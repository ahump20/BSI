'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { withAlpha } from '@/lib/utils/color';

interface HAVFRadarProps {
  /** Player name displayed above chart */
  playerName: string;
  /** Component scores (0-100 each) */
  scores: {
    hitting: number;
    atBatQuality: number;
    velocity: number;
    fielding: number;
  };
  /** Overall HAV-F composite */
  composite: number;
  /** Optional size override */
  height?: number;
  className?: string;
}

const AXIS_LABELS: Record<string, string> = {
  H: 'Hitting',
  A: 'At-Bat Quality',
  V: 'Velocity',
  F: 'Fielding',
};

function getCompositeColor(score: number): string {
  // Hex retained — consumed by Recharts stroke/fill (token: --bsi-accent, --bsi-primary)
  if (score >= 80) return '#FF6B35'; // token: --bsi-accent
  if (score >= 60) return '#BF5700'; // token: --bsi-primary
  if (score >= 40) return 'rgba(255,255,255,0.7)';
  return 'rgba(255,255,255,0.4)';
}

function getCompositeGlow(score: number): string {
  if (score >= 80) return '0 0 20px rgba(255,107,53,0.4)'; // token: --bsi-accent
  if (score >= 60) return '0 0 12px rgba(191,87,0,0.3)'; // token: --bsi-primary
  return 'none';
}

/**
 * HAVFRadar — 4-axis radar chart for HAV-F player evaluation.
 *
 * Scouting-report aesthetic: the shape of the chart IS the insight.
 * High composite scores glow with ember intensity.
 */
export function HAVFRadar({
  playerName,
  scores,
  composite,
  height = 300,
  className = '',
}: HAVFRadarProps) {
  const data = [
    { axis: 'H', value: scores.hitting, fullMark: 100 },
    { axis: 'A', value: scores.atBatQuality, fullMark: 100 },
    { axis: 'V', value: scores.velocity, fullMark: 100 },
    { axis: 'F', value: scores.fielding, fullMark: 100 },
  ];

  const color = getCompositeColor(composite);

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-display text-sm uppercase tracking-widest text-text-secondary">
          HAV-F Profile
        </h4>
        <div
          className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
          style={{
            color,
            backgroundColor: withAlpha(color, 0.08),
            boxShadow: getCompositeGlow(composite),
          }}
        >
          {composite.toFixed(1)}
        </div>
      </div>
      <p className="text-text-primary font-semibold text-lg mb-3 truncate">{playerName}</p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid
            stroke="rgba(255,255,255,0.06)"
            radialLines={false}
          />
          <PolarAngleAxis
            dataKey="axis"
            tick={({ x, y, payload }) => {
              const label = AXIS_LABELS[payload.value as string] || payload.value;
              const score = data.find((d) => d.axis === payload.value)?.value ?? 0;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    textAnchor="middle"
                    dy={-6}
                    fill="rgba(255,255,255,0.5)"
                    fontSize={10}
                    fontFamily="'Oswald', sans-serif"
                    letterSpacing="0.05em"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {label}
                  </text>
                  <text
                    textAnchor="middle"
                    dy={8}
                    fill={color}
                    fontSize={12}
                    fontWeight={700}
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {score}
                  </text>
                </g>
              );
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.15}
            dot={{
              r: 3,
              fill: color,
              stroke: '#0D0D0D', // token: --bsi-midnight
              strokeWidth: 2,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Component breakdown bar */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {data.map((d) => (
          <div key={d.axis} className="text-center">
            <div className="h-1 rounded-full bg-surface-light overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${d.value}%`,
                  backgroundColor: color,
                  opacity: 0.6 + (d.value / 100) * 0.4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
