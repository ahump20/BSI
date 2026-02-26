'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface MMIDataPoint {
  /** Inning number or play index */
  inning: number;
  /** Display label for x-axis (e.g., "T1", "B3", "T7") */
  label: string;
  /** MMI value (-100 to +100) */
  value: number;
}

interface MMITimelineProps {
  data: MMIDataPoint[];
  /** Away team name for tooltip */
  awayTeam?: string;
  /** Home team name for tooltip */
  homeTeam?: string;
  height?: number;
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  awayTeam,
  homeTeam,
}: {
  active?: boolean;
  payload?: Array<{ payload: MMIDataPoint; value: number }>;
  awayTeam: string;
  homeTeam: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const val = point.value;
  const favoring = val > 5 ? homeTeam : val < -5 ? awayTeam : 'Neutral';

  return (
    <div className="bg-background-secondary border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-display uppercase tracking-wider text-text-muted mb-1">
        {point.payload.label}
      </p>
      <p className="text-sm font-mono font-bold tabular-nums" style={{ color: val > 0 ? '#BF5700' : val < 0 ? '#6B8DB2' : 'rgba(255,255,255,0.5)' }}>
        {val > 0 ? '+' : ''}{val.toFixed(1)}
      </p>
      <p className="text-[10px] text-text-muted mt-0.5">
        Favoring {favoring}
      </p>
    </div>
  );
}

/**
 * MMITimeline — area chart showing momentum trajectory over a game.
 *
 * Positive area (above zero line) fills with burnt orange — home momentum.
 * Negative area (below zero) fills with steel blue — away momentum.
 * The zero line is the constant — the drama lives in the swings.
 */
export function MMITimeline({
  data,
  awayTeam = 'Away',
  homeTeam = 'Home',
  height = 200,
  className = '',
}: MMITimelineProps) {
  if (data.length === 0) {
    return (
      <div className={`bg-background-primary border border-border-subtle rounded-xl p-5 ${className}`}>
        <h4 className="font-display text-sm uppercase tracking-widest text-text-secondary mb-4">
          Momentum Timeline
        </h4>
        <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
          No momentum data available
        </div>
      </div>
    );
  }

  // Split into positive and negative series for dual-color fills
  const chartData = data.map((d) => ({
    ...d,
    positive: d.value > 0 ? d.value : 0,
    negative: d.value < 0 ? d.value : 0,
  }));

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display text-sm uppercase tracking-widest text-text-secondary">
          Momentum Timeline
        </h4>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-[#6B8DB2]">
            <span className="w-2 h-2 rounded-full bg-[#6B8DB2]" />
            {awayTeam}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#BF5700]">
            <span className="w-2 h-2 rounded-full bg-[#BF5700]" />
            {homeTeam}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="mmiGradientPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BF5700" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#BF5700" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="mmiGradientNeg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#6B8DB2" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6B8DB2" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[-100, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
            ticks={[-100, -50, 0, 50, 100]}
          />

          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

          <Area
            type="monotone"
            dataKey="positive"
            stroke="#BF5700"
            strokeWidth={2}
            fill="url(#mmiGradientPos)"
            baseValue={0}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="negative"
            stroke="#6B8DB2"
            strokeWidth={2}
            fill="url(#mmiGradientNeg)"
            baseValue={0}
            isAnimationActive={false}
          />

          <Tooltip
            content={
              <CustomTooltip awayTeam={awayTeam} homeTeam={homeTeam} />
            }
            cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
