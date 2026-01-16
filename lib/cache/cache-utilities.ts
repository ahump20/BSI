/**
 * Enhanced Cache Utilities
 *
 * Additional caching utilities based on Cloudflare best practices.
 * Complements the TieredCache with:
 * - Multi-tier storage coordination (KV + R2 + D1)
 * - Cache warming and preloading
 * - Analytics and metrics collection
 * - Distributed cache key management
 *
 * Based on patterns from:
 * @see https://github.com/garyblankenship/cloudflare-free-tier-guide
 * @see https://developers.cloudflare.com/kv/
 */

import type { CacheCategory, CacheStats as _CacheStats } from './tiered-cache';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MultiTierEnv {
  KV?: KVNamespace;
  R2?: R2Bucket;
  D1?: D1Database;
  ANALYTICS?: AnalyticsEngineDataset;
}

export interface CacheMetrics {
  totalRequests: number;
  kvHits: number;
  kvMisses: number;
  r2Hits: number;
  r2Misses: number;
  d1Hits: number;
  d1Misses: number;
  originFetches: number;
  avgLatencyMs: number;
  hitRateByCategory: Record<CacheCategory, number>;
  errorCount: number;
}

export interface WarmingConfig {
  sport: string;
  category: CacheCategory;
  keys: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface CacheKeyPattern {
  prefix: string;
  sport?: string;
  type?: string;
  id?: string;
  timestamp?: number;
}

// Cloudflare binding interfaces
interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: { expirationTtl?: number; metadata?: object }
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: object }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: object; customMetadata?: object }
  ): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ objects: R2Object[]; truncated: boolean; cursor?: string }>;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: object;
  customMetadata?: Record<string, string>;
  body: ReadableStream;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { duration: number; changes: number; last_row_id: number };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

interface AnalyticsEngineDataset {
  writeDataPoint(data: { indexes?: string[]; blobs?: string[]; doubles?: number[] }): void;
}

// ============================================================================
// MULTI-TIER CACHE COORDINATOR
// ============================================================================

export class MultiTierCache {
  private metrics: CacheMetrics;
  private keyIndex: Map<string, Set<string>> = new Map();

  constructor(private env: MultiTierEnv) {
    this.metrics = this.initMetrics();
  }

  // ==========================================================================
  // CORE OPERATIONS
  // ==========================================================================

  /**
   * Get from cache with multi-tier fallback
   * Order: KV (fast) -> R2 (durable) -> D1 (queryable)
   */
  async get<T>(key: string): Promise<{ data: T | null; tier: 'kv' | 'r2' | 'd1' | 'miss' }> {
    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      // Tier 1: KV (fastest)
      if (this.env.KV) {
        const kvResult = await this.env.KV.get(key, { type: 'json' });
        if (kvResult) {
          this.metrics.kvHits++;
          this.updateLatency(startTime);
          return { data: kvResult as T, tier: 'kv' };
        }
        this.metrics.kvMisses++;
      }

      // Tier 2: R2 (durable)
      if (this.env.R2) {
        const r2Object = await this.env.R2.get(key);
        if (r2Object) {
          const data = (await r2Object.json()) as T;
          this.metrics.r2Hits++;
          // Promote to KV for faster future access
          await this.promoteToKV(key, data);
          this.updateLatency(startTime);
          return { data, tier: 'r2' };
        }
        this.metrics.r2Misses++;
      }

      // Tier 3: D1 (queryable)
      if (this.env.D1) {
        const d1Result = await this.env.D1.prepare(
          'SELECT payload FROM cache_store WHERE cache_key = ? LIMIT 1'
        )
          .bind(key)
          .first<{ payload: string }>();

        if (d1Result?.payload) {
          const data = JSON.parse(d1Result.payload) as T;
          this.metrics.d1Hits++;
          // Promote to faster tiers
          await this.promoteToKV(key, data);
          await this.promoteToR2(key, data);
          this.updateLatency(startTime);
          return { data, tier: 'd1' };
        }
        this.metrics.d1Misses++;
      }

      this.updateLatency(startTime);
      return { data: null, tier: 'miss' };
    } catch (error) {
      this.metrics.errorCount++;
      console.error('[MultiTierCache] Get error:', error);
      return { data: null, tier: 'miss' };
    }
  }

  /**
   * Put to all available tiers
   */
  async put<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      category?: CacheCategory;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const { ttl = 300, category, tags = [] } = options;
    const payload = JSON.stringify(data);

    // Update key index for tags
    for (const tag of tags) {
      if (!this.keyIndex.has(tag)) {
        this.keyIndex.set(tag, new Set());
      }
      this.keyIndex.get(tag)!.add(key);
    }

    const operations: Promise<void>[] = [];

    // KV with TTL
    if (this.env.KV) {
      operations.push(
        this.env.KV.put(key, payload, {
          expirationTtl: ttl,
          metadata: { category, tags, cachedAt: Date.now() },
        })
      );
    }

    // R2 (durable, no auto-expiry)
    if (this.env.R2) {
      operations.push(
        this.env.R2.put(key, payload, {
          httpMetadata: { contentType: 'application/json' },
          customMetadata: {
            category: category || '',
            tags: tags.join(','),
            expiresAt: String(Date.now() + ttl * 1000),
          },
        }).then(() => undefined)
      );
    }

    // D1 (queryable archive)
    if (this.env.D1) {
      operations.push(
        this.env.D1.prepare(
          `INSERT OR REPLACE INTO cache_store
             (cache_key, payload, category, tags, expires_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            key,
            payload,
            category || null,
            tags.join(','),
            new Date(Date.now() + ttl * 1000).toISOString(),
            new Date().toISOString()
          )
          .run()
          .then(() => undefined)
      );
    }

    await Promise.allSettled(operations);
  }

  /**
   * Delete from all tiers
   */
  async delete(key: string): Promise<void> {
    const operations: Promise<void>[] = [];

    if (this.env.KV) {
      operations.push(this.env.KV.delete(key));
    }

    if (this.env.R2) {
      operations.push(this.env.R2.delete(key));
    }

    if (this.env.D1) {
      operations.push(
        this.env.D1.prepare('DELETE FROM cache_store WHERE cache_key = ?')
          .bind(key)
          .run()
          .then(() => undefined)
      );
    }

    await Promise.allSettled(operations);
  }

  /**
   * Invalidate by tag across all tiers
   */
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.keyIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    const deletePromises = Array.from(keys).map((key) => this.delete(key));
    await Promise.allSettled(deletePromises);

    this.keyIndex.delete(tag);
    return keys.size;
  }

  // ==========================================================================
  // PROMOTION HELPERS
  // ==========================================================================

  private async promoteToKV<T>(key: string, data: T): Promise<void> {
    if (!this.env.KV) return;
    try {
      await this.env.KV.put(key, JSON.stringify(data), { expirationTtl: 300 });
    } catch (error) {
      console.warn('[MultiTierCache] KV promotion failed:', error);
    }
  }

  private async promoteToR2<T>(key: string, data: T): Promise<void> {
    if (!this.env.R2) return;
    try {
      await this.env.R2.put(key, JSON.stringify(data), {
        httpMetadata: { contentType: 'application/json' },
      });
    } catch (error) {
      console.warn('[MultiTierCache] R2 promotion failed:', error);
    }
  }

  // ==========================================================================
  // METRICS & ANALYTICS
  // ==========================================================================

  private initMetrics(): CacheMetrics {
    return {
      totalRequests: 0,
      kvHits: 0,
      kvMisses: 0,
      r2Hits: 0,
      r2Misses: 0,
      d1Hits: 0,
      d1Misses: 0,
      originFetches: 0,
      avgLatencyMs: 0,
      hitRateByCategory: {} as Record<CacheCategory, number>,
      errorCount: 0,
    };
  }

  private updateLatency(startTime: number): void {
    const latency = Date.now() - startTime;
    const total = this.metrics.totalRequests;
    this.metrics.avgLatencyMs =
      total === 1 ? latency : (this.metrics.avgLatencyMs * (total - 1) + latency) / total;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Write metrics to Analytics Engine
   */
  recordMetrics(): void {
    if (!this.env.ANALYTICS) return;

    const totalHits = this.metrics.kvHits + this.metrics.r2Hits + this.metrics.d1Hits;
    const hitRate = this.metrics.totalRequests > 0 ? totalHits / this.metrics.totalRequests : 0;

    this.env.ANALYTICS.writeDataPoint({
      indexes: ['cache_metrics'],
      blobs: [new Date().toISOString()],
      doubles: [
        this.metrics.totalRequests,
        this.metrics.kvHits,
        this.metrics.r2Hits,
        this.metrics.d1Hits,
        hitRate,
        this.metrics.avgLatencyMs,
        this.metrics.errorCount,
      ],
    });
  }
}

// ============================================================================
// CACHE WARMING UTILITIES
// ============================================================================

export class CacheWarmer {
  constructor(
    private cache: MultiTierCache,
    private fetchFn: (key: string) => Promise<unknown>
  ) {}

  /**
   * Warm cache for a list of keys
   */
  async warmKeys(keys: string[], concurrency: number = 5): Promise<WarmingResult> {
    const result: WarmingResult = {
      total: keys.length,
      warmed: 0,
      skipped: 0,
      errors: 0,
    };

    // Process in batches for concurrency control
    for (let i = 0; i < keys.length; i += concurrency) {
      const batch = keys.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async (key) => {
          try {
            // Check if already cached
            const existing = await this.cache.get(key);
            if (existing.data) {
              result.skipped++;
              return;
            }

            // Fetch and cache
            const data = await this.fetchFn(key);
            await this.cache.put(key, data);
            result.warmed++;
          } catch (error) {
            console.error(`[CacheWarmer] Failed to warm ${key}:`, error);
            result.errors++;
          }
        })
      );
    }

    return result;
  }

  /**
   * Warm cache based on sport-specific patterns
   */
  async warmSportData(
    sport: string,
    options: { standings?: boolean; rankings?: boolean; schedule?: boolean } = {}
  ): Promise<WarmingResult> {
    const keys: string[] = [];

    if (options.standings) {
      keys.push(`standings:${sport}:all`);
    }
    if (options.rankings) {
      keys.push(`rankings:${sport}:latest`);
    }
    if (options.schedule) {
      const today = new Date().toISOString().split('T')[0];
      keys.push(`schedule:${sport}:${today}`);
    }

    return this.warmKeys(keys);
  }

  /**
   * Warm live game data - highest priority
   */
  async warmLiveGames(sports: string[]): Promise<WarmingResult> {
    const keys = sports.map((sport) => `scores:live:${sport}`);
    return this.warmKeys(keys, 10); // Higher concurrency for live data
  }
}

export interface WarmingResult {
  total: number;
  warmed: number;
  skipped: number;
  errors: number;
}

// ============================================================================
// CACHE KEY UTILITIES
// ============================================================================

/**
 * Build a standardized cache key
 */
export function buildCacheKey(pattern: CacheKeyPattern): string {
  const parts = [pattern.prefix];

  if (pattern.sport) parts.push(pattern.sport);
  if (pattern.type) parts.push(pattern.type);
  if (pattern.id) parts.push(pattern.id);
  if (pattern.timestamp) parts.push(String(pattern.timestamp));

  return parts.join(':');
}

/**
 * Parse a cache key into components
 */
export function parseCacheKey(key: string): CacheKeyPattern {
  const parts = key.split(':');
  return {
    prefix: parts[0] || '',
    sport: parts[1],
    type: parts[2],
    id: parts[3],
    timestamp: parts[4] ? parseInt(parts[4], 10) : undefined,
  };
}

/**
 * Generate sport-specific cache keys
 */
export const CacheKeys = {
  liveScores: (sport: string) => `scores:live:${sport}`,
  standings: (sport: string, conference?: string) =>
    conference ? `standings:${sport}:${conference}` : `standings:${sport}:all`,
  rankings: (sport: string, poll: string = 'latest') => `rankings:${sport}:${poll}`,
  schedule: (sport: string, date: string) => `schedule:${sport}:${date}`,
  team: (teamId: string) => `team:${teamId}`,
  player: (playerId: string) => `player:${playerId}`,
  game: (gameId: string) => `game:${gameId}`,
  boxscore: (gameId: string) => `boxscore:${gameId}`,
};

// ============================================================================
// D1 SCHEMA FOR CACHE TABLE
// ============================================================================

export const CACHE_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS cache_store (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cache_category ON cache_store(category);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_store(expires_at);
`;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a MultiTierCache instance
 */
export function createMultiTierCache(env: MultiTierEnv): MultiTierCache {
  return new MultiTierCache(env);
}

/**
 * Create a CacheWarmer instance
 */
export function createCacheWarmer(
  cache: MultiTierCache,
  fetchFn: (key: string) => Promise<unknown>
): CacheWarmer {
  return new CacheWarmer(cache, fetchFn);
}
