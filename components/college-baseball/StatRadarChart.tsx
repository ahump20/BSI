'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StatRadarChartProps {
  player1Name: string;
  player2Name: string;
  data: Array<{
    stat: string;
    player1: number;
    player2: number;
    fullMark: number;
  }>;
}

export function StatRadarChart({ player1Name, player2Name, data }: StatRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        No comparable statistics available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name={player1Name}
          dataKey="player1"
          stroke="#BF5700"
          fill="#BF5700"
          fillOpacity={0.3}
        />
        <Radar
          name={player2Name}
          dataKey="player2"
          stroke="#FF6B35"
          fill="#FF6B35"
          fillOpacity={0.3}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
