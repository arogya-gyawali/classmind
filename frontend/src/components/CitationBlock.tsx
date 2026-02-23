type Citation = { material: string; page?: number; snippet?: string };

export default function CitationBlock({ cite }: { cite: Citation }) {
  return (
    <div className="border-l-4 border-blue-200 bg-blue-50 p-3 rounded-md text-sm">
      <div className="font-semibold text-blue-800">
        📖 {cite.material}{cite.page ? ` — p. ${cite.page}` : ""}
      </div>
      {cite.snippet && <div className="mt-1 text-slate-700">{cite.snippet}</div>}
    </div>
  );
}
