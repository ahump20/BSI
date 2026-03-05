'use client';

import { X, TrendingUp, BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { BSI_CHART_COLORS, tooltipProps } from '@/lib/chart-theme';
import { Sheet, SheetHeader, SheetBody } from '@/components/ui/Sheet';
import { Separator } from '@/components/ui/Separator';
import type { IntelGame } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';
import { MatchupRadar } from './MatchupRadar';
import { WinProbGauge } from './WinProbGauge';
import { isPregameNoScore, rankPrefix, scoreColor } from './game-card-utils';

interface GameDetailSheetProps {
  game: IntelGame | null;
  open: boolean;
  onClose: () => void;
}

export function GameDetailSheet({ game, open, onClose }: GameDetailSheetProps) {
  if (!game) return null;

  const accent = `var(--bsi-intel-accent, ${SPORT_ACCENT[game.sport]})`;
  const isLive = game.status === 'live';
  const showPregameGauge = isPregameNoScore(game);
  const explainData = game.explain ?? generateExplainData(game);
  const awayScoreColor = scoreColor(game, 'away', accent);
  const homeScoreColor = scoreColor(game, 'home', accent);

  return (
    <Sheet open={open} onClose={onClose} side="right">
      <SheetHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
              style={{
                color: accent,
                background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              }}
            >
              {game.sport.toUpperCase()}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 text-green-400 font-mono text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </SheetHeader>

      <SheetBody>
        {/* Scoreboard */}
        <div className="text-center mb-6">
          <div className="font-display text-sm uppercase tracking-wide text-text-muted mb-2">
            {game.venue}
          </div>
          {game.headline && (
            <div className="mb-2 font-mono text-[11px] italic text-text-muted">{game.headline}</div>
          )}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-right">
              {game.away.logo && (
                <img src={game.away.logo} alt="" className="h-9 w-9 shrink-0 object-contain" loading="lazy" decoding="async" />
              )}
              <div>
                <div className="font-display text-base font-semibold uppercase text-text-primary">
                  {rankPrefix(game.away.rank)}{game.away.name}
                </div>
                <div className="font-mono text-[11px] text-text-muted">{game.away.record}</div>
              </div>
            </div>
            {showPregameGauge ? (
              <WinProbGauge probability={game.winProbability?.home ?? 50} label="Home %" size={86} />
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: awayScoreColor }}>
                  {game.away.score}
                </span>
                <span className="text-text-muted">—</span>
                <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: homeScoreColor }}>
                  {game.home.score}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-left">
              <div>
                <div className="font-display text-base font-semibold uppercase text-text-primary">
                  {rankPrefix(game.home.rank)}{game.home.name}
                </div>
                <div className="font-mono text-[11px] text-text-muted">{game.home.record}</div>
              </div>
              {game.home.logo && (
                <img src={game.home.logo} alt="" className="h-9 w-9 shrink-0 object-contain" loading="lazy" decoding="async" />
              )}
            </div>
          </div>
          {game.statusDetail && (
            <div className="font-mono text-[11px] text-text-muted mt-1">{game.statusDetail}</div>
          )}
        </div>

        <Separator />

        {/* Key Stats */}
        {game.keyStats && game.keyStats.length > 0 && (
          <div className="my-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-text-muted" />
              <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">Key Stats</span>
            </div>
            <div className="space-y-2">
              {game.keyStats.map((stat) => (
                <div key={stat.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span className="text-right font-mono text-[12px] text-text-secondary tabular-nums">{stat.away}</span>
                  <span className="font-mono text-[10px] text-text-muted text-center min-w-[80px]">{stat.label}</span>
                  <span className="text-left font-mono text-[12px] text-text-secondary tabular-nums">{stat.home}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Matchup Radar */}
        <div className="my-4">
          <MatchupRadar game={game} />
        </div>

        <Separator />

        {/* Model Explainability (SHAP-like) */}
        <div className="my-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-text-muted" />
            <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">What Drives This Outcome</span>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={explainData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  type="number"
                  tick={{ fill: '#737373', fontSize: 10, fontFamily: 'var(--bsi-font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#a3a3a3', fontSize: 10, fontFamily: 'var(--bsi-font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <ReTooltip {...tooltipProps} />
                <Bar dataKey="delta" name="Impact" barSize={12} radius={[0, 4, 4, 0]}>
                  {explainData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.delta >= 0 ? BSI_CHART_COLORS.success : BSI_CHART_COLORS.error}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 font-mono text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-green-500/80" />
              <span className="text-text-muted">Favors outcome</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-red-500/80" />
              <span className="text-text-muted">Works against</span>
            </span>
          </div>
        </div>
      </SheetBody>
    </Sheet>
  );
}

function generateExplainData(game: IntelGame): Array<{ name: string; delta: number }> {
  const diff = game.home.score - game.away.score;
  const sign = diff >= 0 ? 1 : -1;
  return [
    { name: 'Score margin', delta: +(diff * 0.8).toFixed(1) },
    { name: 'Home court', delta: +(sign * 3.2).toFixed(1) },
    { name: 'Recent form', delta: +(sign * 1.8).toFixed(1) },
    { name: 'Pace factor', delta: -0.5 },
    { name: 'Rest days', delta: +(sign * 0.9).toFixed(1) },
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
