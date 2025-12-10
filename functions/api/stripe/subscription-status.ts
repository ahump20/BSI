/**
 * Subscription Status Endpoint
 * Returns current user's subscription details and available features
 *
 * GET /api/stripe/subscription-status
 *
 * Headers:
 *   Authorization: Bearer <jwt_token>
 *   -OR-
 *   X-User-ID: <user_id>
 *
 * Response:
 * {
 *   success: true,
 *   subscription: {
 *     tier: "free" | "pro" | "enterprise",
 *     status: "active" | "canceled" | "past_due" | "none",
 *     subscriptionId?: string,
 *     periodEnd?: number,
 *     cancelAtPeriodEnd?: boolean,
 *     memberSince: number
 *   },
 *   features: string[],
 *   limits: { ... }
 * }
 */

import { getFeaturesForTier, type Tier } from '../_feature-gate';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
  'Content-Type': 'application/json',
};

// Tier-specific limits
const TIER_LIMITS: Record<Tier, Record<string, number>> = {
  free: {
    apiCallsPerDay: 100,
    exportsPerMonth: 0,
    alertsActive: 0,
    historicalDataDays: 7,
  },
  pro: {
    apiCallsPerDay: 10000,
    exportsPerMonth: 50,
    alertsActive: 10,
    historicalDataDays: 365,
  },
  enterprise: {
    apiCallsPerDay: -1, // Unlimited
    exportsPerMonth: -1, // Unlimited
    alertsActive: -1, // Unlimited
    historicalDataDays: -1, // Unlimited (all time)
  },
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // Extract user ID from Authorization header or X-User-ID
  let userId: string | null = null;

  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Verify JWT and extract user ID
    userId = await verifyJWTAndGetUserId(authHeader.slice(7), env);
  }

  // Fallback to X-User-ID header (for internal use)
  if (!userId) {
    userId = request.headers.get('X-User-ID');
  }

  if (!userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: 'Please provide a valid authentication token or user ID',
      }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // Query user and subscription data
    const result = await env.DB.prepare(
      `
      SELECT
        u.id,
        u.email,
        u.tier,
        u.created_at as member_since,
        s.stripe_subscription_id,
        s.status as subscription_status,
        s.plan_tier,
        s.current_period_end,
        s.cancel_at_period_end
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing', 'past_due')
      WHERE u.id = ?
    `
    )
      .bind(userId)
      .first();

    if (!result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found',
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    const tier = ((result.tier as string) || 'free') as Tier;
    const features = getFeaturesForTier(tier);
    const limits = TIER_LIMITS[tier];

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          tier,
          status: (result.subscription_status as string) || 'none',
          subscriptionId: result.stripe_subscription_id || null,
          periodEnd: result.current_period_end || null,
          cancelAtPeriodEnd: result.cancel_at_period_end === 1,
          memberSince: result.member_since,
        },
        features,
        limits,
        pricing: {
          pro: {
            price: 29,
            interval: 'month',
            priceId: 'price_1SX9voLvpRBk20R2pW0AjUIv',
          },
          enterprise: {
            price: 199,
            interval: 'month',
            priceId: 'price_1SX9w7LvpRBk20R2DJkKAH3y',
          },
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Subscription status error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch subscription status',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

/**
 * Verify JWT and extract user ID
 * Uses the same HMAC-SHA256 algorithm as auth/login.ts
 */
async function verifyJWTAndGetUserId(token: string, env: Env): Promise<string | null> {
  if (!env.JWT_SECRET) {
    console.warn('JWT_SECRET not configured');
    return null;
  }

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
      ['sign', 'verify']
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureInput));
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (signatureB64 !== expectedB64) return null;

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}
