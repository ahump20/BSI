/**
 * List API Keys Endpoint
 * Returns all API keys for authenticated user (without revealing full keys)
 *
 * GET /api/keys
 *
 * Response:
 * {
 *   success: true,
 *   keys: [{
 *     id: string,
 *     name: string,
 *     prefix: string,      // First 8 chars (bsi_live)
 *     scopes: string[],
 *     rateLimit: number,
 *     lastUsedAt: number | null,
 *     expiresAt: number | null,
 *     createdAt: number
 *   }],
 *   limits: {
 *     used: number,
 *     max: number
 *   }
 * }
 */

import { getUserTier } from '../_feature-gate';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const TIER_MAX_KEYS: Record<string, number> = {
  free: 0,
  pro: 5,
  enterprise: 25,
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await authenticateRequest(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const keys = await env.DB.prepare(
      `SELECT id, name, key_prefix, scopes, rate_limit, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY created_at DESC`
    )
      .bind(userId)
      .all();

    const tier = await getUserTier(userId, env);
    const maxKeys = TIER_MAX_KEYS[tier] || 0;

    return new Response(
      JSON.stringify({
        success: true,
        keys: (keys.results || []).map((k: any) => ({
          id: k.id,
          name: k.name,
          prefix: k.key_prefix,
          scopes: k.scopes ? k.scopes.split(',') : ['read'],
          rateLimit: k.rate_limit,
          lastUsedAt: k.last_used_at,
          expiresAt: k.expires_at,
          createdAt: k.created_at,
        })),
        limits: {
          used: keys.results?.length || 0,
          max: maxKeys,
        },
        tier,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to list API keys:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to list API keys' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

async function authenticateRequest(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!env.JWT_SECRET) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

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

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}
