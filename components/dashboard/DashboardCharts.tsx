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

const FALLBACK_STANDINGS_DATA: StandingsChartData[] = [
  { name: 'LAD', wins: 98, losses: 64, winPct: 0.605 },
  { name: 'PHI', wins: 95, losses: 67, winPct: 0.586 },
  { name: 'NYY', wins: 94, losses: 68, winPct: 0.58 },
  { name: 'BAL', wins: 91, losses: 71, winPct: 0.562 },
  { name: 'ATL', wins: 89, losses: 73, winPct: 0.549 },
];

export function StandingsBarChart({ data, isLoading }: StandingsBarChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-3 px-4" aria-hidden>
          <div className="h-4 rounded bg-surface animate-pulse" />
          <div className="h-4 rounded bg-surface animate-pulse" />
          <div className="h-4 rounded bg-surface animate-pulse" />
          <div className="h-4 rounded bg-surface animate-pulse" />
        </div>
        <span className="sr-only">Updating standings visualization</span>
      </div>
    );
  }

  const chartData = data.length > 0 ? data : FALLBACK_STANDINGS_DATA;

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bsi-charcoal)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
          />
          <Bar dataKey="wins" fill="#BF5700" radius={[4, 4, 0, 0]} /> {/* token: --bsi-primary */}
          <Bar dataKey="losses" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {data.length === 0 && (
        <p className="mt-2 text-xs text-text-muted">Showing last known standings snapshot.</p>
      )}
    </div>
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
            backgroundColor: 'var(--bsi-charcoal)',
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
