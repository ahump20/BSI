/**
 * Create API Key Endpoint
 * Generates a new API key for authenticated users with pro/enterprise tier
 *
 * POST /api/keys/create
 *
 * Request Body:
 * {
 *   name: string,        // Key name/description (required)
 *   scopes?: string[],   // Optional: ['read', 'write'] - default ['read']
 *   expiresIn?: number   // Optional: days until expiration - default null (never)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   key: {
 *     id: string,
 *     name: string,
 *     key: string,        // Full key - ONLY shown once!
 *     prefix: string,     // First 8 chars for identification
 *     scopes: string[],
 *     rateLimit: number,
 *     expiresAt: number | null,
 *     createdAt: number
 *   }
 * }
 */

import { getUserTier as _getUserTier, requireTier, createGateResponse } from '../_feature-gate';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

interface CreateKeyRequest {
  name: string;
  scopes?: string[];
  expiresIn?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Rate limits by tier
const TIER_RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 10000,
  enterprise: -1, // Unlimited
};

// Max keys by tier
const TIER_MAX_KEYS: Record<string, number> = {
  free: 0,
  pro: 5,
  enterprise: 25,
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Authenticate user
  const userId = await authenticateRequest(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Check tier - must be pro or enterprise for API access
  const tierCheck = await requireTier(userId, 'pro', env);
  if (!tierCheck.allowed) {
    return createGateResponse('api-access', tierCheck.currentTier, 'pro');
  }

  // Parse request
  let body: CreateKeyRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Validate name
  if (!body.name || body.name.length < 1 || body.name.length > 100) {
    return new Response(
      JSON.stringify({ success: false, error: 'Name is required (1-100 characters)' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Check key count limit
  const tier = tierCheck.currentTier;
  const maxKeys = TIER_MAX_KEYS[tier] || 0;

  try {
    const keyCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND revoked_at IS NULL'
    )
      .bind(userId)
      .first<{ count: number }>();

    if (keyCount && keyCount.count >= maxKeys) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Maximum ${maxKeys} API keys allowed for ${tier} tier`,
          currentCount: keyCount.count,
          limit: maxKeys,
        }),
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Failed to check key count:', error);
  }

  // Generate API key
  const keyId = crypto.randomUUID();
  const rawKey = generateApiKey();
  const keyPrefix = rawKey.substring(0, 8);
  const keyHash = await hashApiKey(rawKey);

  // Calculate expiration
  const expiresAt = body.expiresIn
    ? Math.floor(Date.now() / 1000) + body.expiresIn * 24 * 60 * 60
    : null;

  // Validate and set scopes
  const validScopes = ['read', 'write'];
  const scopes = (body.scopes || ['read']).filter((s) => validScopes.includes(s)).join(',');

  // Get rate limit for tier
  const rateLimit = TIER_RATE_LIMITS[tier] || 100;

  try {
    await env.DB.prepare(
      `INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, scopes, rate_limit, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`
    )
      .bind(keyId, userId, body.name, keyPrefix, keyHash, scopes, rateLimit, expiresAt)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        key: {
          id: keyId,
          name: body.name,
          key: rawKey, // Full key - only shown once!
          prefix: keyPrefix,
          scopes: scopes.split(','),
          rateLimit,
          expiresAt,
          createdAt: Math.floor(Date.now() / 1000),
        },
        warning: 'Store this key securely. It will not be shown again.',
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to create API key:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create API key' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

/**
 * Generate a secure API key
 * Format: bsi_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (40 chars total)
 */
function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `bsi_live_${randomPart}`;
}

/**
 * Hash API key for storage using SHA-256
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Authenticate request via JWT
 */
async function authenticateRequest(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!env.JWT_SECRET) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(signatureInput)
    );

    if (!valid) return null;

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}
