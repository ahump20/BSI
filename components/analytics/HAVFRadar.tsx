'use client';

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

interface HAVFRadarProps {
  hScore: number;
  aScore: number;
  vScore: number;
  fScore: number;
  playerName?: string;
  className?: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  H: 'Hitting',
  A: 'At-Bat Quality',
  V: 'Velocity',
  F: 'Fielding',
};

export function HAVFRadar({ hScore, aScore, vScore, fScore, playerName, className = '' }: HAVFRadarProps) {
  const data = [
    { dimension: 'H', value: hScore, fullName: DIMENSION_LABELS.H },
    { dimension: 'A', value: aScore, fullName: DIMENSION_LABELS.A },
    { dimension: 'V', value: vScore, fullName: DIMENSION_LABELS.V },
    { dimension: 'F', value: fScore, fullName: DIMENSION_LABELS.F },
  ];

  return (
    <div className={`w-full ${className}`}>
      {playerName && (
        <h4 className="text-sm font-semibold text-white/60 text-center mb-2">{playerName}</h4>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={45}
            domain={[0, 100]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="HAV-F"
            dataKey="value"
            stroke="#BF5700"
            fill="#BF5700"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#BF5700', fontWeight: 700 }}
            formatter={(value: number, _name: string, entry: { payload?: { fullName?: string } }) => [
              `${value}`,
              entry.payload?.fullName ?? _name,
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
