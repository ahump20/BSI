/**
 * BSI Health Check Endpoints
 * Provides health status for internal services.
 */

export interface Env {
  DB?: D1Database;
  GAME_DB?: D1Database;
  KV?: KVNamespace;
  BSI_CACHE?: KVNamespace;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
  timestamp: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const route = (params.route as string[]) || [];
  const url = new URL(request.url);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const endpoint = route[0];

  try {
    switch (endpoint) {
      case 'd1':
        return checkD1Health(env, headers);

      case 'kv': {
        const ns = url.searchParams.get('ns') || 'cache';
        return checkKVHealth(env, ns, headers);
      }

      case 'monitor':
        return checkMonitorHealth(headers);

      case 'analytics':
        return checkAnalyticsHealth(headers);

      default:
        return new Response(
          JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            endpoints: [
              '/api/health/d1',
              '/api/health/kv',
              '/api/health/monitor',
              '/api/health/analytics',
            ],
          }),
          { status: 200, headers }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        status: 'down',
        message,
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: 503, headers }
    );
  }
};

async function checkD1Health(env: Env, headers: Record<string, string>): Promise<Response> {
  const db = env.GAME_DB || env.DB;

  if (!db) {
    return new Response(
      JSON.stringify({
        status: 'down',
        message: 'D1 database not configured',
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: 503, headers }
    );
  }

  const start = Date.now();

  try {
    await db.prepare('SELECT 1').first();
    const latency = Date.now() - start;

    const status: HealthResponse['status'] = latency > 500 ? 'degraded' : 'healthy';

    return new Response(
      JSON.stringify({
        status,
        latency,
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: status === 'healthy' ? 200 : 207, headers }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Query failed';
    return new Response(
      JSON.stringify({
        status: 'down',
        latency: Date.now() - start,
        message,
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: 503, headers }
    );
  }
}

async function checkKVHealth(
  env: Env,
  namespace: string,
  headers: Record<string, string>
): Promise<Response> {
  const kv = namespace === 'sessions' ? env.KV : env.BSI_CACHE;

  if (!kv) {
    return new Response(
      JSON.stringify({
        status: 'down',
        message: `KV namespace '${namespace}' not configured`,
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: 503, headers }
    );
  }

  const start = Date.now();
  const testKey = `_health_check_${Date.now()}`;

  try {
    await kv.put(testKey, 'ok', { expirationTtl: 60 });
    const value = await kv.get(testKey);
    await kv.delete(testKey);

    const latency = Date.now() - start;

    if (value !== 'ok') {
      return new Response(
        JSON.stringify({
          status: 'degraded',
          latency,
          message: 'Read/write verification failed',
          timestamp: new Date().toISOString(),
        } satisfies HealthResponse),
        { status: 207, headers }
      );
    }

    const status: HealthResponse['status'] = latency > 200 ? 'degraded' : 'healthy';

    return new Response(
      JSON.stringify({
        status,
        latency,
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: status === 'healthy' ? 200 : 207, headers }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'KV operation failed';
    return new Response(
      JSON.stringify({
        status: 'down',
        latency: Date.now() - start,
        message,
        timestamp: new Date().toISOString(),
      } satisfies HealthResponse),
      { status: 503, headers }
    );
  }
}

function checkMonitorHealth(headers: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    } satisfies HealthResponse),
    { status: 200, headers }
  );
}

function checkAnalyticsHealth(headers: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    } satisfies HealthResponse),
    { status: 200, headers }
  );
}
