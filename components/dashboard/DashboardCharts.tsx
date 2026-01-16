'use client';

/**
 * Dashboard Charts Component
 *
 * Lazy-loaded visualization charts for the dashboard.
 * Extracted for code-splitting to keep recharts (~200KB gzipped)
 * out of the initial bundle.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface StandingsChartData {
  name: string;
  wins: number;
  losses: number;
  winPct: number;
}

interface SportDistributionData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for recharts compatibility
}

interface DashboardChartsProps {
  standingsChartData: StandingsChartData[];
  sportDistributionData: SportDistributionData[];
  isLoading?: boolean;
}

// ============================================================================
// Chart Colors
// ============================================================================

const CHART_COLORS = {
  bars: ['#BF5700', '#FF6B35', '#8B5700', '#22C55E', '#3B82F6', '#8B5CF6'],
};

// ============================================================================
// Components
// ============================================================================

export function StandingsBarChart({
  data,
  isLoading,
}: {
  data: StandingsChartData[];
  isLoading?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-tertiary">
        {isLoading ? 'Loading chart data...' : 'No standings data available'}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
          <YAxis
            type="category"
            dataKey="name"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="wins" name="Wins" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS.bars[index % 6]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SportCoveragePieChart({ data }: { data: SportDistributionData[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export default function DashboardCharts({
  standingsChartData,
  sportDistributionData,
  isLoading,
}: DashboardChartsProps) {
  return (
    <>
      <StandingsBarChart data={standingsChartData} isLoading={isLoading} />
      <SportCoveragePieChart data={sportDistributionData} />
    </>
  );
}

// Named exports are already declared above with 'export function'
