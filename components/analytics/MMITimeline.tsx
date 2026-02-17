'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface MMISnapshot {
  mmi_value: number;
  inning: number | null;
  inning_half: string | null;
  home_score: number;
  away_score: number;
}

interface MMITimelineProps {
  snapshots: MMISnapshot[];
  homeTeam?: string;
  awayTeam?: string;
  className?: string;
}

export function MMITimeline({ snapshots, homeTeam = 'Home', awayTeam = 'Away', className = '' }: MMITimelineProps) {
  if (snapshots.length === 0) {
    return <p className="text-white/40 text-sm text-center py-8">No momentum data available</p>;
  }

  const data = snapshots.map((s, i) => ({
    index: i,
    mmi: s.mmi_value,
    label: s.inning ? `${s.inning_half === 'top' ? 'T' : 'B'}${s.inning}` : `${i + 1}`,
    score: `${s.away_score}-${s.home_score}`,
  }));

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mmiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#BF5700" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#BF5700" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis
            domain={[-100, 100]}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickCount={5}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#BF5700' }}
            formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}`, 'MMI']}
          />
          <Area
            type="monotone"
            dataKey="mmi"
            stroke="#BF5700"
            fill="url(#mmiGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-white/30 px-2 mt-1">
        <span>{awayTeam} momentum</span>
        <span>{homeTeam} momentum</span>
      </div>
    </div>
  );
}
