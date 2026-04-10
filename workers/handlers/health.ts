import type { Env } from '../shared/types';
import { json, getCollegeClient } from '../shared/helpers';
import { getScoreboard } from '../../lib/api-clients/espn-api';
import { timingSafeCompare } from '../shared/auth';

const LIST_PAGE_SIZE = 1000;
const MAX_LIST_ROUNDS = 10;

export function handleHealth(env: Env): Response {
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION ?? '1.0.0',
    environment: env.ENVIRONMENT ?? 'production',
    mode: 'hybrid-worker',
  });
}

export async function handleAdminHealth(env: Env): Promise<Response> {
  const checks: Record<string, unknown> = {};

  // KV check (read-only — avoids write cost on every health poll)
  try {
    await env.KV.get('health:check');
    checks.kv = { status: 'healthy' };
  } catch (e) {
    checks.kv = { status: 'unhealthy', error: e instanceof Error ? e.message : 'Unknown' };
  }

  // D1 check
  try {
    const result = await env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
    checks.d1 = { status: result?.ok === 1 ? 'healthy' : 'degraded' };
  } catch (e) {
    checks.d1 = { status: 'unhealthy', error: e instanceof Error ? e.message : 'Unknown' };
  }

  // NCAA API check (college baseball)
  try {
    const ncaaClient = getCollegeClient();
    const ncaaHealth = await ncaaClient.healthCheck();
    checks.ncaa = {
      status: ncaaHealth.healthy ? 'healthy' : 'unhealthy',
      latency_ms: ncaaHealth.latencyMs,
    };
  } catch (e) {
    checks.ncaa = {
      status: 'unhealthy',
      error: e instanceof Error ? e.message : 'Unknown',
    };
  }

  // ESPN check (pro sports — lightweight scoreboard ping)
  for (const sport of ['mlb', 'nfl', 'nba'] as const) {
    const startMs = Date.now();
    try {
      await getScoreboard(sport);
      checks[`espn_${sport}`] = {
        status: 'healthy',
        latency_ms: Date.now() - startMs,
      };
    } catch (e) {
      checks[`espn_${sport}`] = {
        status: 'unhealthy',
        latency_ms: Date.now() - startMs,
        error: e instanceof Error ? e.message : 'Unknown',
      };
    }
  }

  // Error count (last 24h) — reads from ERROR_LOG if available, falls back to KV
  try {
    const errorKv = env.ERROR_LOG ?? env.KV;
    const errorList = await errorKv.list({ prefix: 'err:' });
    checks.recentErrors = errorList.keys.length;
  } catch {
    checks.recentErrors = -1;
  }

  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks,
  });
}

/**
 * Public system status — merges synthetic monitor results with the daily
 * freshness audit for a more accurate picture. Serves:
 *   - the public /status page
 *   - the footer HealthDot on every page
 *   - any external status consumers
 *
 * GET /api/status
 *
 * Why two sources: the synthetic monitor is a 5-minute endpoint-pinger that
 * captures one snapshot per run; a single network blip can flip `allHealthy`
 * to false and display "Major Outage" even though the product is fine. The
 * freshness audit runs once per day on a KV-gated cron and represents the
 * state of actual data pipelines + upstream APIs + satellite cron workers.
 *
 * The merged `overall` status only degrades the product when BOTH signals
 * agree (or when the freshness audit itself reports stale/missing data).
 * This eliminates the "Major Outage on a clean deploy" false positive.
 */
export async function handleStatus(env: Env): Promise<Response> {
  const timestamp = new Date().toISOString();

  if (!env.MONITOR_KV && !env.KV) {
    return json({
      status: 'unknown',
      message: 'No monitoring infrastructure configured',
      timestamp,
    });
  }

  try {
    // Read both snapshots in parallel.
    const [syntheticRaw, freshnessRaw] = await Promise.all([
      env.MONITOR_KV ? env.MONITOR_KV.get('summary:latest', 'text') : Promise.resolve(null),
      env.KV.get('freshness:daily:latest', 'text'),
    ]);

    let synthetic: {
      timestamp?: string;
      results?: Array<{ name?: string; ok?: boolean; status?: number | string; latencyMs?: number }>;
      allHealthy?: boolean;
      driftDetected?: boolean;
    } | null = null;
    if (syntheticRaw) {
      try { synthetic = JSON.parse(syntheticRaw); } catch { /* malformed — ignore */ }
    }

    interface FreshnessSnapshot {
      ranAt: string;
      summary: { fresh: number; stale: number; degraded: number; missing: number; total: number };
      liveEndpoints: Array<{ status: string }>;
      d1Tables: Array<{ status: string }>;
      upstream?: Array<{ provider: string; status: string; optional?: boolean }>;
      cronHealth?: { workers: Record<string, { status: string }> };
    }

    let freshness: FreshnessSnapshot | null = null;
    if (freshnessRaw) {
      try { freshness = JSON.parse(freshnessRaw); } catch { /* malformed — ignore */ }
    }

    // --- Compute overall status from both signals ---
    //
    // Synthetic monitor signal: `syntheticHealthy` true when allHealthy true
    // or when no results have failed. If synthetic has no data yet, this is
    // null (unknown), not false.
    let syntheticHealthy: boolean | null = null;
    if (synthetic) {
      if (typeof synthetic.allHealthy === 'boolean') {
        syntheticHealthy = synthetic.allHealthy;
      } else if (Array.isArray(synthetic.results)) {
        syntheticHealthy = synthetic.results.every((r) => r.ok === true);
      }
    }

    // Freshness signal: true when 0 stale and 0 missing (optional upstreams
    // already excluded from summary counts in freshness.ts). Null when no
    // audit has run yet.
    let freshnessHealthy: boolean | null = null;
    if (freshness && freshness.summary) {
      freshnessHealthy =
        (freshness.summary.stale || 0) === 0 &&
        (freshness.summary.missing || 0) === 0;
    }

    // Merged overall: prefer freshness audit (authoritative) when both
    // signals exist and disagree. A single synthetic monitor hiccup no
    // longer shows red if the freshness audit says everything is clean.
    let overall: 'healthy' | 'degraded' | 'down' | 'unknown';
    if (freshnessHealthy === true && syntheticHealthy !== false) {
      overall = 'healthy';
    } else if (freshnessHealthy === false) {
      // Freshness says something is actually broken — trust it and surface.
      overall = (freshness!.summary.missing > 0) ? 'down' : 'degraded';
    } else if (syntheticHealthy === true) {
      // No freshness data yet, synthetic says healthy.
      overall = 'healthy';
    } else if (syntheticHealthy === false) {
      // Only synthetic says degraded, freshness is unknown. Don't claim
      // 'down' on a single synthetic blip — use 'degraded' as the floor.
      overall = 'degraded';
    } else {
      overall = 'unknown';
    }

    // --- Enrich with data pipeline freshness (legacy D1 fields) ---
    const pipelines: Record<string, unknown> = {};
    if (env.DB) {
      try {
        const havfCount = await env.DB.prepare('SELECT COUNT(*) as cnt, MAX(computed_at) as latest FROM havf_scores WHERE season = 2026').first<{ cnt: number; latest: string }>();
        pipelines.havf = { players: havfCount?.cnt ?? 0, latest: havfCount?.latest ?? null };
      } catch { /* table may not exist */ }
      try {
        const editorialCount = await env.DB.prepare('SELECT COUNT(*) as cnt, MAX(date) as latest FROM editorials').first<{ cnt: number; latest: string }>();
        pipelines.editorials = { articles: editorialCount?.cnt ?? 0, latest: editorialCount?.latest ?? null };
      } catch { /* table may not exist */ }
      try {
        const mmiCount = await env.DB.prepare('SELECT COUNT(*) as cnt, MAX(game_date) as latest FROM mmi_game_summary').first<{ cnt: number; latest: string }>();
        pipelines.mmi = { games: mmiCount?.cnt ?? 0, latest: mmiCount?.latest ?? null };
      } catch { /* table may not exist */ }
    }

    // --- Public freshness summary (sanitized — no per-key details) ---
    const publicFreshness = freshness ? {
      ranAt: freshness.ranAt,
      summary: freshness.summary,
      upstream: (freshness.upstream || [])
        .filter((u) => !u.optional)
        .map((u) => ({ provider: u.provider, status: u.status })),
      cronWorkers: freshness.cronHealth
        ? Object.entries(freshness.cronHealth.workers).map(([name, w]) => ({ name, status: w.status }))
        : [],
    } : null;

    return json({
      overall,
      timestamp,
      // Legacy fields from synthetic monitor for backward compat with the
      // existing status page + HealthDot parsing.
      allHealthy: syntheticHealthy,
      results: synthetic?.results || [],
      driftDetected: synthetic?.driftDetected || false,
      // New fields — powered by the daily freshness audit.
      freshness: publicFreshness,
      pipelines,
      meta: {
        source: 'bsi-status-merged',
        fetched_at: timestamp,
        timezone: 'America/Chicago',
        sources: {
          synthetic: synthetic?.timestamp || null,
          freshness: freshness?.ranAt || null,
        },
      },
    });
  } catch (err) {
    return json({
      status: 'error',
      error: err instanceof Error ? err.message : 'Failed to read status data',
      timestamp,
    }, 500);
  }
}

export async function handleAdminErrors(url: URL, env: Env): Promise<Response> {
  try {
    const errorKv = env.ERROR_LOG ?? env.KV;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);
    const dateFilter = url.searchParams.get('date') ?? '';

    const listResult = await errorKv.list({ prefix: 'err:', limit: 1000 });

    const errors: unknown[] = [];
    for (const key of listResult.keys) {
      if (errors.length >= limit) break;
      const raw = await errorKv.get(key.name, 'text');
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw);
        if (dateFilter && entry.timestamp && !entry.timestamp.startsWith(dateFilter)) continue;
        errors.push({ key: key.name, ...entry });
      } catch {
        errors.push({ key: key.name, raw });
      }
    }

    return json({
      errors,
      count: errors.length,
      total_keys: listResult.keys.length,
      has_more: !listResult.list_complete,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[handleAdminErrors]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export function handleWebSocket(): Response {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  const interval = setInterval(() => {
    if (server.readyState === WebSocket.OPEN) {
      server.send(
        JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })
      );
    } else {
      clearInterval(interval);
    }
  }, 5000);

  server.addEventListener('close', () => clearInterval(interval));
  server.addEventListener('error', () => clearInterval(interval));

  server.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      if (data.type === 'ping') server.send(JSON.stringify({ type: 'pong' }));
    } catch {
      /* ignore malformed messages */
    }
  });

  return new Response(null, { status: 101, webSocket: client });
}

interface KVListResult {
  keys: { name: string; expiration?: number; metadata?: unknown }[];
  list_complete: boolean;
  cursor?: string;
}

async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (!env.ADMIN_KEY) {
    return json({ error: 'Admin auth secret not configured' }, 500);
  }

  const auth = request.headers.get('Authorization');
  const headerKey = request.headers.get('X-Admin-Key');
  const queryKey = new URL(request.url).searchParams.get('key');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  const provided = bearer || headerKey || queryKey;

  if (!provided || !(await timingSafeCompare(provided, env.ADMIN_KEY))) {
    return json({ error: 'Unauthorized' }, 401);
  }

  return null;
}

async function paginateKVList(
  kv: KVNamespace,
  prefix?: string,
): Promise<{ keys: string[]; rounds: number; complete: boolean }> {
  const allKeys: string[] = [];
  let cursor: string | undefined;
  let rounds = 0;

  do {
    rounds += 1;
    const result = await (kv.list as (opts: Record<string, unknown>) => Promise<KVListResult>)({
      limit: LIST_PAGE_SIZE,
      ...(prefix ? { prefix } : {}),
      ...(cursor ? { cursor } : {}),
    });

    for (const key of result.keys) {
      allKeys.push(key.name);
    }

    if (result.list_complete) break;
    cursor = result.cursor;
  } while (cursor && rounds < MAX_LIST_ROUNDS);

  return { keys: allKeys, rounds, complete: rounds < MAX_LIST_ROUNDS };
}

async function paginateR2List(
  bucket: R2Bucket,
  prefix?: string,
): Promise<{ objects: { key: string; size: number }[]; rounds: number; complete: boolean }> {
  const allObjects: { key: string; size: number }[] = [];
  let cursor: string | undefined;
  let rounds = 0;

  do {
    rounds += 1;
    const result = await bucket.list({
      limit: LIST_PAGE_SIZE,
      ...(prefix ? { prefix } : {}),
      ...(cursor ? { cursor } : {}),
    });

    for (const object of result.objects) {
      allObjects.push({ key: object.key, size: object.size });
    }

    if (!result.truncated) break;
    cursor = result.cursor;
  } while (cursor && rounds < MAX_LIST_ROUNDS);

  return { objects: allObjects, rounds, complete: rounds < MAX_LIST_ROUNDS };
}

export async function handleSemanticHealth(request: Request, env: Env): Promise<Response> {
  try {
    const authError = await requireAdmin(request, env);
    if (authError) return authError;

    const kvResult = await paginateKVList(env.KV);
    const r2Result = env.DATA_LAKE
      ? await paginateR2List(env.DATA_LAKE, 'snapshots/')
      : { objects: [], rounds: 0, complete: true };

    return json({
      timestamp: new Date().toISOString(),
      note: 'KV listing is eventually consistent (~60s)',
      kv: {
        totalKeys: kvResult.keys.length,
        rounds: kvResult.rounds,
        complete: kvResult.complete,
        keys: kvResult.keys,
      },
      r2: {
        totalObjects: r2Result.objects.length,
        rounds: r2Result.rounds,
        complete: r2Result.complete,
        objects: r2Result.objects,
      },
    });
  } catch (err) {
    console.error('[handleSemanticHealth]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}
