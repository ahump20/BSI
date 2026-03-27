'use client';

import { getPercentileColor } from './PercentileBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PercentileStat {
  key: string;
  label: string;
  value: number;
  /** Percentile 0–100 */
  percentile: number;
  /** Whether higher raw values are better */
  higherIsBetter: boolean;
  /** Format function for raw value display */
  format?: (v: number) => string;
}

export interface StatGroup {
  label: string;
  stats: PercentileStat[];
}

export interface ExpectedVsActual {
  label: string;
  actual: number;
  expected: number;
  format?: (v: number) => string;
}

interface PercentilePlayerCardProps {
  playerName: string;
  team: string;
  conference?: string;
  position?: string;
  /** Rank display e.g. "#3 / 247" */
  rank?: string;
  groups: StatGroup[];
  /** Expected vs Actual comparisons (xBA vs BA, etc.) */
  expectedVsActual?: ExpectedVsActual[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PercentilePlayerCard({
  playerName,
  team,
  conference,
  position,
  rank,
  groups,
  expectedVsActual,
  className = '',
}: PercentilePlayerCardProps) {
  return (
    <div className={`savant-card overflow-hidden bg-[var(--svt-card,_#0D0D0D)] border border-[var(--svt-border,_rgba(245,240,235,0.04))] rounded-sm ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--svt-border,_rgba(245,240,235,0.04))]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-savant-display font-bold text-lg uppercase tracking-wider text-[var(--svt-text,_#F5F0EB)]">
              {playerName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[var(--svt-text-muted,_#C4B8A5)]">{team}</span>
              {conference && (
                <span className="text-[10px] font-mono text-[var(--svt-text-dim,_#737373)]">
                  {conference}
                </span>
              )}
              {position && (
                <span className="text-[10px] font-mono text-[var(--svt-text-muted,_#C4B8A5)] uppercase px-1.5 py-0.5 rounded-sm bg-[var(--svt-surface,_rgba(140,98,57,0.12))]">
                  {position}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-savant-display uppercase tracking-widest text-[var(--svt-text-dim,_#737373)]">
              Percentile Rankings
            </span>
            {rank && (
              <span className="text-[11px] font-mono font-bold text-[var(--svt-accent,_#BF5700)]">
                {rank}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat groups — React/CSS bars */}
      <div className="px-5 py-4 space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-savant-display uppercase tracking-[0.1em] text-[var(--svt-text-dim,_#737373)]">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-[var(--svt-border,_rgba(140,98,57,0.15))]" />
            </div>

            {/* Stats */}
            <div className="space-y-2">
              {group.stats.map(stat => {
                const color = getPercentileColor(stat.percentile, stat.higherIsBetter);
                const pct = Math.max(0, Math.min(100, stat.percentile));
                const fmt = stat.format ?? ((v: number) => v >= 10 ? v.toFixed(0) : v.toFixed(3));

                return (
                  <div key={stat.key} className="flex items-center gap-3">
                    {/* Label */}
                    <span className="text-[10px] font-mono text-[var(--svt-text-muted,_#C4B8A5)] w-12 text-right shrink-0 uppercase">
                      {stat.label}
                    </span>

                    {/* Bar track */}
                    <div className="flex-1 h-[10px] rounded-full bg-[var(--svt-border,_rgba(140,98,57,0.08))] overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(3, pct)}%`,
                          backgroundColor: color,
                          opacity: 0.85,
                        }}
                      />
                    </div>

                    {/* Raw value */}
                    <span
                      className="text-[11px] font-mono font-semibold tabular-nums w-12 text-right shrink-0"
                      style={{ color: 'var(--svt-text, #F5F0EB)' }}
                    >
                      {fmt(stat.value)}
                    </span>

                    {/* Percentile pill */}
                    <span
                      className="text-[10px] font-mono font-bold tabular-nums w-8 text-center shrink-0 rounded-full py-0.5 text-white"
                      style={{ backgroundColor: color }}
                    >
                      {Math.round(pct)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Expected vs Actual section */}
      {expectedVsActual && expectedVsActual.length > 0 && (
        <div className="px-5 py-4 border-t border-[var(--svt-border,_rgba(140,98,57,0.15))]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-savant-display uppercase tracking-[0.1em] text-[var(--svt-text-dim,_#737373)]">
              Expected vs Actual
            </span>
            <div className="flex-1 h-px bg-[var(--svt-border,_rgba(140,98,57,0.15))]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {expectedVsActual.map(item => {
              const delta = item.actual - item.expected;
              const fmt = item.format ?? ((v: number) => v.toFixed(3));
              const isPositive = delta > 0;
              const deltaColor = isPositive ? '#22c55e' : '#ef4444';
              const deltaSign = isPositive ? '+' : '';

              return (
                <div
                  key={item.label}
                  className="flex flex-col gap-1 p-3 rounded-sm bg-[var(--svt-surface,_rgba(140,98,57,0.06))]"
                >
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--svt-text-dim,_#737373)]">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-mono font-bold tabular-nums text-[var(--svt-text,_#F5F0EB)]">
                      {fmt(item.actual)}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--svt-text-muted,_#C4B8A5)]">
                      vs {fmt(item.expected)}
                    </span>
                  </div>
                  <span
                    className="text-xs font-mono font-bold tabular-nums"
                    style={{ color: deltaColor }}
                  >
                    {deltaSign}{fmt(delta)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-5 py-3 border-t border-[var(--svt-border,_rgba(140,98,57,0.15))] flex items-center justify-center gap-4">
        {[
          { label: 'Elite', color: '#ef4444' },
          { label: 'Great', color: '#f97316' },
          { label: 'Above', color: '#eab308' },
          { label: 'Avg', color: '#8890a4' },
          { label: 'Below', color: '#3b82f6' },
          { label: 'Poor', color: '#6366f1' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] font-mono text-[var(--svt-text-dim,_#737373)]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
