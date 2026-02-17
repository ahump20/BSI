/**
 * Shared utilities for Cloudflare Pages Functions.
 *
 * Provides CORS headers, response helpers, caching, rate limiting,
 * record validators, and API key resolution.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

interface KVBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  [key: string]: unknown;
  CACHE?: KVBinding;
  KV?: KVBinding;
  SPORTS_DATA_IO_API_KEY?: string;
}

interface TeamRecordInput {
  wins?: number;
  losses?: number;
  currentWins?: number;
  gamesPlayed?: number;
  games?: number;
}

interface ValidRecord {
  valid: true;
  record: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    displayRecord: string;
    winningPercentage?: string;
  };
}

interface InvalidRecord {
  valid: false;
  errors: string[];
}

type RecordValidation = ValidRecord | InvalidRecord;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
  retryAfter?: number;
}

// ---------------------------------------------------------------------------
// CORS + security headers
// ---------------------------------------------------------------------------

const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.posthog.com https://us.i.posthog.com https://api.stripe.com wss://live.blazesportsintel.com",
    "frame-src 'self' https://*.cloudflarestream.com https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

export const corsHeaders: Record<string, string> = {
  ...DEFAULT_CORS_HEADERS,
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export const ok = (data: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });

export const err = (error: unknown, status = 500, init: ResponseInit = {}): Response => {
  const message = error instanceof Error && error.message ? error.message : 'Internal Server Error';

  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...corsHeaders,
        ...(init.headers || {}),
      },
    }
  );
};

export const preflight = (): Response => new Response(null, { headers: corsHeaders });

// ---------------------------------------------------------------------------
// KV cache
// ---------------------------------------------------------------------------

const getCacheBinding = (env: Env): KVBinding | null => {
  if (!env || typeof env !== 'object') return null;

  const candidates = ['CACHE', 'KV', 'kv', 'cache'] as const;
  for (const key of candidates) {
    const binding = env[key];
    if (binding && typeof (binding as KVBinding).get === 'function' && typeof (binding as KVBinding).put === 'function') {
      return binding as KVBinding;
    }
  }

  return null;
};

export const cache = async <T>(env: Env, key: string, fetcher: () => Promise<T>, ttl = 300): Promise<T> => {
  const store = getCacheBinding(env);
  if (!store || typeof fetcher !== 'function') {
    return fetcher();
  }

  const now = Date.now();
  try {
    const cached = await store.get(key);
    if (cached) {
      const parsed = JSON.parse(cached) as { expires?: number; data?: T };
      if (parsed && parsed.expires && parsed.expires > now) {
        return parsed.data as T;
      }
    }
  } catch {
    // Cache miss — fetch fresh data
  }

  const fresh = await fetcher();

  try {
    await store.put(
      key,
      JSON.stringify({ data: fresh, expires: now + ttl * 1000 }),
      { expirationTtl: ttl }
    );
  } catch {
    // Cache write failure — non-critical
  }

  return fresh;
};

// ---------------------------------------------------------------------------
// Timeout + retry
// ---------------------------------------------------------------------------

export const createTimeoutSignal = (timeoutMs = 8000): AbortSignal => {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  (timer as unknown as { unref?: () => void }).unref?.();
  return controller.signal;
};

/** Exponential backoff retry wrapper. */
export const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 250): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const jitter = Math.random() * 100;
        const delay = baseDelay * Math.pow(2, attempt) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/** Fetch with timeout wrapper. */
export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
  const signal = createTimeoutSignal(timeout);

  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Record validators
// ---------------------------------------------------------------------------

/** Validate NFL team record consistency. */
export const validateNFLRecord = (team: TeamRecordInput): RecordValidation => {
  const { currentWins = 0, gamesPlayed = 0, games = 17 } = team;
  const currentLosses = gamesPlayed - currentWins;
  const errors: string[] = [];

  if (currentWins < 0) errors.push(`Invalid wins: ${currentWins} (must be >= 0)`);
  if (currentWins > gamesPlayed) errors.push(`Wins (${currentWins}) exceed games played (${gamesPlayed})`);
  if (gamesPlayed > games) errors.push(`Games played (${gamesPlayed}) exceed season total (${games})`);
  if (currentWins + currentLosses !== gamesPlayed) {
    errors.push(`Wins (${currentWins}) + Losses (${currentLosses}) != Games Played (${gamesPlayed})`);
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    record: { wins: currentWins, losses: currentLosses, gamesPlayed, displayRecord: `${currentWins}-${currentLosses}` },
  };
};

/** Validate MLB team record consistency. */
export const validateMLBRecord = (team: TeamRecordInput): RecordValidation => {
  const { wins = 0, losses = 0, gamesPlayed = 0, games = 162 } = team;
  const errors: string[] = [];

  if (wins < 0) errors.push(`Invalid wins: ${wins} (must be >= 0)`);
  if (losses < 0) errors.push(`Invalid losses: ${losses} (must be >= 0)`);
  if (wins > gamesPlayed) errors.push(`Wins (${wins}) exceed games played (${gamesPlayed})`);
  if (gamesPlayed > games) errors.push(`Games played (${gamesPlayed}) exceed season total (${games})`);
  if (wins + losses !== gamesPlayed) errors.push(`Wins (${wins}) + Losses (${losses}) != Games Played (${gamesPlayed})`);

  if (errors.length > 0) return { valid: false, errors };

  const winningPercentage = gamesPlayed > 0 ? (wins / gamesPlayed).toFixed(3) : '.000';
  return {
    valid: true,
    record: { wins, losses, gamesPlayed, winningPercentage, displayRecord: `${wins}-${losses}` },
  };
};

/** Validate NBA team record consistency. */
export const validateNBARecord = (team: TeamRecordInput): RecordValidation => {
  const { wins = 0, losses = 0, gamesPlayed = 0, games = 82 } = team;
  const errors: string[] = [];

  if (wins < 0) errors.push(`Invalid wins: ${wins} (must be >= 0)`);
  if (losses < 0) errors.push(`Invalid losses: ${losses} (must be >= 0)`);
  if (wins > gamesPlayed) errors.push(`Wins (${wins}) exceed games played (${gamesPlayed})`);
  if (gamesPlayed > games) errors.push(`Games played (${gamesPlayed}) exceed season total (${games})`);
  if (wins + losses !== gamesPlayed) errors.push(`Wins (${wins}) + Losses (${losses}) != Games Played (${gamesPlayed})`);

  if (errors.length > 0) return { valid: false, errors };

  const winningPercentage = gamesPlayed > 0 ? (wins / gamesPlayed).toFixed(3) : '.000';
  return {
    valid: true,
    record: { wins, losses, gamesPlayed, winningPercentage, displayRecord: `${wins}-${losses}` },
  };
};

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

export const rateLimit = async (env: Env, request: Request, maxRequests = 100, windowMs = 60000): Promise<RateLimitResult> => {
  const store = getCacheBinding(env);
  if (!store) return { allowed: true, remaining: maxRequests, resetAt: null };

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const rateLimitKey = `ratelimit:${ip}:${windowKey}`;

  try {
    const current = await store.get(rateLimitKey);
    const count = current ? parseInt(current) : 0;

    if (count >= maxRequests) {
      const resetAt = new Date((windowKey + 1) * windowMs);
      return { allowed: false, remaining: 0, resetAt, retryAfter: Math.ceil((resetAt.getTime() - now) / 1000) };
    }

    await store.put(rateLimitKey, String(count + 1), { expirationTtl: Math.ceil(windowMs / 1000) + 10 });

    return { allowed: true, remaining: maxRequests - count - 1, resetAt: new Date((windowKey + 1) * windowMs) };
  } catch {
    return { allowed: true, remaining: maxRequests, resetAt: null };
  }
};

export const rateLimitError = (resetAt: Date | null, retryAfter?: number): Response => {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfter || 60,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Retry-After': String(retryAfter || 60),
        'X-RateLimit-Reset': resetAt ? resetAt.toISOString() : '',
      },
    }
  );
};

// ---------------------------------------------------------------------------
// API key resolution
// ---------------------------------------------------------------------------

/** Resolve SportsDataIO API key from environment bindings. */
export const getSportsDataApiKey = (env: Env): string | null => {
  if (!env || typeof env !== 'object') return null;
  return (env.SPORTS_DATA_IO_API_KEY as string) || null;
};
