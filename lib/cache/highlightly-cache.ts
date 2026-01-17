/**
 * Highlightly Cache Layer
 * 
 * Provides intelligent caching with TTL, stale-while-revalidate (SWR),
 * and rate limit awareness for RapidAPI Highlightly data.
 * 
 * @module lib/cache/highlightly-cache
 */

import type {
  HighlightlySportType,
  HighlightlyMatch,
  HighlightlyStandings,
  HighlightlyTeam,
  HighlightlyBoxScore,
  RateLimitInfo,
} from '../api-clients/rapidapi-highlightly-unified';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cache data types
 */
export type CacheDataType =
  | 'live_scores'
  | 'schedule'
  | 'standings'
  | 'rankings'
  | 'teams'
  | 'boxscore'
  | 'odds'
  | 'health';

/**
 * Cache entry metadata
 */
export interface CacheMetadata {
  cachedAt: number;
  expiresAt: number;
  staleAt: number;
  sport: HighlightlySportType;
  dataType: CacheDataType;
  cacheKey: string;
  rateLimit?: RateLimitInfo;
}

/**
 * Cached data wrapper
 */
export interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

/**
 * Cache configuration per data type
 */
export interface CacheTTLConfig {
  /** Fresh data TTL in seconds */
  ttl: number;
  /** Stale-while-revalidate window in seconds */
  swr: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Force refresh, bypassing cache */
  forceRefresh?: boolean;
  /** Custom TTL override */
  ttlOverride?: number;
  /** Sport type for cache key */
  sport: HighlightlySportType;
  /** Data type for TTL selection */
  dataType: CacheDataType;
}

/**
 * Cache result with state information
 */
export interface CacheResult<T> {
  data: T | null;
  hit: boolean;
  stale: boolean;
  metadata: CacheMetadata | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default TTL configurations by data type
 * - live_scores: Very short TTL (1 min) for real-time data
 * - schedule: Medium TTL (5 min) for upcoming games
 * - standings: Longer TTL (30 min) for standings
 * - rankings: Long TTL (1 hour) for rankings
 * - teams: Very long TTL (24 hours) for team info
 */
export const DEFAULT_TTL_CONFIG: Record<CacheDataType, CacheTTLConfig> = {
  live_scores: { ttl: 60, swr: 30 },
  schedule: { ttl: 300, swr: 60 },
  standings: { ttl: 1800, swr: 300 },
  rankings: { ttl: 3600, swr: 600 },
  teams: { ttl: 86400, swr: 3600 },
  boxscore: { ttl: 300, swr: 60 },
  odds: { ttl: 120, swr: 30 },
  health: { ttl: 60, swr: 10 },
};

/** Cache key prefix for BSI Highlightly data */
const CACHE_PREFIX = 'bsi:highlightly';

/** KV namespace binding name */
const KV_BINDING = 'BSI_CACHE';

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * Generate a cache key for Highlightly data
 */
export function generateCacheKey(
  sport: HighlightlySportType,
  dataType: CacheDataType,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const parts = [CACHE_PREFIX, sport, dataType];
  
  if (params) {
    const sortedParams = Object.keys(params)
      .filter((k) => params[k] !== undefined)
      .sort()
      .map((k) => k + '=' + String(params[k]))
      .join('&');
    
    if (sortedParams) {
      parts.push(sortedParams);
    }
  }
  
  return parts.join(':');
}

// ============================================================================
// HIGHLIGHTLY CACHE CLASS
// ============================================================================

/**
 * Cache manager for Highlightly API data
 */
export class HighlightlyCache {
  private kv: KVNamespace;
  private ttlConfig: Record<CacheDataType, CacheTTLConfig>;

  constructor(
    kv: KVNamespace,
    ttlConfig: Record<CacheDataType, CacheTTLConfig> = DEFAULT_TTL_CONFIG
  ) {
    this.kv = kv;
    this.ttlConfig = ttlConfig;
  }

  /**
   * Get data from cache
   */
  async get<T>(
    cacheKey: string,
    dataType: CacheDataType
  ): Promise<CacheResult<T>> {
    try {
      const raw = await this.kv.get(cacheKey, 'text');
      
      if (!raw) {
        return {
          data: null,
          hit: false,
          stale: false,
          metadata: null,
        };
      }

      const cached = JSON.parse(raw) as CachedData<T>;
      const now = Date.now();
      const isExpired = now > cached.metadata.expiresAt;
      const isStale = now > cached.metadata.staleAt;

      return {
        data: cached.data,
        hit: !isExpired,
        stale: isStale && !isExpired,
        metadata: cached.metadata,
      };
    } catch (error) {
      console.error('[HighlightlyCache] Get error:', error);
      return {
        data: null,
        hit: false,
        stale: false,
        metadata: null,
      };
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set<T>(
    cacheKey: string,
    data: T,
    options: CacheOptions,
    rateLimit?: RateLimitInfo
  ): Promise<void> {
    try {
      const config = this.ttlConfig[options.dataType];
      const ttl = options.ttlOverride ?? config.ttl;
      const now = Date.now();

      const cached: CachedData<T> = {
        data,
        metadata: {
          cachedAt: now,
          expiresAt: now + ttl * 1000,
          staleAt: now + (ttl - config.swr) * 1000,
          sport: options.sport,
          dataType: options.dataType,
          cacheKey,
          rateLimit,
        },
      };

      // Store with KV expiration slightly longer than TTL for SWR
      await this.kv.put(cacheKey, JSON.stringify(cached), {
        expirationTtl: ttl + config.swr,
      });
    } catch (error) {
      console.error('[HighlightlyCache] Set error:', error);
    }
  }

  /**
   * Delete a specific cache entry
   */
  async delete(cacheKey: string): Promise<void> {
    try {
      await this.kv.delete(cacheKey);
    } catch (error) {
      console.error('[HighlightlyCache] Delete error:', error);
    }
  }

  /**
   * Invalidate all cache entries for a sport
   */
  async invalidateSport(sport: HighlightlySportType): Promise<number> {
    const prefix = CACHE_PREFIX + ':' + sport;
    let deleted = 0;

    try {
      const list = await this.kv.list({ prefix });
      
      for (const key of list.keys) {
        await this.kv.delete(key.name);
        deleted++;
      }
    } catch (error) {
      console.error('[HighlightlyCache] Invalidate sport error:', error);
    }

    return deleted;
  }

  /**
   * Invalidate all cache entries for a data type across all sports
   */
  async invalidateDataType(dataType: CacheDataType): Promise<number> {
    let deleted = 0;

    try {
      const list = await this.kv.list({ prefix: CACHE_PREFIX });
      
      for (const key of list.keys) {
        if (key.name.includes(':' + dataType + ':') || key.name.endsWith(':' + dataType)) {
          await this.kv.delete(key.name);
          deleted++;
        }
      }
    } catch (error) {
      console.error('[HighlightlyCache] Invalidate data type error:', error);
    }

    return deleted;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    keysBySport: Record<string, number>;
    keysByDataType: Record<string, number>;
  }> {
    const stats = {
      totalKeys: 0,
      keysBySport: {} as Record<string, number>,
      keysByDataType: {} as Record<string, number>,
    };

    try {
      const list = await this.kv.list({ prefix: CACHE_PREFIX });
      stats.totalKeys = list.keys.length;

      for (const key of list.keys) {
        const parts = key.name.split(':');
        if (parts.length >= 3) {
          const sport = parts[2];
          const dataType = parts[3] || 'unknown';

          stats.keysBySport[sport] = (stats.keysBySport[sport] || 0) + 1;
          stats.keysByDataType[dataType] = (stats.keysByDataType[dataType] || 0) + 1;
        }
      }
    } catch (error) {
      console.error('[HighlightlyCache] Get stats error:', error);
    }

    return stats;
  }
}

// ============================================================================
// STALE-WHILE-REVALIDATE WRAPPER
// ============================================================================

/**
 * Wrapper for stale-while-revalidate pattern
 * Returns cached data immediately if available (even if stale),
 * and triggers background refresh if stale.
 */
export async function withSWR<T>(
  cache: HighlightlyCache,
  cacheKey: string,
  options: CacheOptions,
  fetcher: () => Promise<{ data: T; rateLimit?: RateLimitInfo }>
): Promise<{
  data: T;
  cached: boolean;
  stale: boolean;
  refreshed: boolean;
  rateLimit?: RateLimitInfo;
}> {
  // Check cache first
  const cacheResult = await cache.get<T>(cacheKey, options.dataType);

  // Force refresh requested
  if (options.forceRefresh) {
    const result = await fetcher();
    await cache.set(cacheKey, result.data, options, result.rateLimit);
    return {
      data: result.data,
      cached: false,
      stale: false,
      refreshed: true,
      rateLimit: result.rateLimit,
    };
  }

  // Cache hit and fresh
  if (cacheResult.hit && !cacheResult.stale && cacheResult.data !== null) {
    return {
      data: cacheResult.data,
      cached: true,
      stale: false,
      refreshed: false,
      rateLimit: cacheResult.metadata?.rateLimit,
    };
  }

  // Cache hit but stale - return stale data and refresh in background
  if (cacheResult.hit && cacheResult.stale && cacheResult.data !== null) {
    // Fire and forget background refresh
    fetcher()
      .then(async (result) => {
        await cache.set(cacheKey, result.data, options, result.rateLimit);
      })
      .catch((error) => {
        console.error('[SWR] Background refresh failed:', error);
      });

    return {
      data: cacheResult.data,
      cached: true,
      stale: true,
      refreshed: false,
      rateLimit: cacheResult.metadata?.rateLimit,
    };
  }

  // Cache miss - fetch fresh data
  const result = await fetcher();
  await cache.set(cacheKey, result.data, options, result.rateLimit);
  
  return {
    data: result.data,
    cached: false,
    stale: false,
    refreshed: true,
    rateLimit: result.rateLimit,
  };
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new HighlightlyCache instance
 */
export function createHighlightlyCache(
  kv: KVNamespace,
  ttlConfig?: Record<CacheDataType, CacheTTLConfig>
): HighlightlyCache {
  return new HighlightlyCache(kv, ttlConfig);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default HighlightlyCache;
