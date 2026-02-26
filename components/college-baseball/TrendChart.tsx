'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DateTime } from 'luxon';

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  dataKey?: string;
  title: string;
  color?: string;
  type?: 'line' | 'area';
  yAxisDomain?: [number | string, number | string];
  valueFormatter?: (value: number) => string;
  height?: number;
}

function formatDate(dateStr: string): string {
  const dt = DateTime.fromISO(dateStr, { zone: 'America/Chicago' });
  return dt.isValid ? dt.toFormat('M/d') : dateStr;
}

interface TooltipPayloadEntry {
  value: number;
  payload: TrendDataPoint;
}

function CustomTooltip({
  active,
  payload,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.[0]) return null;

  const entry = payload[0];
  const dateStr = entry.payload.date;
  const dt = DateTime.fromISO(dateStr, { zone: 'America/Chicago' });
  const formattedDate = dt.isValid ? dt.toFormat('MMM d, yyyy') : dateStr;
  const formattedValue = valueFormatter
    ? valueFormatter(entry.value)
    : String(entry.value);

  return (
    <div className="bg-charcoal border border-border-strong rounded-lg px-3 py-2 shadow-lg">
      <p className="text-text-muted text-xs mb-1">{formattedDate}</p>
      <p className="text-text-primary font-mono text-sm font-semibold">
        {entry.payload.label ?? formattedValue}
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  title,
  color = '#BF5700', // token: --bsi-primary
  type = 'line',
  yAxisDomain,
  valueFormatter,
  height = 240,
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No trend data available
      </div>
    );
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-semibold">
        {title}
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yAxisDomain ?? ['auto', 'auto']}
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={<CustomTooltip valueFormatter={valueFormatter} />}
            cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
          />
          {type === 'area' ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'var(--bsi-charcoal)', strokeWidth: 2 }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'var(--bsi-charcoal)', strokeWidth: 2 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
