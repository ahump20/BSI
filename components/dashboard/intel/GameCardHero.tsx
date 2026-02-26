'use client';

import { TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BSI_CHART_COLORS, tooltipProps } from '@/lib/chart-theme';
import type { IntelGame } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';
import { WinProbGauge } from './WinProbGauge';
import { isPregameNoScore, rankPrefix, scoreColor } from './game-card-utils';

interface GameCardHeroProps {
  game: IntelGame;
  onClick: () => void;
}

export function GameCardHero({ game, onClick }: GameCardHeroProps) {
  const accent = `var(--bsi-intel-accent, ${SPORT_ACCENT[game.sport]})`;
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const showPregameGauge = isPregameNoScore(game);
  const awayScoreColor = scoreColor(game, 'away', accent);
  const homeScoreColor = scoreColor(game, 'home', accent);

  const winProbData = generateWinProbCurve(game);

  return (
    <button
      onClick={onClick}
      className="group w-full intel-panel p-4 md:p-5 text-left transition-all hover:bg-[var(--intel-bg-elevated)]"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
      }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="intel-sport-tag"
            style={{
              color: accent,
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
            }}
          >
            {game.sport.toUpperCase()}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/15 text-green-400 text-[10px]" style={{ fontFamily: 'var(--intel-mono)', borderRadius: '1px' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
          {isFinal && (
            <span className="intel-caption uppercase">Final</span>
          )}
        </div>
        {game.venue && (
          <span className="intel-caption hidden sm:block">{game.venue}</span>
        )}
      </div>

      {/* Headline */}
      {game.headline && (
        <div className="intel-narrative text-[0.85rem] mb-3 truncate">{game.headline}</div>
      )}

      {/* Matchup: Away vs Home */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
        {/* Away */}
        <div className="flex items-center gap-3">
          {game.away.logo && (
            <img src={game.away.logo} alt="" className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
          )}
          <div>
            <div className="intel-team-name text-sm md:text-base truncate">
              {rankPrefix(game.away.rank)}
              {game.away.name}
            </div>
            <div className="intel-caption">{game.away.record}</div>
          </div>
        </div>

        {/* Scores or Pre-game gauge */}
        <div className="text-center">
          {showPregameGauge ? (
            <WinProbGauge probability={game.winProbability?.home ?? 50} label="Home %" size={72} />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="intel-score intel-score-lg"
                  style={{ color: awayScoreColor }}
                >
                  {game.away.score}
                </span>
                <span className="text-text-muted text-sm">—</span>
                <span
                  className="intel-score intel-score-lg"
                  style={{ color: homeScoreColor }}
                >
                  {game.home.score}
                </span>
              </div>
              {game.statusDetail && (
                <div className="intel-caption mt-0.5">{game.statusDetail}</div>
              )}
            </>
          )}
        </div>

        {/* Home */}
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <div className="intel-team-name text-sm md:text-base truncate">
              {rankPrefix(game.home.rank)}
              {game.home.name}
            </div>
            <div className="intel-caption">{game.home.record}</div>
          </div>
          {game.home.logo && (
            <img src={game.home.logo} alt="" className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
          )}
        </div>
      </div>

      {/* Win probability mini chart (live/final only) */}
      {winProbData.length > 0 && (
        <div className="intel-panel-elevated p-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-text-muted" />
            <span className="intel-caption uppercase tracking-wider">Win Probability</span>
          </div>
          <div className="h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={winProbData}>
                <defs>
                  <linearGradient id={`hero-grad-${game.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BSI_CHART_COLORS.primary} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={BSI_CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <ReTooltip {...tooltipProps} />
                <Area
                  type="monotone"
                  dataKey="home"
                  name="Home %"
                  stroke={BSI_CHART_COLORS.primary}
                  fill={`url(#hero-grad-${game.id})`}
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Model edge hint */}
      {game.modelEdge && (
        <div className="intel-narrative text-[0.75rem] mt-2 opacity-60">
          {game.modelEdge}
        </div>
      )}
    </button>
  );
}

function generateWinProbCurve(game: IntelGame): Array<{ t: string; home: number; away: number }> {
  if (game.status === 'scheduled') return [];

  const diff = game.home.score - game.away.score;
  const homeBase = 50 + Math.min(Math.max(diff * 3, -40), 40);

  return [
    { t: '0%', home: 50, away: 50 },
    { t: '25%', home: 50 + (homeBase - 50) * 0.3, away: 50 - (homeBase - 50) * 0.3 },
    { t: '50%', home: 50 + (homeBase - 50) * 0.6, away: 50 - (homeBase - 50) * 0.6 },
    { t: '75%', home: 50 + (homeBase - 50) * 0.85, away: 50 - (homeBase - 50) * 0.85 },
    { t: '100%', home: homeBase, away: 100 - homeBase },
  ];
}
