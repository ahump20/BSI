/**
 * BSI Aggregated Health Check Endpoint
 * Returns overall system health status with service breakdown.
 */

export interface Env {
  DB?: D1Database;
  GAME_DB?: D1Database;
  KV?: KVNamespace;
  BSI_CACHE?: KVNamespace;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

interface HealthzResponse {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  colo: string;
  region: string;
  timestamp: string;
  services: {
    d1: ServiceHealth;
    kv: ServiceHealth;
  };
}

const VERSION = '1.0.0';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  const colo = (request as Request & { cf?: { colo?: string } }).cf?.colo ?? 'unknown';
  const region = (request as Request & { cf?: { region?: string } }).cf?.region ?? 'unknown';

  const [d1Health, kvHealth] = await Promise.all([checkD1(env), checkKV(env)]);

  const services = { d1: d1Health, kv: kvHealth };
  const statuses = Object.values(services).map((s) => s.status);

  let overallStatus: HealthzResponse['status'] = 'healthy';
  if (statuses.includes('down')) {
    overallStatus = 'down';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }

  const response: HealthzResponse = {
    ok: overallStatus === 'healthy',
    status: overallStatus,
    version: VERSION,
    colo,
    region,
    timestamp: new Date().toISOString(),
    services,
  };

  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

  return new Response(JSON.stringify(response), {
    status: httpStatus,
    headers,
  });
};

async function checkD1(env: Env): Promise<ServiceHealth> {
  const db = env.GAME_DB || env.DB;

  if (!db) {
    return { status: 'down', message: 'D1 database not configured' };
  }

  const start = Date.now();
  try {
    await db.prepare('SELECT 1').first();
    const latency = Date.now() - start;
    return {
      status: latency > 500 ? 'degraded' : 'healthy',
      latency,
    };
  } catch (error: unknown) {
    return {
      status: 'down',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'D1 query failed',
    };
  }
}

async function checkKV(env: Env): Promise<ServiceHealth> {
  const kv = env.BSI_CACHE || env.KV;

  if (!kv) {
    return { status: 'down', message: 'KV namespace not configured' };
  }

  const start = Date.now();
  const testKey = `_healthz_${Date.now()}`;

  try {
    await kv.put(testKey, 'ok', { expirationTtl: 60 });
    const value = await kv.get(testKey);
    await kv.delete(testKey);

    const latency = Date.now() - start;

    if (value !== 'ok') {
      return { status: 'degraded', latency, message: 'KV read/write mismatch' };
    }

    return {
      status: latency > 200 ? 'degraded' : 'healthy',
      latency,
    };
  } catch (error: unknown) {
    return {
      status: 'down',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'KV operation failed',
    };
  }
}
