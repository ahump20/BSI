'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useSportData } from '@/lib/hooks/useSportData';
import { ScrollReveal } from '@/components/cinematic';
import { getPercentileColor } from '@/components/analytics/PercentileBar';
import { formatTimestamp } from '@/lib/utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerScoutingCompositeProps {
  playerId: string;
  position: 'hitter' | 'pitcher';
  className?: string;
}

interface PlayerSabermetricsResponse {
  player: {
    id: string;
    name: string;
    team?: string;
    position?: string;
  };
  stats: PlayerStats;
  league: LeagueStats;
  history?: GameLogEntry[];
  meta: { source: string; fetched_at: string; timezone: string };
}

interface PlayerStats {
  // Hitter
  k_pct?: number;
  bb_pct?: number;
  iso?: number;
  wrc_plus?: number;
  babip?: number;
  woba?: number;
  ops?: number;
  pa?: number;
  // Pitcher
  k_per_9?: number;
  bb_per_9?: number;
  fip?: number;
  ip?: number;
  k_pct_pitcher?: number;
  era?: number;
  whip?: number;
}

interface LeagueStats {
  k_pct?: number;
  bb_pct?: number;
  iso?: number;
  wrc_plus?: number;
  babip?: number;
  k_per_9?: number;
  bb_per_9?: number;
  fip?: number;
  ip?: number;
  k_pct_pitcher?: number;
}

interface GameLogEntry {
  date: string;
  [key: string]: string | number;
}

interface RadarDataPoint {
  dimension: string;
  percentile: number;
  rawValue: number;
  leagueAvg: number;
  fullMark: number;
}

interface SparklineDataPoint {
  date: string;
  value: number;
}

interface DimensionConfig {
  key: string;
  label: string;
  statKey: string;
  leagueKey: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
  historyKey?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RADAR_SIZE = { width: 320, height: 260 };
const SPARKLINE_HEIGHT = 60;

const HITTER_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'contact',
    label: 'Contact',
    statKey: 'k_pct',
    leagueKey: 'k_pct',
    higherIsBetter: false, // lower K% = better contact
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    historyKey: 'k_pct',
  },
  {
    key: 'power',
    label: 'Power',
    statKey: 'iso',
    leagueKey: 'iso',
    higherIsBetter: true,
    format: (v: number) => v.toFixed(3).replace(/^0/, ''),
    historyKey: 'iso',
  },
  {
    key: 'discipline',
    label: 'Discipline',
    statKey: 'bb_pct',
    leagueKey: 'bb_pct',
    higherIsBetter: true,
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    historyKey: 'bb_pct',
  },
  {
    key: 'production',
    label: 'Production',
    statKey: 'wrc_plus',
    leagueKey: 'wrc_plus',
    higherIsBetter: true,
    format: (v: number) => Math.round(v).toString(),
    historyKey: 'wrc_plus',
  },
  {
    key: 'babip_luck',
    label: 'BABIP Luck',
    statKey: 'babip',
    leagueKey: 'babip',
    higherIsBetter: true,
    format: (v: number) => v.toFixed(3).replace(/^0/, ''),
    historyKey: 'babip',
  },
];

const PITCHER_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'stuff',
    label: 'Stuff',
    statKey: 'k_per_9',
    leagueKey: 'k_per_9',
    higherIsBetter: true,
    format: (v: number) => v.toFixed(1),
    historyKey: 'k_per_9',
  },
  {
    key: 'command',
    label: 'Command',
    statKey: 'bb_per_9',
    leagueKey: 'bb_per_9',
    higherIsBetter: false, // lower BB/9 = better command
    format: (v: number) => v.toFixed(1),
    historyKey: 'bb_per_9',
  },
  {
    key: 'efficiency',
    label: 'Efficiency',
    statKey: 'fip',
    leagueKey: 'fip',
    higherIsBetter: false, // lower FIP = better
    format: (v: number) => v.toFixed(2),
    historyKey: 'fip',
  },
  {
    key: 'durability',
    label: 'Durability',
    statKey: 'ip',
    leagueKey: 'ip',
    higherIsBetter: true,
    format: (v: number) => v.toFixed(1),
    historyKey: 'ip',
  },
  {
    key: 'k_rate',
    label: 'K Rate',
    statKey: 'k_pct_pitcher',
    leagueKey: 'k_pct_pitcher',
    higherIsBetter: true,
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    historyKey: 'k_pct_pitcher',
  },
];

// Pick the 3 most interesting sparklines per position
const HITTER_SPARKLINE_KEYS = ['wrc_plus', 'iso', 'bb_pct'] as const;
const PITCHER_SPARKLINE_KEYS = ['k_per_9', 'fip', 'k_pct_pitcher'] as const;

// ---------------------------------------------------------------------------
// Percentile computation
// ---------------------------------------------------------------------------

/**
 * Compute a percentile rank for a player stat relative to a league average.
 * Uses a z-score approximation: assumes the player's deviation from league avg
 * maps to a 0-100 scale where 50 = league average.
 *
 * For "lower is better" stats (K%, BB/9, FIP), we invert the ranking so that
 * a lower raw value yields a higher percentile.
 */
function computePercentile(
  playerValue: number,
  leagueAvg: number,
  higherIsBetter: boolean
): number {
  if (leagueAvg === 0) return 50;

  // Normalize deviation: how far the player is from average, as a fraction of the average
  const deviation = (playerValue - leagueAvg) / leagueAvg;

  // Map deviation to 0-100 scale. A deviation of +/- 50% maps to roughly 90th/10th percentile.
  const SPREAD = 0.5;
  let normalized = 50 + (deviation / SPREAD) * 40;

  // Invert for "lower is better" stats
  if (!higherIsBetter) {
    normalized = 100 - normalized;
  }

  return Math.max(1, Math.min(99, Math.round(normalized)));
}

// ---------------------------------------------------------------------------
// Sparkline helpers
// ---------------------------------------------------------------------------

function extractSparklineData(
  history: GameLogEntry[] | undefined,
  key: string
): SparklineDataPoint[] {
  if (!history || history.length === 0) return [];

  return history
    .filter((entry) => entry[key] !== undefined && entry[key] !== null)
    .map((entry) => ({
      date: entry.date,
      value: typeof entry[key] === 'number' ? entry[key] as number : parseFloat(String(entry[key])),
    }))
    .filter((point) => !isNaN(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getDimensionLabel(dimensions: DimensionConfig[], historyKey: string): string {
  const dim = dimensions.find((d) => d.historyKey === historyKey);
  return dim?.label ?? historyKey;
}

function getDimensionConfig(dimensions: DimensionConfig[], historyKey: string): DimensionConfig | undefined {
  return dimensions.find((d) => d.historyKey === historyKey);
}

// ---------------------------------------------------------------------------
// Tooltip components
// ---------------------------------------------------------------------------

interface RadarTooltipProps {
  dimension: string;
  rawValue: number;
  leagueAvg: number;
  percentile: number;
  format: (v: number) => string;
  position: { x: number; y: number };
}

function RadarTooltipOverlay({
  dimension,
  rawValue,
  leagueAvg,
  percentile,
  format,
  position,
}: RadarTooltipProps): React.ReactElement {
  const color = getPercentileColor(percentile, true);

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -120%)',
      }}
    >
      <div
        className="px-3 py-2 rounded"
        style={{
          background: 'var(--surface-dugout)',
          border: '1px solid var(--border-vintage)',
        }}
      >
        <p
          className="text-[10px] uppercase tracking-wider mb-1"
          style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}
        >
          {dimension}
        </p>
        <p className="text-xs" style={{ fontFamily: 'var(--bsi-font-mono)', color: 'var(--bsi-bone)' }}>
          {format(rawValue)}{' '}
          <span style={{ color }}>({percentile}th)</span>
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
          Lg avg: {format(leagueAvg)}
        </p>
      </div>
    </div>
  );
}

interface SparklineTooltipPayload {
  value: number;
  payload: SparklineDataPoint;
}

function SparklineTooltipContent({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: SparklineTooltipPayload[];
  format: (v: number) => string;
}): React.ReactElement | null {
  if (!active || !payload?.[0]) return null;

  const entry = payload[0];

  return (
    <div
      className="px-2 py-1.5 rounded"
      style={{
        background: 'var(--surface-dugout)',
        border: '1px solid var(--border-vintage)',
      }}
    >
      <p className="text-[10px]" style={{ color: 'var(--bsi-dust)' }}>
        {entry.payload.date}
      </p>
      <p
        className="text-xs font-semibold"
        style={{ fontFamily: 'var(--bsi-font-mono)', color: 'var(--bsi-bone)' }}
      >
        {format(entry.value)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoutingRadar({
  data,
  dimensions,
  onHoverAxis,
  onLeaveAxis,
}: {
  data: RadarDataPoint[];
  dimensions: DimensionConfig[];
  onHoverAxis: (dim: string, event: React.MouseEvent) => void;
  onLeaveAxis: () => void;
}): React.ReactElement {
  const AxisTick = useMemo(() => {
    function CustomAxisTick(props: Record<string, unknown>): React.ReactElement {
      const x = props.x as number;
      const y = props.y as number;
      const payload = props.payload as { value: string };
      const dim = data.find((d) => d.dimension === payload.value);
      const percentile = dim?.percentile ?? 50;
      const color = getPercentileColor(percentile, true);

      return (
        <g
          onMouseEnter={(e) => onHoverAxis(payload.value, e)}
          onMouseLeave={onLeaveAxis}
          style={{ cursor: 'pointer' }}
        >
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fill: 'var(--bsi-dust)',
              fontFamily: 'var(--bsi-font-display)',
              fontSize: '10px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}
          >
            {payload.value}
          </text>
          <text
            x={x}
            y={y + 13}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fill: color,
              fontFamily: 'var(--bsi-font-mono)',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {percentile}
          </text>
        </g>
      );
    }
    return CustomAxisTick;
  }, [data, onHoverAxis, onLeaveAxis]);

  return (
    <div style={{ width: RADAR_SIZE.width, height: RADAR_SIZE.height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={<AxisTick />}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Player"
            dataKey="percentile"
            stroke="#BF5700"
            fill="#BF5700"
            fillOpacity={0.3}
            strokeWidth={2}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Sparkline({
  data,
  label,
  percentile,
  format,
}: {
  data: SparklineDataPoint[];
  label: string;
  percentile: number;
  format: (v: number) => string;
}): React.ReactElement {
  const color = getPercentileColor(percentile, true);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: SPARKLINE_HEIGHT }}>
        <span className="text-xs" style={{ color: 'var(--bsi-dust)' }}>
          Insufficient trend data
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-dust)' }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-semibold"
          style={{ fontFamily: 'var(--bsi-font-mono)', color }}
        >
          {format(data[data.length - 1].value)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={SPARKLINE_HEIGHT}>
        <AreaChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={`sparkFill-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            content={<SparklineTooltipContent format={format} />}
            cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#sparkFill-${label.replace(/\s/g, '')})`}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: 'var(--surface-dugout)', strokeWidth: 2 }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlayerScoutingComposite({
  playerId,
  position,
  className = '',
}: PlayerScoutingCompositeProps): React.ReactElement {
  const { data, loading, error } = useSportData<PlayerSabermetricsResponse>(
    `/api/college-baseball/players/${playerId}/sabermetrics`,
    { timeout: 12000 }
  );

  const [hoveredAxis, setHoveredAxis] = useState<{
    dimension: string;
    position: { x: number; y: number };
  } | null>(null);

  const dimensions = position === 'hitter' ? HITTER_DIMENSIONS : PITCHER_DIMENSIONS;
  const sparklineKeys = position === 'hitter' ? HITTER_SPARKLINE_KEYS : PITCHER_SPARKLINE_KEYS;

  // Build radar data from response
  const radarData: RadarDataPoint[] = useMemo(() => {
    if (!data?.stats || !data?.league) return [];

    return dimensions.map((dim) => {
      const playerValue = (data.stats as Record<string, number>)[dim.statKey] ?? 0;
      const leagueAvg = (data.league as Record<string, number>)[dim.leagueKey] ?? 0;
      const percentile = computePercentile(playerValue, leagueAvg, dim.higherIsBetter);

      return {
        dimension: dim.label,
        percentile,
        rawValue: playerValue,
        leagueAvg,
        fullMark: 100,
      };
    });
  }, [data, dimensions]);

  // Build sparkline datasets
  const sparklines = useMemo(() => {
    if (!data?.history) return [];

    return sparklineKeys.map((key) => {
      const dimConfig = getDimensionConfig(dimensions, key);
      const sparkData = extractSparklineData(data.history, key);
      const playerValue = (data.stats as Record<string, number>)[key] ?? 0;
      const leagueAvg = (data.league as Record<string, number>)[dimConfig?.leagueKey ?? key] ?? 0;
      const percentile = computePercentile(playerValue, leagueAvg, dimConfig?.higherIsBetter ?? true);

      return {
        key,
        label: getDimensionLabel(dimensions, key),
        data: sparkData,
        percentile,
        format: dimConfig?.format ?? ((v: number) => v.toFixed(2)),
      };
    });
  }, [data, dimensions, sparklineKeys]);

  const handleHoverAxis = useCallback((dimension: string, event: React.MouseEvent) => {
    const rect = (event.currentTarget as Element).closest('svg')?.getBoundingClientRect();
    if (!rect) return;
    setHoveredAxis({
      dimension,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    });
  }, []);

  const handleLeaveAxis = useCallback(() => {
    setHoveredAxis(null);
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className={`heritage-card p-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="animate-pulse rounded"
            style={{ background: 'rgba(255,255,255,0.04)', height: RADAR_SIZE.height }}
          />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded"
                style={{ background: 'rgba(255,255,255,0.04)', height: SPARKLINE_HEIGHT + 20 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error or no data
  if (error || !data?.stats) {
    return (
      <div className={`heritage-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm" style={{ color: 'var(--bsi-dust)' }}>
            No scouting data available for this player.
          </p>
        </div>
      </div>
    );
  }

  // Find hovered dimension data for tooltip
  const hoveredDimData = hoveredAxis
    ? radarData.find((d) => d.dimension === hoveredAxis.dimension)
    : null;
  const hoveredDimConfig = hoveredAxis
    ? dimensions.find((d) => d.label === hoveredAxis.dimension)
    : null;

  return (
    <ScrollReveal direction="up">
      <div
        className={`heritage-card relative ${className}`}
        role="img"
        aria-label={`Scouting profile for ${data.player?.name ?? 'player'}: ${position} percentile rankings and trend charts`}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-vintage)' }}
        >
          <div>
            <h3
              className="text-sm uppercase tracking-wider font-bold"
              style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
            >
              {data.player?.name ?? 'Player'} — Scouting Composite
            </h3>
            {data.player?.team && (
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--bsi-dust)' }}>
                {data.player.team}
                {data.player.position ? ` / ${data.player.position}` : ''}
              </p>
            )}
          </div>
          <span className="heritage-stamp">BSI Computed</span>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Radar chart */}
          <div
            className="flex items-center justify-center p-4 relative"
            style={{ borderRight: '1px solid var(--border-vintage)' }}
          >
            <ScoutingRadar
              data={radarData}
              dimensions={dimensions}
              onHoverAxis={handleHoverAxis}
              onLeaveAxis={handleLeaveAxis}
            />

            {/* Hover tooltip */}
            {hoveredDimData && hoveredDimConfig && hoveredAxis && (
              <RadarTooltipOverlay
                dimension={hoveredAxis.dimension}
                rawValue={hoveredDimData.rawValue}
                leagueAvg={hoveredDimData.leagueAvg}
                percentile={hoveredDimData.percentile}
                format={hoveredDimConfig.format}
                position={hoveredAxis.position}
              />
            )}
          </div>

          {/* Right: Sparklines */}
          <div className="p-4 space-y-4">
            {sparklines.length > 0 ? (
              sparklines.map((spark) => (
                <Sparkline
                  key={spark.key}
                  data={spark.data}
                  label={spark.label}
                  percentile={spark.percentile}
                  format={spark.format}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs" style={{ color: 'var(--bsi-dust)' }}>
                  No game log history available for trend analysis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trust footer */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderTop: '1px solid var(--border-vintage)',
            background: 'var(--surface-press-box)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Percentile legend */}
            {[
              { label: 'Elite', color: '#c0392b' },
              { label: 'Great', color: '#e74c3c' },
              { label: 'Avg', color: '#aaaaaa' },
              { label: 'Below', color: '#5b9bd5' },
              { label: 'Poor', color: '#1a5276' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className="text-[9px]"
                  style={{ fontFamily: 'var(--bsi-font-mono)', color: 'var(--bsi-dust)' }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--bsi-dust)' }}>
            {data.meta?.source ?? 'BSI'} &middot;{' '}
            {data.meta?.fetched_at ? formatTimestamp(data.meta.fetched_at) : 'Live'}
          </span>
        </div>
      </div>
    </ScrollReveal>
  );
}
