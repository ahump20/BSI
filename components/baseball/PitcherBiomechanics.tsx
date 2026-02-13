'use client';

/**
 * PitcherBiomechanics — Visual pitcher biomechanics profile component
 *
 * Displays arm slot, hip-shoulder separation, velocity trends, workload,
 * injury risk indicators, and mechanical benchmarking against MLB/D1 averages.
 *
 * Per the CV sports survey:
 *   - KinaTrax tracks 18 joint positions at 300fps in 50+ MLB parks
 *   - PitcherNet (CVPR 2024) achieves ~2° accuracy from broadcast video
 *   - UCL injuries cost MLB ~$300M/year — this component surfaces the
 *     fatigue and mechanical drift signals that predict them
 *   - Rapsodo is deployed at 90% of D1 programs for pitch-flight data
 *
 * Usage:
 *   <PitcherBiomechanics profile={biomechanicsProfile} />
 *   <PitcherBiomechanics level="D1" /> // renders benchmark profile
 */

import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { BiomechanicsProfile } from '@/lib/api-clients/pitchernet-biomechanics';
import { MLB_BENCHMARKS, D1_BENCHMARKS } from '@/lib/api-clients/pitchernet-biomechanics';
import { computeDrivelineBenchmarks } from '@/lib/api-clients/driveline-biomechanics';
import type { DrivelineBenchmarks } from '@/lib/api-clients/driveline-biomechanics';

interface PitcherBiomechanicsProps {
  profile?: BiomechanicsProfile | null;
  level?: 'MLB' | 'D1';
  compact?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function percentileColor(pct: number): string {
  if (pct >= 90) return 'text-green-400';
  if (pct >= 70) return 'text-blue-400';
  if (pct >= 40) return 'text-white';
  if (pct >= 20) return 'text-yellow-400';
  return 'text-red-400';
}

function riskColor(risk: string): string {
  switch (risk) {
    case 'high': return 'text-red-400 bg-red-400/10 border-red-400/30';
    case 'elevated': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    case 'moderate': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    default: return 'text-green-400 bg-green-400/10 border-green-400/30';
  }
}

function velocityTrendIcon(trend: number[]): { label: string; color: string } {
  if (trend.length < 2) return { label: 'N/A', color: 'text-text-tertiary' };
  const first = trend[0];
  const last = trend[trend.length - 1];
  const delta = last - first;
  if (delta > 0.3) return { label: `+${delta.toFixed(1)}`, color: 'text-green-400' };
  if (delta < -0.3) return { label: delta.toFixed(1), color: 'text-red-400' };
  return { label: 'Stable', color: 'text-white' };
}

function metricPercentile(
  value: number,
  benchmark: { avg: number; p10: number; p90: number }
): number {
  // Linear interpolation between p10 (10th) and p90 (90th)
  if (value <= benchmark.p10) return 10;
  if (value >= benchmark.p90) return 90;
  const range = benchmark.p90 - benchmark.p10;
  return Math.round(10 + ((value - benchmark.p10) / range) * 80);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PitcherBiomechanics({ profile, level = 'MLB', compact = false }: PitcherBiomechanicsProps) {
  const staticBenchmarks = level === 'MLB' ? MLB_BENCHMARKS : D1_BENCHMARKS;
  const [drivelineBench, setDrivelineBench] = useState<DrivelineBenchmarks | null>(null);

  // Fetch real Driveline benchmarks (open-source, no key needed)
  useEffect(() => {
    computeDrivelineBenchmarks()
      .then(setDrivelineBench)
      .catch(() => {}); // Silent fallback to static benchmarks
  }, []);

  // Merge: prefer Driveline real data when available, fall back to static
  const benchmarks = useMemo(() => {
    if (!drivelineBench) return staticBenchmarks;
    return {
      armSlotDegrees: { avg: drivelineBench.armSlot.mean, p10: drivelineBench.armSlot.p10, p90: drivelineBench.armSlot.p90 },
      hipShoulderSeparationDegrees: { avg: drivelineBench.hipShoulderSep.mean, p10: drivelineBench.hipShoulderSep.p10, p90: drivelineBench.hipShoulderSep.p90 },
      strideLengthPctHeight: { avg: drivelineBench.strideLength.mean, p10: drivelineBench.strideLength.p10, p90: drivelineBench.strideLength.p90 },
      shoulderExternalRotationDegrees: { avg: drivelineBench.shoulderER.mean, p10: drivelineBench.shoulderER.p10, p90: drivelineBench.shoulderER.p90 },
      pelvisRotationSpeedDegSec: { avg: drivelineBench.pelvisRotSpeed.mean, p10: drivelineBench.pelvisRotSpeed.p10, p90: drivelineBench.pelvisRotSpeed.p90 },
      trunkRotationSpeedDegSec: { avg: drivelineBench.torsoRotSpeed.mean, p10: drivelineBench.torsoRotSpeed.p10, p90: drivelineBench.torsoRotSpeed.p90 },
      avgFastballVelocityMph: { avg: drivelineBench.fastballVelo.mean, p10: drivelineBench.fastballVelo.p10, p90: drivelineBench.fastballVelo.p90 },
      spinRateRpm: staticBenchmarks.spinRateRpm, // Not in Driveline POI data
      extensionFt: staticBenchmarks.extensionFt,  // Not in Driveline POI data
    };
  }, [drivelineBench, staticBenchmarks]);

  const mechanicsGrades = useMemo(() => {
    if (!profile) return [];
    const m = profile.mechanics;
    return [
      {
        label: 'Arm Slot',
        value: `${m.armSlotDegrees}°`,
        pct: metricPercentile(m.armSlotDegrees, benchmarks.armSlotDegrees),
        note: m.armSlotDegrees > 55 ? 'Over-the-top' : m.armSlotDegrees < 25 ? 'Sidearm' : 'Three-quarters',
      },
      {
        label: 'Hip-Shoulder Sep',
        value: `${m.hipShoulderSeparationDegrees}°`,
        pct: metricPercentile(m.hipShoulderSeparationDegrees, benchmarks.hipShoulderSeparationDegrees),
        note: m.hipShoulderSeparationDegrees >= 55 ? 'Elite separation' : 'Normal range',
      },
      {
        label: 'Stride Length',
        value: `${m.strideLengthPctHeight}%`,
        pct: metricPercentile(m.strideLengthPctHeight, benchmarks.strideLengthPctHeight),
        note: `${m.strideLengthPctHeight}% of body height`,
      },
      {
        label: 'Pelvis Speed',
        value: `${m.pelvisRotationSpeedDegSec}°/s`,
        pct: metricPercentile(m.pelvisRotationSpeedDegSec, benchmarks.pelvisRotationSpeedDegSec),
        note: 'Rotation speed at foot plant',
      },
      {
        label: 'Trunk Speed',
        value: `${m.trunkRotationSpeedDegSec}°/s`,
        pct: metricPercentile(m.trunkRotationSpeedDegSec, benchmarks.trunkRotationSpeedDegSec),
        note: 'Peak trunk rotation speed',
      },
      {
        label: 'Shoulder ER',
        value: `${m.shoulderExternalRotationDegrees}°`,
        pct: metricPercentile(m.shoulderExternalRotationDegrees, benchmarks.shoulderExternalRotationDegrees),
        note: 'Layback angle',
      },
    ];
  }, [profile, benchmarks]);

  if (!profile) {
    return (
      <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Biomechanics</span>
          <Badge variant="secondary" size="sm">No Data</Badge>
        </div>
        <p className="text-text-secondary text-sm">
          Pitcher biomechanics data requires a KinaTrax, Rapsodo, or PitcherNet integration.
          When available, this component displays arm slot, hip-shoulder separation, velocity
          trends, workload metrics, and injury risk indicators.
        </p>
      </div>
    );
  }

  const veloTrend = velocityTrendIcon(profile.workload.velocityTrendLast5Starts);

  return (
    <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">Biomechanics</span>
          <Badge variant={profile.dataSource === 'BSI Benchmarks' ? 'secondary' : 'primary'} size="sm">
            {profile.dataSource}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">{profile.throws}HP</Badge>
          <Badge variant="outline" size="sm">{profile.level}</Badge>
        </div>
      </div>

      {/* Pitch Metrics Strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Fastball', value: `${profile.pitchMetrics.avgFastballVelocityMph.toFixed(1)}`, unit: 'mph' },
          { label: 'Spin Rate', value: `${Math.round(profile.pitchMetrics.avgSpinRateRpm)}`, unit: 'rpm' },
          { label: 'Extension', value: `${profile.pitchMetrics.extensionFt.toFixed(1)}`, unit: 'ft' },
          { label: 'Spin Eff', value: `${profile.pitchMetrics.spinEfficiencyPct}`, unit: '%' },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <div className="text-white font-mono text-lg font-bold">
              {m.value}<span className="text-text-tertiary text-xs ml-0.5">{m.unit}</span>
            </div>
            <div className="text-text-tertiary text-[10px] uppercase tracking-wider">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Mechanics Grades */}
      {!compact && (
        <div className="space-y-2.5 mb-5">
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Mechanics vs {level} Avg</h4>
          {mechanicsGrades.map((g) => (
            <div key={g.label} className="flex items-center gap-3">
              <span className="text-text-tertiary text-xs w-28 shrink-0">{g.label}</span>
              <div className="flex-1 h-1.5 bg-graphite rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    g.pct >= 70 ? 'bg-green-400' : g.pct >= 40 ? 'bg-burnt-orange' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${g.pct}%` }}
                />
              </div>
              <span className={`font-mono text-xs w-10 text-right ${percentileColor(g.pct)}`}>
                {g.value}
              </span>
              <span className="text-text-tertiary text-[10px] w-10 text-right">p{g.pct}</span>
            </div>
          ))}
        </div>
      )}

      {/* Workload & Fatigue */}
      <div className="bg-graphite rounded-lg p-3 mb-4">
        <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Workload</h4>
        <div className="grid grid-cols-3 gap-4 text-center mb-3">
          <div>
            <div className="text-white font-mono text-lg font-bold">{profile.workload.pitchesLast7Days}</div>
            <div className="text-text-tertiary text-[10px]">Last 7 Days</div>
          </div>
          <div>
            <div className="text-white font-mono text-lg font-bold">{profile.workload.pitchesLast30Days}</div>
            <div className="text-text-tertiary text-[10px]">Last 30 Days</div>
          </div>
          <div>
            <div className="text-white font-mono text-lg font-bold">{profile.workload.highEffortPitchesPct}%</div>
            <div className="text-text-tertiary text-[10px]">High Effort</div>
          </div>
        </div>

        {/* Velocity Trend */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-tertiary text-xs">Velo Trend (5 starts)</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {profile.workload.velocityTrendLast5Starts.map((v, i) => (
                <span key={i} className="text-text-secondary font-mono text-xs">{v.toFixed(1)}</span>
              ))}
            </div>
            <span className={`font-mono text-xs font-bold ${veloTrend.color}`}>{veloTrend.label}</span>
          </div>
        </div>

        {/* Mechanical Drift */}
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-text-tertiary text-xs">Mechanical Drift</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-charcoal rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  profile.workload.mechanicalDriftScore > 30 ? 'bg-red-400' :
                  profile.workload.mechanicalDriftScore > 15 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${profile.workload.mechanicalDriftScore}%` }}
              />
            </div>
            <span className="text-text-secondary font-mono text-xs">{profile.workload.mechanicalDriftScore}/100</span>
          </div>
        </div>
      </div>

      {/* Injury Risk */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-lg p-2.5 text-center border ${riskColor(profile.injuryRisk.elbowStressProxy)}`}>
          <div className="text-xs font-semibold uppercase tracking-wider">Elbow Stress</div>
          <div className="text-sm font-bold capitalize mt-0.5">{profile.injuryRisk.elbowStressProxy}</div>
        </div>
        <div className={`rounded-lg p-2.5 text-center border ${riskColor(profile.injuryRisk.shoulderLoadProxy)}`}>
          <div className="text-xs font-semibold uppercase tracking-wider">Shoulder Load</div>
          <div className="text-sm font-bold capitalize mt-0.5">{profile.injuryRisk.shoulderLoadProxy}</div>
        </div>
      </div>

      {/* Fatigue Index Bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-text-tertiary text-xs w-20 shrink-0">Fatigue</span>
        <div className="flex-1 h-2 bg-graphite rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              profile.injuryRisk.fatigueIndex > 70 ? 'bg-red-400' :
              profile.injuryRisk.fatigueIndex > 40 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${profile.injuryRisk.fatigueIndex}%` }}
          />
        </div>
        <span className="text-text-secondary font-mono text-xs w-14 text-right">
          {profile.injuryRisk.fatigueIndex}/100
        </span>
      </div>

      {/* Notes */}
      {profile.injuryRisk.notes.length > 0 && !compact && (
        <div className="space-y-1.5">
          {profile.injuryRisk.notes.map((note, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-burnt-orange mt-0.5 shrink-0">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-text-tertiary text-xs">{note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attribution */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-text-tertiary text-[10px]">
          {profile.dataSource} | Benchmarks: {drivelineBench ? 'Driveline Open Biomechanics' : level === 'MLB' ? 'KinaTrax / Statcast' : 'Rapsodo / D1 aggregate'}
        </span>
        <span className="text-text-tertiary text-[10px]">
          {profile.injuryRisk.workloadConcern ? 'WORKLOAD FLAG' : 'Normal workload'}
        </span>
      </div>
    </div>
  );
}
