import type { FC } from 'react';

import type { LiveGamePlay } from '../../../../../lib/baseball/games';

interface PlayByPlayListProps {
  plays: LiveGamePlay[];
  gameSlug: string;
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const PlayByPlayList: FC<PlayByPlayListProps> = ({ plays, gameSlug }) => {
  if (plays.length === 0) {
    return (
      <div
        aria-live="polite"
        className="rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-6 text-center text-sm text-slate-400"
        id={`${gameSlug}-plays-empty`}
        role="status"
      >
        Live telemetry is connecting. Play-by-play will populate once Highlightly pushes the first update.
      </div>
    );
  }

  const grouped = plays.reduce<Record<string, LiveGamePlay[]>>((acc, play) => {
    const key = `${play.inning}-${play.half}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(play);
    return acc;
  }, {});

  const orderedKeys = Object.keys(grouped).sort((a, b) => {
    const [inningA, halfA] = a.split('-');
    const [inningB, halfB] = b.split('-');
    const inningDiff = Number(inningB) - Number(inningA);
    if (inningDiff !== 0) {
      return inningDiff;
    }
    return halfA === 'Top' && halfB === 'Bottom' ? 1 : -1;
  });

  return (
    <div aria-label="Latest plays" aria-live="polite" className="flex flex-col gap-4">
      {orderedKeys.map((key) => {
        const [inning, half] = key.split('-');
        const inningPlays = grouped[key];
        const targetId = `plays-inning-${inning}-${half.toLowerCase()}`;

        return (
          <section
            aria-labelledby={`${targetId}-heading`}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm"
            id={targetId}
            key={key}
            role="tabpanel"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
              <h3
                className="text-sm font-semibold uppercase tracking-wide text-amber-300/90"
                id={`${targetId}-heading`}
              >
                {half} {inning}
              </h3>
              <span className="text-xs text-slate-400">{inningPlays.length} plays logged</span>
            </div>
            <ol className="flex flex-col gap-3">
              {inningPlays.map((play) => (
                <li
                  key={play.id}
                  className="flex flex-col gap-1 rounded-xl bg-slate-900/80 p-3 shadow-inner ring-1 ring-white/5"
                  role="article"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>{formatTime(play.createdAt)}</span>
                    <span>Leverage swing: {Math.max(0, Math.round(play.leverage))}</span>
                  </div>
                  <p className="text-sm text-slate-200">{play.description}</p>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
};
