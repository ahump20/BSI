/**
 * bsi-nil-sync
 *
 * NIL (Name, Image, Likeness) data pipeline for college baseball.
 * Syncs valuations, deals, and player stats from paid APIs.
 *
 * Data Sources:
 * - NIL Athletes API (RapidAPI): Player valuations, NIL deals
 * - Highlightly API (RapidAPI): Player stats and profiles
 *
 * Cron: Daily at 6 AM Central
 *
 * @author BSI Team
 * @created 2025-01-09
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface Env {
  BSI_DB: D1Database;
  BSI_CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  ENVIRONMENT?: string;
  // Secrets (set via wrangler secret)
  NIL_RAPIDAPI_KEY?: string;
  HIGHLIGHTLY_API_KEY?: string;
}

interface AnalyticsEngineDataset {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

// NIL Athletes API types
interface NILAthleteValuation {
  id: string;
  name: string;
  school: string;
  sport: string;
  position?: string;
  class?: string;
  nilValue?: number;
  nilValueRange?: { low: number; high: number };
  socialFollowing?: {
    total?: number;
    instagram?: number;
    twitter?: number;
    tiktok?: number;
  };
  rankings?: {
    overall?: number;
    position?: number;
    school?: number;
  };
}

interface NILDeal {
  id: string;
  athleteId: string;
  athleteName: string;
  school: string;
  brand: string;
  dealType?: string;
  value?: number;
  valueTier?: string;
  announcedDate?: string;
  status?: string;
  source?: string;
}

// Highlightly API types
interface HighlightlyPlayer {
  id: string;
  name: string;
  team: string;
  position?: string;
  classYear?: string;
  stats?: PlayerStats;
}

interface PlayerStats {
  games?: number;
  atBats?: number;
  hits?: number;
  avg?: number;
  homeRuns?: number;
  rbi?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  // Pitching
  wins?: number;
  losses?: number;
  era?: number;
  innings?: number;
  strikeouts?: number;
  whip?: number;
}

interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  source: string;
  error?: string;
  duration_ms: number;
}

interface SyncMetadata {
  timestamp: string;
  success: boolean;
  recordCount: number;
  source: string;
  duration_ms: number;
}

type HealthStatus = 'healthy' | 'stale' | 'critical' | 'unconfigured';

// =============================================================================
// CONSTANTS
// =============================================================================

const SERVICE_NAME = 'bsi-nil-sync';
const SERVICE_VERSION = '1.0.0';

// RapidAPI endpoints
const NIL_ATHLETES_API_HOST = 'nil-athletes-api.p.rapidapi.com';
const HIGHLIGHTLY_API_HOST = 'highlightly.p.rapidapi.com';

// KV Keys
const KV_KEYS = {
  NIL_VALUATIONS_LAST_SYNC: 'sync:nil:valuations:last-success',
  NIL_VALUATIONS_LAST_ERROR: 'sync:nil:valuations:last-error',
  NIL_VALUATIONS_FAILURES: 'sync:nil:valuations:consecutive-failures',
  NIL_DEALS_LAST_SYNC: 'sync:nil:deals:last-success',
  NIL_DEALS_LAST_ERROR: 'sync:nil:deals:last-error',
  NIL_DEALS_FAILURES: 'sync:nil:deals:consecutive-failures',
  PLAYER_STATS_LAST_SYNC: 'sync:nil:player-stats:last-success',
  PLAYER_STATS_LAST_ERROR: 'sync:nil:player-stats:last-error',
  PLAYER_STATS_FAILURES: 'sync:nil:player-stats:consecutive-failures',
  RATE_LIMIT_PREFIX: 'ratelimit:',
} as const;

// Rate limiting: 5 requests per second for RapidAPI
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

// Staleness thresholds (hours)
const STALENESS_THRESHOLD_STALE = 36;
const STALENESS_THRESHOLD_CRITICAL = 72;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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

function calculateStalenessHours(timestamp: string | null): number {
  if (!timestamp) return Infinity;
  const lastSync = new Date(timestamp);
  const now = new Date();
  return Math.round(((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)) * 10) / 10;
}

function getHealthStatus(stalenessHours: number, hasApiKey: boolean): HealthStatus {
  if (!hasApiKey) return 'unconfigured';
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// RATE LIMITING
// =============================================================================

async function checkRateLimit(env: Env, apiHost: string): Promise<boolean> {
  const key = KV_KEYS.RATE_LIMIT_PREFIX + apiHost;
  const current = await env.BSI_CACHE.get(key);
  const count = current ? parseInt(current, 10) : 0;
  
  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }
  
  await env.BSI_CACHE.put(key, String(count + 1), { expirationTtl: 1 });
  return true;
}

async function waitForRateLimit(env: Env, apiHost: string): Promise<void> {
  let attempts = 0;
  while (attempts < 10) {
    if (await checkRateLimit(env, apiHost)) return;
    await sleep(200);
    attempts++;
  }
  throw new Error('Rate limit exceeded after 10 attempts');
}

// =============================================================================
// SYNC TRACKING
// =============================================================================

async function recordSyncSuccess(
  env: Env,
  type: 'valuations' | 'deals' | 'player-stats',
  metadata: SyncMetadata
): Promise<void> {
  const keyMap = {
    valuations: { success: KV_KEYS.NIL_VALUATIONS_LAST_SYNC, failures: KV_KEYS.NIL_VALUATIONS_FAILURES },
    deals: { success: KV_KEYS.NIL_DEALS_LAST_SYNC, failures: KV_KEYS.NIL_DEALS_FAILURES },
    'player-stats': { success: KV_KEYS.PLAYER_STATS_LAST_SYNC, failures: KV_KEYS.PLAYER_STATS_FAILURES },
  };
  const keys = keyMap[type];
  await Promise.all([
    env.BSI_CACHE.put(keys.success, metadata.timestamp),
    env.BSI_CACHE.put(keys.failures, '0'),
  ]);
}

async function recordSyncFailure(
  env: Env,
  type: 'valuations' | 'deals' | 'player-stats',
  error: string
): Promise<number> {
  const keyMap = {
    valuations: { error: KV_KEYS.NIL_VALUATIONS_LAST_ERROR, failures: KV_KEYS.NIL_VALUATIONS_FAILURES },
    deals: { error: KV_KEYS.NIL_DEALS_LAST_ERROR, failures: KV_KEYS.NIL_DEALS_FAILURES },
    'player-stats': { error: KV_KEYS.PLAYER_STATS_LAST_ERROR, failures: KV_KEYS.PLAYER_STATS_FAILURES },
  };
  const keys = keyMap[type];
  const current = await env.BSI_CACHE.get(keys.failures);
  const newCount = (parseInt(current || '0', 10) || 0) + 1;
  await Promise.all([
    env.BSI_CACHE.put(keys.error, JSON.stringify({ message: error, timestamp: new Date().toISOString() })),
    env.BSI_CACHE.put(keys.failures, String(newCount)),
  ]);
  return newCount;
}

async function getSyncStatus(env: Env, type: 'valuations' | 'deals' | 'player-stats'): Promise<{
  lastSuccess: string | null;
  lastError: string | null;
  consecutiveFailures: number;
}> {
  const keyMap = {
    valuations: { success: KV_KEYS.NIL_VALUATIONS_LAST_SYNC, error: KV_KEYS.NIL_VALUATIONS_LAST_ERROR, failures: KV_KEYS.NIL_VALUATIONS_FAILURES },
    deals: { success: KV_KEYS.NIL_DEALS_LAST_SYNC, error: KV_KEYS.NIL_DEALS_LAST_ERROR, failures: KV_KEYS.NIL_DEALS_FAILURES },
    'player-stats': { success: KV_KEYS.PLAYER_STATS_LAST_SYNC, error: KV_KEYS.PLAYER_STATS_LAST_ERROR, failures: KV_KEYS.PLAYER_STATS_FAILURES },
  };
  const keys = keyMap[type];
  const [lastSuccess, lastError, failures] = await Promise.all([
    env.BSI_CACHE.get(keys.success),
    env.BSI_CACHE.get(keys.error),
    env.BSI_CACHE.get(keys.failures),
  ]);
  return {
    lastSuccess,
    lastError,
    consecutiveFailures: parseInt(failures || '0', 10) || 0,
  };
}

// =============================================================================
// ANALYTICS LOGGING
// =============================================================================

function logSyncEvent(env: Env, dataType: string, success: boolean, recordCount: number, durationMs: number): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [dataType],
      blobs: [success ? 'sync_success' : 'sync_failure', dataType, SERVICE_VERSION],
      doubles: [recordCount, durationMs, success ? 1 : 0, success ? 0 : 1],
    });
  } catch (error) {
    console.error('[analytics] Failed to log:', error);
  }
}

// =============================================================================
// NIL VALUATIONS SYNC
// =============================================================================

async function syncNILValuations(env: Env): Promise<SyncResult> {
  const startTime = Date.now();
  const dataType = 'nil-valuations';
  console.log('[' + dataType + '] Starting sync...');

  if (!env.NIL_RAPIDAPI_KEY) {
    console.log('[' + dataType + '] NIL_RAPIDAPI_KEY not configured');
    return { success: false, inserted: 0, updated: 0, source: 'nil-athletes-api', error: 'API key not configured', duration_ms: Date.now() - startTime };
  }

  try {
    await waitForRateLimit(env, NIL_ATHLETES_API_HOST);

    // Fetch baseball players with NIL valuations
    const response = await fetch('https://nil-athletes-api.p.rapidapi.com/athletes?sport=baseball&level=college', {
      headers: {
        'X-RapidAPI-Key': env.NIL_RAPIDAPI_KEY,
        'X-RapidAPI-Host': NIL_ATHLETES_API_HOST,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('NIL Athletes API returned ' + response.status + ': ' + response.statusText);
    }

    const data = await response.json() as { athletes?: NILAthleteValuation[] };
    const athletes = data.athletes || [];

    if (athletes.length === 0) {
      console.log('[' + dataType + '] No athlete data returned');
      const duration = Date.now() - startTime;
      return { success: true, inserted: 0, updated: 0, source: 'nil-athletes-api', duration_ms: duration };
    }

    const now = new Date().toISOString();
    let inserted = 0;
    let updated = 0;

    // Upsert each athlete valuation
    for (const athlete of athletes) {
      // First, find the player in our database
      const playerMatch = await env.BSI_DB.prepare(
        'SELECT id, team_id FROM college_baseball_players WHERE name LIKE ? LIMIT 1'
      ).bind('%' + athlete.name + '%').first<{ id: string; team_id: string }>();

      if (!playerMatch) continue; // Skip if player not found

      // Check if valuation exists
      const existing = await env.BSI_DB.prepare(
        'SELECT id FROM nil_valuations WHERE player_id = ?'
      ).bind(playerMatch.id).first();

      if (existing) {
        // Update existing
        await env.BSI_DB.prepare(`
          UPDATE nil_valuations SET
            estimated_value = ?,
            value_range_low = ?,
            value_range_high = ?,
            social_following = ?,
            instagram_followers = ?,
            twitter_followers = ?,
            tiktok_followers = ?,
            overall_nil_rank = ?,
            position_nil_rank = ?,
            source = ?,
            last_updated = ?,
            updated_at = ?
          WHERE player_id = ?
        `).bind(
          athlete.nilValue || null,
          athlete.nilValueRange?.low || null,
          athlete.nilValueRange?.high || null,
          athlete.socialFollowing?.total || 0,
          athlete.socialFollowing?.instagram || 0,
          athlete.socialFollowing?.twitter || 0,
          athlete.socialFollowing?.tiktok || 0,
          athlete.rankings?.overall || null,
          athlete.rankings?.position || null,
          'nil-athletes-api',
          now,
          now,
          playerMatch.id
        ).run();
        updated++;
      } else {
        // Insert new
        await env.BSI_DB.prepare(`
          INSERT INTO nil_valuations (
            player_id, team_id, estimated_value, value_range_low, value_range_high,
            social_following, instagram_followers, twitter_followers, tiktok_followers,
            overall_nil_rank, position_nil_rank, source, last_updated, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          playerMatch.id,
          playerMatch.team_id,
          athlete.nilValue || null,
          athlete.nilValueRange?.low || null,
          athlete.nilValueRange?.high || null,
          athlete.socialFollowing?.total || 0,
          athlete.socialFollowing?.instagram || 0,
          athlete.socialFollowing?.twitter || 0,
          athlete.socialFollowing?.tiktok || 0,
          athlete.rankings?.overall || null,
          athlete.rankings?.position || null,
          'nil-athletes-api',
          now,
          now,
          now
        ).run();
        inserted++;
      }

      // Respect rate limits between operations
      if ((inserted + updated) % 5 === 0) {
        await sleep(200);
      }
    }

    const duration = Date.now() - startTime;
    const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: inserted + updated, source: 'nil-athletes-api', duration_ms: duration };
    await recordSyncSuccess(env, 'valuations', metadata);
    logSyncEvent(env, dataType, true, inserted + updated, duration);

    console.log('[' + dataType + '] Completed: ' + inserted + ' inserted, ' + updated + ' updated in ' + duration + 'ms');
    return { success: true, inserted, updated, source: 'nil-athletes-api', duration_ms: duration };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    console.error('[' + dataType + '] Sync failed:', errorMessage);
    await recordSyncFailure(env, 'valuations', errorMessage);
    logSyncEvent(env, dataType, false, 0, duration);
    return { success: false, inserted: 0, updated: 0, source: 'nil-athletes-api', error: errorMessage, duration_ms: duration };
  }
}

// =============================================================================
// NIL DEALS SYNC
// =============================================================================

async function syncNILDeals(env: Env): Promise<SyncResult> {
  const startTime = Date.now();
  const dataType = 'nil-deals';
  console.log('[' + dataType + '] Starting sync...');

  if (!env.NIL_RAPIDAPI_KEY) {
    console.log('[' + dataType + '] NIL_RAPIDAPI_KEY not configured');
    return { success: false, inserted: 0, updated: 0, source: 'nil-athletes-api', error: 'API key not configured', duration_ms: Date.now() - startTime };
  }

  try {
    await waitForRateLimit(env, NIL_ATHLETES_API_HOST);

    // Fetch recent NIL deals
    const response = await fetch('https://nil-athletes-api.p.rapidapi.com/deals?sport=baseball&level=college&limit=100', {
      headers: {
        'X-RapidAPI-Key': env.NIL_RAPIDAPI_KEY,
        'X-RapidAPI-Host': NIL_ATHLETES_API_HOST,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('NIL Athletes API returned ' + response.status + ': ' + response.statusText);
    }

    const data = await response.json() as { deals?: NILDeal[] };
    const deals = data.deals || [];

    if (deals.length === 0) {
      console.log('[' + dataType + '] No deals data returned');
      const duration = Date.now() - startTime;
      return { success: true, inserted: 0, updated: 0, source: 'nil-athletes-api', duration_ms: duration };
    }

    const now = new Date().toISOString();
    let inserted = 0;
    let updated = 0;

    for (const deal of deals) {
      // Find matching player
      const playerMatch = await env.BSI_DB.prepare(
        'SELECT id, team_id FROM college_baseball_players WHERE name LIKE ? LIMIT 1'
      ).bind('%' + deal.athleteName + '%').first<{ id: string; team_id: string }>();

      if (!playerMatch) continue;

      // Check if deal exists (by external ID)
      const existing = await env.BSI_DB.prepare(
        'SELECT id FROM nil_deals WHERE id = ?'
      ).bind(deal.id).first();

      if (existing) {
        // Update
        await env.BSI_DB.prepare(`
          UPDATE nil_deals SET
            brand_name = ?, deal_type = ?, deal_value = ?, deal_value_tier = ?,
            status = ?, source = ?, updated_at = ?
          WHERE id = ?
        `).bind(
          deal.brand,
          deal.dealType || 'endorsement',
          deal.value || null,
          deal.valueTier || null,
          deal.status || 'active',
          'nil-athletes-api',
          now,
          deal.id
        ).run();
        updated++;
      } else {
        // Insert
        await env.BSI_DB.prepare(`
          INSERT INTO nil_deals (
            id, player_id, team_id, brand_name, deal_type, deal_value, deal_value_tier,
            announced_date, status, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          deal.id,
          playerMatch.id,
          playerMatch.team_id,
          deal.brand,
          deal.dealType || 'endorsement',
          deal.value || null,
          deal.valueTier || null,
          deal.announcedDate || now,
          deal.status || 'active',
          'nil-athletes-api',
          now,
          now
        ).run();
        inserted++;
      }

      if ((inserted + updated) % 5 === 0) await sleep(200);
    }

    const duration = Date.now() - startTime;
    const metadata: SyncMetadata = { timestamp: now, success: true, recordCount: inserted + updated, source: 'nil-athletes-api', duration_ms: duration };
    await recordSyncSuccess(env, 'deals', metadata);
    logSyncEvent(env, dataType, true, inserted + updated, duration);

    console.log('[' + dataType + '] Completed: ' + inserted + ' inserted, ' + updated + ' updated in ' + duration + 'ms');
    return { success: true, inserted, updated, source: 'nil-athletes-api', duration_ms: duration };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    console.error('[' + dataType + '] Sync failed:', errorMessage);
    await recordSyncFailure(env, 'deals', errorMessage);
    logSyncEvent(env, dataType, false, 0, duration);
    return { success: false, inserted: 0, updated: 0, source: 'nil-athletes-api', error: errorMessage, duration_ms: duration };
  }
}

// =============================================================================
// REQUEST HANDLERS
// =============================================================================

async function handleHealth(env: Env): Promise<Response> {
  const [valStatus, dealStatus] = await Promise.all([
    getSyncStatus(env, 'valuations'),
    getSyncStatus(env, 'deals'),
  ]);

  const hasApiKey = !!env.NIL_RAPIDAPI_KEY;
  const valStaleness = calculateStalenessHours(valStatus.lastSuccess);
  const dealStaleness = calculateStalenessHours(dealStatus.lastSuccess);
  const overallStaleness = Math.max(valStaleness, dealStaleness);

  const overallStatus = getHealthStatus(overallStaleness, hasApiKey);

  const response = {
    status: overallStatus,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    api_configured: hasApiKey,
    details: {
      valuations: {
        status: getHealthStatus(valStaleness, hasApiKey),
        staleness_hours: isFinite(valStaleness) ? valStaleness : -1,
        last_sync: valStatus.lastSuccess,
        consecutive_failures: valStatus.consecutiveFailures,
      },
      deals: {
        status: getHealthStatus(dealStaleness, hasApiKey),
        staleness_hours: isFinite(dealStaleness) ? dealStaleness : -1,
        last_sync: dealStatus.lastSuccess,
        consecutive_failures: dealStatus.consecutiveFailures,
      },
    },
  };

  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'unconfigured' ? 503 : 200;
  return jsonResponse(response, httpStatus);
}

async function handleStatus(env: Env): Promise<Response> {
  const [valStatus, dealStatus, valCount, dealCount] = await Promise.all([
    getSyncStatus(env, 'valuations'),
    getSyncStatus(env, 'deals'),
    env.BSI_DB.prepare('SELECT COUNT(*) as count FROM nil_valuations').first<{ count: number }>().catch(() => ({ count: 0 })),
    env.BSI_DB.prepare('SELECT COUNT(*) as count FROM nil_deals').first<{ count: number }>().catch(() => ({ count: 0 })),
  ]);

  const valStaleness = calculateStalenessHours(valStatus.lastSuccess);
  const dealStaleness = calculateStalenessHours(dealStatus.lastSuccess);
  const hasApiKey = !!env.NIL_RAPIDAPI_KEY;

  return jsonResponse({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    api_configured: hasApiKey,
    valuations: {
      lastSync: valStatus.lastSuccess,
      timeSinceSync: formatTimeSinceSync(valStaleness),
      recordCount: valCount?.count || 0,
      healthStatus: getHealthStatus(valStaleness, hasApiKey),
      consecutiveFailures: valStatus.consecutiveFailures,
    },
    deals: {
      lastSync: dealStatus.lastSuccess,
      timeSinceSync: formatTimeSinceSync(dealStaleness),
      recordCount: dealCount?.count || 0,
      healthStatus: getHealthStatus(dealStaleness, hasApiKey),
      consecutiveFailures: dealStatus.consecutiveFailures,
    },
  });
}

async function handleSyncAll(env: Env): Promise<Response> {
  const startTime = Date.now();

  const [valResult, dealResult] = await Promise.all([
    syncNILValuations(env),
    syncNILDeals(env),
  ]);

  const response = {
    success: valResult.success && dealResult.success,
    total_duration_ms: Date.now() - startTime,
    results: { valuations: valResult, deals: dealResult },
  };

  return jsonResponse(response, response.success ? 200 : 207);
}

async function handleGetValuations(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const team = url.searchParams.get('team');
  const minValue = url.searchParams.get('min_value');

  let query = `
    SELECT v.*, p.name as player_name, p.position, p.class_year, t.name as team_name
    FROM nil_valuations v
    JOIN college_baseball_players p ON v.player_id = p.id
    JOIN college_baseball_teams t ON v.team_id = t.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (team) {
    query += ' AND (t.abbreviation = ? OR t.name LIKE ?)';
    params.push(team.toUpperCase(), '%' + team + '%');
  }
  if (minValue) {
    query += ' AND v.estimated_value >= ?';
    params.push(parseInt(minValue, 10));
  }

  query += ' ORDER BY v.estimated_value DESC NULLS LAST LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const result = await env.BSI_DB.prepare(query).bind(...params).all();
    return jsonResponse({
      success: true,
      count: result.results?.length || 0,
      valuations: result.results || [],
    });
  } catch (error) {
    return jsonResponse({ success: false, error: 'NIL tables not found. Run migration 006_nil_tables.sql first.' }, 500);
  }
}

async function handleGetDeals(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const team = url.searchParams.get('team');
  const status = url.searchParams.get('status') || 'active';

  let query = `
    SELECT d.*, p.name as player_name, p.position, t.name as team_name
    FROM nil_deals d
    JOIN college_baseball_players p ON d.player_id = p.id
    JOIN college_baseball_teams t ON d.team_id = t.id
    WHERE d.status = ?
  `;
  const params: (string | number)[] = [status];

  if (team) {
    query += ' AND (t.abbreviation = ? OR t.name LIKE ?)';
    params.push(team.toUpperCase(), '%' + team + '%');
  }

  query += ' ORDER BY d.announced_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const result = await env.BSI_DB.prepare(query).bind(...params).all();
    return jsonResponse({
      success: true,
      count: result.results?.length || 0,
      deals: result.results || [],
    });
  } catch (error) {
    return jsonResponse({ success: false, error: 'NIL tables not found. Run migration 006_nil_tables.sql first.' }, 500);
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
      if (path === '/sync/all' && method === 'POST') return handleSyncAll(env);
      if (path === '/sync/valuations' && method === 'POST') {
        const result = await syncNILValuations(env);
        return jsonResponse(result, result.success ? 200 : 500);
      }
      if (path === '/sync/deals' && method === 'POST') {
        const result = await syncNILDeals(env);
        return jsonResponse(result, result.success ? 200 : 500);
      }
      if (path === '/valuations' && method === 'GET') return handleGetValuations(env, url);
      if (path === '/deals' && method === 'GET') return handleGetDeals(env, url);

      if (path === '/' && method === 'GET') {
        return jsonResponse({
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          description: 'NIL (Name, Image, Likeness) data pipeline for college baseball',
          api_configured: !!env.NIL_RAPIDAPI_KEY,
          endpoints: {
            'GET /health': 'Service health check',
            'GET /status': 'Detailed sync status',
            'POST /sync/all': 'Sync all NIL data',
            'POST /sync/valuations': 'Sync player valuations',
            'POST /sync/deals': 'Sync NIL deals',
            'GET /valuations': 'Get player valuations (params: limit, offset, team, min_value)',
            'GET /deals': 'Get NIL deals (params: limit, offset, team, status)',
          },
          data_sources: {
            valuations: 'NIL Athletes API (RapidAPI)',
            deals: 'NIL Athletes API (RapidAPI)',
          },
          cron: 'Daily at 6 AM Central',
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

    const [valResult, dealResult] = await Promise.allSettled([
      syncNILValuations(env),
      syncNILDeals(env),
    ]);

    const results = {
      valuations: valResult.status === 'fulfilled' ? valResult.value : { success: false, error: String(valResult.reason) },
      deals: dealResult.status === 'fulfilled' ? dealResult.value : { success: false, error: String(dealResult.reason) },
    };

    const successCount = [valResult, dealResult].filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log('[' + SERVICE_NAME + '] Scheduled sync complete: ' + successCount + '/2 succeeded');
    console.log('[' + SERVICE_NAME + '] Results:', JSON.stringify(results, null, 2));
  },
};
