/**
 * Baseball Rankings Worker
 *
 * Serves cached NCAA baseball rankings from the Blaze Sports Intel API layer
 * and stores the payload in Cloudflare KV for low-latency delivery.
 *
 * Route: /baseball/rankings
 * Query params:
 *   - poll: poll identifier (default: d1baseball)
 *   - season: season year (default: current year)
 *   - week: poll week number (latest if omitted)
 *   - forceRefresh: bypass cache when set to "1"
 */

interface RankingsResponse {
  poll: string;
  season: number;
  week?: number;
  generatedAt: string;
  rankings: Array<{
    rank: number;
    team: string;
    conference?: string;
    record?: string;
    previousRank?: number | null;
    points?: number | null;
    firstPlaceVotes?: number | null;
  }>;
}

export interface Env {
  BSI_KV: KVNamespace;
  BASEBALL_API_BASE?: string;
}

const CACHE_PREFIX = 'baseball:rankings';
const DEFAULT_CACHE_TTL_SECONDS = 60 * 15; // 15 minutes
const DEFAULT_API_BASE = 'https://blazesportsintel.com/api/v1';

function buildCacheKey(poll: string, season: number, week?: number | null): string {
  const weekKey = week ?? 'latest';
  return `${CACHE_PREFIX}:${poll}:${season}:${weekKey}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  } satisfies HeadersInit;
}

async function fetchRankingsFromOrigin(
  poll: string,
  season: number,
  week: number | null,
  apiBase: string,
): Promise<RankingsResponse> {
  const url = new URL(`${apiBase.replace(/\/$/, '')}/baseball/rankings`);
  url.searchParams.set('poll', poll);
  url.searchParams.set('season', String(season));
  if (week) {
    url.searchParams.set('week', String(week));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'bsi-baseball-rankings-worker/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Origin responded with ${response.status}`);
  }

  const data = (await response.json()) as RankingsResponse;
  if (!data || !Array.isArray(data.rankings)) {
    throw new Error('Origin returned an unexpected payload');
  }
  return data;
}

function parseQueryParams(url: URL) {
  const poll = url.searchParams.get('poll')?.trim() || 'd1baseball';
  const now = new Date();
  const season = Number.parseInt(url.searchParams.get('season') || String(now.getUTCFullYear()), 10);
  const weekParam = url.searchParams.get('week');
  const week = weekParam ? Number.parseInt(weekParam, 10) : null;
  const forceRefresh = url.searchParams.get('forceRefresh') === '1';

  return { poll, season, week, forceRefresh } as const;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders(),
    ...init?.headers,
  };
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname !== '/baseball/rankings') {
      return jsonResponse({ error: 'Not found' }, { status: 404 });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
    }

    const { poll, season, week, forceRefresh } = parseQueryParams(url);
    const cacheKey = buildCacheKey(poll, season, week);

    try {
      if (!forceRefresh) {
        const cached = await env.BSI_KV.get(cacheKey, { type: 'json' }) as RankingsResponse | null;
        if (cached) {
          return jsonResponse({
            source: 'cache',
            cacheKey,
            ttlSeconds: DEFAULT_CACHE_TTL_SECONDS,
            data: cached,
          }, {
            headers: {
              'Cache-Control': `public, max-age=${DEFAULT_CACHE_TTL_SECONDS}`,
            },
          });
        }
      }

      const apiBase = env.BASEBALL_API_BASE || DEFAULT_API_BASE;
      const payload = await fetchRankingsFromOrigin(poll, season, week, apiBase);

      await env.BSI_KV.put(cacheKey, JSON.stringify(payload), {
        expirationTtl: DEFAULT_CACHE_TTL_SECONDS,
      });

      return jsonResponse({
        source: 'origin',
        cacheKey,
        ttlSeconds: DEFAULT_CACHE_TTL_SECONDS,
        data: payload,
      }, {
        headers: {
          'Cache-Control': `public, max-age=${DEFAULT_CACHE_TTL_SECONDS}`,
        },
      });
    } catch (error) {
      console.error('[baseball-rankings] fetch failed', error);
      return jsonResponse({
        error: 'Failed to retrieve rankings',
        details: error instanceof Error ? error.message : 'Unknown error',
        cacheKey,
      }, { status: 502 });
    }
  },
};
