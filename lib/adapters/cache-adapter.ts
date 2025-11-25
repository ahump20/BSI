/**
 * Cache Adapter for Cloudflare KV
 *
 * Provides a unified interface for caching operations with:
 * - Automatic key generation
 * - TTL management
 * - Cache warming strategies
 * - Error handling
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Cache namespace for grouping
  bustCache?: boolean; // Force cache refresh
}

export interface CacheMetadata {
  cachedAt: string;
  expiresAt: string;
  source: string;
  version: string;
}

export class CacheAdapter {
  private defaultTTL: number = 300; // 5 minutes default
  private namespace: string = 'bsi';

  constructor(private kv?: KVNamespace) {}

  /**
   * Generate a cache key from components
   */
  generateKey(components: string[]): string {
    return `${this.namespace}:${components.join(':')}`;
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.kv) {
      return null;
    }

    try {
      const cached = await this.kv.get(key, 'json');
      if (!cached) {
        return null;
      }

      // Check if expired
      const data = cached as any;
      if (data.metadata?.expiresAt) {
        const expiresAt = new Date(data.metadata.expiresAt);
        if (expiresAt < new Date()) {
          // Expired, delete it
          await this.delete(key);
          return null;
        }
      }

      return data.value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.kv) {
      return;
    }

    const ttl = options.ttl || this.defaultTTL;
    const cachedAt = new Date();
    const expiresAt = new Date(cachedAt.getTime() + ttl * 1000);

    const metadata: CacheMetadata = {
      cachedAt: cachedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source: 'cache-adapter',
      version: '1.0',
    };

    const cacheValue = {
      value,
      metadata,
    };

    try {
      await this.kv.put(key, JSON.stringify(cacheValue), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.kv) {
      return;
    }

    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Get or set (fetch if not cached)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check if cache bust requested
    if (options.bustCache) {
      const freshData = await fetcher();
      await this.set(key, freshData, options);
      return freshData;
    }

    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const freshData = await fetcher();

    // Store in cache
    await this.set(key, freshData, options);

    return freshData;
  }

  /**
   * Warm cache with predefined data
   */
  async warm(
    keys: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>
  ): Promise<void> {
    const promises = keys.map(async ({ key, fetcher, ttl }) => {
      try {
        const data = await fetcher();
        await this.set(key, data, { ttl });
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Invalidate multiple cache keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.kv) {
      return;
    }

    try {
      // List all keys matching pattern
      const list = await this.kv.list({ prefix: pattern });

      // Delete all matching keys
      const deletePromises = list.keys.map(({ name }) => this.delete(name));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(prefix?: string): Promise<{
    keys: number;
    estimatedSize: number;
  }> {
    if (!this.kv) {
      return { keys: 0, estimatedSize: 0 };
    }

    try {
      const list = await this.kv.list({ prefix: prefix || this.namespace });
      return {
        keys: list.keys.length,
        estimatedSize: list.keys.reduce((sum, key) => sum + (key.metadata?.size || 0), 0),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, estimatedSize: 0 };
    }
  }
}

/**
 * Sports-specific cache utilities
 */
export class SportsCache extends CacheAdapter {
  /**
   * Cache TTLs for different data types
   */
  private ttls = {
    liveScores: 30, // 30 seconds during games
    standings: 300, // 5 minutes
    teamStats: 300, // 5 minutes
    playerStats: 600, // 10 minutes
    historical: 86400, // 24 hours
    analytics: 3600, // 1 hour
  };

  /**
   * Cache MLB team data
   */
  async cacheMLBTeam(teamId: number, data: any): Promise<void> {
    const key = this.generateKey(['mlb', 'team', teamId.toString()]);
    await this.set(key, data, { ttl: this.ttls.teamStats });
  }

  /**
   * Get MLB team data from cache
   */
  async getMLBTeam(teamId: number): Promise<any | null> {
    const key = this.generateKey(['mlb', 'team', teamId.toString()]);
    return this.get(key);
  }

  /**
   * Cache NFL team data
   */
  async cacheNFLTeam(teamId: number, data: any): Promise<void> {
    const key = this.generateKey(['nfl', 'team', teamId.toString()]);
    await this.set(key, data, { ttl: this.ttls.teamStats });
  }

  /**
   * Get NFL team data from cache
   */
  async getNFLTeam(teamId: number): Promise<any | null> {
    const key = this.generateKey(['nfl', 'team', teamId.toString()]);
    return this.get(key);
  }

  /**
   * Cache standings
   */
  async cacheStandings(sport: 'mlb' | 'nfl', data: any): Promise<void> {
    const key = this.generateKey([sport, 'standings']);
    await this.set(key, data, { ttl: this.ttls.standings });
  }

  /**
   * Get standings from cache
   */
  async getStandings(sport: 'mlb' | 'nfl'): Promise<any | null> {
    const key = this.generateKey([sport, 'standings']);
    return this.get(key);
  }

  /**
   * Cache live scores
   */
  async cacheLiveScores(sport: 'mlb' | 'nfl', week: number | null, data: any): Promise<void> {
    const key = week
      ? this.generateKey([sport, 'scores', 'week', week.toString()])
      : this.generateKey([sport, 'scores', 'current']);
    await this.set(key, data, { ttl: this.ttls.liveScores });
  }

  /**
   * Get live scores from cache
   */
  async getLiveScores(sport: 'mlb' | 'nfl', week: number | null): Promise<any | null> {
    const key = week
      ? this.generateKey([sport, 'scores', 'week', week.toString()])
      : this.generateKey([sport, 'scores', 'current']);
    return this.get(key);
  }

  /**
   * Invalidate all caches for a sport
   */
  async invalidateSport(sport: 'mlb' | 'nfl'): Promise<void> {
    const pattern = this.generateKey([sport]);
    await this.invalidatePattern(pattern);
  }
}

/**
 * Create cache adapter instance
 */
export function createCacheAdapter(kv?: KVNamespace): CacheAdapter {
  return new CacheAdapter(kv);
}

/**
 * Create sports cache instance
 */
export function createSportsCache(kv?: KVNamespace): SportsCache {
  return new SportsCache(kv);
}
