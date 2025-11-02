export const metadata = {
  title: 'Backyard Blaze Ball Legal | BlazeSportsIntel'
};

export default function BackyardBlazeBallLegalPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-50">Backyard Blaze Ball Legal Notes</h1>
        <p className="text-sm text-slate-300">
          We keep this MVP squeaky clean—no legacy sandlot franchise assets, no licensed marks, just original placeholders ready for future art drops.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6 text-sm text-slate-200">
        <article className="space-y-2">
          <h2 className="text-base font-semibold text-amber-200">What ships today</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Procedurally generated sprites and SFX—no external files bundled.</li>
            <li>Analytics limited to anonymous session timing with Do Not Track honored.</li>
            <li>Iframe isolation keeps the game sandboxed from the core Next.js bundle.</li>
          </ul>
        </article>

        <article className="space-y-2">
          <h2 className="text-base font-semibold text-amber-200">Asset intake rules</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Follow <code className="rounded bg-slate-900 px-1 py-0.5">docs/ai-assets/prompts-and-guidelines.md</code> for all generation prompts.</li>
            <li>Log provenance and approvals in <code className="rounded bg-slate-900 px-1 py-0.5">assets/LICENSES.md</code>.</li>
            <li>Run the CI blocklist locally before submitting to guarantee zero restricted terms.</li>
          </ul>
        </article>

        <article className="space-y-2">
          <h2 className="text-base font-semibold text-amber-200">Questions?</h2>
          <p>Ping legal@blazesportsintel.com with screenshots, prompts, and proposed filenames.</p>
        </article>
      </section>
    </main>
  );
}
