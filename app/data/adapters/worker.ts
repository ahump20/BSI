// Enhanced worker adapter with retry, circuit breaker, and metrics

import {
  schema,
  type KPIData,
  type SeriesData,
  type AlertBucket,
  type Team,
  type Player,
} from '../schema';
import { cache } from '../cache';

const BASE = 'https://blaze-data-layer-prod.humphrey-austin20.workers.dev';

// Circuit breaker implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
      }
      throw error;
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}

const breaker = new CircuitBreaker();

// Request metrics
class RequestMetrics {
  private metrics = new Map<string, { count: number; totalTime: number; errors: number }>();

  record(path: string, time: number, error?: boolean): void {
    const current = this.metrics.get(path) || { count: 0, totalTime: 0, errors: 0 };
    current.count++;
    current.totalTime += time;
    if (error) current.errors++;
    this.metrics.set(path, current);
  }

  getStats(path?: string): any {
    if (path) {
      const m = this.metrics.get(path);
      if (!m) return null;
      return {
        ...m,
        avgTime: m.count ? m.totalTime / m.count : 0,
        errorRate: m.count ? m.errors / m.count : 0,
      };
    }

    const all: any = {};
    this.metrics.forEach((m, p) => {
      all[p] = {
        ...m,
        avgTime: m.count ? m.totalTime / m.count : 0,
        errorRate: m.count ? m.errors / m.count : 0,
      };
    });
    return all;
  }
}

const metrics = new RequestMetrics();

// Enhanced fetch with retry logic
async function fetchWithRetry(
  url: string,
  options: RequestInit & { retries?: number; retryDelay?: number } = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok || attempt === retries) {
        return response;
      }

      // Retry on 5xx errors
      if (response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  throw new Error('Max retries exceeded');
}

// Main request function with metrics and circuit breaker
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const start = Date.now();

  try {
    return await breaker.execute(async () => {
      const response = await fetchWithRetry(`${BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`${path} -> ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      metrics.record(path, Date.now() - start);
      return data as T;
    });
  } catch (error) {
    metrics.record(path, Date.now() - start, true);
    throw error;
  }
}

// Public API with caching
export async function getKPI(): Promise<KPIData> {
  return cache.get('kpi', () => request<any>('/kpi').then(schema.kpi), {
    ttl: 30000,
    staleWhileRevalidate: true,
  });
}

export async function getAccuracy(): Promise<SeriesData> {
  return cache.get(
    'accuracy',
    () => request<any>('/analytics/accuracy').then(schema.accuracySeries),
    { ttl: 60000 }
  );
}

export async function getAlerts(): Promise<AlertBucket> {
  return cache.get('alerts', () => request<any>('/alerts/buckets').then(schema.alertBuckets), {
    ttl: 30000,
  });
}

export async function getTeams(league: string): Promise<Team[]> {
  return cache.get(
    `teams:${league}`,
    () => request<any>(`/teams/${encodeURIComponent(league)}`).then(schema.teams),
    { ttl: 300000 } // 5 minutes
  );
}

export async function getLeaderboard(): Promise<Player[]> {
  return cache.get(
    'leaderboard',
    () => request<any>('/multiplayer/leaderboard').then(schema.leaderboard),
    { ttl: 10000 }
  );
}

export async function simulateMatch(): Promise<Player[]> {
  cache.invalidate('leaderboard');
  const data = await request<any>('/multiplayer/leaderboard/simulate', { method: 'POST' });
  const validated = schema.leaderboard(data);
  cache.preload('leaderboard', validated);
  return validated;
}

export async function getYearlyTrend(): Promise<SeriesData> {
  return cache.get(
    'yearly-trend',
    () => request<any>('/analytics/yearly-trend').then(schema.accuracySeries),
    { ttl: 300000 }
  );
}

// Batch operations
export async function getBatchData<T extends Record<string, () => Promise<any>>>(
  requests: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(requests);
  const results = await Promise.allSettled(entries.map(([_, fn]) => fn()));

  const data: any = {};
  entries.forEach(([key], index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      data[key] = result.value;
    } else {
      data[key] = null;
    }
  });

  return data;
}

// Health check
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  cache: { size: number };
  metrics: any;
}> {
  const start = Date.now();

  try {
    await request('/health');
    return {
      status: 'healthy',
      latency: Date.now() - start,
      cache: cache.getStats(),
      metrics: metrics.getStats(),
    };
  } catch (_error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      cache: cache.getStats(),
      metrics: metrics.getStats(),
    };
  }
}

// Export utilities
export { cache, metrics, breaker };
