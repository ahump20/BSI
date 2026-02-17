// Intelligent caching system with TTL and invalidation

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  key?: string;
}

class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pending = new Map<string, Promise<unknown>>();
  private defaultTTL = 60000; // 1 minute default

  async get<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const ttl = options.ttl ?? this.defaultTTL;
    const now = Date.now();

    // Check for pending request (dedupe)
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    // Stale-while-revalidate
    if (cached && options.staleWhileRevalidate) {
      this.revalidate(key, fetcher, ttl);
      return cached.data;
    }

    // Fetch new data
    const promise = this.fetch(key, fetcher, ttl);
    this.pending.set(key, promise);

    try {
      const data = await promise;
      return data;
    } finally {
      this.pending.delete(key);
    }
  }

  private async fetch<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    return data;
  }

  private async revalidate<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<void> {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      // handled by UI state
    }
  }

  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    const matcher =
      typeof pattern === 'string'
        ? (k: string) => k.includes(pattern)
        : (k: string) => pattern.test(k);

    keys.forEach((key) => {
      if (matcher(key)) {
        this.cache.delete(key);
      }
    });
  }

  preload<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new DataCache();
