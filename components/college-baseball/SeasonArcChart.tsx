'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { formatDateInTimezone } from '@/lib/utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeasonDataPoint {
  gameIndex: number;
  date: string;
  opponent: string;
  isConference: boolean;
  woba: number | null;
  fip: number | null;
  wrc_plus: number | null;
  cumulativeRecord: string;
}

interface SeasonArcResponse {
  teamId: string;
  season: number;
  dataPoints: SeasonDataPoint[];
  conferenceStartIndex: number;
  meta: { source: string; fetched_at: string; timezone: string };
}

interface SeasonArcChartProps {
  teamId: string;
  espnId: string;
  season?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants — Heritage Design System tokens as inline values
// (CSS custom properties aren't accessible in Recharts props)
// ---------------------------------------------------------------------------

const COLORS = {
  scoreboard: 'var(--surface-scoreboard)',
  grid: 'rgba(255,255,255,0.04)',
  woba: 'var(--bsi-primary)',
  fip: 'var(--heritage-columbia-blue)',
  wrcPlus: '#FDB913',   // --bsi-gold
  confBand: 'rgba(191,87,0,0.08)',
  nonConfBand: 'rgba(255,255,255,0.03)',
  dust: 'var(--bsi-dust)',
  bone: 'var(--bsi-bone)',
  pillActive: 'rgba(255,255,255,0.06)',
} as const;

type MetricKey = 'woba' | 'fip' | 'wrc_plus';

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; formatter: (v: number) => string }> = {
  woba:     { label: 'wOBA',  color: COLORS.woba,    formatter: (v) => v.toFixed(3) },
  fip:      { label: 'FIP',   color: COLORS.fip,     formatter: (v) => v.toFixed(2) },
  wrc_plus: { label: 'wRC+',  color: COLORS.wrcPlus, formatter: (v) => String(Math.round(v)) },
};

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  dataKey: string;
  value: number | null;
  color: string;
}

function ArcTooltip({
  active,
  payload,
  visibleMetrics,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  visibleMetrics: Set<MetricKey>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Get the underlying data point from the first payload entry
  const firstEntry = payload[0] as TooltipPayloadEntry & { payload?: SeasonDataPoint };
  const dataPoint = firstEntry?.payload;
  if (!dataPoint) return null;

  const formattedDate = formatDateInTimezone(dataPoint.date + 'T12:00:00', undefined, 'medium');

  return (
    <div
      className="rounded-sm px-3 py-2 shadow-lg"
      style={{
        backgroundColor: 'var(--surface-dugout)',
        border: '1px solid rgba(140,98,57,0.3)',
        fontFamily: 'var(--font-jetbrains, JetBrains Mono, monospace)',
        fontSize: '11px',
      }}
    >
      <p style={{ color: COLORS.dust, marginBottom: '4px' }}>{formattedDate}</p>
      <p style={{ color: COLORS.bone, fontWeight: 600, marginBottom: '6px' }}>
        vs {dataPoint.opponent}
        {dataPoint.isConference && (
          <span style={{ color: COLORS.woba, marginLeft: '6px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CONF
          </span>
        )}
      </p>
      {(['woba', 'fip', 'wrc_plus'] as MetricKey[]).map((key) => {
        if (!visibleMetrics.has(key)) return null;
        const config = METRIC_CONFIG[key];
        const val = dataPoint[key];
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '2px' }}>
            <span style={{ color: config.color }}>{config.label}</span>
            <span style={{ color: COLORS.bone }}>
              {val !== null ? config.formatter(val) : '—'}
            </span>
          </div>
        );
      })}
      <p style={{ color: COLORS.dust, marginTop: '4px', fontSize: '10px' }}>
        Record: {dataPoint.cumulativeRecord}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SeasonArcChart({ teamId, espnId, season, className }: SeasonArcChartProps): React.ReactElement {
  const currentYear = season ?? new Date().getFullYear();
  const [data, setData] = useState<SeasonArcResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricKey>>(
    new Set(['woba', 'fip', 'wrc_plus']),
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(
        `/api/college-baseball/teams/${espnId}/season-arc?season=${currentYear}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Failed to load season arc data`);
      const json = await res.json() as SeasonArcResponse;
      setData(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [espnId, currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMetric = useCallback((key: MetricKey) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow removing the last visible metric
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Reduced motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const hasData = data && data.dataPoints.length > 1;
  const fetchedAt = data?.meta?.fetched_at
    ? formatDateInTimezone(data.meta.fetched_at, undefined, 'medium')
    : null;

  return (
    <div className={`heritage-card ${className ?? ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <span className="heritage-stamp">SEASON ARC {currentYear}</span>

        {/* Metric Toggle Pills */}
        {hasData && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['woba', 'fip', 'wrc_plus'] as MetricKey[]).map((key) => {
              const config = METRIC_CONFIG[key];
              const isActive = visibleMetrics.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  aria-pressed={isActive}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontFamily: 'var(--font-jetbrains, JetBrains Mono, monospace)',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? config.color : COLORS.pillActive,
                    color: isActive ? COLORS.bone : COLORS.dust,
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart Area */}
      {loading && (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.dust,
            fontFamily: 'var(--font-cormorant, Cormorant Garamond, serif)',
            fontSize: '14px',
          }}
        >
          Loading season arc...
        </div>
      )}

      {error && (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.dust,
            fontFamily: 'var(--font-cormorant, Cormorant Garamond, serif)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !hasData && (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.dust,
            fontFamily: 'var(--font-cormorant, Cormorant Garamond, serif)',
            fontSize: '14px',
          }}
        >
          Season arc builds as games are played
        </div>
      )}

      {!loading && !error && hasData && (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: '600px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.dataPoints}
                margin={{ top: 8, right: 16, bottom: 8, left: -8 }}
              >
                {/* Background bands: non-conference then conference */}
                {data.conferenceStartIndex > 0 && (
                  <ReferenceArea
                    x1={1}
                    x2={data.dataPoints[data.conferenceStartIndex]?.gameIndex ?? data.dataPoints.length}
                    fill={COLORS.nonConfBand}
                    ifOverflow="hidden"
                  />
                )}
                {data.conferenceStartIndex < data.dataPoints.length && (
                  <ReferenceArea
                    x1={data.dataPoints[data.conferenceStartIndex]?.gameIndex ?? 1}
                    x2={data.dataPoints[data.dataPoints.length - 1].gameIndex}
                    fill={COLORS.confBand}
                    ifOverflow="hidden"
                  />
                )}

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.grid}
                  vertical={false}
                />

                <XAxis
                  dataKey="gameIndex"
                  tick={{
                    fill: COLORS.dust,
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  label={{
                    value: 'Game',
                    position: 'insideBottom',
                    offset: -4,
                    style: { fill: COLORS.dust, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
                  }}
                />

                <YAxis
                  tick={{
                    fill: COLORS.bone,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />

                <Tooltip
                  content={<ArcTooltip visibleMetrics={visibleMetrics} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeDasharray: '3 3' }}
                />

                {visibleMetrics.has('woba') && (
                  <Line
                    type="monotone"
                    dataKey="woba"
                    stroke={COLORS.woba}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.woba, stroke: COLORS.scoreboard, strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                  />
                )}

                {visibleMetrics.has('fip') && (
                  <Line
                    type="monotone"
                    dataKey="fip"
                    stroke={COLORS.fip}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.fip, stroke: COLORS.scoreboard, strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                  />
                )}

                {visibleMetrics.has('wrc_plus') && (
                  <Line
                    type="monotone"
                    dataKey="wrc_plus"
                    stroke={COLORS.wrcPlus}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.wrcPlus, stroke: COLORS.scoreboard, strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Footer — trust cues */}
      {!loading && !error && data && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '10px',
            fontFamily: 'var(--font-jetbrains, JetBrains Mono, monospace)',
            color: COLORS.dust,
          }}
        >
          <span>Source: {data.meta.source}</span>
          {fetchedAt && <span>Updated {fetchedAt}</span>}
        </div>
      )}
    </div>
  );
}
