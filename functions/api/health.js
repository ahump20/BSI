/**
 * Comprehensive health check endpoint with full dependency monitoring
 * GET /api/health
 *
 * Tests all external APIs and Cloudflare bindings:
 * - MLB Stats API (public)
 * - ESPN APIs (NFL, NBA, NCAA - public)
 * - SportsDataIO (requires SPORTSDATAIO_API_KEY)
 * - CFBD (requires CFBDATA_API_KEY)
 * - Cloudflare KV, D1, R2, Workers AI, Vectorize
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

// ESPN requires User-Agent header to avoid 403
const ESPN_HEADERS = {
  'User-Agent': 'BlazeSportsIntel/2.1.0 (https://blazesportsintel.com)',
  Accept: 'application/json',
};

export async function onRequest(context) {
  const { request, env } = context;

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 200 requests per minute per IP (higher threshold for health checks)
  const limit = await rateLimit(env, request, 200, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const startTime = Date.now();

  // Initialize health response
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'Blaze Sports Intel',
    version: '2.2.0',
    environment: env.ENVIRONMENT || 'production',
    responseTime: null,
    checks: [],
    secrets: {},
  };

  // ========================================
  // PUBLIC APIs (No Auth Required)
  // ========================================

  // Check MLB Stats API
  await checkService(health, {
    service: 'MLB Stats API',
    category: 'sports-data',
    fn: async () => {
      const response = await fetch('https://statsapi.mlb.com/api/v1/teams/138', {
        signal: AbortSignal.timeout(5000),
      });
      return { ok: response.ok, statusCode: response.status };
    },
  });

  // Check ESPN NFL API
  await checkService(health, {
    service: 'ESPN NFL',
    category: 'sports-data',
    fn: async () => {
      const response = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/10',
        { headers: ESPN_HEADERS, signal: AbortSignal.timeout(5000) }
      );
      return { ok: response.ok, statusCode: response.status };
    },
  });

  // Check ESPN NBA API
  await checkService(health, {
    service: 'ESPN NBA',
    category: 'sports-data',
    fn: async () => {
      const response = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/29',
        { headers: ESPN_HEADERS, signal: AbortSignal.timeout(5000) }
      );
      return { ok: response.ok, statusCode: response.status };
    },
  });

  // Check ESPN NCAA Football API
  await checkService(health, {
    service: 'ESPN NCAA Football',
    category: 'sports-data',
    fn: async () => {
      const response = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/251',
        { headers: ESPN_HEADERS, signal: AbortSignal.timeout(5000) }
      );
      return { ok: response.ok, statusCode: response.status };
    },
  });

  // Check ESPN College Baseball API
  await checkService(health, {
    service: 'ESPN College Baseball',
    category: 'sports-data',
    fn: async () => {
      const response = await fetch(
        'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams',
        { headers: ESPN_HEADERS, signal: AbortSignal.timeout(5000) }
      );
      return { ok: response.ok, statusCode: response.status };
    },
  });

  // ========================================
  // AUTHENTICATED APIs (Require Secrets)
  // ========================================

  // Check SportsDataIO
  const sportsdataKey = env.SPORTSDATAIO_API_KEY || env.SPORTSDATAIO_KEY;
  health.secrets.SPORTSDATAIO_API_KEY = Boolean(sportsdataKey);

  if (sportsdataKey) {
    await checkService(health, {
      service: 'SportsDataIO',
      category: 'sports-data',
      fn: async () => {
        const response = await fetch(
          `https://api.sportsdata.io/v3/nfl/scores/json/Teams?key=${sportsdataKey}`,
          { signal: AbortSignal.timeout(5000) }
        );
        return { ok: response.ok, statusCode: response.status };
      },
    });
  } else {
    health.checks.push({
      service: 'SportsDataIO',
      category: 'sports-data',
      status: 'skipped',
      reason: 'SPORTSDATAIO_API_KEY not configured',
    });
  }

  // Check CFBD
  const cfbdKey = env.CFBDATA_API_KEY || env.COLLEGEFOOTBALLDATA_API_KEY;
  health.secrets.CFBDATA_API_KEY = Boolean(cfbdKey);

  if (cfbdKey) {
    await checkService(health, {
      service: 'College Football Data',
      category: 'sports-data',
      fn: async () => {
        const response = await fetch('https://api.collegefootballdata.com/teams?conference=SEC', {
          headers: { Authorization: `Bearer ${cfbdKey}` },
          signal: AbortSignal.timeout(5000),
        });
        return { ok: response.ok, statusCode: response.status };
      },
    });
  } else {
    health.checks.push({
      service: 'College Football Data',
      category: 'sports-data',
      status: 'skipped',
      reason: 'CFBDATA_API_KEY not configured',
    });
  }

  // ========================================
  // CLOUDFLARE BINDINGS
  // ========================================

  // Check KV Namespace
  const kvBinding = env.KV || env.KV_CACHE || env.NIL_CACHE;
  health.secrets.KV_BINDING = Boolean(kvBinding);

  if (kvBinding) {
    await checkService(health, {
      service: 'Cloudflare KV',
      category: 'cloudflare',
      fn: async () => {
        const testKey = '__health_check__';
        const testValue = Date.now().toString();
        await kvBinding.put(testKey, testValue, { expirationTtl: 60 });
        const retrieved = await kvBinding.get(testKey);
        return { ok: retrieved === testValue, statusCode: retrieved ? 200 : 500 };
      },
    });
  } else {
    health.checks.push({
      service: 'Cloudflare KV',
      category: 'cloudflare',
      status: 'skipped',
      reason: 'KV binding not available',
    });
  }

  // Check D1 Database
  const dbBinding = env.DB || env.NIL_DB;
  health.secrets.D1_BINDING = Boolean(dbBinding);

  if (dbBinding) {
    await checkService(health, {
      service: 'Cloudflare D1',
      category: 'cloudflare',
      fn: async () => {
        const result = await dbBinding.prepare('SELECT 1 as test').first();
        return { ok: result?.test === 1, statusCode: result ? 200 : 500 };
      },
    });
  } else {
    health.checks.push({
      service: 'Cloudflare D1',
      category: 'cloudflare',
      status: 'skipped',
      reason: 'D1 binding not available',
    });
  }

  // Check R2 Bucket
  const r2Binding = env.SPORTS_DATA || env.NIL_ARCHIVE;
  health.secrets.R2_BINDING = Boolean(r2Binding);

  if (r2Binding) {
    await checkService(health, {
      service: 'Cloudflare R2',
      category: 'cloudflare',
      fn: async () => {
        const list = await r2Binding.list({ limit: 1 });
        return { ok: Array.isArray(list.objects), statusCode: 200 };
      },
    });
  } else {
    health.checks.push({
      service: 'Cloudflare R2',
      category: 'cloudflare',
      status: 'skipped',
      reason: 'R2 binding not available',
    });
  }

  // Check Workers AI
  health.secrets.AI_BINDING = Boolean(env.AI);

  if (env.AI) {
    await checkService(health, {
      service: 'Workers AI',
      category: 'cloudflare',
      fn: async () => {
        // Simple embedding test - minimal compute
        const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: 'health check',
        });
        return { ok: result?.data?.length > 0, statusCode: 200 };
      },
    });
  } else {
    health.checks.push({
      service: 'Workers AI',
      category: 'cloudflare',
      status: 'skipped',
      reason: 'AI binding not available',
    });
  }

  // Check Vectorize
  health.secrets.VECTORIZE_BINDING = Boolean(env.VECTORIZE);

  if (env.VECTORIZE) {
    await checkService(health, {
      service: 'Cloudflare Vectorize',
      category: 'cloudflare',
      fn: async () => {
        // Query with dummy vector to test connectivity
        const dummyVector = new Array(768).fill(0.1);
        const result = await env.VECTORIZE.query(dummyVector, { topK: 1 });
        return { ok: result !== undefined, statusCode: 200 };
      },
    });
  } else {
    health.checks.push({
      service: 'Cloudflare Vectorize',
      category: 'cloudflare',
      status: 'skipped',
      reason: 'Vectorize binding not available',
    });
  }

  // ========================================
  // PAYMENT & AUTH SECRETS (Presence Check Only)
  // ========================================

  health.secrets.STRIPE_SECRET_KEY = Boolean(env.STRIPE_SECRET_KEY);
  health.secrets.STRIPE_WEBHOOK_SECRET = Boolean(env.STRIPE_WEBHOOK_SECRET);
  health.secrets.JWT_SECRET = Boolean(env.JWT_SECRET);
  health.secrets.GOOGLE_CLIENT_ID = Boolean(env.GOOGLE_CLIENT_ID);
  health.secrets.GOOGLE_CLIENT_SECRET = Boolean(env.GOOGLE_CLIENT_SECRET);
  health.secrets.GOOGLE_GEMINI_API_KEY = Boolean(env.GOOGLE_GEMINI_API_KEY);
  health.secrets.OPENAI_API_KEY = Boolean(env.OPENAI_API_KEY);
  health.secrets.ANTHROPIC_API_KEY = Boolean(env.ANTHROPIC_API_KEY);

  // ========================================
  // CALCULATE SUMMARY
  // ========================================

  health.responseTime = `${Date.now() - startTime}ms`;

  const statusCounts = health.checks.reduce(
    (acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    },
    { healthy: 0, degraded: 0, unhealthy: 0, skipped: 0 }
  );

  health.summary = {
    total: health.checks.length,
    ...statusCounts,
    secretsConfigured: Object.values(health.secrets).filter(Boolean).length,
    secretsTotal: Object.keys(health.secrets).length,
  };

  // Determine overall health status
  if (
    statusCounts.unhealthy > 0 &&
    statusCounts.unhealthy === statusCounts.healthy + statusCounts.degraded + statusCounts.unhealthy
  ) {
    health.status = 'unhealthy';
  } else if (statusCounts.unhealthy > 0 || statusCounts.degraded > 0) {
    health.status = 'degraded';
  }

  // Set appropriate HTTP status code
  const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500;

  return new Response(JSON.stringify(health, null, 2), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}

/**
 * Helper to check a service and add result to health checks
 */
async function checkService(health, { service, category, fn }) {
  const start = Date.now();
  try {
    const result = await fn();
    health.checks.push({
      service,
      category,
      status: result.ok ? 'healthy' : 'degraded',
      statusCode: result.statusCode,
      responseTime: `${Date.now() - start}ms`,
    });
  } catch (error) {
    health.checks.push({
      service,
      category,
      status: 'unhealthy',
      error: error.message,
      responseTime: `${Date.now() - start}ms`,
    });
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }
}
