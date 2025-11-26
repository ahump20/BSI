/**
 * Tiered Cache with Stale-While-Revalidate Pattern
 *
 * Intelligent caching system for sports data with:
 * - Sport-specific TTLs based on data volatility
 * - Stale-while-revalidate for fast responses during refresh
 * - Background revalidation without blocking
 * - Cache tagging for targeted invalidation
 * - Metrics collection for cache performance
 *
 * Cache Strategy:
 * - Live scores: 15-30 seconds (high volatility)
 * - Scheduled games: 5 minutes
 * - Final scores: 1 hour
 * - Standings: 5 minutes
 * - Rankings: 30 minutes
 * - Historical data: 24 hours
 *
 * Design: No fake data. Cache hit or fresh fetch - nothing in between.
 *
 * Brand: BlazeSportsIntel - "Born to Blaze the Path Less Beaten"
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CacheCategory =
  | 'live_scores'
  | 'scheduled_games'
  | 'final_scores'
  | 'standings'
  | 'player_stats'
  | 'team_stats'
  | 'rankings'
  | 'historical'
  | 'news'
  | 'odds';

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  staleAt: number;
  category: CacheCategory;
  tags: string[];
  hits: number;
  provider?: string;
}

export interface CacheOptions {
  category: CacheCategory;
  tags?: string[];
  provider?: string;
  forceRefresh?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  revalidations: number;
  errors: number;
  hitRate: number;
  avgLatencyMs: number;
}

export interface CacheConfig {
  ttlSeconds: number;
  staleTtlSeconds: number; // How long stale data is acceptable
  maxEntries?: number;
}

// ============================================================================
// TTL CONFIGURATION
// ============================================================================

const CACHE_CONFIGS: Record<CacheCategory, CacheConfig> = {
  live_scores: {
    ttlSeconds: 15,
    staleTtlSeconds: 60, // Serve stale up to 1 minute while revalidating
  },
  scheduled_games: {
    ttlSeconds: 300, // 5 minutes
    staleTtlSeconds: 600, // 10 minutes stale OK
  },
  final_scores: {
    ttlSeconds: 3600, // 1 hour
    staleTtlSeconds: 86400, // Stale for up to 24 hours OK
  },
  standings: {
    ttlSeconds: 300, // 5 minutes
    staleTtlSeconds: 900, // 15 minutes stale OK
  },
  player_stats: {
    ttlSeconds: 600, // 10 minutes
    staleTtlSeconds: 1800, // 30 minutes stale OK
  },
  team_stats: {
    ttlSeconds: 300, // 5 minutes
    staleTtlSeconds: 900, // 15 minutes stale OK
  },
  rankings: {
    ttlSeconds: 1800, // 30 minutes
    staleTtlSeconds: 3600, // 1 hour stale OK
  },
  historical: {
    ttlSeconds: 86400, // 24 hours
    staleTtlSeconds: 604800, // 1 week stale OK
  },
  news: {
    ttlSeconds: 300, // 5 minutes
    staleTtlSeconds: 1800, // 30 minutes stale OK
  },
  odds: {
    ttlSeconds: 60, // 1 minute
    staleTtlSeconds: 180, // 3 minutes stale OK
  },
};

// ============================================================================
// MAIN CACHE CLASS
// ============================================================================

export class TieredCache {
  private kv: KVNamespace;
  private ctx?: ExecutionContext;
  private stats: CacheStats;
  private prefix: string;

  constructor(kv: KVNamespace, ctx?: ExecutionContext, prefix: string = 'cache') {
    this.kv = kv;
    this.ctx = ctx;
    this.prefix = prefix;
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      revalidations: 0,
      errors: 0,
      hitRate: 0,
      avgLatencyMs: 0,
    };
  }

  // ==========================================================================
  // CORE CACHE OPERATIONS
  // ==========================================================================

  /**
   * Get cached data with optional stale-while-revalidate
   */
  async get<T>(key: string, category: CacheCategory): Promise<T | null> {
    const cacheKey = this.buildKey(key);
    const startTime = Date.now();

    try {
      const raw = await this.kv.get(cacheKey, 'text');

      if (!raw) {
        this.stats.misses++;
        return null;
      }

      const entry = JSON.parse(raw) as CacheEntry<T>;
      const now = Date.now();

      // Check if completely expired (past stale time)
      if (now > entry.staleAt) {
        this.stats.misses++;
        return null;
      }

      // Fresh hit
      if (now < entry.expiresAt) {
        this.stats.hits++;
        entry.hits++;
        // Update hit count in background
        this.backgroundUpdate(cacheKey, entry);
        return entry.data;
      }

      // Stale hit - data is between expiresAt and staleAt
      this.stats.staleHits++;
      return entry.data;
    } catch (error) {
      console.error(`[TieredCache] Get error for ${key}:`, error);
      this.stats.errors++;
      return null;
    } finally {
      this.updateLatency(startTime);
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    const cacheKey = this.buildKey(key);
    const config = CACHE_CONFIGS[options.category];
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt: now + config.ttlSeconds * 1000,
      staleAt: now + (config.ttlSeconds + config.staleTtlSeconds) * 1000,
      category: options.category,
      tags: options.tags || [],
      hits: 0,
      provider: options.provider,
    };

    try {
      await this.kv.put(cacheKey, JSON.stringify(entry), {
        expirationTtl: config.ttlSeconds + config.staleTtlSeconds,
      });
    } catch (error) {
      console.error(`[TieredCache] Set error for ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Get with stale-while-revalidate pattern
   *
   * Returns cached data immediately (even if stale) and triggers
   * background refresh if data is stale.
   */
  async getWithSWR<T>(key: string, options: CacheOptions, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = this.buildKey(key);
    const startTime = Date.now();

    try {
      // Force refresh bypasses cache entirely
      if (options.forceRefresh) {
        const fresh = await fetchFn();
        await this.set(key, fresh, options);
        return fresh;
      }

      const raw = await this.kv.get(cacheKey, 'text');

      if (!raw) {
        // Cache miss - fetch fresh
        this.stats.misses++;
        const fresh = await fetchFn();
        await this.set(key, fresh, options);
        return fresh;
      }

      const entry = JSON.parse(raw) as CacheEntry<T>;
      const now = Date.now();

      // Completely expired - must fetch fresh
      if (now > entry.staleAt) {
        this.stats.misses++;
        const fresh = await fetchFn();
        await this.set(key, fresh, options);
        return fresh;
      }

      // Fresh - return immediately
      if (now < entry.expiresAt) {
        this.stats.hits++;
        return entry.data;
      }

      // Stale but usable - return stale data and revalidate in background
      this.stats.staleHits++;
      this.backgroundRevalidate(key, options, fetchFn);
      return entry.data;
    } catch (error) {
      console.error(`[TieredCache] SWR error for ${key}:`, error);
      this.stats.errors++;

      // On error, try to fetch fresh
      const fresh = await fetchFn();
      await this.set(key, fresh, options);
      return fresh;
    } finally {
      this.updateLatency(startTime);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.buildKey(key);
    try {
      await this.kv.delete(cacheKey);
    } catch (error) {
      console.error(`[TieredCache] Delete error for ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Invalidate all entries with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    // KV doesn't support tag-based listing, so we maintain a tag index
    const tagKey = `${this.prefix}:tag:${tag}`;
    let invalidated = 0;

    try {
      const keysJson = await this.kv.get(tagKey, 'text');
      if (!keysJson) return 0;

      const keys = JSON.parse(keysJson) as string[];

      await Promise.all(
        keys.map(async (key) => {
          await this.kv.delete(key);
          invalidated++;
        })
      );

      // Clear tag index
      await this.kv.delete(tagKey);
    } catch (error) {
      console.error(`[TieredCache] Tag invalidation error for ${tag}:`, error);
      this.stats.errors++;
    }

    return invalidated;
  }

  /**
   * Invalidate all entries for a sport
   */
  async invalidateSport(sport: string): Promise<number> {
    return this.invalidateByTag(`sport:${sport}`);
  }

  /**
   * Invalidate all entries for a team
   */
  async invalidateTeam(teamId: string): Promise<number> {
    return this.invalidateByTag(`team:${teamId}`);
  }

  // ==========================================================================
  // CONVENIENCE METHODS
  // ==========================================================================

  /**
   * Get live scores with appropriate caching
   */
  async getLiveScores<T>(sport: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.getWithSWR(
      `scores:live:${sport}`,
      {
        category: 'live_scores',
        tags: [`sport:${sport}`, 'type:live'],
      },
      fetchFn
    );
  }

  /**
   * Get standings with appropriate caching
   */
  async getStandings<T>(
    sport: string,
    conference: string | undefined,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const key = conference ? `standings:${sport}:${conference}` : `standings:${sport}:all`;

    return this.getWithSWR(
      key,
      {
        category: 'standings',
        tags: [`sport:${sport}`, 'type:standings', conference ? `conf:${conference}` : ''].filter(
          Boolean
        ),
      },
      fetchFn
    );
  }

  /**
   * Get rankings with appropriate caching
   */
  async getRankings<T>(sport: string, poll: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.getWithSWR(
      `rankings:${sport}:${poll}`,
      {
        category: 'rankings',
        tags: [`sport:${sport}`, 'type:rankings', `poll:${poll}`],
      },
      fetchFn
    );
  }

  /**
   * Get player stats with appropriate caching
   */
  async getPlayerStats<T>(playerId: string, season: number, fetchFn: () => Promise<T>): Promise<T> {
    return this.getWithSWR(
      `player:${playerId}:stats:${season}`,
      {
        category: 'player_stats',
        tags: [`player:${playerId}`, `season:${season}`, 'type:stats'],
      },
      fetchFn
    );
  }

  /**
   * Get team stats with appropriate caching
   */
  async getTeamStats<T>(teamId: string, season: number, fetchFn: () => Promise<T>): Promise<T> {
    return this.getWithSWR(
      `team:${teamId}:stats:${season}`,
      {
        category: 'team_stats',
        tags: [`team:${teamId}`, `season:${season}`, 'type:stats'],
      },
      fetchFn
    );
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses + this.stats.staleHits;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits + this.stats.staleHits) / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      revalidations: 0,
      errors: 0,
      hitRate: 0,
      avgLatencyMs: 0,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private backgroundUpdate<T>(cacheKey: string, entry: CacheEntry<T>): void {
    if (!this.ctx) return;

    this.ctx.waitUntil(
      this.kv
        .put(cacheKey, JSON.stringify(entry), {
          expirationTtl: Math.ceil((entry.staleAt - Date.now()) / 1000),
        })
        .catch((error) => {
          console.warn('[TieredCache] Background update failed:', error);
        })
    );
  }

  private backgroundRevalidate<T>(
    key: string,
    options: CacheOptions,
    fetchFn: () => Promise<T>
  ): void {
    if (!this.ctx) {
      // No execution context - can't do background work
      return;
    }

    this.stats.revalidations++;

    this.ctx.waitUntil(
      (async () => {
        try {
          console.log(`[TieredCache] Background revalidating: ${key}`);
          const fresh = await fetchFn();
          await this.set(key, fresh, options);
          console.log(`[TieredCache] Background revalidation complete: ${key}`);
        } catch (error) {
          console.error(`[TieredCache] Background revalidation failed for ${key}:`, error);
          this.stats.errors++;
        }
      })()
    );
  }

  private updateLatency(startTime: number): void {
    const latency = Date.now() - startTime;
    const total = this.stats.hits + this.stats.misses + this.stats.staleHits;

    if (total === 0) {
      this.stats.avgLatencyMs = latency;
    } else {
      // Running average
      this.stats.avgLatencyMs = (this.stats.avgLatencyMs * (total - 1) + latency) / total;
    }
  }
}

// ============================================================================
// CACHE FACTORY
// ============================================================================

/**
 * Create a configured TieredCache instance
 */
export function createCache(
  kv: KVNamespace,
  ctx?: ExecutionContext,
  prefix: string = 'bsi'
): TieredCache {
  return new TieredCache(kv, ctx, prefix);
}

/**
 * Get TTL configuration for a category
 */
export function getTTLConfig(category: CacheCategory): CacheConfig {
  return CACHE_CONFIGS[category];
}
