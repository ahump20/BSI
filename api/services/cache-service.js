/**
 * BLAZE SPORTS INTEL - CACHE SERVICE
 * Phase 2B: Enterprise-grade caching layer
 *
 * Multi-tier caching with compression, metrics, and cache warming
 */

import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

class CacheService {
  constructor(env, logger) {
    this.kv = env.CACHE; // Cloudflare KV
    this.logger = logger;
    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      errors: 0
    };

    // Memory cache TTL (5 minutes for hot data)
    this.memoryCacheTTL = 300000;
    this.maxMemoryCacheSize = 100;
  }

  /**
   * Multi-tier get: Memory -> KV -> Miss
   */
  async get(key, options = {}) {
    const startTime = Date.now();

    try {
      // L1: Memory cache check
      const memoryResult = this.getFromMemory(key);
      if (memoryResult !== null) {
        this.metrics.hits++;
        this.logger?.debug(`Cache hit (memory): ${key} in ${Date.now() - startTime}ms`);
        return memoryResult;
      }

      // L2: KV store check
      const kvResult = await this.getFromKV(key);
      if (kvResult !== null) {
        // Promote to memory cache
        this.setInMemory(key, kvResult);
        this.metrics.hits++;
        this.logger?.debug(`Cache hit (KV): ${key} in ${Date.now() - startTime}ms`);
        return kvResult;
      }

      // Cache miss
      this.metrics.misses++;
      this.logger?.debug(`Cache miss: ${key} in ${Date.now() - startTime}ms`);
      return null;

    } catch (error) {
      this.metrics.errors++;
      this.logger?.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Multi-tier set: Memory + KV
   */
  async put(key, value, options = {}) {
    const startTime = Date.now();
    const ttl = options.expirationTtl || 3600; // Default 1 hour

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

      // Compress large values
      const compressedValue = this.shouldCompress(serializedValue)
        ? await this.compress(serializedValue)
        : serializedValue;

      // Set in both caches
      this.setInMemory(key, serializedValue);
      await this.setInKV(key, compressedValue, { expirationTtl: ttl, compressed: this.shouldCompress(serializedValue) });

      this.metrics.writes++;
      this.logger?.debug(`Cache set: ${key} in ${Date.now() - startTime}ms`);

      return true;
    } catch (error) {
      this.metrics.errors++;
      this.logger?.error(`Cache set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete from all cache tiers
   */
  async delete(key) {
    try {
      this.memoryCache.delete(key);
      await this.kv?.delete(key);
      this.logger?.debug(`Cache delete: ${key}`);
      return true;
    } catch (error) {
      this.logger?.error(`Cache delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Memory cache operations
   */
  getFromMemory(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    entry.lastAccessed = Date.now();
    return entry.value;
  }

  setInMemory(key, value) {
    // Evict oldest if at capacity
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      this.evictOldest();
    }

    this.memoryCache.set(key, {
      value: value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + this.memoryCacheTTL
    });
  }

  /**
   * KV store operations
   */
  async getFromKV(key) {
    if (!this.kv) return null;

    const result = await this.kv.get(key, { type: 'text' });
    if (!result) return null;

    // Handle compressed data
    const metadata = await this.kv.get(`${key}:meta`, { type: 'json' });
    if (metadata?.compressed) {
      return await this.decompress(result);
    }

    return result;
  }

  async setInKV(key, value, options = {}) {
    if (!this.kv) return false;

    await this.kv.put(key, value, { expirationTtl: options.expirationTtl });

    // Store metadata for compressed items
    if (options.compressed) {
      await this.kv.put(`${key}:meta`, JSON.stringify({ compressed: true }), {
        expirationTtl: options.expirationTtl
      });
    }

    return true;
  }

  /**
   * Cache warming for critical data
   */
  async warmCache(warmingSpecs) {
    const results = [];

    for (const spec of warmingSpecs) {
      try {
        const { key, fetcher, ttl = 3600 } = spec;

        // Check if already cached
        const existing = await this.get(key);
        if (existing) {
          this.logger?.debug(`Cache warm skip (exists): ${key}`);
          continue;
        }

        // Fetch and cache
        const data = await fetcher();
        await this.put(key, data, { expirationTtl: ttl });

        results.push({ key, status: 'warmed' });
        this.logger?.info(`Cache warmed: ${key}`);

      } catch (error) {
        results.push({ key: spec.key, status: 'error', error: error.message });
        this.logger?.error(`Cache warm failed for ${spec.key}:`, error);
      }
    }

    return results;
  }

  /**
   * Cache-aside pattern implementation
   */
  async getOrSet(key, fetcher, options = {}) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    try {
      const data = await fetcher();
      await this.put(key, data, options);
      return data;
    } catch (error) {
      this.logger?.error(`Cache getOrSet fetcher failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async getBatch(keys) {
    const results = {};
    const promises = keys.map(async (key) => {
      const value = await this.get(key);
      return { key, value };
    });

    const resolved = await Promise.allSettled(promises);
    resolved.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results[keys[index]] = result.value.value;
      }
    });

    return results;
  }

  async setBatch(items) {
    const promises = items.map(({ key, value, options }) =>
      this.put(key, value, options)
    );

    const results = await Promise.allSettled(promises);
    return results.map((result, index) => ({
      key: items[index].key,
      success: result.status === 'fulfilled' && result.value
    }));
  }

  /**
   * Memory management - Optimized eviction using entries iterator
   */
  evictOldest() {
    if (this.memoryCache.size === 0) return;
    
    // Find the entry with the oldest lastAccessed time
    const entries = Array.from(this.memoryCache.entries());
    const oldest = entries.reduce((min, [key, entry]) => {
      return entry.lastAccessed < min.entry.lastAccessed ? { key, entry } : min;
    }, { key: entries[0][0], entry: entries[0][1] });

    this.memoryCache.delete(oldest.key);
    this.logger?.debug(`Evicted oldest cache entry: ${oldest.key}`);
  }

  /**
   * Compression utilities - using gzip for better compression
   */
  shouldCompress(value) {
    return typeof value === 'string' && value.length > 1024; // Compress if > 1KB
  }

  async compress(value) {
    try {
      const buffer = Buffer.from(value, 'utf-8');
      const compressed = await gzipAsync(buffer);
      return compressed.toString('base64');
    } catch (error) {
      this.logger?.error('Compression error:', error);
      return value; // Return uncompressed on error
    }
  }

  async decompress(value) {
    try {
      const buffer = Buffer.from(value, 'base64');
      const decompressed = await gunzipAsync(buffer);
      return decompressed.toString('utf-8');
    } catch (error) {
      this.logger?.warn('Decompression error, returning as-is:', error);
      return value; // Return as-is if not compressed or error
    }
  }

  /**
   * Cache statistics and monitoring
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests * 100).toFixed(2) : 0;

    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      memoryCapacity: this.maxMemoryCacheSize,
      memoryCacheTTL: this.memoryCacheTTL
    };
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();
    // Note: KV clear would require listing all keys first
    this.logger?.info('Memory cache cleared');
  }

  /**
   * Cache health check
   */
  async healthCheck() {
    try {
      const testKey = 'health:test:' + Date.now();
      const testValue = 'health-check';

      await this.put(testKey, testValue, { expirationTtl: 60 });
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      return {
        status: retrieved === testValue ? 'healthy' : 'degraded',
        latency: 'measured',
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats()
      };
    }
  }
}

export default CacheService;