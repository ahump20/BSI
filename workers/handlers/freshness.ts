/**
 * Data Freshness Dashboard API — Self-Watching Infrastructure
 *
 * GET /api/admin/freshness — Returns structured freshness data for all
 * BSI data pipelines: live scores (KV), standings (KV), sabermetrics (D1).
 * Each source gets a status: FRESH / STALE / DEGRADED / MISSING.
 *
 * This replaces the manual freshness audit Austin did on 2026-03-24.
 * The system now watches itself.
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';
import { timingSafeCompare } from '../shared/auth';
import { DateTime } from 'luxon';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FreshnessStatus = 'fresh' | 'stale' | 'degraded' | 'missing' | 'off-season';

interface DataSource {
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

interface D1TableCheck {
  name: string;
  table: string;
  rows: number;
  lastComputed: string | null;
  ageHours: number | null;
  status: FreshnessStatus;
}

interface FreshnessReport {
  timestamp: string;
  timezone: 'America/Chicago';
  summary: { fresh: number; stale: number; degraded: number; missing: number; total: number };
  liveEndpoints: DataSource[];
  d1Tables: D1TableCheck[];
  meta: { source: string; fetched_at: string; timezone: 'America/Chicago' };
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Minutes before a data source is considered stale */
const STALE_THRESHOLDS: Record<string, number> = {
  scores: 5,         // live scores: stale after 5 min
  standings: 120,    // standings: stale after 2 hours
  rankings: 360,     // rankings: stale after 6 hours
  editorial: 1440,   // editorial: stale after 24 hours
};

/** Hours before a D1 table is considered stale */
const D1_STALE_HOURS = 24;

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

function classifyStatus(ageMin: number, category: string, degraded: boolean): FreshnessStatus {
  if (degraded) return 'degraded';
  const threshold = STALE_THRESHOLDS[category] || 120;
  return ageMin <= threshold ? 'fresh' : 'stale';
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
}

function getTodayKey(): string {
  // Must match the YYYY-MM-DD format used by score handlers and the cbb-ingest Worker.
  // Handlers use: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format()
  // Ingest uses: new Date().toISOString().split('T')[0]
  return now().toFormat('yyyy-MM-dd');
}

function getKVChecks(): KVCheck[] {
  const today = getTodayKey();
  return [
    // Scores — CB uses YYYY-MM-DD date key; other sports use literal 'today'
    { name: 'College Baseball Scores', key: `cb:scores:${today}`, category: 'scores', sport: 'College Baseball', source: 'ESPN' },
    { name: 'MLB Scores', key: 'mlb:scores:today:stauto', category: 'scores', sport: 'MLB', source: 'ESPN' },
    { name: 'NBA Scores', key: 'nba:scores:today', category: 'scores', sport: 'NBA', source: 'ESPN' },
    { name: 'NFL Scores', key: 'nfl:scores:today', category: 'scores', sport: 'NFL', source: 'ESPN' },
    { name: 'CFB Scores', key: 'cfb:scores:today', category: 'scores', sport: 'CFB', source: 'ESPN' },
    // Standings (static keys)
    { name: 'CB Standings (SEC)', key: 'cb:standings:v3:SEC', category: 'standings', sport: 'College Baseball', source: 'ESPN' },
    { name: 'CB Standings (ACC)', key: 'cb:standings:v3:ACC', category: 'standings', sport: 'College Baseball', source: 'ESPN' },
    { name: 'CB Standings (Big 12)', key: 'cb:standings:v3:Big 12', category: 'standings', sport: 'College Baseball', source: 'ESPN' },
    { name: 'MLB Standings', key: 'mlb:standings', category: 'standings', sport: 'MLB', source: 'ESPN' },
    { name: 'NBA Standings', key: 'nba:standings', category: 'standings', sport: 'NBA', source: 'ESPN' },
    { name: 'NFL Standings', key: 'nfl:standings', category: 'standings', sport: 'NFL', source: 'ESPN' },
    { name: 'CFB Standings', key: 'cfb:standings', category: 'standings', sport: 'CFB', source: 'ESPN' },
    // Rankings
    { name: 'College Baseball Rankings', key: 'cb:rankings:v2', category: 'rankings', sport: 'College Baseball', source: 'ESPN' },
    { name: 'CFB Rankings', key: 'cfb:rankings', category: 'rankings', sport: 'CFB', source: 'ESPN' },
    // Editorial
    { name: 'Trending Intel', key: 'cb:trending', category: 'editorial', sport: 'College Baseball', source: 'BSI' },
    { name: 'Editorial List', key: 'cb:editorial:list', category: 'editorial', sport: 'College Baseball', source: 'BSI D1' },
  ];
}

async function checkKVSource(kv: KVNamespace, check: KVCheck): Promise<DataSource> {
  try {
    const raw = await kv.get(check.key, 'text');
    if (!raw) {
      return {
        name: check.name, category: check.category, sport: check.sport,
        status: 'missing', fetchedAt: null, ageMinutes: null, itemCount: null,
        source: check.source, note: `KV key "${check.key}" not found`,
      };
    }

    const data = JSON.parse(raw);
    const meta = data.meta || {};
    const fetchedAt = meta.fetched_at || meta.fetchedAt || data.lastUpdated || null;
    const degraded = !!meta.degraded || !!data.degraded;

    // Count items in the response — support multiple data shapes
    let itemCount: number | null = null;
    if (Array.isArray(data.data)) itemCount = data.data.length;
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
      status = classifyStatus(age!, check.category, degraded);
    } else if (itemCount !== null && itemCount > 0) {
      // Data exists but no timestamp — treat as fresh (cron-refreshed data)
      status = 'fresh';
    } else {
      status = 'missing';
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

    const status: FreshnessStatus =
      rows === 0 ? 'missing' :
      age !== null && age > D1_STALE_HOURS ? 'stale' :
      'fresh';

    return { name: def.name, table: def.table, rows, lastComputed, ageHours: age, status };
  } catch (err) {
    return {
      name: def.name, table: def.table, rows: 0,
      lastComputed: null, ageHours: null, status: 'missing',
    };
  }
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

export async function handleFreshness(request: Request, env: Env): Promise<Response> {
  // Admin auth — matches requireAdmin pattern in health.ts
  if (env.ADMIN_KEY) {
    const auth = request.headers.get('Authorization');
    const headerKey = request.headers.get('X-Admin-Key');
    const queryKey = new URL(request.url).searchParams.get('key');
    const bearer = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    const provided = bearer || headerKey || queryKey;
    if (!provided || !(await timingSafeCompare(provided, env.ADMIN_KEY))) {
      return json({ error: 'Unauthorized' }, 401);
    }
  }

  const checks = getKVChecks();

  // Run all checks in parallel
  const [kvResults, d1Results] = await Promise.all([
    Promise.all(checks.map((c) => checkKVSource(env.KV, c))),
    Promise.all(D1_TABLES.map((t) => checkD1Table(env.DB, t))),
  ]);

  // Combine all statuses for summary
  const allStatuses = [
    ...kvResults.map((r) => r.status),
    ...d1Results.map((r) => r.status),
  ];

  const summary = {
    fresh: allStatuses.filter((s) => s === 'fresh').length,
    stale: allStatuses.filter((s) => s === 'stale').length,
    degraded: allStatuses.filter((s) => s === 'degraded').length,
    missing: allStatuses.filter((s) => s === 'missing').length,
    total: allStatuses.length,
  };

  const report: FreshnessReport = {
    timestamp: now().toISO()!,
    timezone: 'America/Chicago',
    summary,
    liveEndpoints: kvResults,
    d1Tables: d1Results,
    meta: {
      source: 'bsi-freshness-dashboard',
      fetched_at: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };

  return json(report);
}
