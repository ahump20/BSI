'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import type { SentimentSnapshot } from '../../lib/fanbase/types';

export interface SentimentChartProps {
  snapshots: SentimentSnapshot[];
  height?: number;
  showGrid?: boolean;
  variant?: 'line' | 'area';
  showMetrics?: ('overall' | 'optimism' | 'coachConfidence' | 'playoffHope')[];
  className?: string;
}

const METRIC_COLORS = {
  overall: '#BF5700', // burnt-orange
  optimism: '#22c55e', // success green
  coachConfidence: '#3b82f6', // info blue
  playoffHope: '#FF6B35', // ember
};

const METRIC_LABELS = {
  overall: 'Overall',
  optimism: 'Optimism',
  coachConfidence: 'Coach',
  playoffHope: 'Playoff Hope',
};

interface TooltipPayload {
  dataKey: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card p-3 border border-border-subtle">
      <p className="text-sm font-medium text-white mb-2">Week {label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white/70">
              {METRIC_LABELS[entry.dataKey as keyof typeof METRIC_LABELS]}
            </span>
          </span>
          <span className="font-medium text-white">{(entry.value * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

export function SentimentChart({
  snapshots,
  height = 200,
  showGrid = true,
  variant = 'area',
  showMetrics = ['overall'],
  className = '',
}: SentimentChartProps) {
  // Transform data for the chart
  const data = snapshots
    .sort((a, b) => a.week - b.week)
    .map((s) => ({
      week: `W${s.week}`,
      weekNum: s.week,
      overall: (s.sentiment.overall + 1) / 2, // Normalize -1..1 to 0..1
      optimism: s.sentiment.optimism,
      coachConfidence: s.sentiment.coachConfidence,
      playoffHope: s.sentiment.playoffHope,
      record: s.context.record,
    }));

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-[${height}px] bg-charcoal/50 rounded-lg ${className}`}
      >
        <p className="text-white/50 text-sm">No sentiment data available</p>
      </div>
    );
  }

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          )}
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 1]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={0.5}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="5 5"
            label={{ value: 'Neutral', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          />
          {showMetrics.map((metric) =>
            variant === 'area' ? (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_COLORS[metric]}
                fill={METRIC_COLORS[metric]}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ fill: METRIC_COLORS[metric], r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
              />
            ) : (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_COLORS[metric]}
                strokeWidth={2}
                dot={{ fill: METRIC_COLORS[metric], r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

export interface SentimentGaugeProps {
  value: number; // -1 to 1
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function SentimentGauge({
  value,
  label,
  size = 'md',
  showValue = true,
  className = '',
}: SentimentGaugeProps) {
  // Normalize -1..1 to 0..100
  const percentage = ((value + 1) / 2) * 100;

  const sizeStyles = {
    sm: { width: 60, strokeWidth: 6, fontSize: 'text-xs' },
    md: { width: 80, strokeWidth: 8, fontSize: 'text-sm' },
    lg: { width: 100, strokeWidth: 10, fontSize: 'text-base' },
  };

  const { width, strokeWidth, fontSize } = sizeStyles[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on sentiment
  const color = value > 0.3 ? '#22c55e' : value > -0.3 ? '#BF5700' : '#ef4444';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={width} height={width / 2 + 10} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2},${width / 2} A ${radius},${radius} 0 0 1 ${width - strokeWidth / 2},${width / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2},${width / 2} A ${radius},${radius} 0 0 1 ${width - strokeWidth / 2},${width / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        {showValue && (
          <text
            x={width / 2}
            y={width / 2 - 5}
            textAnchor="middle"
            className={`${fontSize} font-semibold fill-white`}
          >
            {value > 0 ? '+' : ''}
            {(value * 100).toFixed(0)}
          </text>
        )}
      </svg>
      {label && <span className="text-xs text-white/50 mt-1">{label}</span>}
    </div>
  );
}

export interface MetricBarProps {
  label: string;
  value: number; // 0 to 1
  color?: string;
  showPercentage?: boolean;
  className?: string;
}

export function MetricBar({
  label,
  value,
  color = '#BF5700',
  showPercentage = true,
  className = '',
}: MetricBarProps) {
  const percentage = Math.round(value * 100);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        {showPercentage && <span className="text-white font-medium">{percentage}%</span>}
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
