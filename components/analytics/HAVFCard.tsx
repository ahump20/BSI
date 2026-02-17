'use client';

import { useMemo } from 'react';

interface HAVFComponentData {
  hits: number;
  atBats: number;
  velocity: number;
  fielding: number;
}

interface HAVFCardProps {
  playerName: string;
  position: string;
  team: string;
  overall: number;
  components: HAVFComponentData;
  percentile: number;
  className?: string;
}

const LABELS = ['H', 'A', 'V', 'F'] as const;
const FULL_LABELS: Record<string, string> = {
  H: 'Hits',
  A: 'At-Bats',
  V: 'Velocity',
  F: 'Fielding',
};

function getGradeColor(value: number): string {
  if (value >= 70) return 'text-green-400';
  if (value >= 55) return 'text-[#BF5700]';
  if (value >= 40) return 'text-yellow-500';
  return 'text-red-400';
}

function getGradeLabel(value: number): string {
  if (value >= 80) return 'Elite';
  if (value >= 70) return 'Plus';
  if (value >= 55) return 'Above Avg';
  if (value >= 45) return 'Average';
  if (value >= 35) return 'Below Avg';
  return 'Poor';
}

/**
 * HAVFCard — Radar-style display for the HAV-F composite metric.
 * Uses a pure-CSS bar chart instead of Recharts to keep bundle size down.
 */
export function HAVFCard({
  playerName,
  position,
  team,
  overall,
  components,
  percentile,
  className = '',
}: HAVFCardProps) {
  const bars = useMemo(() => [
    { key: 'H', value: components.hits },
    { key: 'A', value: components.atBats },
    { key: 'V', value: components.velocity },
    { key: 'F', value: components.fielding },
  ], [components]);

  return (
    <div className={`bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide">
            {playerName}
          </h3>
          <p className="text-white/50 text-sm mt-0.5">
            {position} · {team}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold tabular-nums ${getGradeColor(overall)}`}>
            {overall.toFixed(1)}
          </div>
          <p className="text-white/30 text-xs uppercase tracking-wider mt-0.5">
            HAV-F
          </p>
        </div>
      </div>

      {/* Component Bars */}
      <div className="space-y-3">
        {bars.map(({ key, value }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-6 text-right">
              <span className="text-xs font-bold text-white/60" title={FULL_LABELS[key]}>
                {key}
              </span>
            </div>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${value}%`,
                  background: value >= 70
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : value >= 55
                      ? 'linear-gradient(90deg, #BF5700, #FF6B35)'
                      : value >= 40
                        ? 'linear-gradient(90deg, #eab308, #facc15)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                }}
              />
            </div>
            <div className="w-16 text-right">
              <span className={`text-sm font-semibold tabular-nums ${getGradeColor(value)}`}>
                {value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-white/30">
          {percentile > 0 ? `${percentile.toFixed(0)}th percentile` : 'Ranking pending'}
        </span>
        <span className={`text-xs font-semibold ${getGradeColor(overall)}`}>
          {getGradeLabel(overall)}
        </span>
      </div>
    </div>
  );
}
