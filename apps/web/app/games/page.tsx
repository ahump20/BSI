import Link from 'next/link';

const games = [
  {
    href: '/games/bbp',
    title: 'Backyard Blaze Ball',
    description: 'Thumb-friendly, three-inning baseball duel built for mobile browsers.',
    badge: 'New'
  }
];

export const metadata = {
  title: 'Games | BlazeSportsIntel'
};

export default function GamesLandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-3 text-center">
        <p className="mx-auto inline-flex rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
          Sandlot Labs
        </p>
        <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">Original BlazeSportsIntel Games</h1>
        <p className="mx-auto max-w-2xl text-base text-slate-300">
          Built mobile-first and performance-budgeted for 4G. Every experience respects privacy, accessibility, and legal guardrails.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {games.map((game) => (
          <article
            key={game.href}
            className="group flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40 transition hover:border-slate-600"
          >
            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500/20 via-emerald-500/10 to-amber-400/10">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-amber-400/40 bg-slate-950/40 text-4xl font-black text-amber-300 shadow-inner shadow-amber-400/20">
                ⚾
              </div>
              <span className="absolute left-3 top-3 inline-flex rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold uppercase text-emerald-950">
                {game.badge}
              </span>
            </div>
            <div className="mt-4 flex flex-1 flex-col gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-50">{game.title}</h2>
                <p className="text-sm text-slate-300">{game.description}</p>
              </div>
              <Link
                href={game.href}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Play
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
