/**
 * BSI Cache Warmer Worker
 *
 * Pre-warms the /api/live-scores endpoint for all sports every 5 minutes.
 * This ensures KV cache stays hot and users never hit cold cache latency.
 *
 * Cron: every 5 minutes
 * Sports: mlb, nfl, nba, ncaa-baseball (per BSI priority: Baseball → Football → Basketball)
 */

interface Env {
  API_BASE_URL: string;
  ENVIRONMENT: string;
}

// Sports to pre-warm, in BSI priority order
const SPORTS_TO_WARM = ['ncaa-baseball', 'mlb', 'nfl', 'nba'] as const;

// Additional high-traffic endpoints to warm
const ADDITIONAL_ENDPOINTS = [
  '/api/mlb/standings',
  '/api/nfl/standings',
  '/api/nba/standings',
  '/api/college-baseball/rankings',
] as const;

interface WarmResult {
  endpoint: string;
  status: number;
  latency: number;
  cached: boolean;
}

async function warmEndpoint(url: string, signal?: AbortSignal): Promise<WarmResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'BSI-Cache-Warmer/1.0',
        Accept: 'application/json',
      },
      signal,
    });

    const cacheHeader = response.headers.get('cf-cache-status');
    return {
      endpoint: url,
      status: response.status,
      latency: Date.now() - start,
      cached: cacheHeader === 'HIT',
    };
  } catch (error) {
    return {
      endpoint: url,
      status: 0,
      latency: Date.now() - start,
      cached: false,
    };
  }
}

async function warmAllEndpoints(env: Env): Promise<WarmResult[]> {
  const baseUrl = env.API_BASE_URL || 'https://blazesportsintel.com';
  const controller = new AbortController();

  // 25 second timeout (cron has 30s limit)
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    // Build all URLs to warm
    const urls: string[] = [
      // Live scores for all sports
      ...SPORTS_TO_WARM.map((sport) => `${baseUrl}/api/live-scores?sport=${sport}`),
      // Additional high-traffic endpoints
      ...ADDITIONAL_ENDPOINTS.map((path) => `${baseUrl}${path}`),
    ];

    // Fire all requests in parallel
    const results = await Promise.all(urls.map((url) => warmEndpoint(url, controller.signal)));

    return results;
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  /**
   * Scheduled handler - runs on cron trigger
   * Warms cache for all configured endpoints
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const startTime = Date.now();

    ctx.waitUntil(
      (async () => {
        const results = await warmAllEndpoints(env);

        // Log results for monitoring
        const successful = results.filter((r) => r.status === 200).length;
        const cached = results.filter((r) => r.cached).length;
        const avgLatency = Math.round(
          results.reduce((sum, r) => sum + r.latency, 0) / results.length
        );

        console.log(
          JSON.stringify({
            event: 'cache_warm_complete',
            timestamp: new Date().toISOString(),
            cron: event.cron,
            totalEndpoints: results.length,
            successful,
            cached,
            avgLatencyMs: avgLatency,
            totalDurationMs: Date.now() - startTime,
            results: results.map((r) => ({
              endpoint: r.endpoint.replace(env.API_BASE_URL, ''),
              status: r.status,
              latency: r.latency,
              cached: r.cached,
            })),
          })
        );
      })()
    );
  },

  /**
   * Fetch handler - manual trigger and health check
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          worker: 'bsi-cache-warmer',
          environment: env.ENVIRONMENT,
          sportsConfigured: SPORTS_TO_WARM.length,
          additionalEndpoints: ADDITIONAL_ENDPOINTS.length,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Manual warm trigger
    if (url.pathname === '/warm' && request.method === 'POST') {
      const results = await warmAllEndpoints(env);

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          results,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('BSI Cache Warmer\n\nGET /health\nPOST /warm', {
      status: 200,
    });
  },
};
