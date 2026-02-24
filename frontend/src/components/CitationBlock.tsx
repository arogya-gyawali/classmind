"use client";
import { useId, useState } from "react";

type Citation = { material: string; page?: number; snippet?: string };

export default function CitationBlock({ cite }: { cite: Citation }) {
  const [open, setOpen] = useState(false);
  const uniqueId = useId().replace(/:/g, "");
  const excerptId = `excerpt-${uniqueId}`;

  return (
    <div className="animate-fade-up rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-sm">
      <div className="mb-2 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
        Grounded Citation
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-sky-900">
            Source: {cite.material}
            {cite.page ? `, p. ${cite.page}` : ""}
          </div>
          {cite.snippet && (
            <div className="mt-1 line-clamp-2 text-slate-700">
              {cite.snippet}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <button
            onClick={() => setOpen((s) => !s)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            aria-expanded={open}
            aria-controls={excerptId}
          >
            {open ? "Hide excerpt" : "View excerpt"}
          </button>
        </div>
      </div>

      {open && cite.snippet && (
        <div id={excerptId} className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {cite.snippet}
        </div>
      )}
    </div>
  );
}
