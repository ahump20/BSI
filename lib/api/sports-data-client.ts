/**
 * Blaze Sports Intel - Unified Sports Data Client
 * Production-grade API client for professional and college sports data
 *
 * Data Sources:
 * - SportsDataIO: MLB, NFL, NBA, NCAA comprehensive data
 * - MLB StatsAPI: Official MLB statistics (free)
 * - ESPN API: Live scores, standings, college sports
 * - CollegeFootballData: NCAA football analytics
 *
 * Features:
 * - Exponential backoff retry logic
 * - Automatic rate limit handling
 * - Transparent caching with TTL
 * - America/Chicago timezone for all timestamps
 * - Zero placeholder data - always real or error
 */

import { DateTime } from 'luxon';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cacheTTL?: number;
}

export interface DataSource {
  provider: string;
  url: string;
  retrievedAt: string; // ISO8601 in America/Chicago
  cacheHit: boolean;
  ttl: number; // seconds
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  source: DataSource;
  error?: ApiError | null;
}

export interface ApiError {
  message: string;
  status: number;
  provider: string;
  timestamp: string;
  retryable: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// ============================================================================
// Sports Data Client
// ============================================================================

export class SportsDataClient {
  private configs: Map<string, ApiConfig>;
  private rateLimits: Map<string, RateLimitInfo>;
  private cache: Map<string, { data: unknown; expires: number }>;

  /**
   * @param env - Cloudflare env bindings (Workers) or undefined (Node.js)
   */
  constructor(env?: any) {
    this.configs = new Map();
    this.rateLimits = new Map();
    this.cache = new Map();
    this.initializeProviders(env);
  }

  /**
   * Initialize all API provider configurations
   * Works in both Node.js and Cloudflare Workers
   *
   * @param env - Cloudflare env bindings (Workers) or undefined (Node.js)
   */
  private initializeProviders(env?: any): void {
    // Get API keys from env bindings (Workers) or process.env (Node.js)
    const sportsDataIOKey =
      env?.SPORTSDATAIO_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.SPORTSDATAIO_API_KEY : null) ||
      '';

    const cfbdKey =
      env?.COLLEGEFOOTBALLDATA_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.COLLEGEFOOTBALLDATA_API_KEY : null) ||
      '';

    // SportsDataIO - Comprehensive pro/college sports data
    this.configs.set('sportsdataio', {
      baseUrl: 'https://api.sportsdata.io/v3',
      apiKey: sportsDataIOKey,
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        Accept: 'application/json',
      },
      timeout: 10000,
      retries: 3,
      cacheTTL: 300, // 5 minutes
    });

    // MLB StatsAPI - Official MLB data (FREE)
    this.configs.set('mlb-statsapi', {
      baseUrl: 'https://statsapi.mlb.com/api/v1',
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        Accept: 'application/json',
      },
      timeout: 8000,
      retries: 3,
      cacheTTL: 60, // 1 minute for live data
    });

    // ESPN API - Live scores, standings, college sports
    this.configs.set('espn', {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        Accept: 'application/json',
        Referer: 'https://blazesportsintel.com',
      },
      timeout: 8000,
      retries: 3,
      cacheTTL: 180, // 3 minutes
    });

    // College Football Data API
    this.configs.set('cfbd', {
      baseUrl: 'https://api.collegefootballdata.com',
      apiKey: cfbdKey,
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        Accept: 'application/json',
      },
      timeout: 10000,
      retries: 3,
      cacheTTL: 300,
    });
  }

  /**
   * Main fetch method - handles caching, retries, rate limits
   */
  async fetch<T>(
    provider: string,
    endpoint: string,
    options: {
      params?: Record<string, string>;
      skipCache?: boolean;
      customTTL?: number;
    } = {}
  ): Promise<ApiResponse<T>> {
    const config = this.configs.get(provider);
    if (!config) {
      return this.errorResponse(`Unknown provider: ${provider}`, 500, provider, false);
    }

    // Check rate limits
    await this.checkRateLimit(provider);

    // Build cache key
    const cacheKey = this.buildCacheKey(provider, endpoint, options.params);

    // Check cache first unless explicitly skipped
    if (!options.skipCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          source: this.buildDataSource(
            provider,
            endpoint,
            true,
            options.customTTL || config.cacheTTL!
          ),
          error: null,
        };
      }
    }

    // Build full URL
    const url = this.buildUrl(config.baseUrl, endpoint, options.params);

    // Fetch with retry logic
    try {
      const data = await this.fetchWithRetry<T>(url, config, provider);
      const ttl = options.customTTL || config.cacheTTL || 300;

      // Cache successful response
      this.setCache(cacheKey, data, ttl);

      return {
        success: true,
        data,
        source: this.buildDataSource(provider, url, false, ttl),
        error: null,
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        data: undefined,
        source: this.buildDataSource(provider, url, false, 0),
        error: apiError,
      };
    }
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry<T>(
    url: string,
    config: ApiConfig,
    provider: string,
    attempt = 1
  ): Promise<T> {
    const headers: Record<string, string> = { ...config.headers };

    // Add API key based on provider
    if (config.apiKey) {
      if (provider === 'sportsdataio') {
        url += `${url.includes('?') ? '&' : '?'}key=${config.apiKey}`;
      } else if (provider === 'cfbd') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeout || 10000);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Update rate limit tracking
      this.updateRateLimit(provider, response);

      // Handle non-OK responses
      if (!response.ok) {
        if (response.status === 429 && attempt < (config.retries || 3)) {
          // Rate limited - exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 16000);
          await this.sleep(waitTime);
          return this.fetchWithRetry<T>(url, config, provider, attempt + 1);
        }

        throw this.createError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          provider,
          response.status >= 500 // 5xx errors are retryable
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (attempt < (config.retries || 3)) {
        // Exponential backoff with jitter
        const baseWait = 250 * Math.pow(2, attempt);
        const jitter = Math.random() * 250;
        await this.sleep(baseWait + jitter);
        return this.fetchWithRetry<T>(url, config, provider, attempt + 1);
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('Request timeout', 408, provider, true);
        }
        throw error; // Re-throw if already ApiError
      }

      throw this.createError('Unknown error occurred', 500, provider, false);
    }
  }

  /**
   * Check and wait for rate limit if necessary
   */
  private async checkRateLimit(provider: string): Promise<void> {
    const limit = this.rateLimits.get(provider);
    if (!limit) return;

    if (limit.remaining === 0) {
      const now = Date.now();
      if (now < limit.reset) {
        const waitTime = limit.reset - now;
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimit(provider: string, response: Response): void {
    const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

    if (limit > 0) {
      this.rateLimits.set(provider, {
        limit,
        remaining,
        reset: reset * 1000, // Convert to ms
      });
    }
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(baseUrl: string, endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Build cache key from provider, endpoint, and params
   */
  private buildCacheKey(
    provider: string,
    endpoint: string,
    params?: Record<string, string>
  ): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${provider}:${endpoint}:${paramStr}`;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set data in cache with TTL
   */
  private setCache(key: string, data: unknown, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Build DataSource object for transparency
   */
  private buildDataSource(
    provider: string,
    url: string,
    cacheHit: boolean,
    ttl: number
  ): DataSource {
    return {
      provider,
      url,
      retrievedAt: DateTime.now().setZone('America/Chicago').toISO() || new Date().toISOString(),
      cacheHit,
      ttl,
    };
  }

  /**
   * Create standardized API error
   */
  private createError(
    message: string,
    status: number,
    provider: string,
    retryable: boolean
  ): ApiError {
    return {
      message,
      status,
      provider,
      timestamp: DateTime.now().setZone('America/Chicago').toISO() || new Date().toISOString(),
      retryable,
    };
  }

  /**
   * Create error response
   */
  private errorResponse<T>(
    message: string,
    status: number,
    provider: string,
    retryable: boolean
  ): ApiResponse<T> {
    return {
      success: false,
      data: undefined,
      source: this.buildDataSource(provider, '', false, 0),
      error: this.createError(message, status, provider, retryable),
    };
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (specific provider or all)
   */
  clearCache(provider?: string): void {
    if (provider) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${provider}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; providers: Record<string, number> } {
    const providers: Record<string, number> = {};

    for (const key of this.cache.keys()) {
      const provider = key.split(':')[0];
      providers[provider] = (providers[provider] || 0) + 1;
    }

    return {
      size: this.cache.size,
      providers,
    };
  }

  /**
   * Get rate limit status for a provider
   */
  getRateLimitStatus(provider: string): RateLimitInfo | null {
    return this.rateLimits.get(provider) || null;
  }
}

// ============================================================================
// Singleton Export / Factory Function
// ============================================================================

/**
 * Global instance for convenience (Node.js only)
 * Returns null in Cloudflare Workers - use createSportsDataClient(env) instead
 *
 * @example Node.js
 * import { sportsDataClient } from './sports-data-client';
 * const data = await sportsDataClient.fetch('espn', '/football/nfl/scoreboard');
 *
 * @example Cloudflare Workers
 * import { createSportsDataClient } from './sports-data-client';
 * export async function onRequest({ request, env }) {
 *   const client = createSportsDataClient(env);
 *   const data = await client.fetch('espn', '/football/nfl/scoreboard');
 * }
 */
export const sportsDataClient = typeof process !== 'undefined' ? new SportsDataClient() : null; // null in Workers - must use createSportsDataClient(env)

/**
 * Factory function for creating SportsDataClient in Cloudflare Workers
 *
 * @param env - Cloudflare env bindings with API keys
 * @returns SportsDataClient instance configured with env bindings
 */
export function createSportsDataClient(env: any): SportsDataClient {
  return new SportsDataClient(env);
}
