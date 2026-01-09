/**
 * bsi-college-data-sync
 *
 * Automated data pipeline for college sports rankings and standings with comprehensive monitoring.
 * - College Baseball: D1Baseball.com Top 25 + Conference Standings via ESPN API
 * - College Football: AP Top 25, CFP Rankings, Coaches Poll + Conference Standings via ESPN API
 *
 * Monitoring Features:
 * - Health check with staleness detection (healthy/stale/critical)
 * - Sync failure tracking with consecutive failure counts
 * - Analytics Engine integration for sync event logging
 * - Alerts endpoint for proactive monitoring
 *
 * Cron: Every 6 hours
 *
 * @author BSI Team
 * @created 2025-01-08
 * @updated 2025-01-08 - Added conference standings synchronization
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Env {
  BSI_DB: D1Database;
  BSI_CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  ENVIRONMENT?: string;
}

interface AnalyticsEngineDataset {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

interface ESPNLogo {
  href: string;
  width: number;
  height: number;
}

interface ESPNTeam {
  id: string;
  uid: string;
  location?: string;
  name?: string;
  displayName?: string;
  nickname?: string;
  abbreviation?: string;
  logo?: string;
  logos?: ESPNLogo[];
  recordSummary?: string;
  record?: string;
}

interface ESPNRank {
  current: number;
  previous?: number;
  team: ESPNTeam;
  recordSummary?: string;
  points?: number;
  firstPlaceVotes?: number;
}

interface ESPNRankingSource {
  id: string;
  name: string;
  shortName?: string;
  ranks?: ESPNRank[];
}

interface ESPNRankingsResponse {
  rankings?: ESPNRankingSource[];
}

interface RankingRecord {
  team_id: string;
  team_name: string;
  team_logo: string | null;
  rank: number;
  previous_rank: number | null;
  record: string;
  source: string;
  week: number;
  season: number;
  updated_at: string;
}

// ESPN Standings API types
interface ESPNStat {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  description?: string;
  abbreviation?: string;
  type?: string;
  value?: number;
  displayValue?: string;
}

interface ESPNStandingsTeam {
  team: {
    id: string;
    uid?: string;
    location?: string;
    name?: string;
    displayName?: string;
    abbreviation?: string;
    logos?: ESPNLogo[];
  };
  stats?: ESPNStat[];
  note?: {
    color?: string;
    description?: string;
    rank?: number;
  };
}

interface ESPNStandingsEntry {
  id?: string;
  name?: string;
  displayName?: string;
  abbreviation?: string;
  standings?: {
    entries?: ESPNStandingsTeam[];
  };
}

interface ESPNStandingsResponse {
  children?: ESPNStandingsEntry[];
  name?: string;
  abbreviation?: string;
}

interface StandingsRecord {
  team_id: string;
  team_name: string;
  team_logo: string | null;
  conference: string;
  division: string | null;
  overall_wins: number;
  overall_losses: number;
  conference_wins: number;
  conference_losses: number;
  win_pct: number | null;
  conference_win_pct: number | null;
  streak: string | null;
  last_10: string | null;
  home_record: string | null;
  away_record: string | null;
  runs_scored: number;
  runs_allowed: number;
  run_differential: number;
  points_for: number;
  points_against: number;
  point_differential: number;
  rpi: number | null;
  games_back: number | null;
  conference_rank: number | null;
  season: number;
  updated_at: string;
}

interface SyncResult {
  success: boolean;
  inserted: number;
  source?: string;
  sources?: string[];
  conferences?: string[];
  error?: string;
  stack?: string;
  duration_ms?: number;
}

interface SyncMetadata {
  timestamp: string;
  success: boolean;
  recordCount: number;
  source?: string;
  sources?: string[];
  conferences?: string[];
  error?: string;
  duration_ms: number;
}

type HealthStatus = 'healthy' | 'stale' | 'critical';

interface HealthResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
  timezone: string;
  staleness_hours: number;
  last_sync: string | null;
  details: {
    college_baseball: DataTypeHealth;
    college_football: DataTypeHealth;
  };
}

interface DataTypeHealth {
  status: HealthStatus;
  staleness_hours: number;
  last_sync: string | null;
  consecutive_failures: number;
  last_error: string | null;
}

interface StatusResponse {
  service: string;
  version: string;
  timestamp: string;
  collegeBaseball: {
    rankings: DataTypeStatus;
    standings: DataTypeStatus;
  };
  collegeFootball: {
    rankings: DataTypeStatus;
    standings: DataTypeStatus;
  };
}

interface DataTypeStatus {
  lastSync: string | null;
  recordCount: number;
  timeSinceSync: string;
  stalenessHours: number;
  healthStatus: HealthStatus;
  consecutiveFailures: number;
  lastError: string | null;
  lastSyncSuccess: boolean;
}

interface Alert {
  type: 'stale_data' | 'consecutive_failures' | 'sync_error';
  severity: 'warning' | 'critical';
  dataType: string;
  message: string;
  details: Record<string, unknown>;
  timestamp: string;
}

interface AlertsResponse {
  timestamp: string;
  healthScore: number;
  overallStatus: HealthStatus;
  alerts: Alert[];
  summary: {
    staleDataTypes: string[];
    failingDataTypes: string[];
    totalAlerts: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ESPN_COLLEGE_BASEBALL_RANKINGS = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
const ESPN_COLLEGE_FOOTBALL_RANKINGS = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';
const ESPN_COLLEGE_BASEBALL_STANDINGS = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/standings';
const ESPN_COLLEGE_FOOTBALL_STANDINGS = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/standings';

// KV Keys for sync tracking
const KV_KEYS = {
  // Rankings
  BASEBALL_RANKINGS_LAST_SUCCESS: 'sync:college-baseball:rankings:last-success',
  BASEBALL_RANKINGS_LAST_ERROR: 'sync:college-baseball:rankings:last-error',
  BASEBALL_RANKINGS_CONSECUTIVE_FAILURES: 'sync:college-baseball:rankings:consecutive-failures',
  BASEBALL_RANKINGS_LAST_METADATA: 'sync:college-baseball:rankings:last-metadata',
  FOOTBALL_RANKINGS_LAST_SUCCESS: 'sync:college-football:rankings:last-success',
  FOOTBALL_RANKINGS_LAST_ERROR: 'sync:college-football:rankings:last-error',
  FOOTBALL_RANKINGS_CONSECUTIVE_FAILURES: 'sync:college-football:rankings:consecutive-failures',
  FOOTBALL_RANKINGS_LAST_METADATA: 'sync:college-football:rankings:last-metadata',
  // Standings
  BASEBALL_STANDINGS_LAST_SUCCESS: 'sync:college-baseball:standings:last-success',
  BASEBALL_STANDINGS_LAST_ERROR: 'sync:college-baseball:standings:last-error',
  BASEBALL_STANDINGS_CONSECUTIVE_FAILURES: 'sync:college-baseball:standings:consecutive-failures',
  BASEBALL_STANDINGS_LAST_METADATA: 'sync:college-baseball:standings:last-metadata',
  FOOTBALL_STANDINGS_LAST_SUCCESS: 'sync:college-football:standings:last-success',
  FOOTBALL_STANDINGS_LAST_ERROR: 'sync:college-football:standings:last-error',
  FOOTBALL_STANDINGS_CONSECUTIVE_FAILURES: 'sync:college-football:standings:consecutive-failures',
  FOOTBALL_STANDINGS_LAST_METADATA: 'sync:college-football:standings:last-metadata',
  // Legacy keys for backwards compatibility
  BASEBALL_LAST_SUCCESS: 'sync:college-baseball:last-success',
  BASEBALL_LAST_ERROR: 'sync:college-baseball:last-error',
  BASEBALL_CONSECUTIVE_FAILURES: 'sync:college-baseball:consecutive-failures',
  BASEBALL_LAST_METADATA: 'sync:college-baseball:last-metadata',
  FOOTBALL_LAST_SUCCESS: 'sync:college-football:last-success',
  FOOTBALL_LAST_ERROR: 'sync:college-football:last-error',
  FOOTBALL_CONSECUTIVE_FAILURES: 'sync:college-football:consecutive-failures',
  FOOTBALL_LAST_METADATA: 'sync:college-football:last-metadata',
} as const;

const SERVICE_VERSION = '2.1.0';
const SERVICE_NAME = 'bsi-college-data-sync';

// Staleness thresholds in hours
const STALENESS_THRESHOLD_STALE = 12;
const STALENESS_THRESHOLD_CRITICAL = 24;

// Consecutive failure threshold for alerts
const CONSECUTIVE_FAILURE_THRESHOLD = 2;

// Major conferences for filtering
const MAJOR_CONFERENCES = [
  'SEC', 'ACC', 'Big Ten', 'Big 12', 'Pac-12', 'Big East', 'American Athletic',
  'Mountain West', 'Conference USA', 'Sun Belt', 'Mid-American', 'Atlantic 10',
  'Colonial Athletic', 'Missouri Valley', 'West Coast', 'Atlantic Sun', 'Big West',
  'Ivy League', 'Patriot League', 'Southern', 'Southland', 'SWAC', 'MEAC',
  'Ohio Valley', 'Horizon League', 'Summit League', 'WAC', 'ASUN',
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getCurrentSeason(sport: 'baseball' | 'football'): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (sport === 'baseball') return year;
  return month >= 8 ? year : year - 1;
}

function getCollegeBaseballWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 1, 15);
  if (now < seasonStart) return 0;
  const diffMs = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.min(diffWeeks + 1, 17);
}

function getCollegeFootballWeek(): number {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const seasonStart = new Date(year, 7, 25);
  const diffMs = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  if (diffWeeks < 0) return 0;
  return Math.min(diffWeeks + 1, 17);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function getTeamName(team: ESPNTeam): string {
  if (team.displayName) return team.displayName;
  if (team.location && team.name) return team.location + ' ' + team.name;
  if (team.nickname) return team.nickname;
  if (team.name) return team.name;
  return 'Unknown';
}

function getTeamLogo(team: ESPNTeam): string | null {
  if (team.logo) return team.logo;
  if (team.logos && team.logos.length > 0) return team.logos[0].href;
  return null;
}

function getTeamId(team: ESPNTeam): string {
  if (team.abbreviation) return team.abbreviation.toLowerCase();
  if (team.id) return team.id;
  return 'unknown';
}

function getPreviousRank(rank: ESPNRank): number | null {
  if (typeof rank.previous === 'number') return rank.previous;
  return null;
}

function getRecord(rank: ESPNRank): string {
  if (rank.recordSummary) return rank.recordSummary;
  if (rank.team.recordSummary) return rank.team.recordSummary;
  if (rank.team.record) return rank.team.record;
  return '';
}

function getStatValue(stats: ESPNStat[] | undefined, statName: string): number {
  if (!stats) return 0;
  const stat = stats.find(s => s.name === statName || s.abbreviation === statName);
  if (stat && typeof stat.value === 'number') return stat.value;
  if (stat && stat.displayValue) {
    const parsed = parseFloat(stat.displayValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getStatDisplayValue(stats: ESPNStat[] | undefined, statName: string): string | null {
  if (!stats) return null;
  const stat = stats.find(s => s.name === statName || s.abbreviation === statName);
  return stat?.displayValue || null;
}

function normalizeConferenceName(rawName: string | undefined): string {
  if (!rawName) return 'Unknown';
  const mappings: Record<string, string> = {
    'southeastern': 'SEC', 'sec': 'SEC', 'atlantic coast': 'ACC', 'acc': 'ACC',
    'big ten': 'Big Ten', 'big 10': 'Big Ten', 'big twelve': 'Big 12', 'big 12': 'Big 12',
    'pac-12': 'Pac-12', 'pac 12': 'Pac-12', 'big east': 'Big East',
    'american athletic': 'American Athletic', 'aac': 'American Athletic',
    'mountain west': 'Mountain West', 'mwc': 'Mountain West',
    'conference usa': 'Conference USA', 'c-usa': 'Conference USA',
    'sun belt': 'Sun Belt', 'mid-american': 'Mid-American', 'mac': 'Mid-American',
  };
  const lower = rawName.toLowerCase().trim();
  if (mappings[lower]) return mappings[lower];
  for (const [key, value] of Object.entries(mappings)) {
    if (lower.includes(key)) return value;
  }
  return rawName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function calculateStalenessHours(timestamp: string | null): number {
  if (!timestamp) return Infinity;
  const lastSync = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastSync.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

function getHealthStatus(stalenessHours: number): HealthStatus {
  if (stalenessHours < STALENESS_THRESHOLD_STALE) return 'healthy';
  if (stalenessHours < STALENESS_THRESHOLD_CRITICAL) return 'stale';
  return 'critical';
}

function formatTimeSinceSync(stalenessHours: number): string {
  if (!isFinite(stalenessHours)) return 'never';
  if (stalenessHours < 1) return Math.round(stalenessHours * 60) + ' minutes ago';
  if (stalenessHours < 24) return Math.round(stalenessHours) + ' hours ago';
  const days = Math.round(stalenessHours / 24);
  return days + ' day' + (days === 1 ? '' : 's') + ' ago';
}

// =============================================================================
// ANALYTICS ENGINE HELPERS
// =============================================================================

function logSyncSuccess(env: Env, dataType: string, recordCount: number, durationMs: number, source: string): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [dataType],
      blobs: ['sync_success', dataType, source, SERVICE_VERSION],
      doubles: [recordCount, durationMs, 1, 0],
    });
  } catch (error) {
    console.error('[analytics] Failed to log sync_success:', error);
  }
}

function logSyncFailure(env: Env, dataType: string, errorMessage: string, durationMs: number): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [dataType],
      blobs: ['sync_failure', dataType, errorMessage.substring(0, 200), SERVICE_VERSION],
      doubles: [0, durationMs, 0, 1],
    });
  } catch (error) {
    console.error('[analytics] Failed to log sync_failure:', error);
  }
}

function logStaleData(env: Env, dataType: string, stalenessHours: number): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [dataType],
      blobs: ['sync_stale', dataType, stalenessHours >= STALENESS_THRESHOLD_CRITICAL ? 'critical' : 'stale', SERVICE_VERSION],
      doubles: [stalenessHours, STALENESS_THRESHOLD_STALE, STALENESS_THRESHOLD_CRITICAL, 0],
    });
  } catch (error) {
    console.error('[analytics] Failed to log sync_stale:', error);
  }
}

// =============================================================================
// SYNC TRACKING FUNCTIONS
// =============================================================================

type SyncType = 'baseball-rankings' | 'football-rankings' | 'baseball-standings' | 'football-standings';

function getKVKeys(syncType: SyncType): { success: string; error: string; failures: string; metadata: string } {
  const keyMap: Record<SyncType, { success: string; error: string; failures: string; metadata: string }> = {
    'baseball-rankings': {
      success: KV_KEYS.BASEBALL_RANKINGS_LAST_SUCCESS,
      error: KV_KEYS.BASEBALL_RANKINGS_LAST_ERROR,
      failures: KV_KEYS.BASEBALL_RANKINGS_CONSECUTIVE_FAILURES,
      metadata: KV_KEYS.BASEBALL_RANKINGS_LAST_METADATA,
    },
    'football-rankings': {
      success: KV_KEYS.FOOTBALL_RANKINGS_LAST_SUCCESS,
      error: KV_KEYS.FOOTBALL_RANKINGS_LAST_ERROR,
      failures: KV_KEYS.FOOTBALL_RANKINGS_CONSECUTIVE_FAILURES,
      metadata: KV_KEYS.FOOTBALL_RANKINGS_LAST_METADATA,
    },
    'baseball-standings': {
      success: KV_KEYS.BASEBALL_STANDINGS_LAST_SUCCESS,
      error: KV_KEYS.BASEBALL_STANDINGS_LAST_ERROR,
      failures: KV_KEYS.BASEBALL_STANDINGS_CONSECUTIVE_FAILURES,
      metadata: KV_KEYS.BASEBALL_STANDINGS_LAST_METADATA,
    },
    'football-standings': {
      success: KV_KEYS.FOOTBALL_STANDINGS_LAST_SUCCESS,
      error: KV_KEYS.FOOTBALL_STANDINGS_LAST_ERROR,
      failures: KV_KEYS.FOOTBALL_STANDINGS_CONSECUTIVE_FAILURES,
      metadata: KV_KEYS.FOOTBALL_STANDINGS_LAST_METADATA,
    },
  };
  return keyMap[syncType];
}

async function recordSyncSuccess(env: Env, syncType: SyncType, metadata: SyncMetadata): Promise<void> {
  const keys = getKVKeys(syncType);
  await Promise.all([
    env.BSI_CACHE.put(keys.success, metadata.timestamp),
    env.BSI_CACHE.put(keys.failures, '0'),
    env.BSI_CACHE.put(keys.metadata, JSON.stringify(metadata)),
    env.BSI_CACHE.delete(keys.error),
  ]);
  // Also update legacy keys for backwards compatibility
  if (syncType === 'baseball-rankings') {
    await env.BSI_CACHE.put(KV_KEYS.BASEBALL_LAST_SUCCESS, metadata.timestamp);
  } else if (syncType === 'football-rankings') {
    await env.BSI_CACHE.put(KV_KEYS.FOOTBALL_LAST_SUCCESS, metadata.timestamp);
  }
}

async function recordSyncFailure(env: Env, syncType: SyncType, errorMessage: string, stack?: string): Promise<number> {
  const keys = getKVKeys(syncType);
  const currentFailures = await env.BSI_CACHE.get(keys.failures);
  const newFailureCount = (parseInt(currentFailures || '0', 10) || 0) + 1;
  const errorData = {
    message: errorMessage,
    stack: stack?.substring(0, 1000),
    timestamp: new Date().toISOString(),
    consecutiveFailures: newFailureCount,
  };
  await Promise.all([
    env.BSI_CACHE.put(keys.failures, String(newFailureCount)),
    env.BSI_CACHE.put(keys.error, JSON.stringify(errorData)),
  ]);
  return newFailureCount;
}

async function getSyncStatus(env: Env, syncType: SyncType): Promise<{
  lastSuccess: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  lastMetadata: SyncMetadata | null;
}> {
  const keys = getKVKeys(syncType);
  const [lastSuccess, lastError, failures, metadataStr] = await Promise.all([
    env.BSI_CACHE.get(keys.success),
    env.BSI_CACHE.get(keys.error),
    env.BSI_CACHE.get(keys.failures),
    env.BSI_CACHE.get(keys.metadata),
  ]);
  let lastMetadata: SyncMetadata | null = null;
  if (metadataStr) {
    try { lastMetadata = JSON.parse(metadataStr); } catch { /* ignore */ }
  }
  return { lastSuccess, lastError, consecutiveFailures: parseInt(failures || '0', 10) || 0, lastMetadata };
}

// =============================================================================
// RANKINGS SYNC FUNCTIONS
// =============================================================================

async function syncCollegeBaseballRankings(env: Env): Promise<SyncResult> {
  const startTime = Date.now();
  const dataType = 'college-baseball-rankings';
  console.log('[' + dataType + '] Starting sync...');

  try {
    const response = await fetch(ESPN_COLLEGE_BASEBALL_RANKINGS, {
      headers: { 'User-Agent': 'BSI-College-Data-Sync/2.1', 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error('ESPN API returned ' + response.status + ': ' + response.statusText);

    const data = await response.json() as ESPNRankingsResponse;
    const rankings = data.rankings?.[0];

    if (!rankings?.ranks?.length) {
      console.log('[' + dataType + '] No rankings data found');
      const duration = Date.now() - startTime;
      const metadata: SyncMetadata = { timestamp: new Date().toISOString(), success: true, recordCount: 0, source: 'none', duration_ms: duration };
      await recordSyncSuccess(env, 'baseball-rankings', metadata);
      logSyncSuccess(env, dataType, 0, duration, 'none');
      return { success: true, inserted: 0, source: 'none', duration_ms: duration };
    }

    const source = rankings.name || 'D1Baseball.com Top 25';
    const now = new Date().toISOString();
    const season = getCurrentSeason('baseball');
    const week = getCollegeBaseballWeek();

    await env.BSI_DB.prepare('DELETE FROM college_baseball_rankings WHERE season = ? AND week = ? AND source = ?').bind(season, week, source).run();

    const records: RankingRecord[] = rankings.ranks.map(rank => ({
      team_id: getTeamId(rank.team), team_name: getTeamName(rank.team), team_logo: getTeamLogo(rank.team),
      rank: rank.current, previous_rank: getPreviousRank(rank), record: getRecord(rank),
      source, week, season, updated_at: now
    }));

    const stmt = env.BSI_DB.prepare('INSERT INTO college_baseball_rankings (team_id, team_name, team_logo, rank, previous_rank, record, source, week, season, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const batch = records.map(r => stmt.bind(r.team_id, r.team_name, r.team_logo, r.rank, r.previous_rank, r.record, r.source, r.week, r.season, r.updated_at));
    await env.BSI_DB.batch(batch);

    const duration = Date.now() - startTime;
    const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: records.length, source, duration_ms: duration };
    await recordSyncSuccess(env, 'baseball-rankings', metadata);
    logSyncSuccess(env, dataType, records.length, duration, source);

    console.log('[' + dataType + '] Inserted ' + records.length + ' rankings in ' + duration + 'ms');
    return { success: true, inserted: records.length, source, duration_ms: duration };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const duration = Date.now() - startTime;
    console.error('[' + dataType + '] Sync failed:', errorMessage);
    const consecutiveFailures = await recordSyncFailure(env, 'baseball-rankings', errorMessage, errorStack);
    console.error('[' + dataType + '] Consecutive failures: ' + consecutiveFailures);
    logSyncFailure(env, dataType, errorMessage, duration);
    return { success: false, inserted: 0, error: errorMessage, stack: errorStack, duration_ms: duration };
  }
}

async function syncCollegeFootballRankings(env: Env): Promise<SyncResult> {
  const startTime = Date.now();
  const dataType = 'college-football-rankings';
  console.log('[' + dataType + '] Starting sync...');

  try {
    const response = await fetch(ESPN_COLLEGE_FOOTBALL_RANKINGS, {
      headers: { 'User-Agent': 'BSI-College-Data-Sync/2.1', 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error('ESPN API returned ' + response.status + ': ' + response.statusText);

    const data = await response.json() as ESPNRankingsResponse;

    if (!data.rankings?.length) {
      console.log('[' + dataType + '] No rankings data found');
      const duration = Date.now() - startTime;
      const metadata: SyncMetadata = { timestamp: new Date().toISOString(), success: true, recordCount: 0, sources: [], duration_ms: duration };
      await recordSyncSuccess(env, 'football-rankings', metadata);
      logSyncSuccess(env, dataType, 0, duration, 'none');
      return { success: true, inserted: 0, sources: [], duration_ms: duration };
    }

    const now = new Date().toISOString();
    const season = getCurrentSeason('football');
    const week = getCollegeFootballWeek();
    const allRecords: RankingRecord[] = [];
    const sources: string[] = [];

    for (const ranking of data.rankings) {
      if (!ranking.ranks?.length) continue;
      const source = ranking.name || ranking.shortName || 'Unknown';
      sources.push(source);

      await env.BSI_DB.prepare('DELETE FROM college_football_rankings WHERE season = ? AND week = ? AND source = ?').bind(season, week, source).run();

      const records = ranking.ranks.map(rank => ({
        team_id: getTeamId(rank.team), team_name: getTeamName(rank.team), team_logo: getTeamLogo(rank.team),
        rank: rank.current, previous_rank: getPreviousRank(rank), record: getRecord(rank),
        source, week, season, updated_at: now
      }));
      allRecords.push(...records);
    }

    if (allRecords.length === 0) {
      const duration = Date.now() - startTime;
      const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: 0, sources: [], duration_ms: duration };
      await recordSyncSuccess(env, 'football-rankings', metadata);
      return { success: true, inserted: 0, sources: [], duration_ms: duration };
    }

    const stmt = env.BSI_DB.prepare('INSERT INTO college_football_rankings (team_id, team_name, team_logo, rank, previous_rank, record, source, week, season, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const batch = allRecords.map(r => stmt.bind(r.team_id, r.team_name, r.team_logo, r.rank, r.previous_rank, r.record, r.source, r.week, r.season, r.updated_at));
    await env.BSI_DB.batch(batch);

    const duration = Date.now() - startTime;
    const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: allRecords.length, sources, duration_ms: duration };
    await recordSyncSuccess(env, 'football-rankings', metadata);
    logSyncSuccess(env, dataType, allRecords.length, duration, sources.join(','));

    console.log('[' + dataType + '] Inserted ' + allRecords.length + ' rankings in ' + duration + 'ms');
    return { success: true, inserted: allRecords.length, sources, duration_ms: duration };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const duration = Date.now() - startTime;
    console.error('[' + dataType + '] Sync failed:', errorMessage);
    const consecutiveFailures = await recordSyncFailure(env, 'football-rankings', errorMessage, errorStack);
    console.error('[' + dataType + '] Consecutive failures: ' + consecutiveFailures);
    logSyncFailure(env, dataType, errorMessage, duration);
    return { success: false, inserted: 0, error: errorMessage, stack: errorStack, duration_ms: duration };
  }
}

// =============================================================================
// STANDINGS SYNC FUNCTIONS
// =============================================================================

async function syncCollegeBaseballStandings(env: Env): Promise<SyncResult> {
  const startTime = Date.now();
  const dataType = 'college-baseball-standings';
  console.log('[' + dataType + '] Starting sync...');

  try {
    const response = await fetch(ESPN_COLLEGE_BASEBALL_STANDINGS, {
      headers: { 'User-Agent': 'BSI-College-Data-Sync/2.1', 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error('ESPN API returned ' + response.status + ': ' + response.statusText);

    const data = await response.json() as ESPNStandingsResponse;

    if (!data.children?.length) {
      console.log('[' + dataType + '] No standings data found');
      const duration = Date.now() - startTime;
      const metadata: SyncMetadata = { timestamp: new Date().toISOString(), success: true, recordCount: 0, conferences: [], duration_ms: duration };
      await recordSyncSuccess(env, 'baseball-standings', metadata);
      logSyncSuccess(env, dataType, 0, duration, 'none');
      return { success: true, inserted: 0, conferences: [], duration_ms: duration };
    }

    const now = new Date().toISOString();
    const season = getCurrentSeason('baseball');
    const conferences: string[] = [];
    const allRecords: StandingsRecord[] = [];

    for (const conf of data.children) {
      const conferenceName = normalizeConferenceName(conf.name || conf.displayName);
      conferences.push(conferenceName);
      const entries = conf.standings?.entries || [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const team = entry.team;
        const stats = entry.stats;
        if (!team) continue;

        const teamId = team.abbreviation?.toLowerCase() || team.id || 'unknown';
        const teamName = team.displayName || (team.location && team.name ? team.location + ' ' + team.name : 'Unknown');
        const teamLogo = team.logos?.[0]?.href || null;

        const overallWins = getStatValue(stats, 'wins') || getStatValue(stats, 'overall') || 0;
        const overallLosses = getStatValue(stats, 'losses') || 0;
        const confWins = getStatValue(stats, 'conferenceWins') || getStatValue(stats, 'confWins') || 0;
        const confLosses = getStatValue(stats, 'conferenceLosses') || getStatValue(stats, 'confLosses') || 0;
        const winPct = getStatValue(stats, 'winPercent') || getStatValue(stats, 'pct') || (overallWins + overallLosses > 0 ? overallWins / (overallWins + overallLosses) : null);
        const confWinPct = confWins + confLosses > 0 ? confWins / (confWins + confLosses) : null;
        const streak = getStatDisplayValue(stats, 'streak') || getStatDisplayValue(stats, 'strk');
        const gamesBack = getStatValue(stats, 'gamesBehind') || getStatValue(stats, 'GB') || 0;
        const runsScored = getStatValue(stats, 'pointsFor') || getStatValue(stats, 'runsFor') || 0;
        const runsAllowed = getStatValue(stats, 'pointsAgainst') || getStatValue(stats, 'runsAgainst') || 0;

        const record: StandingsRecord = {
          team_id: teamId, team_name: teamName, team_logo: teamLogo, conference: conferenceName, division: null,
          overall_wins: overallWins, overall_losses: overallLosses, conference_wins: confWins, conference_losses: confLosses,
          win_pct: winPct, conference_win_pct: confWinPct, streak: streak,
          last_10: getStatDisplayValue(stats, 'last10'),
          home_record: getStatDisplayValue(stats, 'homeRecord') || getStatDisplayValue(stats, 'home'),
          away_record: getStatDisplayValue(stats, 'awayRecord') || getStatDisplayValue(stats, 'away'),
          runs_scored: runsScored, runs_allowed: runsAllowed, run_differential: runsScored - runsAllowed,
          points_for: 0, points_against: 0, point_differential: 0,
          rpi: getStatValue(stats, 'rpi') || null, games_back: gamesBack, conference_rank: i + 1,
          season: season, updated_at: now
        };
        allRecords.push(record);
      }
    }

    if (allRecords.length === 0) {
      const duration = Date.now() - startTime;
      return { success: true, inserted: 0, conferences: [], duration_ms: duration };
    }

    await env.BSI_DB.prepare('DELETE FROM college_baseball_standings WHERE season = ?').bind(season).run();

    const stmt = env.BSI_DB.prepare('INSERT INTO college_baseball_standings (team_id, team_name, team_logo, conference, division, overall_wins, overall_losses, conference_wins, conference_losses, win_pct, conference_win_pct, streak, last_10, home_record, away_record, runs_scored, runs_allowed, run_differential, rpi, games_back, conference_rank, season, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const batch = allRecords.map(r => stmt.bind(r.team_id, r.team_name, r.team_logo, r.conference, r.division, r.overall_wins, r.overall_losses, r.conference_wins, r.conference_losses, r.win_pct, r.conference_win_pct, r.streak, r.last_10, r.home_record, r.away_record, r.runs_scored, r.runs_allowed, r.run_differential, r.rpi, r.games_back, r.conference_rank, r.season, r.updated_at));
    await env.BSI_DB.batch(batch);

    const duration = Date.now() - startTime;
    const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: allRecords.length, conferences, duration_ms: duration };
    await recordSyncSuccess(env, 'baseball-standings', metadata);
    logSyncSuccess(env, dataType, allRecords.length, duration, conferences.join(','));

    console.log('[' + dataType + '] Inserted ' + allRecords.length + ' standings from ' + conferences.length + ' conferences in ' + duration + 'ms');
    return { success: true, inserted: allRecords.length, conferences, duration_ms: duration };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const duration = Date.now() - startTime;
    console.error('[' + dataType + '] Sync failed:', errorMessage);
    const consecutiveFailures = await recordSyncFailure(env, 'baseball-standings', errorMessage, errorStack);
    console.error('[' + dataType + '] Consecutive failures: ' + consecutiveFailures);
    logSyncFailure(env, dataType, errorMessage, duration);
    return { success: false, inserted: 0, error: errorMessage, stack: errorStack, duration_ms: duration };
  }
}

async function syncCollegeFootballStandings(env: Env): Promise<SyncResult> {
  const startTime = Date.now();
  const dataType = 'college-football-standings';
  console.log('[' + dataType + '] Starting sync...');

  try {
    const response = await fetch(ESPN_COLLEGE_FOOTBALL_STANDINGS, {
      headers: { 'User-Agent': 'BSI-College-Data-Sync/2.1', 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error('ESPN API returned ' + response.status + ': ' + response.statusText);

    const data = await response.json() as ESPNStandingsResponse;

    if (!data.children?.length) {
      console.log('[' + dataType + '] No standings data found');
      const duration = Date.now() - startTime;
      const metadata: SyncMetadata = { timestamp: new Date().toISOString(), success: true, recordCount: 0, conferences: [], duration_ms: duration };
      await recordSyncSuccess(env, 'football-standings', metadata);
      logSyncSuccess(env, dataType, 0, duration, 'none');
      return { success: true, inserted: 0, conferences: [], duration_ms: duration };
    }

    const now = new Date().toISOString();
    const season = getCurrentSeason('football');
    const conferences: string[] = [];
    const allRecords: StandingsRecord[] = [];

    for (const conf of data.children) {
      const conferenceName = normalizeConferenceName(conf.name || conf.displayName);
      conferences.push(conferenceName);
      const entries = conf.standings?.entries || [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const team = entry.team;
        const stats = entry.stats;
        if (!team) continue;

        const teamId = team.abbreviation?.toLowerCase() || team.id || 'unknown';
        const teamName = team.displayName || (team.location && team.name ? team.location + ' ' + team.name : 'Unknown');
        const teamLogo = team.logos?.[0]?.href || null;

        const overallWins = getStatValue(stats, 'wins') || getStatValue(stats, 'overall') || 0;
        const overallLosses = getStatValue(stats, 'losses') || 0;
        const confWins = getStatValue(stats, 'conferenceWins') || getStatValue(stats, 'confWins') || 0;
        const confLosses = getStatValue(stats, 'conferenceLosses') || getStatValue(stats, 'confLosses') || 0;
        const winPct = getStatValue(stats, 'winPercent') || getStatValue(stats, 'pct') || (overallWins + overallLosses > 0 ? overallWins / (overallWins + overallLosses) : null);
        const confWinPct = confWins + confLosses > 0 ? confWins / (confWins + confLosses) : null;
        const streak = getStatDisplayValue(stats, 'streak') || getStatDisplayValue(stats, 'strk');
        const gamesBack = getStatValue(stats, 'gamesBehind') || getStatValue(stats, 'GB') || 0;
        const pointsFor = getStatValue(stats, 'pointsFor') || getStatValue(stats, 'PF') || 0;
        const pointsAgainst = getStatValue(stats, 'pointsAgainst') || getStatValue(stats, 'PA') || 0;

        const record: StandingsRecord = {
          team_id: teamId, team_name: teamName, team_logo: teamLogo, conference: conferenceName, division: null,
          overall_wins: overallWins, overall_losses: overallLosses, conference_wins: confWins, conference_losses: confLosses,
          win_pct: winPct, conference_win_pct: confWinPct, streak: streak, last_10: null,
          home_record: getStatDisplayValue(stats, 'homeRecord') || getStatDisplayValue(stats, 'home'),
          away_record: getStatDisplayValue(stats, 'awayRecord') || getStatDisplayValue(stats, 'away'),
          runs_scored: 0, runs_allowed: 0, run_differential: 0,
          points_for: pointsFor, points_against: pointsAgainst, point_differential: pointsFor - pointsAgainst,
          rpi: null, games_back: gamesBack, conference_rank: i + 1,
          season: season, updated_at: now
        };
        allRecords.push(record);
      }
    }

    if (allRecords.length === 0) {
      const duration = Date.now() - startTime;
      return { success: true, inserted: 0, conferences: [], duration_ms: duration };
    }

    await env.BSI_DB.prepare('DELETE FROM college_football_standings WHERE season = ?').bind(season).run();

    const stmt = env.BSI_DB.prepare('INSERT INTO college_football_standings (team_id, team_name, team_logo, conference, division, overall_wins, overall_losses, conference_wins, conference_losses, win_pct, conference_win_pct, streak, home_record, away_record, points_for, points_against, point_differential, games_back, conference_rank, season, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const batch = allRecords.map(r => stmt.bind(r.team_id, r.team_name, r.team_logo, r.conference, r.division, r.overall_wins, r.overall_losses, r.conference_wins, r.conference_losses, r.win_pct, r.conference_win_pct, r.streak, r.home_record, r.away_record, r.points_for, r.points_against, r.point_differential, r.games_back, r.conference_rank, r.season, r.updated_at));
    await env.BSI_DB.batch(batch);

    const duration = Date.now() - startTime;
    const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: allRecords.length, conferences, duration_ms: duration };
    await recordSyncSuccess(env, 'football-standings', metadata);
    logSyncSuccess(env, dataType, allRecords.length, duration, conferences.join(','));

    console.log('[' + dataType + '] Inserted ' + allRecords.length + ' standings from ' + conferences.length + ' conferences in ' + duration + 'ms');
    return { success: true, inserted: allRecords.length, conferences, duration_ms: duration };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const duration = Date.now() - startTime;
    console.error('[' + dataType + '] Sync failed:', errorMessage);
    const consecutiveFailures = await recordSyncFailure(env, 'football-standings', errorMessage, errorStack);
    console.error('[' + dataType + '] Consecutive failures: ' + consecutiveFailures);
    logSyncFailure(env, dataType, errorMessage, duration);
    return { success: false, inserted: 0, error: errorMessage, stack: errorStack, duration_ms: duration };
  }
}

// =============================================================================
// REQUEST HANDLERS
// =============================================================================

async function handleHealth(env: Env): Promise<Response> {
  const [baseballRankingsStatus, footballRankingsStatus] = await Promise.all([
    getSyncStatus(env, 'baseball-rankings'),
    getSyncStatus(env, 'football-rankings'),
  ]);

  const baseballStaleness = calculateStalenessHours(baseballRankingsStatus.lastSuccess);
  const footballStaleness = calculateStalenessHours(footballRankingsStatus.lastSuccess);
  const baseballHealth = getHealthStatus(baseballStaleness);
  const footballHealth = getHealthStatus(footballStaleness);
  const overallStaleness = Math.max(baseballStaleness, footballStaleness);
  const overallStatus = getHealthStatus(overallStaleness);

  if (baseballHealth !== 'healthy') logStaleData(env, 'college-baseball', baseballStaleness);
  if (footballHealth !== 'healthy') logStaleData(env, 'college-football', footballStaleness);

  const parseError = (e: string | null): string | null => {
    if (!e) return null;
    try { return JSON.parse(e).message || null; } catch { return e; }
  };

  const response: HealthResponse = {
    status: overallStatus, service: SERVICE_NAME, version: SERVICE_VERSION,
    timestamp: new Date().toISOString(), timezone: 'America/Chicago',
    staleness_hours: isFinite(overallStaleness) ? overallStaleness : -1,
    last_sync: baseballRankingsStatus.lastSuccess || footballRankingsStatus.lastSuccess,
    details: {
      college_baseball: {
        status: baseballHealth, staleness_hours: isFinite(baseballStaleness) ? baseballStaleness : -1,
        last_sync: baseballRankingsStatus.lastSuccess, consecutive_failures: baseballRankingsStatus.consecutiveFailures,
        last_error: parseError(baseballRankingsStatus.lastError),
      },
      college_football: {
        status: footballHealth, staleness_hours: isFinite(footballStaleness) ? footballStaleness : -1,
        last_sync: footballRankingsStatus.lastSuccess, consecutive_failures: footballRankingsStatus.consecutiveFailures,
        last_error: parseError(footballRankingsStatus.lastError),
      },
    },
  };

  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'stale' ? 200 : 503;
  return jsonResponse(response, httpStatus);
}

async function handleStatus(env: Env): Promise<Response> {
  const [brStatus, frStatus, bsStatus, fsStatus, brCount, frCount, bsCount, fsCount] = await Promise.all([
    getSyncStatus(env, 'baseball-rankings'),
    getSyncStatus(env, 'football-rankings'),
    getSyncStatus(env, 'baseball-standings'),
    getSyncStatus(env, 'football-standings'),
    env.BSI_DB.prepare('SELECT COUNT(*) as count FROM college_baseball_rankings').first<{ count: number }>(),
    env.BSI_DB.prepare('SELECT COUNT(*) as count FROM college_football_rankings').first<{ count: number }>(),
    env.BSI_DB.prepare('SELECT COUNT(*) as count FROM college_baseball_standings').first<{ count: number }>().catch(() => ({ count: 0 })),
    env.BSI_DB.prepare('SELECT COUNT(*) as count FROM college_football_standings').first<{ count: number }>().catch(() => ({ count: 0 })),
  ]);

  const brStaleness = calculateStalenessHours(brStatus.lastSuccess);
  const frStaleness = calculateStalenessHours(frStatus.lastSuccess);
  const bsStaleness = calculateStalenessHours(bsStatus.lastSuccess);
  const fsStaleness = calculateStalenessHours(fsStatus.lastSuccess);

  const parseError = (e: string | null): string | null => {
    if (!e) return null;
    try { return JSON.parse(e).message || null; } catch { return e; }
  };

  const response: StatusResponse = {
    service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: new Date().toISOString(),
    collegeBaseball: {
      rankings: {
        lastSync: brStatus.lastSuccess, recordCount: brCount?.count || 0, timeSinceSync: formatTimeSinceSync(brStaleness),
        stalenessHours: isFinite(brStaleness) ? brStaleness : -1, healthStatus: getHealthStatus(brStaleness),
        consecutiveFailures: brStatus.consecutiveFailures, lastError: parseError(brStatus.lastError),
        lastSyncSuccess: brStatus.lastMetadata?.success ?? true,
      },
      standings: {
        lastSync: bsStatus.lastSuccess, recordCount: bsCount?.count || 0, timeSinceSync: formatTimeSinceSync(bsStaleness),
        stalenessHours: isFinite(bsStaleness) ? bsStaleness : -1, healthStatus: getHealthStatus(bsStaleness),
        consecutiveFailures: bsStatus.consecutiveFailures, lastError: parseError(bsStatus.lastError),
        lastSyncSuccess: bsStatus.lastMetadata?.success ?? true,
      },
    },
    collegeFootball: {
      rankings: {
        lastSync: frStatus.lastSuccess, recordCount: frCount?.count || 0, timeSinceSync: formatTimeSinceSync(frStaleness),
        stalenessHours: isFinite(frStaleness) ? frStaleness : -1, healthStatus: getHealthStatus(frStaleness),
        consecutiveFailures: frStatus.consecutiveFailures, lastError: parseError(frStatus.lastError),
        lastSyncSuccess: frStatus.lastMetadata?.success ?? true,
      },
      standings: {
        lastSync: fsStatus.lastSuccess, recordCount: fsCount?.count || 0, timeSinceSync: formatTimeSinceSync(fsStaleness),
        stalenessHours: isFinite(fsStaleness) ? fsStaleness : -1, healthStatus: getHealthStatus(fsStaleness),
        consecutiveFailures: fsStatus.consecutiveFailures, lastError: parseError(fsStatus.lastError),
        lastSyncSuccess: fsStatus.lastMetadata?.success ?? true,
      },
    },
  };

  return jsonResponse(response);
}

async function handleAlerts(env: Env): Promise<Response> {
  const [brStatus, frStatus] = await Promise.all([
    getSyncStatus(env, 'baseball-rankings'),
    getSyncStatus(env, 'football-rankings'),
  ]);

  const brStaleness = calculateStalenessHours(brStatus.lastSuccess);
  const frStaleness = calculateStalenessHours(frStatus.lastSuccess);

  const alerts: Alert[] = [];
  const staleDataTypes: string[] = [];
  const failingDataTypes: string[] = [];
  const now = new Date().toISOString();

  if (brStaleness >= STALENESS_THRESHOLD_STALE) {
    staleDataTypes.push('college-baseball');
    alerts.push({
      type: 'stale_data', severity: brStaleness >= STALENESS_THRESHOLD_CRITICAL ? 'critical' : 'warning',
      dataType: 'college-baseball', message: 'College baseball rankings data is ' + (brStaleness >= STALENESS_THRESHOLD_CRITICAL ? 'critically ' : '') + 'stale',
      details: { staleness_hours: brStaleness, threshold_hours: brStaleness >= STALENESS_THRESHOLD_CRITICAL ? STALENESS_THRESHOLD_CRITICAL : STALENESS_THRESHOLD_STALE, last_sync: brStatus.lastSuccess },
      timestamp: now,
    });
  }

  if (brStatus.consecutiveFailures > CONSECUTIVE_FAILURE_THRESHOLD) {
    failingDataTypes.push('college-baseball');
    let errorMsg: string | null = null;
    if (brStatus.lastError) { try { errorMsg = JSON.parse(brStatus.lastError).message; } catch { errorMsg = brStatus.lastError; } }
    alerts.push({
      type: 'consecutive_failures', severity: brStatus.consecutiveFailures > 5 ? 'critical' : 'warning',
      dataType: 'college-baseball', message: 'College baseball sync has failed ' + brStatus.consecutiveFailures + ' consecutive times',
      details: { consecutive_failures: brStatus.consecutiveFailures, threshold: CONSECUTIVE_FAILURE_THRESHOLD, last_error: errorMsg },
      timestamp: now,
    });
  }

  if (frStaleness >= STALENESS_THRESHOLD_STALE) {
    staleDataTypes.push('college-football');
    alerts.push({
      type: 'stale_data', severity: frStaleness >= STALENESS_THRESHOLD_CRITICAL ? 'critical' : 'warning',
      dataType: 'college-football', message: 'College football rankings data is ' + (frStaleness >= STALENESS_THRESHOLD_CRITICAL ? 'critically ' : '') + 'stale',
      details: { staleness_hours: frStaleness, threshold_hours: frStaleness >= STALENESS_THRESHOLD_CRITICAL ? STALENESS_THRESHOLD_CRITICAL : STALENESS_THRESHOLD_STALE, last_sync: frStatus.lastSuccess },
      timestamp: now,
    });
  }

  if (frStatus.consecutiveFailures > CONSECUTIVE_FAILURE_THRESHOLD) {
    failingDataTypes.push('college-football');
    let errorMsg: string | null = null;
    if (frStatus.lastError) { try { errorMsg = JSON.parse(frStatus.lastError).message; } catch { errorMsg = frStatus.lastError; } }
    alerts.push({
      type: 'consecutive_failures', severity: frStatus.consecutiveFailures > 5 ? 'critical' : 'warning',
      dataType: 'college-football', message: 'College football sync has failed ' + frStatus.consecutiveFailures + ' consecutive times',
      details: { consecutive_failures: frStatus.consecutiveFailures, threshold: CONSECUTIVE_FAILURE_THRESHOLD, last_error: errorMsg },
      timestamp: now,
    });
  }

  let healthScore = 100;
  if (brStaleness >= STALENESS_THRESHOLD_CRITICAL) healthScore -= 25;
  else if (brStaleness >= STALENESS_THRESHOLD_STALE) healthScore -= 15;
  if (frStaleness >= STALENESS_THRESHOLD_CRITICAL) healthScore -= 25;
  else if (frStaleness >= STALENESS_THRESHOLD_STALE) healthScore -= 15;
  if (brStatus.consecutiveFailures > CONSECUTIVE_FAILURE_THRESHOLD) healthScore -= 10 + Math.min(20, (brStatus.consecutiveFailures - CONSECUTIVE_FAILURE_THRESHOLD) * 5);
  if (frStatus.consecutiveFailures > CONSECUTIVE_FAILURE_THRESHOLD) healthScore -= 10 + Math.min(20, (frStatus.consecutiveFailures - CONSECUTIVE_FAILURE_THRESHOLD) * 5);
  healthScore = Math.max(0, healthScore);

  let overallStatus: HealthStatus = 'healthy';
  if (healthScore < 50) overallStatus = 'critical';
  else if (healthScore < 80) overallStatus = 'stale';

  const response: AlertsResponse = {
    timestamp: now, healthScore, overallStatus, alerts,
    summary: { staleDataTypes, failingDataTypes, totalAlerts: alerts.length },
  };

  return jsonResponse(response);
}

async function handleSyncAll(env: Env): Promise<Response> {
  const startTime = Date.now();

  const [brResult, frResult, bsResult, fsResult] = await Promise.all([
    syncCollegeBaseballRankings(env),
    syncCollegeFootballRankings(env),
    syncCollegeBaseballStandings(env),
    syncCollegeFootballStandings(env),
  ]);

  const response = {
    success: brResult.success && frResult.success && bsResult.success && fsResult.success,
    total_duration_ms: Date.now() - startTime,
    results: {
      collegeBaseball: { rankings: brResult, standings: bsResult },
      collegeFootball: { rankings: frResult, standings: fsResult },
    },
  };

  return jsonResponse(response, response.success ? 200 : 207);
}

async function handleGetBaseballRankings(env: Env): Promise<Response> {
  const season = getCurrentSeason('baseball');
  const result = await env.BSI_DB.prepare('SELECT team_id, team_name, team_logo, rank, previous_rank, record, source, week, season, updated_at FROM college_baseball_rankings WHERE season = ? ORDER BY week DESC, rank ASC LIMIT 100').bind(season).all();
  return jsonResponse({ success: true, season, count: result.results?.length || 0, rankings: result.results || [] });
}

async function handleGetFootballRankings(env: Env): Promise<Response> {
  const season = getCurrentSeason('football');
  const result = await env.BSI_DB.prepare('SELECT team_id, team_name, team_logo, rank, previous_rank, record, source, week, season, updated_at FROM college_football_rankings WHERE season = ? ORDER BY week DESC, source ASC, rank ASC LIMIT 200').bind(season).all();
  return jsonResponse({ success: true, season, count: result.results?.length || 0, rankings: result.results || [] });
}

async function handleGetBaseballStandings(env: Env, url: URL): Promise<Response> {
  const season = getCurrentSeason('baseball');
  const conference = url.searchParams.get('conference');

  let query = 'SELECT * FROM college_baseball_standings WHERE season = ?';
  const params: (string | number)[] = [season];
  if (conference) { query += ' AND conference = ?'; params.push(conference); query += ' ORDER BY conference_rank ASC'; }
  else { query += ' ORDER BY conference ASC, conference_rank ASC'; }
  query += ' LIMIT 500';

  try {
    const result = await env.BSI_DB.prepare(query).bind(...params).all();
    const confResult = await env.BSI_DB.prepare('SELECT DISTINCT conference FROM college_baseball_standings WHERE season = ? ORDER BY conference').bind(season).all();
    return jsonResponse({
      success: true, season, filter: conference || 'all', count: result.results?.length || 0,
      availableConferences: confResult.results?.map((r: Record<string, unknown>) => r.conference) || [],
      standings: result.results || [],
    });
  } catch (error) {
    return jsonResponse({ success: false, error: 'Standings table not found. Run migration 0002_college_standings.sql first.', season }, 500);
  }
}

async function handleGetFootballStandings(env: Env, url: URL): Promise<Response> {
  const season = getCurrentSeason('football');
  const conference = url.searchParams.get('conference');

  let query = 'SELECT * FROM college_football_standings WHERE season = ?';
  const params: (string | number)[] = [season];
  if (conference) { query += ' AND conference = ?'; params.push(conference); query += ' ORDER BY conference_rank ASC'; }
  else { query += ' ORDER BY conference ASC, conference_rank ASC'; }
  query += ' LIMIT 500';

  try {
    const result = await env.BSI_DB.prepare(query).bind(...params).all();
    const confResult = await env.BSI_DB.prepare('SELECT DISTINCT conference FROM college_football_standings WHERE season = ? ORDER BY conference').bind(season).all();
    return jsonResponse({
      success: true, season, filter: conference || 'all', count: result.results?.length || 0,
      availableConferences: confResult.results?.map((r: Record<string, unknown>) => r.conference) || [],
      standings: result.results || [],
    });
  } catch (error) {
    return jsonResponse({ success: false, error: 'Standings table not found. Run migration 0002_college_standings.sql first.', season }, 500);
  }
}

// =============================================================================
// MAIN EXPORTS
// =============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      if (path === '/health' && method === 'GET') return handleHealth(env);
      if (path === '/status' && method === 'GET') return handleStatus(env);
      if (path === '/alerts' && method === 'GET') return handleAlerts(env);

      // Rankings sync endpoints
      if (path === '/sync/college-baseball' && method === 'POST') {
        const result = await syncCollegeBaseballRankings(env);
        return jsonResponse(result, result.success ? 200 : 500);
      }
      if (path === '/sync/college-football' && method === 'POST') {
        const result = await syncCollegeFootballRankings(env);
        return jsonResponse(result, result.success ? 200 : 500);
      }

      // Standings sync endpoints
      if (path === '/sync/standings/baseball' && method === 'POST') {
        const result = await syncCollegeBaseballStandings(env);
        return jsonResponse(result, result.success ? 200 : 500);
      }
      if (path === '/sync/standings/football' && method === 'POST') {
        const result = await syncCollegeFootballStandings(env);
        return jsonResponse(result, result.success ? 200 : 500);
      }

      // Sync all
      if (path === '/sync/all' && method === 'POST') return handleSyncAll(env);

      // Rankings get endpoints
      if (path === '/rankings/baseball' && method === 'GET') return handleGetBaseballRankings(env);
      if (path === '/rankings/football' && method === 'GET') return handleGetFootballRankings(env);

      // Standings get endpoints
      if (path === '/standings/baseball' && method === 'GET') return handleGetBaseballStandings(env, url);
      if (path === '/standings/football' && method === 'GET') return handleGetFootballStandings(env, url);

      // Root endpoint - API documentation
      if (path === '/' && method === 'GET') {
        return jsonResponse({
          service: SERVICE_NAME, version: SERVICE_VERSION,
          description: 'College sports rankings and standings data pipeline with comprehensive monitoring',
          endpoints: {
            'GET /health': 'Service health check with staleness detection',
            'GET /status': 'Detailed sync status for rankings and standings',
            'GET /alerts': 'Active alerts and system health score',
            'POST /sync/all': 'Sync all rankings and standings',
            'POST /sync/college-baseball': 'Sync college baseball rankings',
            'POST /sync/college-football': 'Sync college football rankings',
            'POST /sync/standings/baseball': 'Sync college baseball standings',
            'POST /sync/standings/football': 'Sync college football standings',
            'GET /rankings/baseball': 'Get current baseball rankings',
            'GET /rankings/football': 'Get current football rankings',
            'GET /standings/baseball?conference=SEC': 'Get baseball standings (optional conference filter)',
            'GET /standings/football?conference=SEC': 'Get football standings (optional conference filter)',
          },
          monitoring: {
            staleness_thresholds: { healthy: '< ' + STALENESS_THRESHOLD_STALE + ' hours', stale: STALENESS_THRESHOLD_STALE + '-' + STALENESS_THRESHOLD_CRITICAL + ' hours', critical: '> ' + STALENESS_THRESHOLD_CRITICAL + ' hours' },
            failure_threshold: CONSECUTIVE_FAILURE_THRESHOLD + ' consecutive failures',
            analytics_engine: env.ANALYTICS ? 'enabled' : 'disabled',
          },
          sources: {
            baseballRankings: 'ESPN API (D1Baseball.com Top 25)',
            footballRankings: 'ESPN API (AP Top 25, CFP, Coaches Poll)',
            baseballStandings: 'ESPN API (Conference Standings)',
            footballStandings: 'ESPN API (Conference Standings)',
          },
          majorConferences: MAJOR_CONFERENCES.slice(0, 10),
          cron: 'Every 6 hours',
        });
      }

      return jsonResponse({ error: 'Not Found', path }, 404);

    } catch (error) {
      console.error('[' + SERVICE_NAME + '] Request handler error:', error);
      return jsonResponse({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[' + SERVICE_NAME + '] Cron triggered: ' + event.cron + ' at ' + new Date().toISOString());

    const results: Record<string, SyncResult> = {};

    const [brResult, frResult, bsResult, fsResult] = await Promise.allSettled([
      syncCollegeBaseballRankings(env),
      syncCollegeFootballRankings(env),
      syncCollegeBaseballStandings(env),
      syncCollegeFootballStandings(env),
    ]);

    results.collegeBaseballRankings = brResult.status === 'fulfilled' ? brResult.value : { success: false, inserted: 0, error: String(brResult.reason) };
    results.collegeFootballRankings = frResult.status === 'fulfilled' ? frResult.value : { success: false, inserted: 0, error: String(frResult.reason) };
    results.collegeBaseballStandings = bsResult.status === 'fulfilled' ? bsResult.value : { success: false, inserted: 0, error: String(bsResult.reason) };
    results.collegeFootballStandings = fsResult.status === 'fulfilled' ? fsResult.value : { success: false, inserted: 0, error: String(fsResult.reason) };

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;

    console.log('[' + SERVICE_NAME + '] Scheduled sync complete: ' + successCount + '/' + totalCount + ' succeeded');
    console.log('[' + SERVICE_NAME + '] Results:', JSON.stringify(results, null, 2));
  },
};
