'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface StandingsChartData {
  name: string;
  wins: number;
  losses: number;
  winPct?: number;
}

interface StandingsBarChartProps {
  data: StandingsChartData[];
  isLoading?: boolean;
}

export function StandingsBarChart({ data, isLoading }: StandingsBarChartProps) {
  if (isLoading || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-white/30 text-sm">{isLoading ? 'Loading...' : 'No data available'}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: 12,
          }}
        />
        <Bar dataKey="wins" fill="#BF5700" radius={[4, 4, 0, 0]} />
        <Bar dataKey="losses" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface SportCoveragePieChartProps {
  data: PieChartData[];
}

export function SportCoveragePieChart({ data }: SportCoveragePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
