/**
 * Driveline Open Biomechanics Adapter
 *
 * Fetches REAL pitcher biomechanics data from Driveline's open-source
 * dataset on GitHub: github.com/drivelineresearch/openbiomechanics
 *
 * This is actual markerless motion capture data from elite pitchers
 * collected at 360 Hz with 92 biomechanics metrics per pitch.
 *
 * Key metrics mapped:
 *   - arm_slot → armSlotDegrees
 *   - max_rotation_hip_shoulder_separation → hipShoulderSeparationDegrees
 *   - stride_length → strideLengthPctHeight
 *   - max_pelvis_rotational_velo → pelvisRotationSpeedDegSec
 *   - max_torso_rotational_velo → trunkRotationSpeedDegSec
 *   - max_shoulder_external_rotation → shoulderExternalRotationDegrees
 *   - elbow_flexion_mer → elbowFlexionAtReleaseDegrees
 *   - elbow_varus_moment → elbowStress (Nm)
 *
 * No API key required — this is open-source data (CC BY 4.0).
 */

import type { BiomechanicsProfile } from './pitchernet-biomechanics';

// ─── Raw Driveline CSV Row ──────────────────────────────────────────────────

interface DrivelineRow {
  session_pitch: string;
  session: string;
  p_throws: string;
  pitch_type: string;
  pitch_speed_mph: string;
  arm_slot: string;
  max_rotation_hip_shoulder_separation: string;
  stride_length: string;
  max_pelvis_rotational_velo: string;
  max_torso_rotational_velo: string;
  max_shoulder_external_rotation: string;
  elbow_flexion_mer: string;
  max_shoulder_internal_rotational_velo: string;
  max_elbow_extension_velo: string;
  elbow_varus_moment: string;
  torso_anterior_tilt_br: string;
  shoulder_internal_rotation_moment: string;
  [key: string]: string;
}

// ─── Benchmarks computed from Driveline data (real distributions) ───────────

export interface DrivelineBenchmarks {
  armSlot: { mean: number; sd: number; p10: number; p50: number; p90: number };
  hipShoulderSep: { mean: number; sd: number; p10: number; p50: number; p90: number };
  strideLength: { mean: number; sd: number; p10: number; p50: number; p90: number };
  pelvisRotSpeed: { mean: number; sd: number; p10: number; p50: number; p90: number };
  torsoRotSpeed: { mean: number; sd: number; p10: number; p50: number; p90: number };
  shoulderER: { mean: number; sd: number; p10: number; p50: number; p90: number };
  elbowFlexionMER: { mean: number; sd: number; p10: number; p50: number; p90: number };
  elbowVarusMoment: { mean: number; sd: number; p10: number; p50: number; p90: number };
  fastballVelo: { mean: number; sd: number; p10: number; p50: number; p90: number };
}

// ─── CSV Parser (minimal, no dependencies) ──────────────────────────────────

function parseCSV(text: string): DrivelineRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: DrivelineRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]?.trim() || '';
    }
    rows.push(row as DrivelineRow);
  }

  return rows;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(values: number[]): { mean: number; sd: number; p10: number; p50: number; p90: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, sd: 0, p10: 0, p50: 0, p90: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: Math.round(mean * 100) / 100,
    sd: Math.round(Math.sqrt(variance) * 100) / 100,
    p10: Math.round(percentile(sorted, 10) * 100) / 100,
    p50: Math.round(percentile(sorted, 50) * 100) / 100,
    p90: Math.round(percentile(sorted, 90) * 100) / 100,
  };
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

const DRIVELINE_CSV_URL =
  'https://raw.githubusercontent.com/drivelineresearch/openbiomechanics/main/baseball_pitching/data/poi/poi_metrics.csv';

let cachedRows: DrivelineRow[] | null = null;
let cachedBenchmarks: DrivelineBenchmarks | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch the full Driveline open biomechanics dataset from GitHub.
 * Cached for 24 hours after first fetch.
 */
export async function fetchDrivelineData(): Promise<DrivelineRow[]> {
  if (cachedRows && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRows;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(DRIVELINE_CSV_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    cachedRows = parseCSV(text);
    cacheTimestamp = Date.now();
    return cachedRows;
  } catch (err) {
    clearTimeout(timeout);
    // Return cached data if available, even if stale
    if (cachedRows) return cachedRows;
    throw err;
  }
}

/**
 * Compute population benchmarks from the Driveline dataset.
 * Filters to fastballs (FF) only for velocity benchmarks.
 */
export async function computeDrivelineBenchmarks(): Promise<DrivelineBenchmarks> {
  if (cachedBenchmarks && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedBenchmarks;
  }

  const rows = await fetchDrivelineData();

  const num = (row: DrivelineRow, key: string): number | null => {
    const val = parseFloat(row[key]);
    return Number.isFinite(val) ? val : null;
  };

  const collect = (key: string, filter?: (r: DrivelineRow) => boolean) => {
    const values: number[] = [];
    for (const row of rows) {
      if (filter && !filter(row)) continue;
      const v = num(row, key);
      if (v !== null) values.push(v);
    }
    return values;
  };

  const isFastball = (r: DrivelineRow) => r.pitch_type === 'FF' || r.pitch_type === 'Fastball';

  cachedBenchmarks = {
    armSlot: computeStats(collect('arm_slot')),
    hipShoulderSep: computeStats(collect('max_rotation_hip_shoulder_separation')),
    strideLength: computeStats(collect('stride_length')),
    pelvisRotSpeed: computeStats(collect('max_pelvis_rotational_velo')),
    torsoRotSpeed: computeStats(collect('max_torso_rotational_velo')),
    shoulderER: computeStats(collect('max_shoulder_external_rotation')),
    elbowFlexionMER: computeStats(collect('elbow_flexion_mer')),
    elbowVarusMoment: computeStats(collect('elbow_varus_moment')),
    fastballVelo: computeStats(collect('pitch_speed_mph', isFastball)),
  };

  return cachedBenchmarks;
}

/**
 * Get all pitches for a specific session/pitcher from the Driveline dataset.
 */
export async function getDrivelinePitcherSession(sessionId: string): Promise<DrivelineRow[]> {
  const rows = await fetchDrivelineData();
  return rows.filter((r) => r.session === sessionId);
}

/**
 * Get unique session IDs (each represents a pitcher's lab visit).
 */
export async function getDrivelineSessions(): Promise<string[]> {
  const rows = await fetchDrivelineData();
  return [...new Set(rows.map((r) => r.session))];
}

/**
 * Convert a Driveline session into the BSI BiomechanicsProfile format.
 * Averages across all pitches in the session.
 */
export async function drivelineSessionToProfile(sessionId: string): Promise<BiomechanicsProfile | null> {
  const pitches = await getDrivelinePitcherSession(sessionId);
  if (pitches.length === 0) return null;

  const avg = (key: string): number => {
    const values = pitches
      .map((p) => parseFloat(p[key]))
      .filter((v) => Number.isFinite(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const fastballs = pitches.filter((p) => p.pitch_type === 'FF' || p.pitch_type === 'Fastball');
  const avgFF = (key: string): number => {
    const values = fastballs
      .map((p) => parseFloat(p[key]))
      .filter((v) => Number.isFinite(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const maxFF = (key: string): number => {
    const values = fastballs
      .map((p) => parseFloat(p[key]))
      .filter((v) => Number.isFinite(v));
    return values.length > 0 ? Math.max(...values) : 0;
  };

  const throws = pitches[0].p_throws === 'Left' ? 'L' as const : 'R' as const;
  const avgVelo = avgFF('pitch_speed_mph');
  const maxVelo = maxFF('pitch_speed_mph');

  // Compute velocity trend across pitches (group by pitch order)
  const veloTrend = fastballs
    .slice(0, 5)
    .map((p) => parseFloat(p.pitch_speed_mph))
    .filter((v) => Number.isFinite(v));

  // Mechanical drift: standard deviation of arm slot across session
  const armSlots = pitches
    .map((p) => parseFloat(p.arm_slot))
    .filter((v) => Number.isFinite(v));
  const armSlotMean = armSlots.reduce((a, b) => a + b, 0) / armSlots.length;
  const armSlotSD = Math.sqrt(
    armSlots.reduce((sum, v) => sum + (v - armSlotMean) ** 2, 0) / armSlots.length
  );
  // Drift score: SD normalized to 0-100 (SD of 5° = score of 50)
  const driftScore = Math.min(100, Math.round((armSlotSD / 5) * 50));

  // Elbow stress proxy from varus moment
  const elbowVarus = avg('elbow_varus_moment');
  const elbowRisk: 'low' | 'moderate' | 'elevated' | 'high' =
    elbowVarus > 80 ? 'high' : elbowVarus > 60 ? 'elevated' : elbowVarus > 40 ? 'moderate' : 'low';

  return {
    playerId: sessionId,
    playerName: `Driveline Session ${sessionId}`,
    team: 'Driveline Lab',
    throws,
    level: 'D1', // Driveline data spans college through pro
    dataSource: 'Driveline Open Biomechanics',
    lastUpdated: new Date().toISOString(),

    mechanics: {
      armSlotDegrees: Math.round(avg('arm_slot') * 10) / 10,
      hipShoulderSeparationDegrees: Math.round(avg('max_rotation_hip_shoulder_separation') * 10) / 10,
      strideLengthPctHeight: Math.round(avg('stride_length') * 10) / 10,
      trunkTiltDegrees: Math.round(avg('torso_anterior_tilt_br') * 10) / 10,
      shoulderExternalRotationDegrees: Math.round(avg('max_shoulder_external_rotation') * 10) / 10,
      elbowFlexionAtReleaseDegrees: Math.round(avg('elbow_flexion_mer') * 10) / 10,
      pelvisRotationSpeedDegSec: Math.round(avg('max_pelvis_rotational_velo')),
      trunkRotationSpeedDegSec: Math.round(avg('max_torso_rotational_velo')),
    },

    pitchMetrics: {
      avgFastballVelocityMph: Math.round(avgVelo * 10) / 10,
      maxFastballVelocityMph: Math.round(maxVelo * 10) / 10,
      avgSpinRateRpm: 0, // Not in Driveline POI data (requires Rapsodo)
      spinEfficiencyPct: 0,
      extensionFt: 0, // Not in Driveline POI data
      releasePtHeight: 0,
      inducedVertBreakIn: 0,
      horizontalBreakIn: 0,
    },

    workload: {
      pitchesLast7Days: pitches.length, // Session pitch count
      pitchesLast30Days: pitches.length,
      highEffortPitchesPct: Math.round(
        (fastballs.filter((p) => parseFloat(p.pitch_speed_mph) > avgVelo * 0.95).length /
          Math.max(fastballs.length, 1)) * 100
      ),
      velocityTrendLast5Starts: veloTrend.length >= 2 ? veloTrend : [avgVelo],
      mechanicalDriftScore: driftScore,
    },

    injuryRisk: {
      elbowStressProxy: elbowRisk,
      shoulderLoadProxy: 'low', // Requires more context than single session
      fatigueIndex: Math.min(100, Math.round(driftScore * 0.8 + (elbowVarus > 50 ? 20 : 0))),
      workloadConcern: elbowVarus > 60 || driftScore > 40,
      notes: [
        `Session: ${pitches.length} pitches thrown (${fastballs.length} fastballs).`,
        `Arm slot: ${avg('arm_slot').toFixed(1)}° (SD: ${armSlotSD.toFixed(1)}°)${armSlotSD > 3 ? ' — elevated variance.' : ' — consistent.'}`,
        elbowVarus > 0
          ? `Elbow varus moment: ${elbowVarus.toFixed(1)} Nm${elbowVarus > 60 ? ' — above threshold.' : '.'}`
          : 'Elbow varus moment data not available for this session.',
        `Source: Driveline Open Biomechanics (CC BY 4.0)`,
      ],
    },
  };
}
