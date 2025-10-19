import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  CartesianGrid,
} from 'recharts';

export type WinProbabilitySample = {
  pitchId: string;
  inning: number;
  half: 'Top' | 'Bottom';
  pitchCount: number;
  batter: string;
  description: string;
  winProbability: {
    home: number;
    away: number;
  };
  leverageIndex: number;
  isKeyEvent?: boolean;
  pitchMeta?: {
    pitchType: string;
    velocity: number;
    spinRate: number;
    zone: string;
  };
};

export type LiveWinProbability = {
  summary: {
    current: {
      home: number;
      away: number;
    };
    lastUpdated: string;
  };
  timeline: WinProbabilitySample[];
};

type WinProbabilityTimelineProps = {
  data: LiveWinProbability;
  homeTeam: string;
  awayTeam: string;
};

const formatLabel = (sample: WinProbabilitySample) =>
  `${sample.half.charAt(0)}${sample.inning} · P${sample.pitchCount}`;

const WinProbabilityTimeline: React.FC<WinProbabilityTimelineProps> = ({
  data,
  homeTeam,
  awayTeam,
}) => {
  const chartData = useMemo(
    () =>
      (data.timeline || []).map((sample) => ({
        ...sample,
        label: formatLabel(sample),
        homeWinProb: Number((sample.winProbability.home * 100).toFixed(1)),
        awayWinProb: Number((sample.winProbability.away * 100).toFixed(1)),
      })),
    [data.timeline]
  );

  const updatedTimestamp = useMemo(() => {
    if (!data.summary?.lastUpdated) {
      return 'just now';
    }

    const parsed = new Date(data.summary.lastUpdated);
    if (Number.isNaN(parsed.getTime())) {
      return 'just now';
    }

    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [data.summary?.lastUpdated]);

  if (!chartData.length) {
    return (
      <div className="timeline-empty-state">
        Win probability data is not yet available for this game.
      </div>
    );
  }

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <div>
          <h4>Win Probability</h4>
          <p className="timeline-subtitle">
            Updated {updatedTimestamp}
          </p>
        </div>
        <div className="timeline-legend">
          <span className="legend-chip legend-home" />
          <span>{homeTeam}</span>
          <span className="legend-chip legend-away" />
          <span>{awayTeam}</span>
        </div>
      </div>
      <div className="timeline-body">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="homeProbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="awayProbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '4 4' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const sample = payload[0].payload as (typeof chartData)[number];
                return (
                  <div className="timeline-tooltip">
                    <p className="tooltip-heading">
                      {sample.half} {sample.inning} · Pitch {sample.pitchCount}
                    </p>
                    <p className="tooltip-body">{sample.description}</p>
                    <div className="tooltip-grid">
                      <span>{homeTeam}</span>
                      <span>{sample.homeWinProb}%</span>
                      <span>{awayTeam}</span>
                      <span>{sample.awayWinProb}%</span>
                    </div>
                    <div className="tooltip-meta">
                      <span>Leverage {sample.leverageIndex.toFixed(2)}</span>
                      {sample.pitchMeta && (
                        <span>
                          {sample.pitchMeta.pitchType} · {Math.round(sample.pitchMeta.velocity)} mph ·{' '}
                          {sample.pitchMeta.spinRate} rpm
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="homeWinProb"
              stroke="var(--accent-color)"
              fill="url(#homeProbGradient)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="awayWinProb"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
            {chartData
              .filter((sample) => sample.isKeyEvent)
              .map((sample) => (
                <ReferenceDot
                  key={sample.pitchId}
                  x={sample.label}
                  y={sample.homeWinProb}
                  r={5}
                  fill="#f97316"
                  stroke="#fde68a"
                  strokeWidth={2}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
        <div className="timeline-footer">
          <span className="probability-chip">
            {homeTeam} {Math.round(data.summary.current.home * 100)}%
          </span>
          <span className="probability-chip away">
            {awayTeam} {Math.round(data.summary.current.away * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WinProbabilityTimeline;
