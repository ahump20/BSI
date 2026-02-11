'use client';

import type { IntelGame } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';

interface GameCardMarqueeProps {
  game: IntelGame;
  onClick: () => void;
}

export function GameCardMarquee({ game, onClick }: GameCardMarqueeProps) {
  const accent = SPORT_ACCENT[game.sport];
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const awayWinning = (isLive || isFinal) && game.away.score > game.home.score;
  const homeWinning = (isLive || isFinal) && game.home.score > game.away.score;

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border bg-white/[0.04] p-3 text-left transition-all hover:bg-white/[0.06] hover:border-white/20"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 20%, transparent)`,
      }}
    >
      {/* Sport tag + status */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
          style={{
            color: accent,
            background: `color-mix(in srgb, ${accent} 10%, transparent)`,
          }}
        >
          {game.sport.toUpperCase()}
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="font-mono text-[10px] text-white/30">
            {game.status === 'final' ? 'Final' : game.startTime || 'TBD'}
          </span>
        )}
      </div>

      {/* Teams + scores */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {game.away.logo && (
              <img src={game.away.logo} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" />
            )}
            <span className="font-mono text-[12px] text-white/80 truncate">
              {game.away.rank ? `#${game.away.rank} ` : ''}{game.away.abbreviation || game.away.name}
            </span>
          </div>
          <span
            className="font-mono text-sm font-bold tabular-nums shrink-0"
            style={{ color: awayWinning ? accent : 'var(--bsi-gold, #FDB913)' }}
          >
            {game.away.score}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {game.home.logo && (
              <img src={game.home.logo} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" />
            )}
            <span className="font-mono text-[12px] text-white/80 truncate">
              {game.home.rank ? `#${game.home.rank} ` : ''}{game.home.abbreviation || game.home.name}
            </span>
          </div>
          <span
            className="font-mono text-sm font-bold tabular-nums shrink-0"
            style={{ color: homeWinning ? accent : 'var(--bsi-gold, #FDB913)' }}
          >
            {game.home.score}
          </span>
        </div>
      </div>

      {/* Model edge hint */}
      {game.modelEdge && (
        <div className="mt-2 font-mono text-[10px] text-white/30 truncate">
          {game.modelEdge}
        </div>
      )}
    </button>
  );
}
