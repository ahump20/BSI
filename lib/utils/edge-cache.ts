/**
 * Cloudflare Workers edge caching utilities
 * 
 * Pattern sourced from: https://github.com/aunghein-dev/api_soccerOddsMyanmar
 * Implements cache-first strategy with stale-while-revalidate for Cloudflare Workers
 * 
 * Complements lib/utils/cache.ts (memory cache) with Cloudflare Cache API
 */

interface EdgeCacheOptions {
  /** Cache TTL in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Stale-while-revalidate window in seconds (default: 3600 = 1 hour) */
  swr?: number;
  /** Cache key (default: request URL) */
  cacheKey?: string;
  /** Custom cache tags for purging */
  cacheTags?: string[];
}

interface CachedResponse {
  data: unknown;
  headers?: Record<string, string>;
  status?: number;
}

type FetchFn = () => Promise<CachedResponse>;

/**
 * Wrap Cloudflare Worker handler with edge cache
 * Uses Cloudflare Cache API for distributed caching
 * 
 * @param context Cloudflare EventContext
 * @param fetchFn Function that returns response data
 * @param options Cache configuration
 * @returns Response with appropriate cache headers
 */
export async function withEdgeCache(
  context: { request: Request },
  fetchFn: FetchFn,
  options: EdgeCacheOptions = {}
): Promise<Response> {
  const {
    ttl = 300,
    swr = 3600,
    cacheKey,
    cacheTags = [],
  } = options;

  const cache = caches.default;
  const cacheKeyStr = cacheKey || context.request.url;
  const cacheRequest = new Request(cacheKeyStr, context.request);

  const cachedResponse = await cache.match(cacheRequest);
  
  if (cachedResponse) {
    const age = parseInt(cachedResponse.headers.get('age') || '0', 10);
    
    if (age < ttl) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('X-Cache-Status', 'HIT');
      return response;
    }
    
    if (age < ttl + swr) {
      Promise.resolve().then(async () => {
        try {
          const freshData = await fetchFn();
          const freshResponse = createEdgeResponse(freshData, {
            ttl,
            swr,
            cacheTags,
          });
          await cache.put(cacheRequest, freshResponse.clone());
        } catch (error) {
          console.error('Background revalidation failed:', error);
        }
      });
      
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('X-Cache-Status', 'STALE');
      return response;
    }
  }

  try {
    const freshData = await fetchFn();
    const response = createEdgeResponse(freshData, {
      ttl,
      swr,
      cacheTags,
    });

    await cache.put(cacheRequest, response.clone());
    response.headers.set('X-Cache-Status', 'MISS');
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set('X-Cache-Status', 'EXPIRED-FALLBACK');
      return response;
    }

    return new Response(
      JSON.stringify({
        error: 'Service Unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

/**
 * Create Response with Cloudflare cache headers
 */
function createEdgeResponse(
  data: CachedResponse,
  options: {
    ttl: number;
    swr: number;
    cacheTags: string[];
  }
): Response {
  const { ttl, swr, cacheTags } = options;
  
  const headers = new Headers(data.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set(
    'Cache-Control',
    `public, max-age=${ttl}, stale-while-revalidate=${swr}`
  );
  
  if (cacheTags.length > 0) {
    headers.set('Cache-Tag', cacheTags.join(','));
  }
  
  const body = typeof data.data === 'string'
    ? data.data
    : JSON.stringify(data.data);

  return new Response(body, {
    status: data.status || 200,
    headers,
  });
}

/**
 * KV-based caching for Cloudflare Workers
 * Use when you need more control than Cache API
 */
export async function withKVCache<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttl?: number } = {}
): Promise<T> {
  const { ttl = 300 } = options;

  const cached = await kv.get(key, { type: 'json' });
  if (cached !== null) {
    return cached as T;
  }

  const fresh = await fetchFn();
  
  await kv.put(key, JSON.stringify(fresh), {
    expirationTtl: ttl,
  });

  return fresh;
}
