"use client";
import { useState } from "react";

type Uploaded = { name: string; pages?: number; chunks: number; status: "processing" | "indexed" };

export default function UploadArea({ onIndexed }: { onIndexed?: (u: Uploaded) => void }) {
  const [processing, setProcessing] = useState<null | { name: string; progress: number }>(null);

  function mockChunkCount(pages: number) {
    // rough heuristic: ~ (pages * 50) / 800-chunk-size ≈ pages * 0.0625 -> scale for demo
    return Math.max(5, Math.round(pages * 6.5));
  }

  function handleFile(file?: File) {
    if (!file) return;
    const name = file.name;
    // estimate pages by filename hint or random for demo
    const pages = Math.max(5, Math.min(120, Math.round((name.match(/\d+/)?.[0] ? Number(name.match(/\d+/)?.[0]) : Math.random()*40))));
    setProcessing({ name, progress: 0 });

    // simulate processing progress
    const start = Date.now();
    const interval = setInterval(() => {
      setProcessing((p) => {
        if (!p) return p;
        const elapsed = Date.now() - start;
        const prog = Math.min(100, Math.round((elapsed / 1500) * 100)); // ~1.5s
        if (prog >= 100) {
          clearInterval(interval);
          const chunks = mockChunkCount(pages);
          const uploaded = { name: p.name, pages, chunks, status: "indexed" as const };
          setProcessing(null);
          onIndexed && onIndexed(uploaded);
        }
        return { ...p, progress: prog };
      });
    }, 120);
  }

  return (
    <div>
      <label className="block">
        <div className="border-2 border-dashed border-slate-200 bg-white p-6 rounded-md text-center hover:border-slate-300 cursor-pointer">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files ? e.target.files[0] : undefined)}
          />
          <div className="text-slate-700 font-medium">Drag & drop a PDF here, or click to select</div>
          <div className="text-sm text-slate-500 mt-2">Professor uploads course materials (PDF only)</div>
        </div>
      </label>

      {processing && (
        <div className="mt-3 p-3 bg-white border rounded-md">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-700">Processing: <strong>{processing.name}</strong></div>
            <div className="text-xs text-slate-500">{processing.progress}%</div>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-2 rounded">
            <div style={{width: `${processing.progress}%`}} className="h-2 rounded bg-blue-500 transition-all" />
          </div>
        </div>
      )}
    </div>
  );
}
