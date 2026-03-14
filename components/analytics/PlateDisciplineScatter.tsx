'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis, ReferenceArea, ReferenceLine,
} from 'recharts';
import {
  SAVANT_CHART_COLORS, savantXAxisProps, savantYAxisProps,
  savantCartesianGridProps,
} from '@/lib/chart-theme';
import { getConfColor } from '@/lib/data/conference-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScatterPlayer {
  player_name: string;
  team: string;
  conference: string;
  k_pct: number;
  bb_pct: number;
  pa?: number;
  player_id?: string;
}

interface PlateDisciplineScatterProps {
  data: ScatterPlayer[];
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlateDisciplineScatter({
  data,
  onPlayerClick,
  className = '',
}: PlateDisciplineScatterProps) {
  const [selectedConf, setSelectedConf] = useState<string>('');

  // Derive conferences
  const conferences = useMemo(() => {
    const confs = new Set<string>();
    for (const p of data) {
      if (p.conference) confs.add(p.conference);
    }
    return ['', ...Array.from(confs).sort()];
  }, [data]);

  // Filter + compute medians
  const { filteredData, medianK, medianBB } = useMemo(() => {
    const filtered = selectedConf ? data.filter(p => p.conference === selectedConf) : data;

    const kValues = data.map(p => p.k_pct).sort((a, b) => a - b);
    const bbValues = data.map(p => p.bb_pct).sort((a, b) => a - b);
    const mK = kValues.length > 0 ? kValues[Math.floor(kValues.length / 2)] : 0.2;
    const mBB = bbValues.length > 0 ? bbValues[Math.floor(bbValues.length / 2)] : 0.08;

    return { filteredData: filtered, medianK: mK, medianBB: mBB };
  }, [data, selectedConf]);

  // Chart data with bubble size
  const chartData = useMemo(() =>
    filteredData.map(p => ({
      ...p,
      z: p.pa ?? 30,
      fill: getConfColor(p.conference),
    })),
  [filteredData]);

  // Domain bounds
  const kExtent = useMemo(() => {
    const vals = data.map(d => d.k_pct);
    return [Math.max(0, Math.min(...vals) - 0.02), Math.max(...vals) + 0.02];
  }, [data]);

  const bbExtent = useMemo(() => {
    const vals = data.map(d => d.bb_pct);
    return [Math.max(0, Math.min(...vals) - 0.01), Math.max(...vals) + 0.01];
  }, [data]);

  return (
    <div className={`savant-card overflow-hidden bg-[var(--svt-card,_#0D0D0D)] border border-[var(--svt-border,_rgba(245,240,235,0.04))] rounded-sm ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--svt-border,_rgba(245,240,235,0.04))] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-savant-display text-base uppercase tracking-wider text-[var(--svt-text,_#F5F0EB)]">
            Plate Discipline
          </h3>
          <p className="text-[10px] font-mono text-[var(--svt-text-muted,_#A89F95)] mt-0.5">
            K% vs BB% · Bubble size = plate appearances
          </p>
        </div>
        <select
          aria-label="Filter by conference"
          value={selectedConf}
          onChange={(e) => setSelectedConf(e.target.value)}
          className="bg-[var(--svt-surface,_rgba(255,255,255,0.04))] border border-[var(--svt-border,_rgba(255,255,255,0.1))] rounded-sm px-2.5 py-1.5 text-xs text-[var(--svt-text-muted,_#A89F95)] font-mono appearance-none cursor-pointer hover:border-[var(--svt-accent,_#BF5700)] transition-colors focus:outline-none"
        >
          {conferences.map(c => (
            <option key={c} value={c} className="bg-[#12151c] text-[#e8eaf0]">
              {c || 'All Conferences'}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="px-2 py-4" style={{ background: SAVANT_CHART_COLORS.bg }}>
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 48, left: 56 }}>
            <CartesianGrid {...savantCartesianGridProps} />

            {/* Color-coded quadrant backgrounds */}
            <ReferenceArea
              x1={kExtent[0]} x2={medianK}
              y1={medianBB} y2={bbExtent[1]}
              fill={SAVANT_CHART_COLORS.quadrantGreen}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              x1={medianK} x2={kExtent[1]}
              y1={medianBB} y2={bbExtent[1]}
              fill={SAVANT_CHART_COLORS.quadrantYellow}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              x1={kExtent[0]} x2={medianK}
              y1={bbExtent[0]} y2={medianBB}
              fill={SAVANT_CHART_COLORS.quadrantGray}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
            <ReferenceArea
              x1={medianK} x2={kExtent[1]}
              y1={bbExtent[0]} y2={medianBB}
              fill={SAVANT_CHART_COLORS.quadrantRed}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />

            {/* Median divider lines */}
            <ReferenceLine x={medianK} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
            <ReferenceLine y={medianBB} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />

            <XAxis
              type="number"
              dataKey="k_pct"
              domain={kExtent}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              {...savantXAxisProps}
              label={{
                value: 'STRIKEOUT RATE (K%)',
                position: 'insideBottom',
                offset: -20,
                fill: SAVANT_CHART_COLORS.axis,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <YAxis
              type="number"
              dataKey="bb_pct"
              domain={bbExtent}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              {...savantYAxisProps}
              label={{
                value: 'WALK RATE (BB%)',
                angle: -90,
                position: 'insideLeft',
                offset: -42,
                fill: SAVANT_CHART_COLORS.axis,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <ZAxis type="number" dataKey="z" range={[20, 200]} />

            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const p = payload[0].payload as ScatterPlayer;
                return (
                  <div className="bg-[var(--svt-surface,_#12151c)] border border-[var(--svt-border,_#242a38)] rounded-sm px-3 py-2 shadow-xl">
                    <div className="text-sm text-[var(--svt-text,_#e8eaf0)] font-medium">{p.player_name}</div>
                    <div className="text-[10px] text-[var(--svt-text-muted,_#8890a4)]">{p.team} · {p.conference}</div>
                    <div className="flex gap-3 mt-1.5">
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">K%</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">
                          {(p.k_pct * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">BB%</span>
                        <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">
                          {(p.bb_pct * 100).toFixed(1)}%
                        </span>
                      </div>
                      {p.pa != null && (
                        <div>
                          <span className="text-[9px] text-[var(--svt-text-dim,_#555d73)] font-mono">PA</span>
                          <span className="block text-xs font-mono font-bold text-[var(--svt-text,_#e8eaf0)]">{p.pa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            <Scatter
              data={chartData}
              fillOpacity={0.65}
              strokeOpacity={0.3}
              strokeWidth={1}
              cursor={onPlayerClick ? 'pointer' : 'default'}
              onClick={(entry) => {
                const d = entry as unknown as ScatterPlayer;
                if (d?.player_id && onPlayerClick) {
                  onPlayerClick(d.player_id);
                }
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant labels */}
        <div className="flex justify-between px-14 -mt-2 mb-2">
          <span className="text-[9px] font-savant-display uppercase tracking-[0.12em] text-green-400/30">Elite Eye</span>
          <span className="text-[9px] font-savant-display uppercase tracking-[0.12em] text-yellow-400/30">Aggressive Power</span>
        </div>
        <div className="flex justify-between px-14 -mt-1">
          <span className="text-[9px] font-savant-display uppercase tracking-[0.12em] text-gray-400/30">Patient Contact</span>
          <span className="text-[9px] font-savant-display uppercase tracking-[0.12em] text-red-400/30">Free Swinger</span>
        </div>
      </div>

      {/* Conference legend */}
      <div className="px-5 py-3 border-t border-[var(--svt-border,_rgba(245,240,235,0.04))] flex flex-wrap items-center justify-center gap-3">
        {conferences.filter(c => c !== '').slice(0, 8).map(conf => (
          <button
            key={conf}
            onClick={() => setSelectedConf(selectedConf === conf ? '' : conf)}
            className={`flex items-center gap-1 transition-opacity ${
              selectedConf && selectedConf !== conf ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getConfColor(conf) }} />
            <span className="text-[9px] font-mono text-[var(--svt-text-muted,_#A89F95)]">{conf}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
