"use client";
import React from "react";

type Props = {
  mode: "guided" | "direct";
  setMode: (m: "guided" | "direct") => void;
};

export default function ModeToggle({ mode, setMode }: Props) {
  return (
    <div
      className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 p-1"
      role="group"
      aria-label="Response mode"
    >
      <button
        onClick={() => setMode("guided")}
        aria-pressed={mode === "guided"}
        aria-label="Switch to guided learning mode"
        className={
          "rounded-full px-3 py-1.5 text-sm font-semibold transition md:px-4 " +
          (mode === "guided"
            ? "bg-[var(--brand)] text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-200")
        }
      >
        Guided
      </button>

      <button
        onClick={() => setMode("direct")}
        aria-pressed={mode === "direct"}
        aria-label="Switch to direct answer mode"
        className={
          "ml-1 rounded-full px-3 py-1.5 text-sm font-semibold transition md:px-4 " +
          (mode === "direct"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-200")
        }
      >
        Direct
      </button>
    </div>
  );
}
