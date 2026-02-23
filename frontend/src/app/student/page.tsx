"use client";
import { useContext, useState } from "react";
import CitationBlock from "@/components/CitationBlock";
import RefusalCard from "@/components/RefusalCard";
import { ModeContext } from "@/app/layout";

export default function StudentPage() {
  const { mode } = useContext(ModeContext);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    // initial example message to show citation formatting
    {
      type: "answer",
      text: mode === "guided"
        ? "Let's think this through step-by-step. What property of this data structure matters most?"
        : "A balanced binary search tree keeps operations at O(log n) time complexity.",
      citation: {
        material: "Lecture_01_Trees.pdf",
        page: 12,
        snippet: "Balanced trees maintain height O(log n) which ensures operations are efficient."
      }
    }
  ]);

  function handleSend() {
    if (!input.trim()) return;

    // refusal trigger (mock)
    if (input.toLowerCase().includes("quantum")) {
      setMessages((m) => [...m, { type: "refusal" }]);
      setInput("");
      return;
    }

    // behavior varies by mode
    if (mode === "guided") {
      setMessages((m) => [
        ...m,
        {
          type: "answer",
          text: "Guided hint: what property ensures balanced trees remain efficient?",
          citation: {
            material: "Lecture_02_BSTs.pdf",
            page: 8,
            snippet: "Balance property ensures logarithmic height."
          }
        }
      ]);
    } else {
      // direct mode
      setMessages((m) => [
        ...m,
        {
          type: "answer",
          text: "Direct answer: A balanced binary search tree maintains O(log n) height, ensuring search/insert/delete are O(log n).",
          citation: {
            material: "Lecture_02_BSTs.pdf",
            page: 8,
            snippet: "Balance property ensures logarithmic height."
          }
        }
      ]);
    }

    setInput("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Student Chat</h1>

      <div className="space-y-4">
        {messages.map((msg, i) =>
          msg.type === "refusal" ? (
            <RefusalCard key={i} />
          ) : (
            <div key={i} className="bg-white p-4 rounded shadow">
              <div className="text-slate-700">{msg.text}</div>
              {msg.citation && (
                <div className="mt-2">
                  <CitationBlock cite={msg.citation} />
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <input
          className="flex-1 border p-3 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the course material..."
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
        />
        <button onClick={handleSend} className="px-4 py-2 bg-blue-800 text-white rounded">
          Send
        </button>
      </div>

      <div className="mt-4 text-sm text-slate-500">
        Current mode: <strong>{mode === "guided" ? "Guided (Socratic)" : "Direct Answer"}</strong>
      </div>
    </div>
  );
}
