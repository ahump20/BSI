/**
 * Data Fetcher — Fallback Orchestration Layer
 *
 * Implements the priority chain: KV cache → SportsDataIO → ESPN → stale cache.
 * Every response carries source attribution for debugging and UI display.
 */

interface FetchResult<T> {
  data: T;
  source: string;
  cached: boolean;
  staleMinutes?: number;
}

interface KVLike {
  get(key: string, type: 'text'): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface CacheEnvelope<T> {
  data: T;
  cachedAt: string;
}

function wrapCache<T>(data: T): string {
  const envelope: CacheEnvelope<T> = { data, cachedAt: new Date().toISOString() };
  return JSON.stringify(envelope);
}

function unwrapCache<T>(raw: string): { data: T; cachedAt: string | null } {
  const parsed = JSON.parse(raw);
  // Support both envelope format and legacy raw format
  if (parsed && typeof parsed === 'object' && 'cachedAt' in parsed && 'data' in parsed) {
    return { data: parsed.data as T, cachedAt: parsed.cachedAt };
  }
  return { data: parsed as T, cachedAt: null };
}

function minutesSince(isoDate: string | null): number | undefined {
  if (!isoDate) return undefined;
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.round(diff / 60_000);
}

/**
 * Fetch data with automatic fallback between primary and secondary sources.
 *
 * Flow:
 * 1. Check KV cache — return if fresh
 * 2. Try primary (SportsDataIO) — cache + return on success
 * 3. On primary failure — try fallback (ESPN) — cache + return on success
 * 4. On both failure — return stale cache if available, else throw
 */
export async function fetchWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  cacheKey: string,
  kv: KVLike,
  ttl: number,
  primarySource = 'sportsdataio',
  fallbackSource = 'espn',
): Promise<FetchResult<T>> {
  // 1. Check KV cache
  const raw = await kv.get(cacheKey, 'text');
  if (raw) {
    try {
      const { data } = unwrapCache<T>(raw);
      return { data, source: 'cache', cached: true };
    } catch {
      // Corrupt cache entry — continue to live fetch
    }
  }

  // 2. Try primary source (SportsDataIO)
  try {
    const data = await primary();
    await kv.put(cacheKey, wrapCache(data), { expirationTtl: ttl });
    return { data, source: primarySource, cached: false };
  } catch (primaryErr) {
    // Primary failed — try fallback
    try {
      const data = await fallback();
      await kv.put(cacheKey, wrapCache(data), { expirationTtl: ttl });
      return { data, source: fallbackSource, cached: false };
    } catch {
      // Both failed — try stale cache
      if (raw) {
        try {
          const { data, cachedAt } = unwrapCache<T>(raw);
          return { data, source: 'stale-cache', cached: true, staleMinutes: minutesSince(cachedAt) };
        } catch {
          // Nothing left
        }
      }
      // Re-throw the primary error for caller to handle
      throw primaryErr;
    }
  }
}

/**
 * Single-source fetch with KV caching. For endpoints where only one source exists.
 */
export async function fetchWithCache<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  kv: KVLike,
  ttl: number,
  source: string,
): Promise<FetchResult<T>> {
  const raw = await kv.get(cacheKey, 'text');
  if (raw) {
    try {
      const { data } = unwrapCache<T>(raw);
      return { data, source: 'cache', cached: true };
    } catch {
      // Corrupt — continue
    }
  }

  const data = await fetcher();
  await kv.put(cacheKey, wrapCache(data), { expirationTtl: ttl });
  return { data, source, cached: false };
}
