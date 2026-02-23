"use client";
import { useEffect, useState } from "react";
import UploadArea from "@/components/UploadArea";

type Mat = { name: string; pages?: number; chunks: number; status: "processing" | "indexed" };

export default function TeacherPage() {
  const [materials, setMaterials] = useState<Mat[]>([]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("materials_v1");
      if (saved) setMaterials(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("materials_v1", JSON.stringify(materials));
    } catch (e) {}
  }, [materials]);

  function handleIndexed(u: Mat) {
    // add to materials list as indexed
    setMaterials((m) => [u, ...m]);
  }

  return (
    <div className="flex gap-6">
      <aside className="w-72 bg-white border p-4 rounded-md shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Materials</h2>

        <div className="space-y-3">
          <div className="mt-2 text-sm text-slate-600">Uploaded</div>
          <ul className="mt-2 space-y-2">
            {materials.length === 0 && <div className="text-sm text-slate-500">No materials yet.</div>}
            {materials.map((it, idx) => (
              <li key={idx} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-slate-500">{it.pages ?? "—"} pages • {it.chunks} chunks</div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded ${it.status === "indexed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {it.status === "indexed" ? "Indexed" : "Processing"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">AI Settings</h3>
          <div className="mt-2 text-sm text-slate-700">
            Guided Learning: <strong>On</strong><br />
            Strict Source Lock: <strong>On</strong>
          </div>
        </div>
      </aside>

      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>

        <div className="bg-white p-6 rounded shadow">
          <p className="text-sm text-slate-600">Use the panel on the left to upload materials and control AI settings.</p>

          <div className="mt-6">
            <UploadArea onIndexed={handleIndexed} />
          </div>
        </div>
      </section>
    </div>
  );
}
