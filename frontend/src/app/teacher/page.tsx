"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import UploadArea from "@/components/UploadArea";
import { ModeContext } from "@/context/mode";

type Material = { name: string; pages?: number; chunks: number; status: "processing" | "indexed" };

export default function TeacherPage() {
  const { mode } = useContext(ModeContext);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lastIndexed, setLastIndexed] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("materials_v1");
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted session data once on mount.
        setMaterials(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("materials_v1", JSON.stringify(materials));
    } catch {}
  }, [materials]);

  function handleIndexed(material: Material) {
    setMaterials((existing) => [material, ...existing]);
    setLastIndexed(material.name);
  }

  function clearLibrary() {
    setMaterials([]);
    setLastIndexed(null);
  }

  const stats = useMemo(() => {
    const indexed = materials.filter((item) => item.status === "indexed").length;
    const chunks = materials.reduce((sum, item) => sum + item.chunks, 0);
    return { indexed, chunks, total: materials.length };
  }, [materials]);

  return (
    <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3 md:space-y-4">
        <div className="surface-card animate-reveal p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Dashboard</h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload course PDFs and keep responses grounded in approved material.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] px-3 py-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active mode</div>
              <div className="text-sm font-semibold text-slate-800">{mode === "guided" ? "Guided Learning" : "Direct Answer"}</div>
            </div>
          </div>

          <div className="stagger-in mt-5 grid gap-2.5 sm:grid-cols-3 md:gap-3">
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Materials</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Indexed</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{stats.indexed}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Chunks</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{stats.chunks}</div>
            </div>
          </div>
        </div>

        <div className="surface-card animate-reveal reveal-delay-1 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Upload Course Material</h3>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              onClick={clearLibrary}
              disabled={materials.length === 0}
            >
              Clear Library
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            PDF-only mock ingestion with progress and indexed status.
          </p>
          <div className="mt-4">
            <UploadArea onIndexed={handleIndexed} />
          </div>
        </div>
      </div>

      <aside className="surface-card animate-reveal reveal-delay-2 h-fit p-4 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Material Library</h3>
        <p className="mt-1 text-sm text-slate-600">Session-persistent mock index state.</p>

        {lastIndexed && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status" aria-live="polite">
            Added: <strong>{lastIndexed}</strong>
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {materials.length === 0 && (
            <li className="rounded-lg border border-slate-200 bg-[var(--surface-muted)] p-3 text-sm text-slate-600">
              No materials uploaded yet.
            </li>
          )}

          {materials.map((item, idx) => (
            <li
              key={`${item.name}-${idx}`}
              className="animate-reveal rounded-xl border border-slate-200 bg-white p-3"
              style={{ animationDelay: `${Math.min(50 + idx * 40, 260)}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.pages ?? "-"} pages | {item.chunks} chunks
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    item.status === "indexed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.status === "indexed" ? "Indexed" : "Processing"}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
          <h4 className="font-semibold text-slate-900">ClassMind Policy</h4>
          <p className="mt-2 text-sm text-slate-700">Response mode: <strong>{mode === "guided" ? "Guided Learning" : "Direct Answer"}</strong></p>
          <p className="text-sm text-slate-700">Strict Source Lock: <strong>On</strong></p>
          <p className="mt-2 text-xs text-slate-500">
            Guardrails are always enforced in this prototype.
          </p>
        </div>
      </aside>
    </section>
  );
}
