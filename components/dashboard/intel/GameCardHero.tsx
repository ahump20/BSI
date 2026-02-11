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
      className="group w-full rounded-xl border bg-white/[0.04] p-4 md:p-5 text-left transition-all hover:bg-white/[0.06] hover:shadow-[var(--bsi-glow-sm)]"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
      }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
            style={{
              color: accent,
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
            }}
          >
            {game.sport.toUpperCase()}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-green-500/15 text-green-400 font-mono text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
          {isFinal && (
            <span className="font-mono text-[10px] text-white/30 uppercase">Final</span>
          )}
        </div>
        {game.venue && (
          <span className="font-mono text-[10px] text-white/25 hidden sm:block">{game.venue}</span>
        )}
      </div>

      {/* Headline */}
      {game.headline && (
        <div className="font-mono text-[11px] italic text-white/45 mb-3 truncate">{game.headline}</div>
      )}

      {/* Matchup: Away vs Home */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
        {/* Away */}
        <div className="flex items-center gap-3">
          {game.away.logo && (
            <img src={game.away.logo} alt="" className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
          )}
          <div>
            <div className="font-display text-sm md:text-base font-semibold uppercase tracking-wide text-white/80 truncate">
              {rankPrefix(game.away.rank)}
              {game.away.name}
            </div>
            <div className="font-mono text-[11px] text-white/30">{game.away.record}</div>
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
                  className="font-mono text-2xl md:text-3xl font-bold tabular-nums"
                  style={{ color: awayScoreColor }}
                >
                  {game.away.score}
                </span>
                <span className="text-white/20 text-sm">—</span>
                <span
                  className="font-mono text-2xl md:text-3xl font-bold tabular-nums"
                  style={{ color: homeScoreColor }}
                >
                  {game.home.score}
                </span>
              </div>
              {game.statusDetail && (
                <div className="font-mono text-[10px] text-white/40 mt-0.5">{game.statusDetail}</div>
              )}
            </>
          )}
        </div>

        {/* Home */}
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <div className="font-display text-sm md:text-base font-semibold uppercase tracking-wide text-white/80 truncate">
              {rankPrefix(game.home.rank)}
              {game.home.name}
            </div>
            <div className="font-mono text-[11px] text-white/30">{game.home.record}</div>
          </div>
          {game.home.logo && (
            <img src={game.home.logo} alt="" className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
          )}
        </div>
      </div>

      {/* Win probability mini chart (live/final only) */}
      {winProbData.length > 0 && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-white/30" />
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Win Probability</span>
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
        <div className="mt-2 font-mono text-[11px] text-white/40">
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
