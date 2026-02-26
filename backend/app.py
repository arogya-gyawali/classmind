from __future__ import annotations

from collections import Counter
import logging
import os
import re
import time
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from ollama import Client
from pydantic import BaseModel, Field

# ================================
# Imports (supports package + script mode)
# ================================
try:
    from .auth import (
        bootstrap_teacher_account,
        create_access_token,
        create_user,
        get_current_user,
        init_auth_db,
        require_role,
        authenticate_user,
    )
    from .ingest import ingest_all_pdfs, ingest_single_pdf
except ImportError:
    from auth import (  # type: ignore
        bootstrap_teacher_account,
        create_access_token,
        create_user,
        get_current_user,
        init_auth_db,
        require_role,
        authenticate_user,
    )
    from ingest import ingest_all_pdfs, ingest_single_pdf  # type: ignore

# ================================
# Setup
# ================================
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=False)

logger = logging.getLogger("classmind.api")

DB_DIR = BASE_DIR / os.getenv("DB_DIR", "db")
DOCS_DIR = BASE_DIR / os.getenv("DOCS_DIR", "docs")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.getenv("CHAT_MODEL", "ta-tutor")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
    if origin.strip()
]

app = FastAPI(title="ClassMind Local Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOCS_DIR.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=str(DB_DIR))
collection = chroma_client.get_or_create_collection(COLLECTION_NAME)

ollama_client = Client(host=OLLAMA_HOST)

# ================================
# Models
# ================================
class RegisterReq(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    role: str
    invite_code: str | None = None


class LoginReq(BaseModel):
    username: str
    password: str


class ChatReq(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    k: int = Field(default=5, ge=1, le=20)


class IngestReq(BaseModel):
    path: str | None = None
    ingest_all: bool = False
    force: bool = False


# ================================
# Startup
# ================================
@app.on_event("startup")
def startup() -> None:
    init_auth_db()
    bootstrap_teacher_account()
    logger.info("Backend started | DB=%s | Collection=%s", DB_DIR, COLLECTION_NAME)


# ================================
# Health
# ================================
@app.get("/health")
def health():
    return {"ok": True}


# ================================
# Auth
# ================================
@app.post("/auth/register", status_code=201)
def register(req: RegisterReq):
    try:
        user = create_user(
            username=req.username,
            password=req.password,
            role=req.role,
            invite_code=req.invite_code,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
    }


@app.post("/auth/login")
def login(req: LoginReq):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {"sub": str(user["id"]), "username": user["username"], "role": user["role"]}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"],
    }


@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return current_user


# ================================
# RAG Helpers
# ================================
def truncate_context(text: str, max_chars: int = 5000) -> str:
    return text[:max_chars]


def build_prompt(context: str, query: str) -> str:
    return f"""
You are a course-grounded academic assistant.

Answer ONLY using the provided context.
If the answer is not present in the context, say:
"The answer is not found in the uploaded materials."

Context:
{context}

Student Question:
{query}

Answer:
"""


# ================================
# Chat Endpoint (Clean RAG)
# ================================
@app.post("/chat")
def chat(req: ChatReq, _current_user=Depends(get_current_user)):
    try:
        emb = ollama_client.embeddings(
            model=EMBED_MODEL,
            prompt=req.message,
        )["embedding"]
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Embedding service unavailable.",
        ) from exc

    results = collection.query(
        query_embeddings=[emb],
        n_results=req.k,
        include=["documents", "metadatas"],
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]

    if not docs:
        return {
            "answer": "No matching course material found yet.",
            "sources": [],
        }

    raw_context = "\n\n".join(docs)
    context = truncate_context(raw_context)

    prompt = build_prompt(context, req.message)

    try:
        response = ollama_client.chat(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Chat model unavailable.",
        ) from exc

    return {
        "answer": response["message"]["content"],
        "sources": [
            {
                "filename": m.get("filename"),
                "chunk_index": m.get("chunk_index"),
            }
            for m in metas
        ],
    }


# ================================
# Admin Ingest
# ================================
@app.post("/admin/ingest")
def admin_ingest(req: IngestReq, _teacher=Depends(require_role("teacher"))):
    if req.ingest_all:
        return ingest_all_pdfs(force=req.force)

    if not req.path:
        raise HTTPException(status_code=400, detail="path required")

    target = Path(req.path)
    if not target.is_absolute():
        target = (BASE_DIR / target).resolve()

    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return ingest_single_pdf(target, force=req.force)


# ================================
# Admin Stats
# ================================
@app.get("/admin/stats")
def admin_stats(_teacher=Depends(require_role("teacher"))):
    chunks = collection.count()

    payload = collection.get(include=["metadatas"])
    metas = payload.get("metadatas") or []

    counter: Counter[str] = Counter()
    for m in metas:
        if isinstance(m, dict) and m.get("filename"):
            counter[m["filename"]] += 1

    files = [
        {"filename": name, "chunk_count": count}
        for name, count in sorted(counter.items())
    ]

    return {
        "chunks": chunks,
        "documents": len(files),
        "files": files,
    }


# ================================
# Upload Endpoint
# ================================
@app.post("/admin/upload")
async def admin_upload(
    file: UploadFile = File(...),
    _teacher=Depends(require_role("teacher")),
):
    raw_name = Path(file.filename or "").name
    if not raw_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", raw_name)
    destination = DOCS_DIR / safe_name

    if destination.exists():
        destination = DOCS_DIR / f"{destination.stem}_{int(time.time())}.pdf"

    with destination.open("wb") as out:
        while chunk := await file.read(1024 * 1024):
            out.write(chunk)

    await file.close()

    return {"status": "ok", "path": str(destination)}