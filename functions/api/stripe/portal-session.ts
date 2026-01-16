/**
 * Stripe Customer Portal Session
 * Creates a session URL to Stripe's hosted customer portal
 *
 * POST /api/stripe/portal-session
 *
 * Allows users to:
 * - Update payment method
 * - Cancel subscription
 * - View billing history
 * - Update billing details
 *
 * @version 1.0.0
 * @updated 2025-12-10
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  JWT_SECRET: string;
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Authenticate user
  const userId = await authenticateRequest(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    // Get user's Stripe customer ID
    const subscription = await env.DB.prepare(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(userId)
      .first<{ stripe_customer_id: string }>();

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          error: 'No subscription found',
          message: 'You need an active subscription to access billing management',
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Create Stripe Customer Portal session
    const returnUrl = new URL(request.url).origin + '/portal';

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: subscription.stripe_customer_id,
        return_url: returnUrl,
      }),
    });

    const session = (await response.json()) as { url?: string; error?: { message: string } };

    if (!response.ok || !session.url) {
      console.error('Stripe portal session error:', session);
      return new Response(
        JSON.stringify({
          error: 'Failed to create portal session',
          message: session.error?.message || 'Please try again',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Portal session error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create portal session' }), {
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
