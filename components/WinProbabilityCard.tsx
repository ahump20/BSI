import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

type TimelinePoint = {
  timestamp: string;
  homeWinPercent: number;
  awayWinPercent: number;
  label?: string;
};

type WinProbabilitySeries = {
  timeline: TimelinePoint[];
  lastUpdated?: string;
};

type PitchLocation = {
  x: number;
  y: number;
};

type PitchMetric = {
  id?: string;
  timestamp: string;
  velocity: number;
  spinRate: number;
  pitchType?: string;
  location?: PitchLocation;
};

type TeamSummary = {
  id?: string;
  name: string;
  abbreviation?: string;
  score?: number;
};

type WinProbabilityCardProps = {
  gameId: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  winProbability?: WinProbabilitySeries;
  pitchMetrics?: PitchMetric[];
};

const MAX_SPARKLINE_POINTS = 120;

const formatPercent = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(1)}%`
    : '—';

const formatTimestamp = (iso?: string) => {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatVelocity = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(1)} mph`
    : '—';

const formatSpin = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value)} rpm`
    : '—';

const toLabel = (timestamp?: string, fallbackIndex?: number) => {
  if (!timestamp) {
    return fallbackIndex != null ? `P${fallbackIndex + 1}` : '';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackIndex != null ? `P${fallbackIndex + 1}` : '';
  }

  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeScore = (value: number, ceiling: number) =>
  Math.max(0, Math.min(100, Math.round((value / ceiling) * 100)));

const WinProbabilityCard = ({
  gameId,
  homeTeam,
  awayTeam,
  winProbability,
  pitchMetrics,
}: WinProbabilityCardProps) => {
  const timeline = winProbability?.timeline ?? [];
  const limitedTimeline = useMemo(
    () => timeline.slice(-MAX_SPARKLINE_POINTS),
    [timeline]
  );

  const sparklineData = useMemo(
    () =>
      limitedTimeline.map((point, index) => {
        const home = Number(point.homeWinPercent ?? 0);
        const away = Number(point.awayWinPercent ?? 0);
        return {
          index,
          home,
          away,
          label: point.label ?? toLabel(point.timestamp, index),
        };
      }),
    [limitedTimeline]
  );

  const currentHomeWin = sparklineData.length
    ? sparklineData[sparklineData.length - 1].home
    : null;
  const currentAwayWin =
    typeof currentHomeWin === 'number' ? 100 - currentHomeWin : null;

  const gradientId = useMemo(
    () => `win-probability-gradient-${gameId}`,
    [gameId]
  );

  const limitedPitchMetrics = useMemo(
    () => (pitchMetrics ?? []).slice(-50),
    [pitchMetrics]
  );

  const pitchSummary = useMemo(() => {
    if (!limitedPitchMetrics.length) {
      return null;
    }

    const totals = limitedPitchMetrics.reduce(
      (acc, metric) => {
        acc.velocity += Number.isFinite(metric.velocity)
          ? metric.velocity
          : 0;
        acc.spinRate += Number.isFinite(metric.spinRate)
          ? metric.spinRate
          : 0;
        if (metric.location) {
          const x = Number.isFinite(metric.location.x)
            ? metric.location.x
            : 0;
          const y = Number.isFinite(metric.location.y)
            ? metric.location.y
            : 0;
          acc.locationDistance += Math.sqrt(x * x + y * y);
          acc.locationSamples += 1;
        }
        return acc;
      },
      {
        velocity: 0,
        spinRate: 0,
        locationDistance: 0,
        locationSamples: 0,
      }
    );

    const averageVelocity = totals.velocity / limitedPitchMetrics.length;
    const averageSpinRate = totals.spinRate / limitedPitchMetrics.length;
    const averageDistance = totals.locationSamples
      ? totals.locationDistance / totals.locationSamples
      : 0.65;
    const edgePrecision = Math.max(
      0,
      Math.min(1, 1 - averageDistance / 1.2)
    );

    return {
      averageVelocity,
      averageSpinRate,
      edgePrecision,
      sampleSize: limitedPitchMetrics.length,
      lastPitch: limitedPitchMetrics[limitedPitchMetrics.length - 1],
    };
  }, [limitedPitchMetrics]);

  const radialData = useMemo(() => {
    if (!pitchSummary) {
      return [];
    }

    const { averageVelocity, averageSpinRate, edgePrecision } = pitchSummary;

    return [
      {
        name: 'Velo',
        value: normalizeScore(averageVelocity, 100),
        raw: averageVelocity,
        unit: 'mph',
        fill: '#FBBF24',
      },
      {
        name: 'Spin',
        value: normalizeScore(averageSpinRate, 3200),
        raw: averageSpinRate,
        unit: 'rpm',
        fill: '#6366F1',
      },
      {
        name: 'Edge',
        value: Math.max(0, Math.min(100, Math.round(edgePrecision * 100))),
        raw: edgePrecision * 100,
        unit: '%',
        fill: '#14B8A6',
      },
    ];
  }, [pitchSummary]);

  const homeLabel = homeTeam.abbreviation ?? homeTeam.name;
  const awayLabel = awayTeam.abbreviation ?? awayTeam.name;

  return (
    <div className="win-prob-card flex w-full flex-col gap-4 text-slate-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">
            Win Probability
          </p>
          <p className="text-lg font-semibold text-slate-100">
            {formatPercent(currentHomeWin)}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {homeLabel}
            </span>
          </p>
        </div>
        <div className="text-xs text-slate-400 sm:text-right">
          <p>
            {awayLabel}: {formatPercent(currentAwayWin)}
          </p>
          {winProbability?.lastUpdated && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
              Updated {formatTimestamp(winProbability.lastUpdated)}
            </p>
          )}
        </div>
      </div>

      <div className="h-20 w-full">
        {sparklineData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="home"
                stroke="#FBBF24"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Win probability data pending
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-between">
        <div className="h-32 w-full md:w-1/2">
          {radialData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={radialData}
                innerRadius="35%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  minAngle={15}
                  background
                  cornerRadius={8}
                  dataKey="value"
                  clockWise
                />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-600/60 text-xs text-slate-500">
              Pitch telemetry unavailable
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 text-xs text-slate-300">
          <p className="text-sm font-medium text-slate-200">
            Pitch Tunnel Snapshot
            <span className="ml-2 text-xs font-normal text-slate-500">
              Last {pitchSummary?.sampleSize ?? 0} pitches
            </span>
          </p>

          {radialData.length ? (
            radialData.map((metric) => (
              <div
                key={`${gameId}-${metric.name}`}
                className="flex items-center justify-between rounded-md border border-slate-700/60 bg-slate-900/40 px-3 py-2"
              >
                <span className="font-semibold text-slate-200">{metric.name}</span>
                <span className="text-slate-400">
                  {metric.name === 'Edge'
                    ? `${metric.raw.toFixed(1)}%`
                    : `${metric.raw.toFixed(1)} ${metric.unit}`}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-slate-700/60 bg-slate-900/20 px-3 py-2 text-slate-500">
              Waiting on pitch-level tracking
            </p>
          )}

          {pitchSummary?.lastPitch && (
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Last pitch: {pitchSummary.lastPitch.pitchType ?? '—'} ·{' '}
              {formatVelocity(pitchSummary.lastPitch.velocity)} ·{' '}
              {formatSpin(pitchSummary.lastPitch.spinRate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

WinProbabilityCard.displayName = 'WinProbabilityCard';

const areEqual = (
  prevProps: WinProbabilityCardProps,
  nextProps: WinProbabilityCardProps
) => {
  const prevTimeline = prevProps.winProbability?.timeline ?? [];
  const nextTimeline = nextProps.winProbability?.timeline ?? [];
  const prevLastTimelineUpdate =
    prevProps.winProbability?.lastUpdated ||
    (prevTimeline.length ? prevTimeline[prevTimeline.length - 1].timestamp : '');
  const nextLastTimelineUpdate =
    nextProps.winProbability?.lastUpdated ||
    (nextTimeline.length ? nextTimeline[nextTimeline.length - 1].timestamp : '');

  if (prevLastTimelineUpdate !== nextLastTimelineUpdate) {
    return false;
  }

  if (prevTimeline.length !== nextTimeline.length) {
    return false;
  }

  const prevPitchLength = prevProps.pitchMetrics?.length ?? 0;
  const nextPitchLength = nextProps.pitchMetrics?.length ?? 0;

  if (prevPitchLength !== nextPitchLength) {
    return false;
  }

  const prevLastPitch =
    prevPitchLength > 0
      ? prevProps.pitchMetrics?.[prevPitchLength - 1]?.timestamp
      : '';
  const nextLastPitch =
    nextPitchLength > 0
      ? nextProps.pitchMetrics?.[nextPitchLength - 1]?.timestamp
      : '';

  if (prevLastPitch !== nextLastPitch) {
    return false;
  }

  if (prevProps.homeTeam?.score !== nextProps.homeTeam?.score) {
    return false;
  }

  if (prevProps.awayTeam?.score !== nextProps.awayTeam?.score) {
    return false;
  }

  return true;
};

export default React.memo(WinProbabilityCard, areEqual);
