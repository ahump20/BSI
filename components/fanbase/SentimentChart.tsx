'use client';

import { useState } from 'react';
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
  ReferenceArea,
} from 'recharts';
import { Trophy, AlertTriangle, Star, UserPlus } from 'lucide-react';
import type { SentimentSnapshot } from '../../lib/fanbase/types';

// ============================================================================
// Types
// ============================================================================

export type TimeRange = 'week' | 'month' | 'season' | 'all';

export interface SentimentEvent {
  week: number;
  type: 'win' | 'loss' | 'recruiting' | 'news' | 'injury';
  label: string;
  impact?: 'positive' | 'negative' | 'neutral';
}

export interface SentimentChartProps {
  snapshots: SentimentSnapshot[];
  events?: SentimentEvent[];
  comparisonSnapshots?: SentimentSnapshot[];
  comparisonLabel?: string;
  height?: number;
  showGrid?: boolean;
  variant?: 'line' | 'area';
  showMetrics?: ('overall' | 'optimism' | 'coachConfidence' | 'playoffHope')[];
  showTimeRangeSelector?: boolean;
  showEventMarkers?: boolean;
  defaultTimeRange?: TimeRange;
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

const EVENT_COLORS: Record<SentimentEvent['type'], string> = {
  win: '#22c55e',
  loss: '#ef4444',
  recruiting: '#3b82f6',
  news: '#BF5700',
  injury: '#f59e0b',
};

type LucideIconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const EVENT_ICONS: Record<SentimentEvent['type'], LucideIconComponent> = {
  win: Trophy,
  loss: AlertTriangle,
  recruiting: UserPlus,
  news: Star,
  injury: AlertTriangle,
};

// ============================================================================
// Time Range Selector
// ============================================================================

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

function TimeRangeSelector({ value, onChange, className = '' }: TimeRangeSelectorProps) {
  const options: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'season', label: 'Season' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className={`inline-flex bg-white/5 rounded-lg p-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === opt.value
              ? 'bg-burnt-orange text-white'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Event Marker Component
// ============================================================================

interface EventMarkerProps {
  event: SentimentEvent;
  x: number;
  y: number;
}

function _EventMarker({ event, x, y }: EventMarkerProps) {
  const Icon = EVENT_ICONS[event.type];
  const color = EVENT_COLORS[event.type];

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r={12} fill={`${color}30`} />
      <foreignObject x={-8} y={-8} width={16} height={16}>
        <div className="flex items-center justify-center w-4 h-4">
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
      </foreignObject>
    </g>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function filterByTimeRange(
  snapshots: SentimentSnapshot[],
  range: TimeRange,
  currentWeek?: number
): SentimentSnapshot[] {
  if (range === 'all') return snapshots;

  const now = currentWeek ?? Math.max(...snapshots.map((s) => s.week));
  const weeksCutoff = {
    week: 1,
    month: 4,
    season: 17, // Full CFB season including bowl
  };

  const cutoff = now - weeksCutoff[range];
  return snapshots.filter((s) => s.week >= cutoff);
}

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
  events = [],
  comparisonSnapshots,
  comparisonLabel,
  height = 200,
  showGrid = true,
  variant = 'area',
  showMetrics = ['overall'],
  showTimeRangeSelector = false,
  showEventMarkers = false,
  defaultTimeRange = 'season',
  className = '',
}: SentimentChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);

  // Filter snapshots by time range
  const filteredSnapshots = filterByTimeRange(snapshots, timeRange);
  const filteredComparison = comparisonSnapshots
    ? filterByTimeRange(comparisonSnapshots, timeRange)
    : undefined;

  // Transform data for the chart
  const data = filteredSnapshots
    .sort((a, b) => a.week - b.week)
    .map((s) => {
      const base = {
        week: `W${s.week}`,
        weekNum: s.week,
        overall: (s.sentiment.overall + 1) / 2, // Normalize -1..1 to 0..1
        optimism: s.sentiment.optimism,
        coachConfidence: s.sentiment.coachConfidence,
        playoffHope: s.sentiment.playoffHope,
        record: s.context.record,
        event: events.find((e) => e.week === s.week),
      };

      // Add comparison data if available
      if (filteredComparison) {
        const compSnap = filteredComparison.find((c) => c.week === s.week);
        if (compSnap) {
          return {
            ...base,
            compOverall: (compSnap.sentiment.overall + 1) / 2,
            compOptimism: compSnap.sentiment.optimism,
            compCoachConfidence: compSnap.sentiment.coachConfidence,
            compPlayoffHope: compSnap.sentiment.playoffHope,
          };
        }
      }
      return base;
    });

  // Get events for markers
  const chartEvents = showEventMarkers
    ? events.filter((e) => data.some((d) => d.weekNum === e.week))
    : [];

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-charcoal/50 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-white/50 text-sm">No sentiment data available</p>
      </div>
    );
  }

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <div className={`w-full ${className}`}>
      {/* Header with time range selector */}
      {showTimeRangeSelector && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {comparisonLabel && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="w-3 h-0.5 bg-burnt-orange rounded" />
                <span>Primary</span>
                <span className="w-3 h-0.5 bg-white/30 rounded ml-2" />
                <span>{comparisonLabel}</span>
              </div>
            )}
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      )}

      {/* Event legend */}
      {showEventMarkers && chartEvents.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {Array.from(new Set(chartEvents.map((e) => e.type))).map((type) => {
            const Icon = EVENT_ICONS[type];
            return (
              <div key={type} className="flex items-center gap-1 text-xs text-white/50">
                <Icon className="w-3 h-3" style={{ color: EVENT_COLORS[type] }} />
                <span className="capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      )}

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

          {/* Event markers as reference areas */}
          {showEventMarkers &&
            chartEvents.map((event) => (
              <ReferenceArea
                key={`event-${event.week}-${event.type}`}
                x1={`W${event.week}`}
                x2={`W${event.week}`}
                y1={0}
                y2={1}
                stroke={EVENT_COLORS[event.type]}
                strokeOpacity={0.5}
                fill={EVENT_COLORS[event.type]}
                fillOpacity={0.1}
                label={{
                  value: event.label.substring(0, 10),
                  position: 'top',
                  fill: EVENT_COLORS[event.type],
                  fontSize: 9,
                }}
              />
            ))}

          {/* Comparison lines (behind primary) */}
          {filteredComparison &&
            showMetrics.map((metric) => (
              <Line
                key={`comp-${metric}`}
                type="monotone"
                dataKey={`comp${metric.charAt(0).toUpperCase() + metric.slice(1)}`}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            ))}

          {/* Primary metrics */}
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
