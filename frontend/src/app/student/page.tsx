"use client";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import CitationBlock from "@/components/CitationBlock";
import RefusalCard from "@/components/RefusalCard";
import { ModeContext } from "@/context/mode";

type Citation = {
  material: string;
  page?: number;
  snippet?: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "refusal" | "error";
  text?: string;
  citation?: Citation;
};

const PROMPTS = [
  "What is a balanced binary search tree?",
  "How do insertion and deletion stay efficient?",
  "Give me a hint to reason about tree height."
];

export default function StudentPage() {
  const { mode } = useContext(ModeContext);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const counterRef = useRef(1);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const modeLabel = useMemo(
    () => (mode === "guided" ? "Guided (Socratic)" : "Direct Answer"),
    [mode]
  );

  const groundedResponseCount = useMemo(
    () => messages.filter((item) => item.role === "assistant").length,
    [messages]
  );

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  function nextId() {
    const next = counterRef.current;
    counterRef.current += 1;
    return next;
  }

  function appendMessage(msg: Omit<ChatMessage, "id">) {
    setMessages((existing) => [...existing, { id: nextId(), ...msg }]);
  }

  function buildAssistantMessage(prompt: string): Omit<ChatMessage, "id"> {
    if (prompt.toLowerCase().includes("quantum")) {
      return { role: "refusal" };
    }

    if (prompt.toLowerCase().includes("error")) {
      return {
        role: "error",
        text: "Response failed in demo mode. Try another question."
      };
    }

    const citation: Citation = {
      material: "Lecture_02_BSTs.pdf",
      page: 8,
      snippet: "Balance property constrains tree height to O(log n), so search, insert, and delete stay logarithmic."
    };

    return {
      role: "assistant",
      text:
        mode === "guided"
          ? "Hint: if each subtree remains close in height, what does that imply about the maximum path from root to leaf?"
          : "A balanced binary search tree keeps height around O(log n), which keeps search, insert, and delete operations efficient.",
      citation
    };
  }

  function sendMessage(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;

    appendMessage({ role: "user", text: prompt });
    setInput("");
    setBusy(true);

    window.setTimeout(() => {
      const result = buildAssistantMessage(prompt);
      appendMessage(result);
      setBusy(false);
    }, 640);
  }

  return (
    <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_260px]">
      <div className="surface-card animate-reveal flex min-h-[68vh] flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-3 py-3 md:px-5">
          <h2 className="text-xl font-bold text-slate-900">Student Chat</h2>
          <p className="text-sm text-slate-600">
            Ask course-related questions. All responses stay tied to uploaded materials.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">Grounded by uploaded PDFs</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              {groundedResponseCount} cited response{groundedResponseCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Out-of-scope refusal active</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto bg-[var(--surface-muted)] p-3 md:space-y-3 md:p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="animate-reveal reveal-delay-1 rounded-xl border border-slate-200 bg-white p-3.5 md:p-4">
              <h3 className="font-semibold text-slate-900">Start with a focused question</h3>
              <p className="mt-1 text-sm text-slate-600">
                Example prompts below help demo guided and direct modes quickly.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 md:gap-2">
                {PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const animationDelay = `${Math.min(40 + idx * 35, 220)}ms`;
            if (msg.role === "refusal") {
              return (
                <div key={msg.id} className="animate-reveal" style={{ animationDelay }}>
                  <RefusalCard />
                </div>
              );
            }

            if (msg.role === "error") {
              return (
                <div
                  key={msg.id}
                  className="animate-reveal rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  style={{ animationDelay }}
                  role="alert"
                >
                  {msg.text}
                </div>
              );
            }

            if (msg.role === "user") {
              return (
                <div
                  key={msg.id}
                  className="animate-reveal ml-auto max-w-[92%] rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm text-white md:max-w-[80%] md:py-3"
                  style={{ animationDelay }}
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className="animate-reveal max-w-[95%] space-y-2 rounded-2xl border border-slate-200 bg-white p-3.5 md:max-w-[88%] md:p-4"
                style={{ animationDelay }}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {mode === "guided" ? "Guided response" : "Direct response"}
                </div>
                <div className="text-slate-800">{msg.text}</div>
                {msg.citation && <CitationBlock cite={msg.citation} />}
              </div>
            );
          })}

          {busy && (
            <div className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2" role="status" aria-label="Generating response">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3 md:p-5">
          <label htmlFor="student-question" className="mb-2 block text-sm font-medium text-slate-700">
            Your question
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="student-question"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the course material..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              className="rounded-xl bg-[var(--brand)] px-5 py-3 font-semibold text-white hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!input.trim() || busy}
            >
              {busy ? "Sending..." : "Send"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            Current mode: <strong>{modeLabel}</strong>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setMessages([])}
              disabled={messages.length === 0 || busy}
            >
              Clear chat
            </button>
          </div>
        </div>
      </div>

      <aside className="surface-card animate-reveal reveal-delay-2 h-fit p-3.5 md:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Learning Policy</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Every answer is expected to map to uploaded material.</li>
          <li>Mode controls answer style, not source boundaries.</li>
          <li>Refusal appears when prompt is outside approved content.</li>
        </ul>
        <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-600">How to demo</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Ask one question in guided mode.</li>
          <li>Switch to direct mode and repeat.</li>
          <li>Try an off-topic prompt with the word quantum.</li>
        </ul>
      </aside>
    </section>
  );
}
