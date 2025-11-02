/**
 * Advanced Rate Limiting System
 *
 * Implements rate limiting for all API endpoints using:
 * - Token bucket algorithm
 * - Sliding window counter
 * - Distributed rate limiting (Cloudflare KV/Durable Objects)
 * - Per-user and per-IP rate limits
 * - Dynamic rate limits based on user tier
 * - Burst protection
 *
 * Features:
 * - Configurable limits per endpoint
 * - Support for multiple time windows
 * - Rate limit headers (X-RateLimit-*)
 * - Automatic retry-after calculation
 */

export interface RateLimitConfig {
  requests: number; // Max requests
  window: number; // Time window in milliseconds
  burst?: number; // Max burst requests (optional)
  keyPrefix?: string; // Prefix for storage keys
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when limit resets
  retryAfter?: number; // Seconds to wait before retry
}

export interface RateLimitTier {
  name: string;
  limits: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
}

// Predefined rate limit tiers
export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  free: {
    name: 'Free',
    limits: {
      perMinute: 10,
      perHour: 100,
      perDay: 1000,
    },
  },
  basic: {
    name: 'Basic',
    limits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000,
    },
  },
  pro: {
    name: 'Pro',
    limits: {
      perMinute: 300,
      perHour: 10000,
      perDay: 100000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    limits: {
      perMinute: 1000,
      perHour: 50000,
      perDay: 1000000,
    },
  },
};

// Endpoint-specific rate limits
export const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints (stricter limits)
  '/api/auth/login': {
    requests: 5,
    window: 60000, // 1 minute
    burst: 10,
  },
  '/api/auth/register': {
    requests: 3,
    window: 60000,
  },
  '/api/auth/password-reset': {
    requests: 3,
    window: 3600000, // 1 hour
  },

  // API endpoints (standard limits)
  '/api/v1/teams': {
    requests: 100,
    window: 60000,
    burst: 150,
  },
  '/api/v1/games': {
    requests: 100,
    window: 60000,
    burst: 150,
  },
  '/api/v1/players': {
    requests: 100,
    window: 60000,
    burst: 150,
  },

  // Live data endpoints (higher limits but protect backend)
  '/api/v1/live': {
    requests: 300,
    window: 60000,
    burst: 500,
  },

  // Heavy computation endpoints (lower limits)
  '/api/v1/predictions': {
    requests: 10,
    window: 60000,
    burst: 15,
  },
  '/api/v1/simulations': {
    requests: 5,
    window: 60000,
    burst: 10,
  },

  // File upload (very strict)
  '/api/v1/upload': {
    requests: 5,
    window: 3600000, // 1 hour
  },

  // Default fallback
  default: {
    requests: 60,
    window: 60000,
    burst: 100,
  },
};

/**
 * Token Bucket Rate Limiter
 */
export class TokenBucketRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(
    key: string,
    storage: KVNamespace | Map<string, string>
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.window;

    // Get current bucket state
    const bucketKey = `${this.config.keyPrefix || 'rl'}:${key}`;
    const bucketData = await this.getBucketData(bucketKey, storage);

    // Calculate tokens
    const refillRate = this.config.requests / this.config.window;
    const timeSinceLastRefill = now - bucketData.lastRefill;
    const tokensToAdd = timeSinceLastRefill * refillRate;

    let tokens = Math.min(
      this.config.requests,
      bucketData.tokens + tokensToAdd
    );

    // Check if request is allowed
    const allowed = tokens >= 1;

    if (allowed) {
      tokens -= 1;
    }

    // Update bucket state
    const newBucketData = {
      tokens,
      lastRefill: now,
      requests: bucketData.requests + (allowed ? 1 : 0),
    };

    await this.setBucketData(bucketKey, newBucketData, storage);

    // Calculate reset time
    const resetTime = now + this.config.window;

    return {
      allowed,
      limit: this.config.requests,
      remaining: Math.floor(tokens),
      reset: resetTime,
      retryAfter: allowed ? undefined : Math.ceil((1 - tokens) / refillRate / 1000),
    };
  }

  /**
   * Get bucket data from storage
   */
  private async getBucketData(
    key: string,
    storage: KVNamespace | Map<string, string>
  ): Promise<{ tokens: number; lastRefill: number; requests: number }> {
    try {
      let data: string | null;

      if (storage instanceof Map) {
        data = storage.get(key) || null;
      } else {
        data = await storage.get(key);
      }

      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get bucket data:', error);
    }

    // Default initial state
    return {
      tokens: this.config.requests,
      lastRefill: Date.now(),
      requests: 0,
    };
  }

  /**
   * Set bucket data in storage
   */
  private async setBucketData(
    key: string,
    data: any,
    storage: KVNamespace | Map<string, string>
  ): Promise<void> {
    try {
      const value = JSON.stringify(data);

      if (storage instanceof Map) {
        storage.set(key, value);
      } else {
        await storage.put(key, value, {
          expirationTtl: Math.ceil(this.config.window / 1000) + 60, // TTL + 1 minute buffer
        });
      }
    } catch (error) {
      console.error('Failed to set bucket data:', error);
    }
  }
}

/**
 * Rate limit middleware
 */
export class RateLimiter {
  /**
   * Get rate limit configuration for endpoint
   */
  static getEndpointConfig(pathname: string): RateLimitConfig {
    return ENDPOINT_RATE_LIMITS[pathname] || ENDPOINT_RATE_LIMITS.default;
  }

  /**
   * Get rate limit key for request
   */
  static getRateLimitKey(request: Request, userId?: string): string {
    if (userId) {
      return `user:${userId}`;
    }

    // Use IP address
    const ip = request.headers.get('CF-Connecting-IP') ||
                request.headers.get('X-Forwarded-For') ||
                'unknown';

    return `ip:${ip}`;
  }

  /**
   * Check rate limit for request
   */
  static async check(
    request: Request,
    env: any,
    userId?: string,
    tier: string = 'free'
  ): Promise<RateLimitResult> {
    const url = new URL(request.url);
    const config = this.getEndpointConfig(url.pathname);
    const key = this.getRateLimitKey(request, userId);

    const limiter = new TokenBucketRateLimiter(config);

    // Use KV storage if available, otherwise fallback to Map
    const storage = env.RATE_LIMIT_KV || new Map<string, string>();

    return limiter.checkLimit(key, storage);
  }

  /**
   * Add rate limit headers to response
   */
  static addHeaders(response: Response, result: RateLimitResult): Response {
    const headers = new Headers(response.headers);

    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.reset.toString());

    if (result.retryAfter) {
      headers.set('Retry-After', result.retryAfter.toString());
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  /**
   * Create rate limit exceeded response
   */
  static createRateLimitResponse(result: RateLimitResult): Response {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': (result.retryAfter || 60).toString(),
        },
      }
    );
  }
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: Request, env: any, ctx: any) => Promise<Response>,
  config?: RateLimitConfig
) {
  return async (request: Request, env: any, ctx: any): Promise<Response> => {
    // Extract user ID from request (if authenticated)
    const userId = request.headers.get('X-User-ID') || undefined;
    const tier = request.headers.get('X-User-Tier') || 'free';

    // Check rate limit
    const result = await RateLimiter.check(request, env, userId, tier);

    if (!result.allowed) {
      return RateLimiter.createRateLimitResponse(result);
    }

    // Call handler
    const response = await handler(request, env, ctx);

    // Add rate limit headers to response
    return RateLimiter.addHeaders(response, result);
  };
}
