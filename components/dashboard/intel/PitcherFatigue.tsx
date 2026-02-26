'use client';

import { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BSI_CHART_COLORS, tooltipProps } from '@/lib/chart-theme';
import { useInjuryAlerts } from '@/lib/cv/hooks';
import { BIOMECHANICS_NORMS } from '@/lib/cv/seed-data';
import type { PitcherBiomechanics } from '@/lib/cv/types';

// ---------------------------------------------------------------------------
// Fatigue Zone Helpers
// ---------------------------------------------------------------------------

type FatigueZone = 'low' | 'moderate' | 'high';

function getZone(score: number): FatigueZone {
  if (score < 40) return 'low';
  if (score < 70) return 'moderate';
  return 'high';
}

const ZONE_COLORS: Record<FatigueZone, string> = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#ef4444',
};

const ZONE_LABELS: Record<FatigueZone, string> = {
  low: 'Fresh',
  moderate: 'Elevated',
  high: 'Fatigued',
};

// ---------------------------------------------------------------------------
// SVG Arc Gauge
// ---------------------------------------------------------------------------

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function FatigueGauge({ score }: { score: number }) {
  const zone = getZone(score);
  const cx = 80;
  const cy = 70;
  const r = 55;
  // 180-degree arc: -90 to 90
  const startAngle = -90;
  const endAngle = 90;
  const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);

  return (
    <svg viewBox="0 0 160 90" className="w-full max-w-[200px] mx-auto">
      {/* Background arc */}
      <path
        d={describeArc(cx, cy, r, startAngle, endAngle)}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Zone gradient arcs */}
      <path
        d={describeArc(cx, cy, r, -90, -30)}
        fill="none"
        stroke={ZONE_COLORS.low}
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d={describeArc(cx, cy, r, -30, 24)}
        fill="none"
        stroke={ZONE_COLORS.moderate}
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d={describeArc(cx, cy, r, 24, 90)}
        fill="none"
        stroke={ZONE_COLORS.high}
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.2}
      />
      {/* Active arc */}
      {score > 0 && (
        <path
          d={describeArc(cx, cy, r, startAngle, scoreAngle)}
          fill="none"
          stroke={ZONE_COLORS[zone]}
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}
      {/* Score text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill={ZONE_COLORS[zone]}
        fontSize="28"
        fontFamily="var(--bsi-font-display)"
        fontWeight="700"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="10"
        fontFamily="var(--bsi-font-mono)"
      >
        {ZONE_LABELS[zone]}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Velocity Sparkline
// ---------------------------------------------------------------------------

function VelocitySparkline({ data }: { data: PitcherBiomechanics[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.game_date,
        velo: d.velocity_current,
        start: d.velocity_start,
      })),
    [data],
  );

  if (chartData.length < 2) {
    return (
      <div className="h-[60px] flex items-center justify-center text-text-muted font-mono text-[10px]">
        Insufficient history
      </div>
    );
  }

  return (
    <div className="h-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="veloGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BSI_CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BSI_CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
          <ReTooltip {...tooltipProps} />
          <Area
            type="monotone"
            dataKey="velo"
            name="Velocity"
            stroke={BSI_CHART_COLORS.primary}
            fill="url(#veloGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Release Point Drift Scatter
// ---------------------------------------------------------------------------

function ReleaseDriftVisual({ driftInches }: { driftInches: number }) {
  const abs = Math.abs(driftInches);
  const isSignificant = abs >= BIOMECHANICS_NORMS.releasePointStableThreshold;
  const normalized = Math.min(1, abs / 4); // 4 inches = max visual displacement

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 60 40" className="w-[60px] h-[40px]">
        {/* Baseline circle */}
        <circle cx={30} cy={20} r={6} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        {/* Current release point */}
        <circle
          cx={30 + normalized * 15}
          cy={20 - normalized * 8}
          r={4}
          fill={isSignificant ? ZONE_COLORS.high : ZONE_COLORS.low}
          opacity={0.8}
        />
        {/* Drift line */}
        <line
          x1={30}
          y1={20}
          x2={30 + normalized * 15}
          y2={20 - normalized * 8}
          stroke={isSignificant ? ZONE_COLORS.high : 'rgba(255,255,255,0.2)'}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
      <div>
        <span className="font-mono text-[12px] text-text-secondary">{driftInches.toFixed(1)}&quot;</span>
        <span className="font-mono text-[10px] text-text-muted ml-1">drift</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pitcher Row
// ---------------------------------------------------------------------------

function PitcherRow({ pitcher }: { pitcher: PitcherBiomechanics }) {
  const zone = getZone(pitcher.fatigue_score);
  const riskFactors: string[] = (() => {
    try { return JSON.parse(pitcher.risk_factors); } catch { return []; }
  })();

  return (
    <div className="border-b border-border-subtle last:border-0 py-3 px-1">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-text-primary">{pitcher.player_name}</span>
          <span className="ml-2 text-[10px] font-mono text-text-muted">
            {pitcher.team} / {pitcher.league.toUpperCase()}
          </span>
        </div>
        <Badge
          variant={zone === 'high' ? 'error' : zone === 'moderate' ? 'warning' : 'success'}
          size="sm"
          className="font-mono"
        >
          {pitcher.fatigue_score}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
        <div>
          <span className="text-text-muted">Pitch Ct</span>
          <p className="text-text-primary">{pitcher.pitch_count}</p>
        </div>
        <div>
          <span className="text-text-muted">Velo Drop</span>
          <p className="text-text-primary">
            {pitcher.velocity_delta != null ? `${pitcher.velocity_delta > 0 ? '+' : ''}${pitcher.velocity_delta.toFixed(1)} mph` : '--'}
          </p>
        </div>
        <ReleaseDriftVisual driftInches={pitcher.release_point_drift_inches ?? 0} />
      </div>

      {riskFactors.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {riskFactors.map((f, i) => (
            <li key={i} className="text-[10px] text-text-muted flex items-start gap-1">
              <span className="text-yellow-500/60 mt-0.5">*</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main PitcherFatigue Component
// ---------------------------------------------------------------------------

interface PitcherFatigueProps {
  sport: 'mlb' | 'college-baseball';
}

export function PitcherFatigue({ sport }: PitcherFatigueProps) {
  const [threshold] = useState(50);
  const { data: alertsData, isLoading } = useInjuryAlerts(sport, threshold);
  const pitchers = alertsData?.data ?? [];

  // Highest fatigue pitcher for the gauge
  const topPitcher = pitchers[0] ?? null;

  if (isLoading) {
    return (
      <Card variant="default" padding="none">
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-burnt-orange" />
            Pitcher Fatigue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-burnt-orange/30 border-t-[#BF5700] rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-burnt-orange" />
            Pitcher Fatigue
          </CardTitle>
          <div className="flex items-center gap-2">
            {pitchers.length > 0 && (
              <Badge variant="accent" size="sm" className="font-mono">
                {pitchers.length} monitored
              </Badge>
            )}
            <Badge
              variant={sport === 'mlb' ? 'primary' : 'accent'}
              size="sm"
              className="font-mono"
            >
              {sport === 'mlb' ? 'MLB' : 'NCAABB'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Gauge — show highest fatigue pitcher */}
        {topPitcher ? (
          <div className="mb-4">
            <FatigueGauge score={topPitcher.fatigue_score} />
            <p className="text-center text-[11px] font-mono text-text-muted mt-1">
              {topPitcher.player_name} — highest active fatigue
            </p>
          </div>
        ) : (
          <div className="mb-4 text-center">
            <FatigueGauge score={0} />
            <p className="text-[11px] font-mono text-text-muted mt-1">
              No active fatigue alerts
            </p>
          </div>
        )}

        {/* Velocity Trend (uses history data if available) */}
        {pitchers.length > 1 && (
          <div className="mb-4">
            <p className="text-[10px] font-mono text-text-muted mb-1 uppercase tracking-wider">
              Velocity Trend
            </p>
            <VelocitySparkline data={pitchers} />
          </div>
        )}

        {/* Pitcher List */}
        {pitchers.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto">
            {pitchers.slice(0, 8).map((p) => (
              <PitcherRow key={`${p.player_id}-${p.game_id}`} pitcher={p} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-[11px] font-mono text-white/25">
              No pitchers above fatigue threshold
            </p>
            <p className="text-[10px] font-mono text-white/15 mt-1">
              Data populates during live games
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="font-mono text-[10px] text-white/20">
            Threshold: {threshold}+
          </span>
          <span className="font-mono text-[10px] text-white/20">
            CV Intelligence
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
