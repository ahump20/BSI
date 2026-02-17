'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

// ---------------------------------------------------------------------------
// Tooltip Formatter
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatValue(val: number): string {
  if (Number.isInteger(val)) return val.toLocaleString();
  return val.toFixed(2);
}

interface TooltipPayloadEntry {
  value?: number;
  payload?: TrendDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const dataPoint = entry.payload;

  return (
    <div className="bg-charcoal border border-border-subtle rounded-lg px-3 py-2 shadow-lg">
      <p className="text-text-tertiary text-[10px] font-mono uppercase tracking-wider">
        {dataPoint ? formatDate(dataPoint.date) : ''}
      </p>
      {dataPoint?.label && (
        <p className="text-text-secondary text-xs mt-0.5">{dataPoint.label}</p>
      )}
      <p className="text-burnt-orange font-mono text-sm font-bold mt-0.5">
        {entry.value !== undefined ? formatValue(entry.value) : '—'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrendChart({ data, height = 200 }: TrendChartProps) {
  // Prepare chart data with short date labels for the X axis
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        shortDate: (() => {
          try {
            const d = new Date(point.date);
            return d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          } catch {
            return point.date;
          }
        })(),
      })),
    [data]
  );

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-tertiary text-xs font-mono"
        style={{ height }}
      >
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="burntOrangeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#BF5700" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#BF5700" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="shortDate"
          tick={{ fontSize: 10, fill: '#737373', fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#737373', fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#BF5700"
          strokeWidth={2}
          fill="url(#burntOrangeGradient)"
          dot={false}
          activeDot={{
            r: 4,
            fill: '#BF5700',
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
