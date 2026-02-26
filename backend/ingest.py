"""
ClassMind Advanced Ingestion Engine

Features:
- Sentence-aware chunking
- Text normalization
- Smart OCR fallback
- Force re-ingest
- Full database reset
- Robust embedding error logging
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import tempfile
import time
import traceback
from pathlib import Path
from typing import Any

import chromadb
from dotenv import load_dotenv
from ollama import Client
from pypdf import PdfReader
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


# ------------------------
# Configuration
# ------------------------

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=False)

DOCS_DIR = (BASE_DIR / os.getenv("DOCS_DIR", "docs")).resolve()
DB_DIR = (BASE_DIR / os.getenv("DB_DIR", "db")).resolve()
STATE_FILE = DB_DIR / "ingest_state.json"
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
CHUNK_SLEEP = float(os.getenv("CHUNK_SLEEP", "0.02"))
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MAX_CHUNKS_PER_DOC = 1500


DOCS_DIR.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("classmind.ingest")

_ollama_client: Client | None = None
_collection = None


# ------------------------
# Startup
# ------------------------

def startup_banner():
    logger.info("=== ClassMind Ingest Engine ===")
    logger.info("BASE_DIR: %s", BASE_DIR)
    logger.info("DOCS_DIR: %s", DOCS_DIR)
    logger.info("DB_DIR: %s", DB_DIR)
    logger.info("COLLECTION_NAME: %s", COLLECTION_NAME)


# ------------------------
# Database Reset
# ------------------------

def reset_database():
    logger.warning("⚠️ Resetting entire Chroma database and ingestion state")

    if DB_DIR.exists():
        shutil.rmtree(DB_DIR)

    DB_DIR.mkdir(parents=True, exist_ok=True)

    if STATE_FILE.exists():
        STATE_FILE.unlink()

    logger.info("Database reset complete.")


# ------------------------
# Helpers
# ------------------------

def get_ollama_client() -> Client:
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = Client(host=OLLAMA_HOST)
        _ollama_client.list()
        logger.info("Connected to Ollama at %s", OLLAMA_HOST)
    return _ollama_client


def get_collection():
    global _collection
    if _collection is None:
        chroma_client = chromadb.PersistentClient(path=str(DB_DIR))
        _collection = chroma_client.get_or_create_collection(COLLECTION_NAME)
        logger.info(
            "Initialized Chroma collection '%s' (existing count=%d)",
            COLLECTION_NAME,
            _collection.count(),
        )
    return _collection


def load_state() -> dict[str, float]:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict[str, float]):
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ------------------------
# Text Extraction
# ------------------------

def extract_text_from_pdf(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    text = "".join(page.extract_text() or "" for page in reader.pages)
    return text.strip()


def try_ocr_and_extract(pdf_path: Path) -> str:
    try:
        import ocrmypdf
    except Exception:
        logger.warning("OCR fallback unavailable (install with: pip install ocrmypdf)")
        return ""

    with tempfile.TemporaryDirectory() as tmp:
        ocr_pdf = Path(tmp) / f"ocr_{pdf_path.name}"
        try:
            logger.info("Running OCR fallback for %s", pdf_path.name)
            ocrmypdf.ocr(str(pdf_path), str(ocr_pdf), deskew=True, skip_text=True)
            return extract_text_from_pdf(ocr_pdf)
        except Exception:
            logger.error("OCR failed:\n%s", traceback.format_exc())
            return ""


# ------------------------
# Text Processing
# ------------------------

def normalize_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"-\s+", "", text)
    return text.strip()


def sentence_split(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_text(text: str) -> list[str]:
    """
    Paragraph-aware semantic chunking.
    Groups paragraphs up to CHUNK_SIZE limit.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 <= CHUNK_SIZE:
            current += para + "\n\n"
        else:
            if current:
                chunks.append(current.strip())
            current = para + "\n\n"

    if current:
        chunks.append(current.strip())

    return chunks


# ------------------------
# Embedding
# ------------------------

import time

def embed_text(chunk: str, *, chunk_id: str, retries: int = 3) -> list[float] | None:
    for attempt in range(retries):
        try:
            response = get_ollama_client().embeddings(
                model=EMBED_MODEL,
                prompt=chunk,
            )
            return response["embedding"]
        except Exception as e:
            logger.warning(f"Embedding failed ({attempt+1}/{retries}) for {chunk_id}")
            logger.warning(str(e))
            time.sleep(0.5)  # throttle retry

    logger.error(f"Embedding permanently failed for {chunk_id}")
    return None


# ------------------------
# Ingestion Logic
# ------------------------

def ingest_single_pdf(pdf_path: Path, force: bool = False) -> dict[str, Any]:
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    state = load_state()
    mtime = pdf_path.stat().st_mtime

    if not force and state.get(pdf_path.name, 0) >= mtime:
        return {"status": "skipped", "reason": "up_to_date"}

    logger.info("Ingesting %s (force=%s)", pdf_path.name, force)

    text = extract_text_from_pdf(pdf_path)

    if not text or len(re.findall(r"[A-Za-z]", text)) < 100:
        logger.info("Low text density detected, trying OCR fallback")
        text = try_ocr_and_extract(pdf_path)

    if not text:
        return {"status": "skipped", "reason": "no_text"}

    chunks = chunk_text(text)
    collection = get_collection()

    if force:
        ids_to_delete = [f"{pdf_path.stem}::chunk_{i}" for i in range(len(chunks))]
        collection.delete(ids=ids_to_delete)

    added = 0
    failures = 0

    for idx, chunk in enumerate(chunks):
        chunk_id = f"{pdf_path.stem}::chunk_{idx}"
        embedding = embed_text(chunk, chunk_id)
        if embedding is None:
            failures += 1
            continue

        collection.add(
            ids=[chunk_id],
            documents=[chunk],
            embeddings=[embedding],
            metadatas=[{
                "filename": pdf_path.name,
                "chunk_index": idx,
                "timestamp": time.time(),
            }],
        )

        added += 1
        time.sleep(CHUNK_SLEEP)

    if failures == 0:
        state[pdf_path.name] = mtime
        save_state(state)

    result = {
        "status": "ok" if failures == 0 else "partial",
        "chunks_added": added,
        "chunks_total": len(chunks),
        "embedding_failures": failures,
    }

    logger.info("Ingest result: %s", result)
    return result


# ------------------------
# Watcher
# ------------------------

class PDFWatcher(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory or not event.src_path.lower().endswith(".pdf"):
            return
        time.sleep(1)
        ingest_single_pdf(Path(event.src_path))


def watch_folder():
    startup_banner()
    observer = Observer()
    observer.schedule(PDFWatcher(), str(DOCS_DIR), recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

def ingest_all_pdfs(force: bool = False):
    results = []
    for pdf in DOCS_DIR.glob("*.pdf"):
        result = ingest_single_pdf(pdf, force=force)
        results.append(result)
    return {
        "status": "ok",
        "files": results
    }


# ------------------------
# CLI
# ------------------------

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", help="Ingest a single PDF and exit")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--reset", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if args.reset:
        startup_banner()
        reset_database()

    elif args.path:
        startup_banner()
        print(ingest_single_pdf(Path(args.path), force=args.force))

    elif args.once:
        startup_banner()
        for pdf in DOCS_DIR.glob("*.pdf"):
            print(ingest_single_pdf(pdf, force=args.force))

    else:
        watch_folder()