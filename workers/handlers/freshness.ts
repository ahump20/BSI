/**
 * Data Freshness Dashboard API — Self-Watching Infrastructure
 *
 * GET /api/admin/freshness — Returns structured freshness data for all
 * BSI data pipelines: live scores (KV), standings (KV), sabermetrics (D1).
 * Each source gets a status: FRESH / STALE / DEGRADED / MISSING / OFF-SEASON.
 *
 * GET /api/admin/freshness?deep=true — Same plus an upstream API ping
 * (Highlightly Pro + ESPN) so the report can prove the source is alive
 * even when the cached data is recent.
 *
 * Response shape additions (2026-04-09):
 *  - upstream:      [{ provider, status, latencyMs, error?, checkedAt }]
 *  - cronHealth:    { workers: { name → { status, lastRunAt, ageMinutes } } }
 *  - dailyAudit:    { ranAt, summary } if a daily audit has run
 *
 * The check is sport- and season-aware: sports in offseason relax to a
 * 1-week threshold, in-season sports use Austin's spec
 * (scores 6h, standings 24h, rankings 48h).
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';
import { timingSafeCompare } from '../shared/auth';
import { DateTime } from 'luxon';
import { getSeasonPhase, type SportKey } from '../../lib/season';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FreshnessStatus = 'fresh' | 'stale' | 'degraded' | 'missing' | 'off-season';

export interface DataSource {
  name: string;
  category: 'scores' | 'standings' | 'rankings' | 'sabermetrics' | 'editorial';
  sport: string;
  status: FreshnessStatus;
  fetchedAt: string | null;
  ageMinutes: number | null;
  itemCount: number | null;
  source: string;
  degraded?: boolean;
  note?: string;
}

export interface D1TableCheck {
  name: string;
  table: string;
  rows: number;
  lastComputed: string | null;
  ageHours: number | null;
  status: FreshnessStatus;
  note?: string;
}

export interface UpstreamCheck {
  provider: string;
  status: 'ok' | 'slow' | 'down' | 'unconfigured';
  latencyMs: number | null;
  checkedAt: string;
  error?: string;
  /**
   * When true, this upstream is a secondary source with a known-working
   * fallback (e.g. SportsDataIO → ESPN). A `down` status surfaces to the
   * dashboard for visibility but doesn't get counted in the alertable
   * summary — the product keeps working via fallback.
   */
  optional?: boolean;
}

export interface CronWorkerStatus {
  status: 'ok' | 'silent' | 'degraded';
  lastRunAt: string | null;
  ageMinutes: number | null;
  detail?: string;
}

/**
 * An error cluster from the `bsi-error-tracker` tail worker. Mirrors the
 * ErrorCluster interface in workers/error-tracker/index.ts:32-41.
 */
export interface ErrorCluster {
  fingerprint: string;
  worker: string;
  kind: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  sample: string;
  /** Minutes since last seen — computed at audit time. */
  ageMinutes: number | null;
}

export interface FreshnessReport {
  timestamp: string;
  timezone: 'America/Chicago';
  summary: { fresh: number; stale: number; degraded: number; missing: number; total: number };
  liveEndpoints: DataSource[];
  d1Tables: D1TableCheck[];
  upstream?: UpstreamCheck[];
  cronHealth?: { workers: Record<string, CronWorkerStatus>; checkedAt: string | null };
  errorClusters?: { total: number; active: ErrorCluster[] };
  dailyAudit?: { ranAt: string | null; summary: FreshnessReport['summary'] | null };
  meta: { source: string; fetched_at: string; timezone: 'America/Chicago' };
}

// ---------------------------------------------------------------------------
// Thresholds (Austin's spec, 2026-04-09)
// ---------------------------------------------------------------------------

/** Minutes before an in-season data source is considered stale. */
const STALE_THRESHOLDS_IN_SEASON: Record<string, number> = {
  scores:    360,    // 6 hours
  standings: 1440,   // 24 hours
  rankings:  2880,   // 48 hours
  editorial: 1440,   // 24 hours
};

/** Off-season relaxation: 1 week is acceptable for everything except editorial. */
const OFF_SEASON_THRESHOLD = 7 * 24 * 60; // 168h = 10080 min

/**
 * D1 sabermetric staleness thresholds, per table.
 *
 * These mirror the actual schedule in workers/bsi-cbb-analytics/index.ts:
 * - batting_advanced, pitching_advanced, league_context: every 6h UTC
 * - park_factors + conference_strength: Sunday UTC only (weekly)
 *
 * The `runAnalytics(env, isSunday)` call at scheduled() line 716 gates the
 * weekly computations behind `getUTCDay() === 0`. A bigger buffer than 7d
 * gives us a safety margin for missed Sunday runs.
 */
const D1_STALE_HOURS_BY_TABLE: Record<string, number> = {
  cbb_batting_advanced:    7,    // 6h cron + 1h buffer
  cbb_pitching_advanced:   7,
  cbb_league_context:      7,
  cbb_conference_strength: 192,  // 8 days = weekly Sunday + 1 day buffer
  cbb_park_factors:        192,  // 8 days = weekly Sunday + 1 day buffer
};
const D1_STALE_HOURS_DEFAULT = 24;

/**
 * D1 tables that are intentionally orphaned (KV is the active path).
 * Per the platform manager memory: cbb_* sabermetric tables stopped writing
 * in January but the KV cache continues to serve fresh data. Mark these as
 * 'off-season' instead of 'stale' so they don't trip alerts.
 */
const D1_ORPHANED_TABLES = new Set<string>([
  // Intentionally empty for now — leave the door open to mark specific tables
  // orphaned if/when the platform decision is finalized. Adding a table here
  // suppresses its 'stale' alert without hiding it from the dashboard.
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = () => DateTime.now().setZone('America/Chicago');

function ageMinutes(fetchedAt: string): number {
  const fetched = DateTime.fromISO(fetchedAt);
  if (!fetched.isValid) return 999999;
  return Math.round(now().diff(fetched, 'minutes').minutes);
}

function ageHours(fetchedAt: string): number {
  const fetched = DateTime.fromISO(fetchedAt);
  if (!fetched.isValid) return 999999;
  return Math.round(now().diff(fetched, 'hours').hours * 10) / 10;
}

/** Map a sport label string back to a SportKey for season lookup. */
function sportToKey(sport: string): SportKey | null {
  const s = sport.toLowerCase();
  if (s.includes('college baseball') || s === 'ncaa') return 'ncaa';
  if (s === 'mlb') return 'mlb';
  if (s === 'nfl') return 'nfl';
  if (s === 'nba') return 'nba';
  if (s === 'cfb') return 'cfb';
  return null;
}

/** Threshold lookup that accounts for sport season state. */
function getThreshold(category: string, sport: string): { thresholdMinutes: number; offSeason: boolean } {
  const key = sportToKey(sport);
  if (key) {
    const phase = getSeasonPhase(key).phase;
    if (phase === 'offseason') {
      return { thresholdMinutes: OFF_SEASON_THRESHOLD, offSeason: true };
    }
  }
  return {
    thresholdMinutes: STALE_THRESHOLDS_IN_SEASON[category] ?? 1440,
    offSeason: false,
  };
}

function classifyStatus(
  ageMin: number,
  category: string,
  sport: string,
  degraded: boolean,
): FreshnessStatus {
  if (degraded) return 'degraded';
  const { thresholdMinutes, offSeason } = getThreshold(category, sport);
  if (ageMin <= thresholdMinutes) return 'fresh';
  // If we're past the in-season threshold but the sport is in its offseason,
  // surface the source as 'off-season' rather than 'stale' so alerts only
  // fire on actively-broken sports.
  return offSeason ? 'off-season' : 'stale';
}

// ---------------------------------------------------------------------------
// KV Endpoint Checks
// ---------------------------------------------------------------------------

interface KVCheck {
  name: string;
  key: string;
  category: DataSource['category'];
  sport: string;
  source: string;
  /**
   * When true, this key is only written on user demand (no cron warms it).
   * A missing key on an on-demand endpoint is neutral — it means nobody's
   * hit it recently, not that the cron failed. These surface to the
   * dashboard but don't trigger alerts.
   */
  onDemand?: boolean;
}

function getTodayKey(): string {
  // Must match the YYYY-MM-DD format used by:
  //   - score handlers (demand-loaded): `new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' })`
  //   - cbb-ingest worker:             `new Date().toISOString().split('T')[0]`
  //   - main cron scoresCacheKey:      `new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).split(',')[0]`
  return now().toFormat('yyyy-MM-dd');
}

function getKVChecks(): KVCheck[] {
  const today = getTodayKey();
  return [
    // Scores — only CB is checked via KV directly. The MLB/NBA/NCAA-baseball
    // cron-warmed keys (`scores:cached:${sport}:${date}`) have a 120s TTL and
    // the 1-minute cron rewrites them each cycle — that's a short-enough
    // window that KV's eventual consistency sometimes returns empty even when
    // the write succeeded. cronHealth below (read from `health:providers:latest`)
    // is the authoritative source for whether those crons are running, so we
    // use THAT instead of racing KV.
    //
    // CB Scores is different: the cbb-ingest worker writes `cb:scores:${date}`
    // via `processFinishedGames` in the main cron, but only on days with active
    // games — there's nothing to write on an off-day (Thursday often is). So
    // CB Scores is marked `onDemand: true`: the key exists when games happen
    // and is legitimately absent when they don't.
    { name: 'College Baseball Scores', key: `cb:scores:${today}`, category: 'scores', sport: 'College Baseball', source: 'ESPN', onDemand: true },
    // Standings — SEC is the primary health indicator (highest traffic). Other conferences
    // are demand-loaded so a missing key just means nobody hit that endpoint today.
    { name: 'CB Standings (SEC)', key: 'cb:standings:v3:SEC',    category: 'standings', sport: 'College Baseball', source: 'ESPN' },
    { name: 'CB Standings (ACC)', key: 'cb:standings:v3:ACC',    category: 'standings', sport: 'College Baseball', source: 'ESPN', onDemand: true },
    { name: 'CB Standings (Big 12)', key: 'cb:standings:v3:Big 12', category: 'standings', sport: 'College Baseball', source: 'ESPN', onDemand: true },
    // Pro league standings are also demand-loaded (no cron warming).
    { name: 'MLB Standings', key: 'mlb:standings', category: 'standings', sport: 'MLB', source: 'ESPN', onDemand: true },
    { name: 'NBA Standings', key: 'nba:standings', category: 'standings', sport: 'NBA', source: 'ESPN', onDemand: true },
    { name: 'NFL Standings', key: 'nfl:standings', category: 'standings', sport: 'NFL', source: 'ESPN', onDemand: true },
    { name: 'CFB Standings', key: 'cfb:standings', category: 'standings', sport: 'CFB', source: 'ESPN', onDemand: true },
    // Rankings — cron-warmed by cacheRankings() in cron/rankings.ts
    { name: 'College Baseball Rankings', key: 'cb:rankings:v2', category: 'rankings', sport: 'College Baseball', source: 'ESPN' },
    { name: 'CFB Rankings',              key: 'cfb:rankings',   category: 'rankings', sport: 'CFB',              source: 'ESPN', onDemand: true },
    // Editorial — demand-loaded; trending and list only exist after handler invocation.
    { name: 'Trending Intel', key: 'cb:trending',      category: 'editorial', sport: 'College Baseball', source: 'BSI',    onDemand: true },
    { name: 'Editorial List', key: 'cb:editorial:list', category: 'editorial', sport: 'College Baseball', source: 'BSI D1', onDemand: true },
  ];
}

async function checkKVSource(kv: KVNamespace, check: KVCheck): Promise<DataSource> {
  try {
    const raw = await kv.get(check.key, 'text');
    if (!raw) {
      // Off-season sports and on-demand endpoints both get a neutral status
      // instead of 'missing'. For off-season, the sport isn't playing. For
      // on-demand, no user has hit the endpoint yet today — that's expected.
      const key = sportToKey(check.sport);
      const isOff = key ? getSeasonPhase(key).phase === 'offseason' : false;
      const isNeutral = isOff || check.onDemand === true;
      let note: string;
      if (isOff) note = `Sport in offseason — KV key absent is expected`;
      else if (check.onDemand) note = `On-demand endpoint — key only exists after handler invocation`;
      else note = `KV key "${check.key}" not found`;
      return {
        name: check.name, category: check.category, sport: check.sport,
        status: isNeutral ? 'off-season' : 'missing',
        fetchedAt: null, ageMinutes: null, itemCount: null,
        source: check.source,
        note,
      };
    }

    const data = JSON.parse(raw);
    const meta = data.meta || {};
    // Timestamp can be stored under any of these keys depending on writer:
    //  - cron score cache: meta.cachedAt
    //  - API handlers: meta.fetched_at / meta.fetchedAt
    //  - legacy: data.lastUpdated
    const fetchedAt = meta.fetched_at || meta.fetchedAt || meta.cachedAt || data.lastUpdated || null;
    const degraded = !!meta.degraded || !!data.degraded;

    // Count items in the response — support multiple data shapes.
    // The cron cache wraps responses as `{ data: { games: [...] }, meta: {...} }`
    // while handlers often return `{ data: [...], meta: {...} }` directly.
    const inner = data.data;
    const innerObj = inner && typeof inner === 'object' && !Array.isArray(inner) ? inner : null;
    let itemCount: number | null = null;
    if (Array.isArray(data.data)) itemCount = data.data.length;
    else if (innerObj && Array.isArray(innerObj.games)) itemCount = innerObj.games.length;
    else if (innerObj && Array.isArray(innerObj.data)) itemCount = innerObj.data.length;
    else if (innerObj && Array.isArray(innerObj.teams)) itemCount = innerObj.teams.length;
    else if (innerObj && Array.isArray(innerObj.standings)) itemCount = innerObj.standings.length;
    else if (Array.isArray(data.games)) itemCount = data.games.length;
    else if (Array.isArray(data.teams)) itemCount = data.teams.length;
    else if (Array.isArray(data.rankings)) itemCount = data.rankings.length;
    else if (Array.isArray(data.conferences)) itemCount = data.conferences.length;
    else if (Array.isArray(data.editorials)) itemCount = data.editorials.length;
    else if (Array.isArray(data.items)) itemCount = data.items.length;
    else if (data.totalCount != null) itemCount = data.totalCount;
    else if (data.count != null) itemCount = data.count;

    const age = fetchedAt ? ageMinutes(fetchedAt) : null;

    // If the key exists with data but no timestamp (e.g., cbb-ingest writes raw data
    // without a meta wrapper), classify as 'fresh' — the data is real and current.
    let status: FreshnessStatus;
    if (fetchedAt) {
      status = classifyStatus(age!, check.category, check.sport, degraded);
    } else if (itemCount !== null && itemCount > 0) {
      // Data exists but no timestamp — treat as fresh (cron-refreshed data)
      status = 'fresh';
    } else {
      const key = sportToKey(check.sport);
      const isOff = key ? getSeasonPhase(key).phase === 'offseason' : false;
      const isNeutral = isOff || check.onDemand === true;
      status = isNeutral ? 'off-season' : 'missing';
    }

    return {
      name: check.name, category: check.category, sport: check.sport,
      status, fetchedAt, ageMinutes: age, itemCount,
      source: check.source, degraded: degraded || undefined,
      note: (!fetchedAt && itemCount !== null && itemCount > 0) ? 'No timestamp in payload (cron-refreshed)' : undefined,
    };
  } catch (err) {
    return {
      name: check.name, category: check.category, sport: check.sport,
      status: 'missing', fetchedAt: null, ageMinutes: null, itemCount: null,
      source: check.source, note: `Error: ${err instanceof Error ? err.message : 'unknown'}`,
    };
  }
}

// ---------------------------------------------------------------------------
// D1 Table Checks
// ---------------------------------------------------------------------------

const D1_TABLES = [
  { name: 'Batting Advanced', table: 'cbb_batting_advanced', tsCol: 'computed_at' },
  { name: 'Pitching Advanced', table: 'cbb_pitching_advanced', tsCol: 'computed_at' },
  { name: 'Conference Strength', table: 'cbb_conference_strength', tsCol: 'computed_at' },
  { name: 'Park Factors', table: 'cbb_park_factors', tsCol: 'computed_at' },
  { name: 'League Context', table: 'cbb_league_context', tsCol: 'computed_at' },
];

async function checkD1Table(
  db: D1Database,
  def: typeof D1_TABLES[number],
): Promise<D1TableCheck> {
  try {
    const countResult = await db.prepare(
      `SELECT COUNT(*) as cnt FROM ${def.table}`
    ).first<{ cnt: number }>();

    const rows = countResult?.cnt ?? 0;

    // Try to get the latest timestamp
    let lastComputed: string | null = null;
    let age: number | null = null;
    try {
      const tsResult = await db.prepare(
        `SELECT MAX(${def.tsCol}) as latest FROM ${def.table}`
      ).first<{ latest: string | null }>();
      if (tsResult?.latest) {
        lastComputed = tsResult.latest;
        age = ageHours(lastComputed);
      }
    } catch {
      // Column may not exist — non-fatal
    }

    // Orphan suppression: if a table is in the orphan set, surface as
    // off-season with a note instead of stale.
    const orphaned = D1_ORPHANED_TABLES.has(def.table);
    const tableThreshold = D1_STALE_HOURS_BY_TABLE[def.table] ?? D1_STALE_HOURS_DEFAULT;

    let status: FreshnessStatus;
    if (rows === 0) {
      status = orphaned ? 'off-season' : 'missing';
    } else if (age !== null && age > tableThreshold) {
      status = orphaned ? 'off-season' : 'stale';
    } else {
      status = 'fresh';
    }

    return {
      name: def.name, table: def.table, rows, lastComputed, ageHours: age, status,
      note: orphaned ? 'D1 path orphaned — KV is canonical' : undefined,
    };
  } catch {
    return {
      name: def.name, table: def.table, rows: 0,
      lastComputed: null, ageHours: null, status: 'missing',
    };
  }
}

// ---------------------------------------------------------------------------
// Upstream API checks (only when ?deep=true)
// ---------------------------------------------------------------------------

const UPSTREAM_TIMEOUT_MS = 6000;
const UPSTREAM_SLOW_MS = 2000;

async function pingUpstream(
  provider: string,
  url: string,
  init: RequestInit = {},
): Promise<UpstreamCheck> {
  const startMs = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    const latencyMs = Date.now() - startMs;
    if (!res.ok) {
      return {
        provider,
        status: 'down',
        latencyMs,
        checkedAt,
        error: `HTTP ${res.status}`,
      };
    }
    return {
      provider,
      status: latencyMs > UPSTREAM_SLOW_MS ? 'slow' : 'ok',
      latencyMs,
      checkedAt,
    };
  } catch (err) {
    return {
      provider,
      status: 'down',
      latencyMs: Date.now() - startMs,
      checkedAt,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkUpstreams(env: Env): Promise<UpstreamCheck[]> {
  const checks: Promise<UpstreamCheck>[] = [];

  // Highlightly Pro (RapidAPI) — only when key is configured.
  // Probe /teams?league=NCAA which is the canonical league listing endpoint
  // used by lib/api-clients/highlightly-api.ts:387.
  if (env.RAPIDAPI_KEY) {
    checks.push(
      pingUpstream(
        'Highlightly Pro',
        'https://mlb-college-baseball-api.p.rapidapi.com/teams?league=NCAA',
        {
          headers: {
            'x-rapidapi-key': env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'mlb-college-baseball-api.p.rapidapi.com',
            'User-Agent': 'BSI-Freshness-Check/1.0',
          },
        },
      ),
    );
  } else {
    checks.push(
      Promise.resolve({
        provider: 'Highlightly Pro',
        status: 'unconfigured',
        latencyMs: null,
        checkedAt: new Date().toISOString(),
        error: 'RAPIDAPI_KEY not set',
      } as UpstreamCheck),
    );
  }

  // ESPN — free, always check
  checks.push(
    pingUpstream(
      'ESPN College Baseball',
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
      { headers: { 'User-Agent': 'BSI-Freshness-Check/1.0' } },
    ),
  );

  // SportsDataIO — secondary source with ESPN fallback at the handler level.
  // Probe /v3/mlb/scores/json/GamesByDate/{today} which is the exact endpoint
  // the cron's fetchMLBScores() uses via SDIOClient.getMLBScores(). If this
  // returns 403, the key's scope has drifted and needs refresh — but the
  // product keeps working via ESPN. Marked `optional: true` so a down status
  // surfaces to the dashboard for visibility but doesn't trigger alerts.
  if (env.SPORTS_DATA_IO_API_KEY) {
    const todayISO = now().toFormat('yyyy-MM-dd');
    checks.push(
      pingUpstream(
        'SportsDataIO',
        `https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate/${todayISO}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': env.SPORTS_DATA_IO_API_KEY,
            'User-Agent': 'BSI-Freshness-Check/1.0',
          },
        },
      ).then((r) => ({ ...r, optional: true })),
    );
  }

  return Promise.all(checks);
}

// ---------------------------------------------------------------------------
// Cron worker health (read from KV — written by handleScheduled)
// ---------------------------------------------------------------------------

interface ProviderHealthBlob {
  providers: Record<string, { status: string; lastSuccessAt?: string; lastCheckAt: string }>;
  checkedAt: string;
  activeSports: string[];
}

interface HealingStatusBlob {
  checkedAt: string;
  stale: string[];
  healthy: boolean;
}

async function checkCronHealth(env: Env): Promise<FreshnessReport['cronHealth']> {
  const workers: Record<string, CronWorkerStatus> = {};
  let checkedAt: string | null = null;

  // 1) Main worker per-sport health (written by handleScheduled every minute)
  try {
    const raw = await env.KV.get('health:providers:latest', 'text');
    if (raw) {
      const blob = JSON.parse(raw) as ProviderHealthBlob;
      checkedAt = blob.checkedAt ?? null;
      for (const [sport, p] of Object.entries(blob.providers || {})) {
        const ts = p.lastSuccessAt || p.lastCheckAt;
        const age = ts ? ageMinutes(ts) : null;
        // Main cron runs every minute — silent if last success > 10 min ago.
        let status: CronWorkerStatus['status'];
        if (p.status !== 'ok') status = 'degraded';
        else if (age !== null && age > 10) status = 'silent';
        else status = 'ok';
        workers[`main-cron:${sport}`] = {
          status,
          lastRunAt: ts,
          ageMinutes: age,
          detail: p.status,
        };
      }
    }
  } catch {
    /* non-fatal */
  }

  // 2) D1 healing status (written by handleScheduled, derived from sabermetric tables)
  try {
    const raw = await env.KV.get('healing:d1:status', 'text');
    if (raw) {
      const blob = JSON.parse(raw) as HealingStatusBlob;
      const age = blob.checkedAt ? ageMinutes(blob.checkedAt) : null;
      workers['d1-healing-monitor'] = {
        status: blob.healthy ? 'ok' : 'degraded',
        lastRunAt: blob.checkedAt ?? null,
        ageMinutes: age,
        detail: blob.healthy ? 'All sabermetric tables fresh' : `Stale: ${blob.stale.join(', ')}`,
      };
    }
  } catch {
    /* non-fatal */
  }

  // 3) Synthetic monitor — read summary:latest from MONITOR_KV if bound
  if (env.MONITOR_KV) {
    try {
      const raw = await env.MONITOR_KV.get('summary:latest', 'text');
      if (raw) {
        const blob = JSON.parse(raw) as { timestamp: string; allHealthy: boolean };
        const age = blob.timestamp ? ageMinutes(blob.timestamp) : null;
        // Synthetic monitor cron is */5 — silent if > 15 min.
        const status: CronWorkerStatus['status'] =
          age !== null && age > 15 ? 'silent' :
          blob.allHealthy ? 'ok' : 'degraded';
        workers['bsi-synthetic-monitor'] = {
          status,
          lastRunAt: blob.timestamp,
          ageMinutes: age,
          detail: blob.allHealthy ? 'All endpoints healthy' : 'One or more endpoints failing',
        };
      }
    } catch {
      /* non-fatal */
    }
  }

  return { workers, checkedAt };
}

// ---------------------------------------------------------------------------
// Error clusters (read from the bsi-error-tracker tail worker's KV)
// ---------------------------------------------------------------------------

/**
 * Read active error clusters from the error-tracker's `ERROR_LOG` KV.
 *
 * The tail worker at workers/error-tracker/index.ts fingerprints errors
 * and stores rolling cluster summaries under `err-cluster:${fp}` with a
 * 24h TTL. The list of active fingerprints lives at `err-clusters:index`.
 *
 * This function reads the index, fetches each cluster in parallel, computes
 * an age in minutes, and returns the N most-recent. Capped at 20 to keep
 * the audit payload bounded.
 */
async function checkErrorClusters(env: Env): Promise<FreshnessReport['errorClusters']> {
  const kv = env.ERROR_LOG ?? env.KV;
  if (!kv) return { total: 0, active: [] };

  try {
    const indexRaw = await kv.get('err-clusters:index', 'text');
    if (!indexRaw) return { total: 0, active: [] };

    const fingerprints: string[] = JSON.parse(indexRaw);
    if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
      return { total: 0, active: [] };
    }

    // Fetch each cluster in parallel. Skip any that have already been
    // evicted from KV (24h TTL) — index lags the actual cluster keys.
    const clusters = await Promise.all(
      fingerprints.map(async (fp): Promise<ErrorCluster | null> => {
        try {
          const raw = await kv.get(`err-cluster:${fp}`, 'text');
          if (!raw) return null;
          const cluster = JSON.parse(raw) as Omit<ErrorCluster, 'ageMinutes'>;
          const ageMin = cluster.lastSeen ? ageMinutes(cluster.lastSeen) : null;
          return { ...cluster, ageMinutes: ageMin };
        } catch {
          return null;
        }
      }),
    );

    const active = clusters
      .filter((c): c is ErrorCluster => c !== null)
      .sort((a, b) => {
        // Most-recent first; within the same minute, highest-count first.
        const aAge = a.ageMinutes ?? Infinity;
        const bAge = b.ageMinutes ?? Infinity;
        if (aAge !== bAge) return aAge - bAge;
        return b.count - a.count;
      })
      .slice(0, 20);

    return { total: active.length, active };
  } catch {
    return { total: 0, active: [] };
  }
}

// ---------------------------------------------------------------------------
// Daily audit snapshot (written by the daily-gated cron block in cron/index.ts)
// ---------------------------------------------------------------------------

async function readDailyAudit(env: Env): Promise<FreshnessReport['dailyAudit']> {
  try {
    const raw = await env.KV.get('freshness:daily:latest', 'text');
    if (!raw) return { ranAt: null, summary: null };
    const blob = JSON.parse(raw) as { ranAt: string; summary: FreshnessReport['summary'] };
    return { ranAt: blob.ranAt, summary: blob.summary };
  } catch {
    return { ranAt: null, summary: null };
  }
}

// ---------------------------------------------------------------------------
// Core builder (callable from outside the HTTP handler — used by daily cron)
// ---------------------------------------------------------------------------

export async function buildFreshnessReport(env: Env, deep: boolean): Promise<FreshnessReport> {
  const checks = getKVChecks();

  // Always-on checks: KV + D1 + cron health + error clusters + daily-audit snapshot
  // Deep-only:        upstream API pings
  const baseChecks = await Promise.all([
    Promise.all(checks.map((c) => checkKVSource(env.KV, c))),
    Promise.all(D1_TABLES.map((t) => checkD1Table(env.DB, t))),
    checkCronHealth(env),
    checkErrorClusters(env),
    readDailyAudit(env),
  ]);

  const [kvResults, d1Results, cronHealth, errorClusters, dailyAudit] = baseChecks;

  let upstream: UpstreamCheck[] | undefined;
  if (deep) {
    upstream = await checkUpstreams(env);
  }

  // Combine all statuses for summary (KV + D1 + upstream)
  // Note: 'off-season' is not counted as fresh OR stale — it's neutral.
  const allStatuses: FreshnessStatus[] = [
    ...kvResults.map((r) => r.status),
    ...d1Results.map((r) => r.status),
  ];

  // Upstream contributes to the alertable count only for non-optional
  // sources. Optional sources (SportsDataIO, etc.) have fallbacks and don't
  // break the product when down — they surface to the dashboard as a
  // visibility signal but aren't counted in stale/missing.
  if (upstream) {
    for (const u of upstream) {
      if (u.optional) continue;
      if (u.status === 'down') allStatuses.push('missing');
      else if (u.status === 'slow') allStatuses.push('degraded');
    }
  }

  const summary = {
    fresh: allStatuses.filter((s) => s === 'fresh').length,
    stale: allStatuses.filter((s) => s === 'stale').length,
    degraded: allStatuses.filter((s) => s === 'degraded').length,
    missing: allStatuses.filter((s) => s === 'missing').length,
    total: allStatuses.length,
  };

  const isoNow = new Date().toISOString();
  return {
    timestamp: now().toISO()!,
    timezone: 'America/Chicago',
    summary,
    liveEndpoints: kvResults,
    d1Tables: d1Results,
    upstream,
    cronHealth,
    errorClusters,
    dailyAudit,
    meta: {
      source: 'bsi-freshness-dashboard',
      fetched_at: isoNow,
      timezone: 'America/Chicago',
    },
  };
}

// ---------------------------------------------------------------------------
// HTTP Handler
// ---------------------------------------------------------------------------

export async function handleFreshness(request: Request, env: Env): Promise<Response> {
  // Admin auth — matches requireAdmin pattern in health.ts
  if (env.ADMIN_KEY) {
    const auth = request.headers.get('Authorization');
    const headerKey = request.headers.get('X-Admin-Key');
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('key');
    const bearer = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    const provided = bearer || headerKey || queryKey;
    if (!provided || !(await timingSafeCompare(provided, env.ADMIN_KEY))) {
      return json({ error: 'Unauthorized' }, 401);
    }
  }

  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === 'true';

  const report = await buildFreshnessReport(env, deep);
  return json(report);
}
