'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getPercentileColor } from './PercentileBar';
import { withAlpha } from '@/lib/utils/color';
import { SAVANT_CHART_COLORS, savantXAxisProps, savantYAxisProps, savantCartesianGridProps } from '@/lib/chart-theme';

interface ConferenceRow {
  conference: string;
  strength_index: number;
  avg_era: number;
  avg_ops: number;
  avg_woba: number;
  is_power: number;
}

interface ConferenceStrengthChartProps {
  data: ConferenceRow[];
  isPro?: boolean;
  total?: number;
  className?: string;
}

/**
 * ConferenceStrengthChart — horizontal bar chart + ranked list with sub-metric badges.
 * Recharts bar chart for 4+ conferences; inline CSS bars for the expandable detail list.
 * P5 / mid-major tier separator. Expandable detail rows.
 */
function strengthColor(index: number, isPower: boolean): string {
  if (isPower) return 'var(--svt-accent, #BF5700)';
  if (index >= 60) return 'var(--svt-blue, #3b82f6)';
  if (index >= 45) return 'var(--svt-text-muted, #8890a4)';
  return 'var(--svt-text-dim, rgba(255,255,255,0.25))';
}

export function ConferenceStrengthChart({
  data,
  isPro = false,
  total,
  className = '',
}: ConferenceStrengthChartProps) {
  const [expandedConf, setExpandedConf] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => b.strength_index - a.strength_index);
  const displayData = isPro ? sorted : sorted.slice(0, 5);

  // Find where P5 ends and mid-major starts
  const p5Conferences = displayData.filter(c => c.is_power === 1);
  const midMajors = displayData.filter(c => c.is_power !== 1);
  const showTierSeparator = p5Conferences.length > 0 && midMajors.length > 0;

  // Compute percentiles for sub-metrics across all conferences
  const allERAs = data.map(c => c.avg_era).sort((a, b) => a - b);
  const allWOBAs = data.map(c => c.avg_woba).sort((a, b) => a - b);
  const allOPS = data.map(c => c.avg_ops).sort((a, b) => a - b);

  function getSubPctl(val: number, sorted: number[]): number {
    if (sorted.length <= 1) return 50;
    const below = sorted.filter(v => v < val).length;
    return (below / (sorted.length - 1)) * 100;
  }

  function renderConference(conf: ConferenceRow, i: number, globalRank: number) {
    const isExpanded = expandedConf === conf.conference;
    const eraPctl = getSubPctl(conf.avg_era, allERAs);
    const wobaPctl = getSubPctl(conf.avg_woba, allWOBAs);
    const opsPctl = getSubPctl(conf.avg_ops, allOPS);

    return (
      <div key={conf.conference}>
        <button
          className="flex items-center gap-3 w-full py-2 hover:bg-surface-light transition-colors rounded-sm px-1 -mx-1"
          onClick={() => setExpandedConf(isExpanded ? null : conf.conference)}
        >
          <span className={`text-xs font-mono w-4 tabular-nums ${
            globalRank <= 3 ? 'text-burnt-orange font-bold' : 'text-text-muted'
          }`}>
            {globalRank}
          </span>
          <span className="text-sm text-text-primary w-24 shrink-0 truncate text-left">
            {conf.conference}
          </span>
          <div className="flex-1 h-[10px] rounded-full bg-surface-light overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${conf.strength_index}%`,
                backgroundColor: strengthColor(conf.strength_index, conf.is_power === 1),
              }}
            />
          </div>
          <span
            className="text-xs font-mono font-bold tabular-nums w-8 text-right"
            style={{ color: strengthColor(conf.strength_index, conf.is_power === 1) }}
          >
            {conf.strength_index.toFixed(0)}
          </span>
          {/* Sub-metric badges */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <SubBadge label="ERA" value={conf.avg_era.toFixed(2)} color={getPercentileColor(eraPctl, false)} />
            <SubBadge label="wOBA" value={conf.avg_woba.toFixed(3)} color={getPercentileColor(wobaPctl, true)} />
            <SubBadge label="OPS" value={conf.avg_ops.toFixed(3)} color={getPercentileColor(opsPctl, true)} />
          </div>
          {conf.is_power === 1 && (
            <span className="text-[8px] text-burnt-orange font-mono uppercase tracking-wider">
              P5
            </span>
          )}
          <span className="text-[10px] text-text-muted ml-1">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>

        {/* Expanded detail row */}
        {isExpanded && (
          <div className="ml-8 mb-2 pl-4 border-l border-border-subtle py-2 space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <SubMetricBar label="ERA" value={conf.avg_era} pctl={eraPctl} format={(v) => v.toFixed(2)} higherIsBetter={false} />
              <SubMetricBar label="wOBA" value={conf.avg_woba} pctl={wobaPctl} format={(v) => v.toFixed(3)} higherIsBetter={true} />
              <SubMetricBar label="OPS" value={conf.avg_ops} pctl={opsPctl} format={(v) => v.toFixed(3)} higherIsBetter={true} />
            </div>
          </div>
        )}
      </div>
    );
  }

  let globalRank = 0;

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-border-subtle" style={{ borderTop: '2px solid var(--svt-accent, #BF5700)' }}>
        <h3 className="font-display text-base uppercase tracking-wider text-text-primary">
          Conference Strength Index
        </h3>
        <p className="text-[10px] text-text-muted mt-1 font-mono">
          Composite of inter-conference record, RPI, offense, and pitching · Click to expand
        </p>
      </div>

      {/* Horizontal bar chart */}
      {displayData.length > 3 && (
        <div className="px-3 py-4 border-b border-border-subtle" style={{ background: SAVANT_CHART_COLORS.bg }}>
          <ResponsiveContainer width="100%" height={Math.max(200, displayData.length * 32)}>
            <BarChart
              data={sorted.map(c => ({ ...c, name: c.conference }))}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 60 }}
            >
              <CartesianGrid {...savantCartesianGridProps} horizontal={false} vertical />
              <XAxis type="number" {...savantXAxisProps} />
              <YAxis
                type="category"
                dataKey="name"
                {...savantYAxisProps}
                width={55}
                tick={{ fill: SAVANT_CHART_COLORS.axis, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--svt-surface, #12151c)',
                  border: '1px solid var(--svt-border, #242a38)',
                  borderRadius: '2px',
                  color: '#e8eaf0',
                  fontSize: '0.75rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                formatter={(value: number) => [value.toFixed(1), 'Strength Index']}
              />
              <Bar dataKey="strength_index" radius={[0, 2, 2, 0]}>
                {sorted.map((conf) => (
                  <Cell
                    key={conf.conference}
                    fill={conf.is_power === 1 ? 'var(--svt-accent, #BF5700)' : 'var(--svt-blue, #3b82f6)'}
                    fillOpacity={0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="px-5 py-4 space-y-1">
        {/* P5 section */}
        {p5Conferences.map((conf, i) => {
          globalRank++;
          return renderConference(conf, i, globalRank);
        })}

        {/* Tier separator */}
        {showTierSeparator && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-border-subtle" />
            <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Mid-Major</span>
            <div className="flex-1 border-t border-border-subtle" />
          </div>
        )}

        {/* Mid-major section */}
        {midMajors.map((conf, i) => {
          globalRank++;
          return renderConference(conf, i, globalRank);
        })}
      </div>

      {isPro && displayData.length > 0 && (
        <div className="px-5 py-3 border-t border-border-subtle">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[10px] text-text-muted font-display uppercase tracking-widest block">Avg ERA</span>
              <span className="text-sm text-text-primary font-mono">{(displayData.reduce((s, c) => s + c.avg_era, 0) / displayData.length).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted font-display uppercase tracking-widest block">Avg wOBA</span>
              <span className="text-sm text-text-primary font-mono">{(displayData.reduce((s, c) => s + c.avg_woba, 0) / displayData.length).toFixed(3)}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted font-display uppercase tracking-widest block">Avg OPS</span>
              <span className="text-sm text-text-primary font-mono">{(displayData.reduce((s, c) => s + c.avg_ops, 0) / displayData.length).toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {!isPro && (total ?? data.length) > 5 && (
        <div className="px-5 py-3 border-t border-border-subtle text-center">
          <a
            href="/pricing"
            className="text-xs text-burnt-orange hover:text-ember font-medium transition-colors"
          >
            Upgrade to Pro for all {total ?? data.length} conferences
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SubBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-mono"
      style={{ backgroundColor: withAlpha(color, 0.09), color }}
    >
      <span className="text-text-muted">{label}</span>
      {value}
    </span>
  );
}

function SubMetricBar({
  label,
  value,
  pctl,
  format,
  higherIsBetter,
}: {
  label: string;
  value: number;
  pctl: number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}) {
  const color = getPercentileColor(pctl, higherIsBetter);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-text-muted font-mono uppercase">{label}</span>
        <span className="text-xs font-mono font-bold">{format(value)}</span>
      </div>
      <div className="h-[4px] rounded-full bg-surface-light overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(5, pctl)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
