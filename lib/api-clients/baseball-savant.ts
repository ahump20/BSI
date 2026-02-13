/**
 * Baseball Savant / Statcast CSV Fetcher
 *
 * Fetches pitch-level Statcast data directly from Baseball Savant's
 * public CSV endpoint. No API key required — this is MLB's official
 * public data distribution channel.
 *
 * Endpoint: https://baseballsavant.mlb.com/statcast_search/csv
 *
 * Key fields available:
 *   - release_speed (mph)
 *   - release_pos_x, release_pos_z (feet, catcher's perspective)
 *   - release_extension (feet from rubber)
 *   - release_spin_rate (rpm)
 *   - effective_speed (mph, adjusted for extension)
 *   - launch_speed (exit velocity, mph)
 *   - launch_angle (degrees)
 *   - pfx_x, pfx_z (movement in inches)
 *   - spin_axis (degrees, 0-360)
 *   - plate_x, plate_z (pitch location at plate)
 *   - pitch_type, pitch_name
 *
 * Rate limits: ~25,000 rows per query, ~6 days per request.
 * Strategy: small date windows, cached results.
 *
 * Data source: https://baseballsavant.mlb.com/statcast_search
 * CSV docs: https://baseballsavant.mlb.com/csv-docs
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StatcastPitch {
  pitchType: string;
  pitchName: string;
  gameDate: string;
  releaseSpeedMph: number;
  releasePosX: number;
  releasePosZ: number;
  releaseExtensionFt: number;
  releaseSpinRate: number;
  effectiveSpeedMph: number;
  spinAxis: number;
  pfxX: number;
  pfxZ: number;
  plateX: number;
  plateZ: number;
  launchSpeed: number;
  launchAngle: number;
  playerName: string;
  pitcherId: string;
  batterId: string;
  events: string;
  description: string;
}

export interface StatcastPitcherSummary {
  pitcherId: string;
  playerName: string;
  team: string;
  pitchCount: number;
  avgFastballVelo: number;
  maxVelo: number;
  avgSpinRate: number;
  avgExtension: number;
  avgReleasePosX: number;
  avgReleasePosZ: number;
  pitchMix: Record<string, { count: number; avgVelo: number; avgSpin: number }>;
}

export interface SavantLeaderEntry {
  rank: number;
  playerId: string;
  playerName: string;
  team: string;
  value: number;
  supportingStats?: Record<string, string | number>;
}

export interface SavantResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'baseball-savant';
  rowCount?: number;
  timestamp: string;
  duration_ms: number;
}

// ─── CSV Endpoint ───────────────────────────────────────────────────────────

const SAVANT_BASE = 'https://baseballsavant.mlb.com/statcast_search/csv';

interface SavantQueryParams {
  playerType?: 'pitcher' | 'batter';
  season?: number;
  startDate?: string;
  endDate?: string;
  pitcherId?: number;
  batterId?: number;
  team?: string;
  pitchType?: string;
  gameType?: 'R' | 'PO' | 'S'; // Regular, Postseason, Spring
  minPitches?: number;
}

function buildSavantURL(params: SavantQueryParams): string {
  const season = params.season || new Date().getFullYear();
  const startDate = params.startDate || `${season}-03-20`;
  const endDate = params.endDate || `${season}-11-05`;

  const qs = new URLSearchParams({
    all: 'true',
    hfPT: params.pitchType || '',
    hfAB: '',
    hfBBT: '',
    hfPR: '',
    hfZ: '',
    stadium: '',
    hfBBL: '',
    hfNewZones: '',
    hfGT: `${params.gameType || 'R'}|`,
    hfC: '',
    hfSea: `${season}|`,
    hfSit: '',
    player_type: params.playerType || 'pitcher',
    hfOuts: '',
    opponent: '',
    pitcher_throws: '',
    batter_stands: '',
    hfSA: '',
    game_date_gt: startDate,
    game_date_lt: endDate,
    team: params.team || '',
    position: '',
    hfRO: '',
    home_road: '',
    hfFlag: '',
    hfPull: '',
    metric_1: '',
    hfInn: '',
    min_pitches: String(params.minPitches || 0),
    min_results: '0',
    group_by: 'name',
    sort_col: 'pitches',
    player_event_sort: 'h_launch_speed',
    sort_order: 'desc',
    min_abs: '0',
    type: 'details',
  });

  // Add pitcher/batter ID if specified
  if (params.pitcherId) {
    qs.set('pitchers_lookup[]', String(params.pitcherId));
  }
  if (params.batterId) {
    qs.set('batters_lookup[]', String(params.batterId));
  }

  return `${SAVANT_BASE}?${qs.toString()}`;
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────

function parseStatcastCSV(text: string): StatcastPitch[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const pitches: StatcastPitch[] = [];

  const col = (row: string[], name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (row[idx] || '').replace(/^"|"$/g, '').trim() : '';
  };

  const num = (row: string[], name: string): number => {
    const v = parseFloat(col(row, name));
    return Number.isFinite(v) ? v : 0;
  };

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV fields that might contain commas within quotes
    const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    if (row.length < 10) continue;

    pitches.push({
      pitchType: col(row, 'pitch_type'),
      pitchName: col(row, 'pitch_name'),
      gameDate: col(row, 'game_date'),
      releaseSpeedMph: num(row, 'release_speed'),
      releasePosX: num(row, 'release_pos_x'),
      releasePosZ: num(row, 'release_pos_z'),
      releaseExtensionFt: num(row, 'release_extension'),
      releaseSpinRate: num(row, 'release_spin_rate'),
      effectiveSpeedMph: num(row, 'effective_speed'),
      spinAxis: num(row, 'spin_axis'),
      pfxX: num(row, 'pfx_x'),
      pfxZ: num(row, 'pfx_z'),
      plateX: num(row, 'plate_x'),
      plateZ: num(row, 'plate_z'),
      launchSpeed: num(row, 'launch_speed'),
      launchAngle: num(row, 'launch_angle'),
      playerName: col(row, 'player_name'),
      pitcherId: col(row, 'pitcher'),
      batterId: col(row, 'batter'),
      events: col(row, 'events'),
      description: col(row, 'description'),
    });
  }

  return pitches;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch raw pitch-level Statcast data from Baseball Savant.
 * Returns up to 25,000 pitches per query.
 * Use small date windows (5-7 days) for best results.
 */
export async function fetchStatcastPitches(
  params: SavantQueryParams
): Promise<SavantResponse<StatcastPitch[]>> {
  const start = Date.now();
  const url = buildSavantURL(params);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BSI-Statcast-Client/1.0',
        'Accept': 'text/csv',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        source: 'baseball-savant',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - start,
      };
    }

    const text = await res.text();
    const pitches = parseStatcastCSV(text);

    return {
      success: true,
      data: pitches,
      source: 'baseball-savant',
      rowCount: pitches.length,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      source: 'baseball-savant',
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - start,
    };
  }
}

/**
 * Fetch and summarize a specific pitcher's Statcast profile.
 * Aggregates pitch mix, velocities, spin rates, and release point.
 */
export async function fetchPitcherStatcast(
  pitcherId: number,
  season?: number
): Promise<SavantResponse<StatcastPitcherSummary | null>> {
  const result = await fetchStatcastPitches({
    pitcherId,
    playerType: 'pitcher',
    season,
  });

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      ...result,
      data: null,
    };
  }

  const pitches = result.data;
  const playerName = pitches[0].playerName;

  // Build pitch mix
  const pitchMix: Record<string, { count: number; totalVelo: number; totalSpin: number }> = {};
  let totalFBVelo = 0;
  let fbCount = 0;
  let maxVelo = 0;
  let totalSpin = 0;
  let spinCount = 0;
  let totalExt = 0;
  let extCount = 0;
  let totalRPX = 0;
  let totalRPZ = 0;
  let rpCount = 0;

  for (const p of pitches) {
    // Pitch mix
    const type = p.pitchName || p.pitchType || 'Unknown';
    if (!pitchMix[type]) pitchMix[type] = { count: 0, totalVelo: 0, totalSpin: 0 };
    pitchMix[type].count++;
    if (p.releaseSpeedMph > 0) pitchMix[type].totalVelo += p.releaseSpeedMph;
    if (p.releaseSpinRate > 0) pitchMix[type].totalSpin += p.releaseSpinRate;

    // Fastball velo
    if (['FF', '4-Seam Fastball', 'SI', 'Sinker'].includes(p.pitchType) || ['4-Seam Fastball', 'Sinker'].includes(p.pitchName)) {
      if (p.releaseSpeedMph > 0) {
        totalFBVelo += p.releaseSpeedMph;
        fbCount++;
      }
    }

    if (p.releaseSpeedMph > maxVelo) maxVelo = p.releaseSpeedMph;
    if (p.releaseSpinRate > 0) { totalSpin += p.releaseSpinRate; spinCount++; }
    if (p.releaseExtensionFt > 0) { totalExt += p.releaseExtensionFt; extCount++; }
    if (p.releasePosX !== 0 || p.releasePosZ !== 0) {
      totalRPX += p.releasePosX;
      totalRPZ += p.releasePosZ;
      rpCount++;
    }
  }

  const formattedMix: Record<string, { count: number; avgVelo: number; avgSpin: number }> = {};
  for (const [type, data] of Object.entries(pitchMix)) {
    formattedMix[type] = {
      count: data.count,
      avgVelo: data.count > 0 ? Math.round((data.totalVelo / data.count) * 10) / 10 : 0,
      avgSpin: data.count > 0 ? Math.round(data.totalSpin / data.count) : 0,
    };
  }

  return {
    success: true,
    data: {
      pitcherId: String(pitcherId),
      playerName,
      team: '', // Not directly in CSV per-pitch data
      pitchCount: pitches.length,
      avgFastballVelo: fbCount > 0 ? Math.round((totalFBVelo / fbCount) * 10) / 10 : 0,
      maxVelo: Math.round(maxVelo * 10) / 10,
      avgSpinRate: spinCount > 0 ? Math.round(totalSpin / spinCount) : 0,
      avgExtension: extCount > 0 ? Math.round((totalExt / extCount) * 10) / 10 : 0,
      avgReleasePosX: rpCount > 0 ? Math.round((totalRPX / rpCount) * 100) / 100 : 0,
      avgReleasePosZ: rpCount > 0 ? Math.round((totalRPZ / rpCount) * 100) / 100 : 0,
      pitchMix: formattedMix,
    },
    source: 'baseball-savant',
    rowCount: pitches.length,
    timestamp: new Date().toISOString(),
    duration_ms: result.duration_ms,
  };
}

/**
 * Compute leaderboard from Statcast data for a specific metric.
 * Fetches recent data and aggregates by pitcher.
 */
export async function fetchStatcastLeaderboard(
  metric: 'exit_velocity' | 'sprint_speed' | 'barrel_rate' | 'hard_hit_pct' | 'spin_rate' | 'whiff_rate' | 'extension',
  params: { season?: number; startDate?: string; endDate?: string; limit?: number } = {}
): Promise<SavantResponse<SavantLeaderEntry[]>> {
  // For leaderboards, we need batter data for EV/barrel/etc, pitcher data for spin/whiff/extension
  const isPitcherMetric = ['spin_rate', 'whiff_rate', 'extension'].includes(metric);
  const result = await fetchStatcastPitches({
    playerType: isPitcherMetric ? 'pitcher' : 'batter',
    season: params.season,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (!result.success || !result.data) {
    return { ...result, data: [] };
  }

  // Aggregate by player
  const playerMap = new Map<string, { name: string; values: number[]; count: number }>();

  for (const pitch of result.data) {
    const id = isPitcherMetric ? pitch.pitcherId : pitch.batterId;
    const name = pitch.playerName;
    if (!id) continue;

    if (!playerMap.has(id)) {
      playerMap.set(id, { name, values: [], count: 0 });
    }
    const player = playerMap.get(id)!;
    player.count++;

    let value: number | null = null;
    switch (metric) {
      case 'exit_velocity': value = pitch.launchSpeed > 0 ? pitch.launchSpeed : null; break;
      case 'spin_rate': value = pitch.releaseSpinRate > 0 ? pitch.releaseSpinRate : null; break;
      case 'extension': value = pitch.releaseExtensionFt > 0 ? pitch.releaseExtensionFt : null; break;
      case 'hard_hit_pct': value = pitch.launchSpeed >= 95 ? 1 : pitch.launchSpeed > 0 ? 0 : null; break;
      case 'barrel_rate': {
        // Barrel: EV >= 98 mph and LA 26-30°, or EV 95-98 with LA in optimal range
        if (pitch.launchSpeed >= 98 && pitch.launchAngle >= 26 && pitch.launchAngle <= 30) value = 1;
        else if (pitch.launchSpeed > 0 && pitch.launchAngle !== 0) value = 0;
        break;
      }
    }

    if (value !== null) player.values.push(value);
  }

  // Compute averages and rank
  const entries: SavantLeaderEntry[] = [];
  for (const [id, player] of playerMap) {
    if (player.values.length < 20) continue; // Minimum sample size

    const avg = player.values.reduce((a, b) => a + b, 0) / player.values.length;
    const isRate = ['hard_hit_pct', 'barrel_rate', 'whiff_rate'].includes(metric);
    const value = isRate ? avg * 100 : avg;

    entries.push({
      rank: 0,
      playerId: id,
      playerName: player.name,
      team: '',
      value: Math.round(value * 10) / 10,
      supportingStats: { 'PA/Pitches': player.count },
    });
  }

  // Sort and rank
  entries.sort((a, b) => b.value - a.value);
  const limit = params.limit || 15;
  const ranked = entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    success: true,
    data: ranked,
    source: 'baseball-savant',
    rowCount: ranked.length,
    timestamp: new Date().toISOString(),
    duration_ms: result.duration_ms,
  };
}
