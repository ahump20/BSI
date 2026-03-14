'use client';

import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, ReferenceLine,
} from 'recharts';
import {
  SAVANT_CHART_COLORS, savantXAxisProps, savantYAxisProps,
  savantCartesianGridProps, savantTooltipProps,
} from '@/lib/chart-theme';

export interface PitchingCommandPlayer {
  player_name: string;
  team: string;
  conference: string;
  k_9: number;
  bb_9: number;
  fip?: number;
  ip?: number;
  player_id?: string;
}

interface PitchingCommandScatterProps {
  data: PitchingCommandPlayer[];
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

export function PitchingCommandScatter({
  data,
  onPlayerClick,
  className = '',
}: PitchingCommandScatterProps) {
  const chartData = useMemo(() => {
    const maxFip = Math.max(...data.map(p => p.fip ?? 5), 6);
    return data.map(p => ({
      ...p,
      z: maxFip - (p.fip ?? maxFip) + 1,
    }));
  }, [data]);

  return (
    <div className={`savant-card overflow-hidden bg-[var(--svt-card,_#0D0D0D)] border border-[var(--svt-border,_rgba(245,240,235,0.04))] rounded-sm ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--svt-border,_rgba(245,240,235,0.04))] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-savant-display text-base uppercase tracking-wider text-[var(--svt-text,_#F5F0EB)]">
            Pitching Command
          </h3>
          <p className="text-[10px] font-mono text-[var(--svt-text-muted,_#A89F95)] mt-0.5">
            K/9 vs BB/9 · Bubble size inversely proportional to FIP
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
              dataKey="k_9"
              name="K/9"
              {...savantXAxisProps}
              label={{
                value: 'STRIKEOUTS PER 9 (K/9)',
                position: 'insideBottom',
                offset: -20,
                fill: SAVANT_CHART_COLORS.axis,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <YAxis
              type="number"
              dataKey="bb_9"
              name="BB/9"
              reversed
              {...savantYAxisProps}
              label={{
                value: 'BB/9 (lower = better)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: SAVANT_CHART_COLORS.axis,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <ZAxis type="number" dataKey="z" range={[30, 350]} />
            <Tooltip
              {...savantTooltipProps}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const p = payload[0].payload as PitchingCommandPlayer;
                return (
                  <div className="bg-[var(--svt-surface,_#12151c)] border border-[var(--svt-border,_#242a38)] rounded-sm px-3 py-2 shadow-xl">
                    <div className="text-sm text-[var(--svt-text,_#e8eaf0)] font-medium">{p.player_name}</div>
                    <div className="text-[10px] text-[var(--svt-text-muted,_#8890a4)]">{p.team} · {p.conference}</div>
                    <div className="flex gap-3 mt-1.5">
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">K/9</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{p.k_9.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">BB/9</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{p.bb_9.toFixed(1)}</span>
                      </div>
                      {p.fip != null && (
                        <div>
                          <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">FIP</span>
                          <span className="block text-xs font-mono font-bold text-[var(--svt-accent,_#e85d26)]">{p.fip.toFixed(2)}</span>
                        </div>
                      )}
                      {p.ip != null && (
                        <div>
                          <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">IP</span>
                          <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{p.ip.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              x={9}
              stroke="rgba(136, 144, 164, 0.2)"
              strokeDasharray="4 3"
            />
            <ReferenceLine
              y={3}
              stroke="rgba(136, 144, 164, 0.2)"
              strokeDasharray="4 3"
            />
            <Scatter
              data={chartData}
              fill="#22d3ee"
              fillOpacity={0.55}
              stroke="#22d3ee"
              strokeOpacity={0.2}
              strokeWidth={1}
              cursor={onPlayerClick ? 'pointer' : 'default'}
              onClick={(entry) => {
                const d = entry as unknown as PitchingCommandPlayer;
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
