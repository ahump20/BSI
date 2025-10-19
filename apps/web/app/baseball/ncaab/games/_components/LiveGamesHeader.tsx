import type { FC } from 'react';

interface LiveGamesHeaderProps {
  gameCount: number;
}

export const LiveGamesHeader: FC<LiveGamesHeaderProps> = ({ gameCount }) => (
  <header className="w-full rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm sm:p-8">
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/90">
          Diamond Insights · Live Board
        </p>
        <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
          NCAA Baseball Live Game Center
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Track leverage swings, inning state, and pitch-by-pitch context for every ongoing Division I matchup across the Deep
          South footprint.
        </p>
      </div>
      <div
        aria-label={`${gameCount} live games currently tracked`}
        className="flex items-center gap-3 rounded-2xl border border-amber-500/60 bg-amber-500/15 px-6 py-4 text-amber-300"
        role="status"
      >
        <span className="text-4xl font-bold leading-none sm:text-5xl">{gameCount}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Live Games</span>
      </div>
    </div>
  </header>
);
