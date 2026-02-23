import { useState } from "react";
import CitationBlock from "@/components/CitationBlock";

export default function StudentPage() {
  const [input, setInput] = useState("");
  const sampleCitation = {
    material: "Lecture_01_Trees.pdf",
    page: 12,
    snippet: "Balanced trees maintain height O(log n) which ensures operations are efficient."
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Student Chat</h1>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-slate-700">Guided hint: consider tree balance properties.</div>
          <div className="mt-2"><CitationBlock cite={sampleCitation} /></div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <input
          className="flex-1 border p-3 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the course material..."
        />
        <button
          onClick={() => { setInput(""); }}
          className="px-4 py-2 bg-blue-800 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
