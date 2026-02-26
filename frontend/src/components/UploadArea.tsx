"use client";

import { useMemo, useState } from "react";
import { TOKEN_STORAGE_KEY, buildApiUrl, parseJsonResponse } from "@/lib/api";

type TeacherStats = {
  chunks: number;
  documents: number;
  files: Array<{
    filename: string;
    chunk_count: number;
  }>;
};

export default function UploadArea({ onStatsUpdated }: { onStatsUpdated?: (stats: TeacherStats) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<null | { name: string; progress: number }>(null);
  const busy = Boolean(processing);

  const stageLabel = useMemo(() => {
    if (!processing) return null;
    if (processing.progress < 25) return "Preparing upload";
    if (processing.progress < 80) return "Uploading PDF";
    if (processing.progress < 100) return "Finalizing";
    return "Uploaded — ingestion pending";
  }, [processing]);

  function validateFile(file: File) {
    const validMime = file.type === "application/pdf";
    const validName = file.name.toLowerCase().endsWith(".pdf");
    return validMime || validName;
  }

  function uploadPdf(file: File): Promise<{ status: string; path: string }> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        reject(new Error("Missing login token. Please sign in as teacher."));
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", buildApiUrl("/admin/upload"));
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.responseType = "json";

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.min(95, Math.round((event.loaded / event.total) * 95));
        setProcessing({ name: file.name, progress });
      };

      xhr.onerror = () => reject(new Error("Upload failed due to a network error."));
      xhr.onabort = () => reject(new Error("Upload was aborted."));

      xhr.onload = () => {
        const payload = xhr.response;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload);
          return;
        }

        const detail =
          payload && typeof payload === "object" && "detail" in payload
            ? String((payload as { detail: unknown }).detail)
            : `Upload failed (HTTP ${xhr.status})`;
        reject(new Error(detail));
      };

      const form = new FormData();
      form.append("file", file);
      xhr.send(form);
    });
  }

  async function fetchStatsWithToken(token: string) {
    const response = await fetch(buildApiUrl("/admin/stats"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await parseJsonResponse<TeacherStats>(response);
    onStatsUpdated?.(payload);
  }

  async function handleFile(file?: File) {
    if (!file || busy) return;
    setError(null);
    setStatusMessage(null);

    if (!validateFile(file)) {
      setError("Only PDF files are supported.");
      return;
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setError("Missing login token. Please sign in as teacher.");
      return;
    }

    setProcessing({ name: file.name, progress: 5 });
    try {
      await uploadPdf(file);
      setStatusMessage("PDF uploaded successfully!");
      setProcessing({ name: file.name, progress: 100 });
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        try {
          await fetchStatsWithToken(token);
        } catch (statsErr) {
          setError(statsErr instanceof Error ? statsErr.message : "Failed to refresh stats.");
        }
      }
      window.setTimeout(() => setProcessing(null), 450);
    } catch (uploadErr) {
      setProcessing(null);
      setError(uploadErr instanceof Error ? uploadErr.message : "Upload failed.");
    }
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
          <div className="mt-2 text-sm text-slate-600">
            Uploads to backend/docs via teacher-only endpoint.
          </div>
          <span className="mt-4 inline-flex rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            {busy ? "Uploading..." : "Choose PDF"}
          </span>
          <div className="mt-2 text-xs text-slate-500">Supported format: PDF</div>
        </div>
      </label>

      {processing && (
        <div className="animate-reveal rounded-xl border border-slate-200 bg-white p-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              Uploading <strong>{processing.name}</strong>
            </div>
            <div className="text-xs font-medium text-slate-500">{processing.progress}%</div>
          </div>
          <div className="mt-1 text-xs text-slate-500">{stageLabel}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div
              style={{ width: `${processing.progress}%` }}
              className="h-2 rounded-full bg-[var(--brand)] transition-all duration-150"
            />
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="animate-reveal rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status" aria-live="polite">
          {statusMessage}
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
