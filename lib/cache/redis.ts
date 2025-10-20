import { Redis } from '@upstash/redis';

export interface CacheClient {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<unknown>;
  del?(key: string): Promise<unknown>;
}

let client: CacheClient | null = null;

function createRedisClient(): CacheClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[cache] Upstash credentials missing – falling back to in-memory fetches only');
    }
    return null;
  }

  return new Redis({ url, token });
}

export function getCacheClient(): CacheClient | null {
  if (client) {
    return client;
  }

  client = createRedisClient();
  return client;
}

export function setCacheClient(mock: CacheClient | null): void {
  client = mock;
}

export async function getCachedJSON<T>(key: string): Promise<T | null> {
  const redis = getCacheClient();
  if (!redis) return null;

  try {
    const cached = await redis.get<string>(key);
    if (!cached) return null;

    return JSON.parse(cached) as T;
  } catch (error) {
    console.warn(`[cache] Failed to read key ${key}:`, error);
    return null;
  }
}

export async function setCachedJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getCacheClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (error) {
    console.warn(`[cache] Failed to set key ${key}:`, error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  const redis = getCacheClient();
  if (!redis || !redis.del) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.warn(`[cache] Failed to delete key ${key}:`, error);
  }
}
