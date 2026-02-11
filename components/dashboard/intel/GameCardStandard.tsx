'use client';

import type { IntelGame } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';
import { WinProbGauge } from './WinProbGauge';
import { isPregameNoScore, rankPrefix, scoreColor } from './game-card-utils';

interface GameCardStandardProps {
  game: IntelGame;
  onClick: () => void;
}

export function GameCardStandard({ game, onClick }: GameCardStandardProps) {
  const accent = `var(--bsi-intel-accent, ${SPORT_ACCENT[game.sport]})`;
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const showPregameGauge = isPregameNoScore(game);
  const awayScoreColor = scoreColor(game, 'away', accent);
  const homeScoreColor = scoreColor(game, 'home', accent);

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]"
      style={{ borderLeftWidth: '3px', borderLeftColor: isLive ? '#10b981' : `color-mix(in srgb, ${accent} 40%, transparent)` }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Teams + Scores */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {game.away.logo && (
                <img src={game.away.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
              )}
              <span className="font-mono text-[12px] text-white/80 truncate">
                {rankPrefix(game.away.rank)}{game.away.abbreviation || game.away.name}
              </span>
            </div>
            <span
              className="font-mono text-sm font-semibold tabular-nums shrink-0"
              style={{ color: awayScoreColor }}
            >
              {game.away.score}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {game.home.logo && (
                <img src={game.home.logo} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
              )}
              <span className="font-mono text-[12px] text-white/80 truncate">
                {rankPrefix(game.home.rank)}{game.home.abbreviation || game.home.name}
              </span>
            </div>
            <span
              className="font-mono text-sm font-semibold tabular-nums shrink-0"
              style={{ color: homeScoreColor }}
            >
              {game.home.score}
            </span>
          </div>
        </div>

        {showPregameGauge && (
          <div className="shrink-0">
            <WinProbGauge probability={game.winProbability?.home ?? 50} label="Home %" size={52} />
          </div>
        )}

        {/* Status */}
        <div className="shrink-0 text-right">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-green-500/15 text-green-400 font-mono text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          ) : isFinal ? (
            <span className="font-mono text-[10px] text-white/30 uppercase">Final</span>
          ) : (
            <span className="font-mono text-[10px] text-white/40">
              {game.startTime || game.statusDetail || 'TBD'}
            </span>
          )}
        </div>
      </div>

      {/* Venue hint on hover */}
      {game.venue && (
        <div className="mt-1 font-mono text-[10px] text-white/20 truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {game.venue}
        </div>
      )}
    </button>
  );
}
