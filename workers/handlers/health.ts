import type { Env } from '../shared/types';
import { json, getCollegeClient } from '../shared/helpers';
import { getScoreboard } from '../../lib/api-clients/espn-api';

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

export async function handleAdminErrors(url: URL, env: Env): Promise<Response> {
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
