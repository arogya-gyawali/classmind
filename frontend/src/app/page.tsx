import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-4 py-6 md:space-y-5 md:py-12">
      <div className="surface-card animate-reveal overflow-hidden p-5 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div className="max-w-2xl stagger-in">
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-wide text-sky-800">
              Professor-Controlled AI Learning
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              AI that teaches within course boundaries, not beyond them.
            </h2>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              ClassMind grounds every answer in uploaded materials, switches between guided and direct response modes, and refuses off-scope questions.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Citations on every answer</span>
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Strict source lock</span>
              <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white">Teacher-first controls</span>
            </div>
          </div>

          <div className="animate-reveal reveal-delay-1 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Core Problem</h3>
            <p className="mt-2 text-sm text-slate-700">
              Generic AI tools hallucinate, pull outside knowledge, and encourage shortcut learning.
            </p>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">ClassMind Approach</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              <li>Only approved course PDFs are used.</li>
              <li>Responses are either guided hints or direct explanations.</li>
              <li>Questions outside approved content are refused.</li>
            </ul>
          </div>
        </div>

        <div className="stagger-in mt-6 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-4">
          <Link
            href="/teacher"
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-1 hover:shadow-md md:p-5"
          >
            <h3 className="text-lg font-semibold text-[var(--brand)]">Continue as Teacher</h3>
            <p className="mt-2 text-sm text-slate-600">Upload materials, manage indexing state, and enforce source lock.</p>
            <span className="mt-4 inline-block text-sm font-medium text-[var(--brand)] group-hover:text-[var(--brand-strong)]">
              Open Dashboard
            </span>
          </Link>

          <Link
            href="/student"
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-1 hover:shadow-md md:p-5"
          >
            <h3 className="text-lg font-semibold text-[var(--brand)]">Continue as Student</h3>
            <p className="mt-2 text-sm text-slate-600">Ask course questions and get guided or direct responses with citations.</p>
            <span className="mt-4 inline-block text-sm font-medium text-[var(--brand)] group-hover:text-[var(--brand-strong)]">
              Open Chat
            </span>
          </Link>
        </div>
      </div>

      <div className="stagger-in grid gap-3 md:grid-cols-3 md:gap-4">
        <div className="surface-card p-3.5 md:p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Teacher Flow</h3>
          <p className="mt-2 text-sm text-slate-700">Upload PDFs, watch ingestion state, and verify indexed chunk coverage.</p>
        </div>
        <div className="surface-card p-3.5 md:p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Student Flow</h3>
          <p className="mt-2 text-sm text-slate-700">Ask course questions and receive cited responses in guided or direct mode.</p>
        </div>
        <div className="surface-card p-3.5 md:p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Guardrail Flow</h3>
          <p className="mt-2 text-sm text-slate-700">Off-topic prompts trigger a clear refusal aligned with academic boundaries.</p>
        </div>
      </div>
    </section>
  );
}
