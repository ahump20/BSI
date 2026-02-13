/**
 * SkillCorner Open Data Adapter
 *
 * Fetches REAL broadcast-derived tracking data from SkillCorner's
 * open-source GitHub repository — no API key required.
 *
 * Repository: https://github.com/SkillCorner/opendata
 * License: MIT
 *
 * Available data:
 *   - 10 matches from 2024/2025 Australian A-League season
 *   - Per-match: lineup, tracking (10fps XY), dynamic events, phases of play
 *   - Tracking covers ~14 of 22 players per frame (broadcast camera limitation)
 *   - ~97% player identity accuracy
 *   - Coordinates in meters, pitch-centered (0,0 at center, 105m x 68m)
 *
 * This adapter fetches match data and converts it into the BSI
 * MatchTrackingSummary format used by the MatchTracking component.
 */

import type { MatchTrackingSummary, TeamTrackingData, PlayerTrackingData } from './skillcorner';

// ─── GitHub Raw URLs ─────────────────────────────────────────────────────────

const OPENDATA_BASE = 'https://raw.githubusercontent.com/SkillCorner/opendata/main';

// Available match IDs from the 2024/25 A-League dataset
export const AVAILABLE_MATCHES = [
  { id: '3894907', home: 'Melbourne Victory', away: 'Auckland FC', date: '2024-10-18' },
  { id: '3894908', home: 'Sydney FC', away: 'Western Sydney', date: '2024-10-19' },
  { id: '3894909', home: 'Central Coast', away: 'Perth Glory', date: '2024-10-19' },
  { id: '3894910', home: 'Adelaide United', away: 'Brisbane Roar', date: '2024-10-20' },
  { id: '3894911', home: 'Wellington Phoenix', away: 'Macarthur FC', date: '2024-10-20' },
  { id: '3894912', home: 'Melbourne City', away: 'Newcastle Jets', date: '2024-10-25' },
  { id: '3894913', home: 'Western United', away: 'Melbourne Victory', date: '2024-10-26' },
  { id: '3894914', home: 'Auckland FC', away: 'Central Coast', date: '2024-10-26' },
  { id: '3894915', home: 'Perth Glory', away: 'Sydney FC', date: '2024-10-27' },
  { id: '3894916', home: 'Brisbane Roar', away: 'Wellington Phoenix', date: '2024-10-27' },
] as const;

// ─── Types (SkillCorner raw format) ──────────────────────────────────────────

interface SCMatchInfo {
  match_id: number;
  home_team: { id: number; name: string; short_name: string };
  away_team: { id: number; name: string; short_name: string };
  date_time: string;
  competition: { id: number; name: string };
  duration: number;
  pitch_length: number;
  pitch_width: number;
  home_team_lineup: SCPlayer[];
  away_team_lineup: SCPlayer[];
}

interface SCPlayer {
  player_id: number;
  short_name: string;
  team_id: number;
  number: number;
  position: string;
  start: boolean;
}

interface SCTrackingFrame {
  timestamp: number;
  frame: number;
  period: number;
  ball: { x: number; y: number; z: number } | null;
  home_team: SCPlayerFrame[];
  away_team: SCPlayerFrame[];
}

interface SCPlayerFrame {
  player_id: number;
  x: number;
  y: number;
  speed: number;
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

let matchInfoCache = new Map<string, SCMatchInfo>();
let trackingCache = new Map<string, SCTrackingFrame[]>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cacheTimestamps = new Map<string, number>();

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function fetchJSONL<T>(url: string): Promise<T[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as T);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Fetch match info (lineup, teams, competition).
 */
export async function fetchMatchInfo(matchId: string): Promise<SCMatchInfo> {
  const cacheKey = `match-${matchId}`;
  const cached = matchInfoCache.get(cacheKey);
  const ts = cacheTimestamps.get(cacheKey) || 0;
  if (cached && Date.now() - ts < CACHE_TTL) return cached;

  const data = await fetchJSON<SCMatchInfo>(
    `${OPENDATA_BASE}/data/matches/${matchId}/${matchId}_match.json`
  );
  matchInfoCache.set(cacheKey, data);
  cacheTimestamps.set(cacheKey, Date.now());
  return data;
}

/**
 * Fetch tracking data (10fps XY positions for all visible players).
 * Warning: large files (~5-15 MB per match).
 */
export async function fetchTrackingData(matchId: string): Promise<SCTrackingFrame[]> {
  const cacheKey = `tracking-${matchId}`;
  const cached = trackingCache.get(cacheKey);
  const ts = cacheTimestamps.get(cacheKey) || 0;
  if (cached && Date.now() - ts < CACHE_TTL) return cached;

  const data = await fetchJSONL<SCTrackingFrame>(
    `${OPENDATA_BASE}/data/matches/${matchId}/${matchId}_tracking_extrapolated.jsonl`
  );
  trackingCache.set(cacheKey, data);
  cacheTimestamps.set(cacheKey, Date.now());
  return data;
}

// ─── Compute Physical Metrics from Tracking ──────────────────────────────────

interface PlayerPhysicalOutput {
  playerId: number;
  name: string;
  position: string;
  totalDistanceM: number;
  topSpeedKmh: number;
  avgSpeedKmh: number;
  sprintCount: number;        // Frames with speed > 25 km/h
  highIntensityCount: number; // Frames with speed > 20 km/h
  frameCount: number;
}

function computePlayerPhysicals(
  frames: SCTrackingFrame[],
  players: SCPlayer[],
  side: 'home_team' | 'away_team'
): PlayerPhysicalOutput[] {
  const playerMap = new Map<number, {
    name: string;
    position: string;
    speeds: number[];
    distances: number[];
    prevX: number | null;
    prevY: number | null;
  }>();

  for (const p of players) {
    playerMap.set(p.player_id, {
      name: p.short_name,
      position: p.position,
      speeds: [],
      distances: [],
      prevX: null,
      prevY: null,
    });
  }

  for (const frame of frames) {
    const teamFrames = frame[side];
    if (!teamFrames) continue;
    for (const pf of teamFrames) {
      const player = playerMap.get(pf.player_id);
      if (!player) continue;
      player.speeds.push(pf.speed);
      if (player.prevX !== null && player.prevY !== null) {
        const dx = pf.x - player.prevX;
        const dy = pf.y - player.prevY;
        player.distances.push(Math.sqrt(dx * dx + dy * dy));
      }
      player.prevX = pf.x;
      player.prevY = pf.y;
    }
  }

  const results: PlayerPhysicalOutput[] = [];
  for (const [playerId, data] of playerMap) {
    if (data.speeds.length === 0) continue;

    const totalDistance = data.distances.reduce((a, b) => a + b, 0);
    const topSpeed = Math.max(...data.speeds);
    const avgSpeed = data.speeds.reduce((a, b) => a + b, 0) / data.speeds.length;
    const sprintCount = data.speeds.filter((s) => s > 25).length;
    const highIntensityCount = data.speeds.filter((s) => s > 20).length;

    results.push({
      playerId,
      name: data.name,
      position: data.position,
      totalDistanceM: Math.round(totalDistance),
      topSpeedKmh: Math.round(topSpeed * 10) / 10,
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      sprintCount,
      highIntensityCount,
      frameCount: data.speeds.length,
    });
  }

  return results;
}

// ─── Convert to BSI Format ───────────────────────────────────────────────────

function toTeamTrackingData(
  team: SCMatchInfo['home_team'],
  players: SCPlayer[],
  physicals: PlayerPhysicalOutput[]
): TeamTrackingData {
  const playerData: PlayerTrackingData[] = physicals.map((p) => ({
    playerId: String(p.playerId),
    playerName: p.name,
    teamId: String(team.id),
    teamName: team.name,
    position: p.position,
    metrics: {
      totalDistanceM: p.totalDistanceM,
      sprintDistanceM: 0, // Would need speed threshold integration
      highSpeedRunDistanceM: 0,
      topSpeedKmh: p.topSpeedKmh,
      avgSpeedKmh: p.avgSpeedKmh,
      sprintCount: p.sprintCount,
      highIntensityEfforts: p.highIntensityCount,
      minutesPlayed: Math.round(p.frameCount / 10 / 60), // 10fps → minutes
    },
  }));

  const avgDistance = physicals.length > 0
    ? Math.round(physicals.reduce((a, b) => a + b.totalDistanceM, 0) / physicals.length)
    : 0;
  const avgTopSpeed = physicals.length > 0
    ? Math.round(physicals.reduce((a, b) => a + b.topSpeedKmh, 0) / physicals.length * 10) / 10
    : 0;
  const avgSprints = physicals.length > 0
    ? Math.round(physicals.reduce((a, b) => a + b.sprintCount, 0) / physicals.length)
    : 0;
  const avgHI = physicals.length > 0
    ? Math.round(physicals.reduce((a, b) => a + b.highIntensityCount, 0) / physicals.length)
    : 0;

  return {
    teamId: String(team.id),
    teamName: team.name,
    abbreviation: team.short_name,
    metrics: {
      avgTotalDistanceM: avgDistance,
      avgSprintDistanceM: 0,
      avgTopSpeedKmh: avgTopSpeed,
      avgSprintCount: avgSprints,
      avgHighIntensityEfforts: avgHI,
      possessionPct: 50, // Would need ball possession analysis
    },
    players: playerData,
  };
}

/**
 * Fetch and process a complete match into BSI MatchTrackingSummary format.
 * This is real broadcast-derived tracking data from SkillCorner.
 */
export async function fetchOpenMatchTracking(matchId: string): Promise<MatchTrackingSummary> {
  const [matchInfo, trackingFrames] = await Promise.all([
    fetchMatchInfo(matchId),
    fetchTrackingData(matchId),
  ]);

  const homePhysicals = computePlayerPhysicals(
    trackingFrames,
    matchInfo.home_team_lineup,
    'home_team'
  );
  const awayPhysicals = computePlayerPhysicals(
    trackingFrames,
    matchInfo.away_team_lineup,
    'away_team'
  );

  return {
    matchId: String(matchInfo.match_id),
    date: matchInfo.date_time?.slice(0, 10) || '',
    competition: matchInfo.competition?.name || 'A-League',
    season: '2024-25',
    homeTeam: toTeamTrackingData(matchInfo.home_team, matchInfo.home_team_lineup, homePhysicals),
    awayTeam: toTeamTrackingData(matchInfo.away_team, matchInfo.away_team_lineup, awayPhysicals),
  };
}

/**
 * Get list of available open-data matches.
 */
export function getAvailableMatches() {
  return AVAILABLE_MATCHES;
}
