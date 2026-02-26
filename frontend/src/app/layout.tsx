"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import ModeToggle from "@/components/ModeToggle";
import ModeBadge from "@/components/ModeBadge";
import { ModeContext, type Mode } from "@/context/mode";
import { AuthProvider, useAuth } from "@/context/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-800 min-h-screen">
        <AuthProvider>
          <LayoutChrome>{children}</LayoutChrome>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutChrome({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("guided");
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("classmind_mode");
      if (savedMode === "guided" || savedMode === "direct") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted preference once on mount.
        setMode(savedMode);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("classmind_mode", mode);
    } catch {}
  }, [mode]);

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-white focus:px-3 focus:py-2 focus:rounded-md">
        Skip to main content
      </a>
      <header className="w-full border-b border-slate-200/80 bg-white/85 px-3 py-3 backdrop-blur-sm md:px-8 md:py-4">
        <div className="mx-auto grid max-w-6xl gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--brand)] md:text-2xl">ClassMind</h1>
              <p className="text-xs text-slate-600 md:text-sm">Professor-controlled learning assistant</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex flex-wrap items-center gap-2" aria-label="Main navigation">
                <Link
                  href="/"
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    pathname === "/" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/teacher"
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    pathname === "/teacher" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Teacher
                </Link>
                <Link
                  href="/student"
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    pathname === "/student" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Student
                </Link>
              </nav>

              {!user ? (
                <>
                  <Link href="/login" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Login
                  </Link>
                  <Link href="/register" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {user.username} ({user.role})
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-2.5 md:gap-3 md:pt-3">
            <ModeToggle mode={mode} setMode={setMode} />
            {mode === "guided" ? (
              <ModeBadge label="Guided Learning" />
            ) : (
              <ModeBadge label="Direct Answer" variant="secondary" />
            )}
            <span className="glass-chip rounded-full px-3 py-1 text-xs font-semibold text-slate-700" aria-label="Source lock active">
              Source Lock On
            </span>
            <span className="text-xs text-slate-500">Grounded responses only</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl p-3 md:p-6 lg:p-8 animate-reveal">{children}</main>
    </ModeContext.Provider>
  );
}
