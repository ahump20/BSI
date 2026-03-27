'use client';

import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ZAxis,
} from 'recharts';
import {
  SAVANT_CHART_COLORS, savantXAxisProps, savantYAxisProps,
  savantCartesianGridProps, savantTooltipProps,
} from '@/lib/chart-theme';

export interface BattedBallPlayer {
  player_name: string;
  team: string;
  conference: string;
  woba: number;
  iso: number;
  wrc_plus?: number;
  player_id?: string;
}

interface BattedBallScatterProps {
  data: BattedBallPlayer[];
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

export function BattedBallScatter({
  data,
  onPlayerClick,
  className = '',
}: BattedBallScatterProps) {
  const chartData = useMemo(() =>
    data.map(p => ({
      ...p,
      z: p.wrc_plus ?? 100,
    })),
  [data]);

  return (
    <div className={`savant-card overflow-hidden bg-[var(--svt-card,_#0D0D0D)] border border-[var(--svt-border,_rgba(245,240,235,0.04))] rounded-sm ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--svt-border,_rgba(245,240,235,0.04))] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-savant-display text-base uppercase tracking-wider text-[var(--svt-text,_#F5F0EB)]">
            Batted Ball Profile
          </h3>
          <p className="text-[10px] font-mono text-[var(--svt-text-muted,_#C4B8A5)] mt-0.5">
            wOBA vs ISO · Bubble size = wRC+
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-4" style={{ background: SAVANT_CHART_COLORS.bg }}>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
            <CartesianGrid {...savantCartesianGridProps} />
            <XAxis
              type="number"
              dataKey="iso"
              name="ISO"
              {...savantXAxisProps}
              label={{
                value: 'ISOLATED POWER (ISO)',
                position: 'insideBottom',
                offset: -20,
                fill: SAVANT_CHART_COLORS.axis,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <YAxis
              type="number"
              dataKey="woba"
              name="wOBA"
              {...savantYAxisProps}
              label={{
                value: 'wOBA',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: SAVANT_CHART_COLORS.axis,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip
              {...savantTooltipProps}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const p = payload[0].payload as BattedBallPlayer & { z: number };
                return (
                  <div className="bg-[var(--svt-surface,_var(--surface-press-box))] border border-[var(--svt-border,_var(--border-vintage))] rounded-sm px-3 py-2 shadow-xl">
                    <div className="text-sm text-[var(--svt-text,_#e8eaf0)] font-medium">{p.player_name}</div>
                    <div className="text-[10px] text-[var(--svt-text-muted,_#8890a4)]">{p.team} · {p.conference}</div>
                    <div className="flex gap-3 mt-1.5">
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">wOBA</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{p.woba.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">ISO</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{p.iso.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">wRC+</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{Math.round(p.z)}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={0.370}
              stroke={SAVANT_CHART_COLORS.accent}
              strokeDasharray="6 3"
              strokeOpacity={0.4}
              label={{
                value: '.370 wOBA',
                position: 'right',
                fill: SAVANT_CHART_COLORS.accent,
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <Scatter
              data={chartData}
              fill={SAVANT_CHART_COLORS.accent}
              fillOpacity={0.6}
              stroke={SAVANT_CHART_COLORS.accent}
              strokeOpacity={0.2}
              strokeWidth={1}
              cursor={onPlayerClick ? 'pointer' : 'default'}
              onClick={(entry) => {
                const d = entry as unknown as BattedBallPlayer;
                if (d?.player_id && onPlayerClick) {
                  onPlayerClick(d.player_id);
                }
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
