"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Uploaded = { name: string; pages?: number; chunks: number; status: "processing" | "indexed" };

export default function UploadArea({ onIndexed }: { onIndexed?: (u: Uploaded) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIndexed, setLastIndexed] = useState<string | null>(null);
  const [processing, setProcessing] = useState<null | { name: string; progress: number }>(null);
  const intervalRef = useRef<number | null>(null);
  const busy = Boolean(processing);

  const stageLabel = useMemo(() => {
    if (!processing) return null;
    if (processing.progress < 35) return "Parsing file";
    if (processing.progress < 70) return "Chunking content";
    return "Indexing vectors";
  }, [processing]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  function mockChunkCount(pages: number) {
    return Math.max(5, Math.round(pages * 6.5));
  }

  function estimatePages(name: string) {
    const match = name.match(/\d+/)?.[0];
    return Math.max(5, Math.min(120, Math.round(match ? Number(match) : Math.random() * 40)));
  }

  function validateFile(file: File) {
    const validMime = file.type === "application/pdf";
    const validName = file.name.toLowerCase().endsWith(".pdf");
    return validMime || validName;
  }

  function handleFile(file?: File) {
    if (!file || busy) return;
    setError(null);
    setLastIndexed(null);

    if (!validateFile(file)) {
      setError("Only PDF files are supported.");
      return;
    }

    const name = file.name;
    const pages = estimatePages(name);
    setProcessing({ name, progress: 0 });

    const start = Date.now();
    intervalRef.current = window.setInterval(() => {
      setProcessing((current) => {
        if (!current) return current;
        const elapsed = Date.now() - start;
        const progress = Math.min(100, Math.round((elapsed / 1600) * 100));
        if (progress >= 100) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
          }
          const chunks = mockChunkCount(pages);
          const uploaded = { name: current.name, pages, chunks, status: "indexed" as const };
          setLastIndexed(current.name);
          setProcessing(null);
          onIndexed?.(uploaded);
          return null;
        }
        return { ...current, progress };
      });
    }, 120);
  }

  return (
    <div className="space-y-2.5 md:space-y-3">
      <label className="block">
        <div
          className={`rounded-2xl border-2 border-dashed p-5 text-center md:p-6 ${dragActive ? "border-[var(--brand)] bg-sky-50" : "border-slate-300 bg-white"} ${busy ? "cursor-not-allowed opacity-70" : ""}`}
          aria-busy={busy}
          onDragEnter={(e) => {
            e.preventDefault();
            if (busy) return;
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (busy) return;
            setDragActive(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (busy) return;
            setDragActive(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (busy) return;
            setDragActive(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            aria-label="Upload PDF material"
            disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="font-medium text-slate-800">Drop a PDF here, or click to choose a file</div>
          <div className="mt-2 text-sm text-slate-600">Course materials stay source-locked for student responses.</div>
          <span className="mt-4 inline-flex rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            {busy ? "Processing..." : "Choose PDF"}
          </span>
          <div className="mt-2 text-xs text-slate-500">Supported format: PDF</div>
        </div>
      </label>

      {processing && (
        <div className="animate-reveal rounded-xl border border-slate-200 bg-white p-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              Indexing <strong>{processing.name}</strong>
            </div>
            <div className="text-xs font-medium text-slate-500">{processing.progress}%</div>
          </div>
          <div className="mt-1 text-xs text-slate-500">{stageLabel}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div style={{ width: `${processing.progress}%` }} className="h-2 rounded-full bg-[var(--brand)] transition-all duration-150" />
          </div>
        </div>
      )}

      {lastIndexed && (
        <div className="animate-reveal rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status" aria-live="polite">
          Indexed successfully: <strong>{lastIndexed}</strong>
        </div>
      )}

      {error && (
        <div className="animate-reveal rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
