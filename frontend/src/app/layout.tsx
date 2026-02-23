"use client";
import "./globals.css";
import { useState, createContext } from "react";
import ModeToggle from "@/components/ModeToggle";
import ModeBadge from "@/components/ModeBadge";

export const ModeContext = createContext<{ mode: "guided" | "direct"; setMode: (m: "guided" | "direct") => void }>({
  mode: "guided",
  setMode: () => {}
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"guided" | "direct">("guided");

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 min-h-screen">
        <ModeContext.Provider value={{ mode, setMode }}>
          <header className="w-full px-6 md:px-10 py-4 bg-white shadow-sm flex justify-between items-center">
            <h1 className="text-xl font-semibold text-blue-900">ClassMind</h1>

            <div className="flex items-center gap-4">
              {/* Big segmented toggle */}
              <ModeToggle mode={mode} setMode={setMode} />

              {/* More visible mode badge */}
              {mode === "guided" ? (
                <ModeBadge label="🧠 Guided Learning" />
              ) : (
                <ModeBadge label="📝 Direct Answer" variant="secondary" />
              )}

              {/* Source lock stays visible */}
              <span className="ml-2 px-3 py-1 text-sm rounded-full bg-slate-200 text-slate-700">
                🔒 Source Locked
              </span>
            </div>
          </header>

          <main className="p-6 md:p-8">{children}</main>
        </ModeContext.Provider>
      </body>
    </html>
  );
}
