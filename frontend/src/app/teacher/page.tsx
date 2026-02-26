"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import UploadArea from "@/components/UploadArea";
import { ModeContext } from "@/context/mode";
import { useAuth } from "@/context/auth";
import { buildApiUrl, parseJsonResponse } from "@/lib/api";

type TeacherStats = {
  chunks: number;
  documents: number;
  files: Array<{
    filename: string;
    chunk_count: number;
  }>;
};

export default function TeacherPage() {
  const { mode } = useContext(ModeContext);
  const { user, token, loading } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await fetch(buildApiUrl("/admin/stats"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await parseJsonResponse<TeacherStats>(response);
      setStats(payload);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : "Failed to load stats.");
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isTeacher || !token) return;
    fetchStats();
  }, [isTeacher, token, fetchStats]);

  if (loading) {
    return (
      <section className="surface-card p-6 text-sm text-slate-600">
        Checking session...
      </section>
    );
  }

  if (!user) {
    return (
      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold text-slate-900">Login required</h2>
        <p className="mt-2 text-sm text-slate-700">
          Please sign in as a teacher to access this page.
        </p>
        <Link href="/login" className="mt-4 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
          Go to Login
        </Link>
      </section>
    );
  }

  if (!isTeacher) {
    return (
      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold text-red-700">403 - Not authorized</h2>
        <p className="mt-2 text-sm text-slate-700">
          Only teachers can access ingestion controls.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3 md:gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3 md:space-y-4">
        <div className="surface-card animate-reveal p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Dashboard</h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload course PDFs and track real ingestion stats from backend.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] px-3 py-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active mode</div>
              <div className="text-sm font-semibold text-slate-800">{mode === "guided" ? "Guided Learning" : "Direct Answer"}</div>
            </div>
          </div>

          <div className="stagger-in mt-5 grid gap-2.5 sm:grid-cols-3 md:gap-3">
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Materials</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{stats?.documents ?? 0}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Indexed</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{stats?.documents ?? 0}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Chunks</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{stats?.chunks ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="surface-card animate-reveal reveal-delay-1 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Upload Course Material</h3>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              onClick={fetchStats}
              disabled={statsLoading}
            >
              {statsLoading ? "Refreshing..." : "Refresh Stats"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Upload PDFs and monitor real-time backend indexing status.
          </p>
          <div className="mt-4">
            <UploadArea onStatsUpdated={setStats} />
          </div>
          {statsError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {statsError}
            </p>
          )}
        </div>
      </div>

      <aside className="surface-card animate-reveal reveal-delay-2 h-fit p-4 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Material Library</h3>
        <p className="mt-1 text-sm text-slate-600">Live indexed file/chunk stats from ChromaDB.</p>

        {statsLoading && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-[var(--surface-muted)] px-3 py-2 text-sm text-slate-700">
            Loading stats...
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {!statsLoading && (!stats || stats.files.length === 0) && (
            <li className="rounded-lg border border-slate-200 bg-[var(--surface-muted)] p-3 text-sm text-slate-600">
              No indexed materials yet.
            </li>
          )}

          {stats?.files.map((file) => (
            <li
              key={file.filename}
              className="animate-reveal rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{file.filename}</div>
                  <div className="mt-1 text-xs text-slate-500">{file.chunk_count} chunks</div>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                  Indexed
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-slate-200 bg-[var(--surface-muted)] p-3">
          <h4 className="font-semibold text-slate-900">ClassMind Policy</h4>
          <p className="mt-2 text-sm text-slate-700">Response mode: <strong>{mode === "guided" ? "Guided Learning" : "Direct Answer"}</strong></p>
          <p className="text-sm text-slate-700">Strict Source Lock: <strong>On</strong></p>
          <p className="mt-2 text-xs text-slate-500">
            Guardrails are always enforced in this prototype.
          </p>
        </div>
      </aside>
    </section>
  );
}
