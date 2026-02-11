'use client';

import type { IntelGame } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';
import { WinProbGauge } from './WinProbGauge';
import { isPregameNoScore, rankPrefix, scoreColor } from './game-card-utils';

interface GameCardMarqueeProps {
  game: IntelGame;
  onClick: () => void;
}

export function GameCardMarquee({ game, onClick }: GameCardMarqueeProps) {
  const accent = `var(--bsi-intel-accent, ${SPORT_ACCENT[game.sport]})`;
  const isLive = game.status === 'live';
  const showPregameGauge = isPregameNoScore(game);
  const awayScoreColor = scoreColor(game, 'away', accent);
  const homeScoreColor = scoreColor(game, 'home', accent);

  return (
    <button
      onClick={onClick}
      className="group w-full intel-panel p-3 text-left transition-all hover:bg-[var(--intel-bg-elevated)]"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 20%, transparent)`,
        borderLeftWidth: '3px',
        borderLeftColor: isLive ? '#10b981' : `color-mix(in srgb, ${accent} 40%, transparent)`,
      }}
    >
      {/* Sport tag + status */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="intel-sport-tag"
          style={{
            color: accent,
            background: `color-mix(in srgb, ${accent} 10%, transparent)`,
          }}
        >
          {game.sport.toUpperCase()}
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-green-400" style={{ fontFamily: 'var(--intel-mono)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="intel-caption">
            {game.status === 'final' ? 'Final' : game.startTime || 'TBD'}
          </span>
        )}
      </div>

      {game.headline && (
        <div className="intel-narrative mb-2 text-[0.75rem] truncate">{game.headline}</div>
      )}

      {/* Teams + scores */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {game.away.logo && (
              <img src={game.away.logo} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" />
            )}
            <span className="intel-team-name text-[0.75rem] truncate">
              {rankPrefix(game.away.rank)}{game.away.abbreviation || game.away.name}
            </span>
          </div>
          <span
            className="intel-score intel-score-sm shrink-0"
            style={{ color: awayScoreColor }}
          >
            {game.away.score}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {game.home.logo && (
              <img src={game.home.logo} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" />
            )}
            <span className="intel-team-name text-[0.75rem] truncate">
              {rankPrefix(game.home.rank)}{game.home.abbreviation || game.home.name}
            </span>
          </div>
          <span
            className="intel-score intel-score-sm shrink-0"
            style={{ color: homeScoreColor }}
          >
            {game.home.score}
          </span>
        </div>
      </div>

      {showPregameGauge && (
        <div className="mt-2 intel-panel-elevated py-1">
          <WinProbGauge probability={game.winProbability?.home ?? 50} label="Home %" size={62} />
        </div>
      )}

      {/* Model edge hint */}
      {game.modelEdge && (
        <div className="intel-narrative mt-2 text-[0.65rem] truncate opacity-50">
          {game.modelEdge}
        </div>
      )}
    </button>
  );
}
