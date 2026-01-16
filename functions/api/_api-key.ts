/**
 * BLAZE SPORTS INTEL - API KEY VALIDATION
 *
 * Validates API keys, enforces rate limits, and tracks usage.
 * Use this in endpoints that should accept API key authentication.
 *
 * Usage:
 *   const auth = await validateApiKey(request, env);
 *   if (!auth.valid) return auth.errorResponse;
 *   // auth.userId, auth.keyId, auth.scopes available
 *
 * @version 1.0.0
 * @updated 2025-12-10
 */

interface ApiKeyEnv {
  DB: D1Database;
  KV: KVNamespace;
}

interface ApiKeyValidation {
  valid: boolean;
  userId?: string;
  keyId?: string;
  scopes?: string[];
  rateLimit?: number;
  errorResponse?: Response;
}

interface CachedKeyData {
  userId: string;
  keyId: string;
  scopes: string[];
  rateLimit: number;
  expiresAt: number | null;
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * Validate an API key from request headers
 * Checks X-API-Key header or Authorization: Bearer bsi_live_xxx
 */
export async function validateApiKey(request: Request, env: ApiKeyEnv): Promise<ApiKeyValidation> {
  // Extract API key from headers
  const apiKey =
    request.headers.get('X-API-Key') || extractBearerToken(request.headers.get('Authorization'));

  if (!apiKey) {
    return {
      valid: false,
      errorResponse: new Response(
        JSON.stringify({
          error: 'API key required',
          message: 'Provide API key via X-API-Key header or Authorization: Bearer <key>',
        }),
        { status: 401, headers: corsHeaders }
      ),
    };
  }

  // Validate key format
  if (!apiKey.startsWith('bsi_live_') || apiKey.length !== 56) {
    return {
      valid: false,
      errorResponse: new Response(
        JSON.stringify({
          error: 'Invalid API key format',
          message: 'API keys should start with bsi_live_ and be 56 characters',
        }),
        { status: 401, headers: corsHeaders }
      ),
    };
  }

  const _keyPrefix = apiKey.substring(0, 8);
  const keyHash = await hashApiKey(apiKey);

  // Check KV cache first
  const cacheKey = `apikey:hash:${keyHash}`;
  const cached = (await env.KV.get(cacheKey, 'json')) as CachedKeyData | null;

  let keyData: CachedKeyData;

  if (cached) {
    keyData = cached;
  } else {
    // Look up in database
    const result = await env.DB.prepare(
      `SELECT id, user_id, scopes, rate_limit, expires_at
       FROM api_keys
       WHERE key_hash = ? AND revoked_at IS NULL`
    )
      .bind(keyHash)
      .first<{
        id: string;
        user_id: string;
        scopes: string;
        rate_limit: number;
        expires_at: number | null;
      }>();

    if (!result) {
      return {
        valid: false,
        errorResponse: new Response(
          JSON.stringify({
            error: 'Invalid API key',
            message: 'API key not found or has been revoked',
          }),
          { status: 401, headers: corsHeaders }
        ),
      };
    }

    keyData = {
      userId: result.user_id,
      keyId: result.id,
      scopes: result.scopes ? result.scopes.split(',') : ['read'],
      rateLimit: result.rate_limit,
      expiresAt: result.expires_at,
    };

    // Cache for 5 minutes
    await env.KV.put(cacheKey, JSON.stringify(keyData), { expirationTtl: 300 });
  }

  // Check expiration
  if (keyData.expiresAt && keyData.expiresAt < Math.floor(Date.now() / 1000)) {
    return {
      valid: false,
      errorResponse: new Response(
        JSON.stringify({
          error: 'API key expired',
          message: 'This API key has expired. Please generate a new one.',
        }),
        { status: 401, headers: corsHeaders }
      ),
    };
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(keyData.keyId, keyData.rateLimit, env);
  if (!rateLimitResult.allowed) {
    return {
      valid: false,
      errorResponse: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `You have exceeded your rate limit of ${keyData.rateLimit} requests per day`,
          limit: keyData.rateLimit,
          remaining: 0,
          resetAt: rateLimitResult.resetAt,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': String(keyData.rateLimit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
            'Retry-After': String(rateLimitResult.resetAt - Math.floor(Date.now() / 1000)),
          },
        }
      ),
    };
  }

  // Update last used timestamp (async, don't wait)
  updateLastUsed(keyData.keyId, env).catch(() => {});

  return {
    valid: true,
    userId: keyData.userId,
    keyId: keyData.keyId,
    scopes: keyData.scopes,
    rateLimit: keyData.rateLimit,
  };
}

/**
 * Check if request has required scope
 */
export function hasScope(auth: ApiKeyValidation, requiredScope: string): boolean {
  return auth.scopes?.includes(requiredScope) || auth.scopes?.includes('write') || false;
}

/**
 * Create rate limit headers for successful responses
 */
export async function getRateLimitHeaders(
  keyId: string,
  rateLimit: number,
  env: ApiKeyEnv
): Promise<Record<string, string>> {
  const now = Math.floor(Date.now() / 1000);
  const dayStart = now - (now % 86400);
  const resetAt = dayStart + 86400;

  const countKey = `ratelimit:${keyId}:${dayStart}`;
  const countStr = await env.KV.get(countKey);
  const count = countStr ? parseInt(countStr) : 0;

  const remaining = rateLimit === -1 ? 999999 : Math.max(0, rateLimit - count);

  return {
    'X-RateLimit-Limit': String(rateLimit === -1 ? 'unlimited' : rateLimit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetAt),
  };
}

/**
 * Track API usage for analytics
 */
export async function trackUsage(
  keyId: string,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  env: ApiKeyEnv
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO api_usage (key_id, user_id, endpoint, method, status_code, response_time_ms)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(keyId, userId, endpoint, method, statusCode, responseTimeMs)
      .run();
  } catch (error) {
    console.error('Failed to track API usage:', error);
  }
}

// --- Internal helpers ---

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  // Only return if it looks like an API key, not a JWT
  return token.startsWith('bsi_') ? token : null;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function checkRateLimit(
  keyId: string,
  limit: number,
  env: ApiKeyEnv
): Promise<{ allowed: boolean; resetAt: number }> {
  // Unlimited
  if (limit === -1) {
    return { allowed: true, resetAt: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const dayStart = now - (now % 86400);
  const resetAt = dayStart + 86400;
  const countKey = `ratelimit:${keyId}:${dayStart}`;

  const countStr = await env.KV.get(countKey);
  const count = countStr ? parseInt(countStr) : 0;

  if (count >= limit) {
    return { allowed: false, resetAt };
  }

  // Increment count
  await env.KV.put(countKey, String(count + 1), {
    expirationTtl: 86400, // Expire after 24 hours
  });

  return { allowed: true, resetAt };
}

async function updateLastUsed(keyId: string, env: ApiKeyEnv): Promise<void> {
  try {
    await env.DB.prepare('UPDATE api_keys SET last_used_at = unixepoch() WHERE id = ?')
      .bind(keyId)
      .run();
  } catch {
    // Ignore errors - this is non-critical
  }
}
