"use client";
import React from "react";

type Props = {
  mode: "guided" | "direct";
  setMode: (m: "guided" | "direct") => void;
};

export default function ModeToggle({ mode, setMode }: Props) {
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
      <button
        onClick={() => setMode("guided")}
        aria-pressed={mode === "guided"}
        className={
          "px-4 py-1 rounded-full text-sm font-medium transition " +
          (mode === "guided"
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-200")
        }
      >
        🧠 Guided
      </button>

      <button
        onClick={() => setMode("direct")}
        aria-pressed={mode === "direct"}
        className={
          "ml-1 px-4 py-1 rounded-full text-sm font-medium transition " +
          (mode === "direct"
            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-200")
        }
      >
        📝 Direct
      </button>
    </div>
  );
}
