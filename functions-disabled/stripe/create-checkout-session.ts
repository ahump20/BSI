// Blaze Sports Intel - Create Stripe Checkout Session
import type { PagesFunction } from '@cloudflare/workers-types';
import { parseCookies, verifyJWT } from '../../../lib/auth/auth-utils';
import { createStripeClient, createCheckoutSession } from '../../../lib/stripe/stripe-utils';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
}

interface CheckoutRequest {
  tier: 'pro' | 'enterprise';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // Authenticate user
    const cookies = parseCookies(request.headers.get('Cookie'));
    const sessionToken = cookies['bsi_session'];

    if (!sessionToken) {
      return new Response(JSON.stringify({
        error: 'Not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const jwtVerification = verifyJWT(sessionToken, env.JWT_SECRET);
    if (!jwtVerification.valid) {
      return new Response(JSON.stringify({
        error: 'Invalid session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { userId } = jwtVerification.payload;

    // Parse request body
    const body = await request.json() as CheckoutRequest;
    const { tier } = body;

    if (!tier || (tier !== 'pro' && tier !== 'enterprise')) {
      return new Response(JSON.stringify({
        error: 'Invalid tier specified'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user and subscription info
    const user = await env.DB.prepare(
      'SELECT email, name FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subscription = await env.DB.prepare(
      `SELECT stripe_customer_id, plan_tier, status
       FROM subscriptions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId).first();

    if (!subscription) {
      return new Response(JSON.stringify({
        error: 'Subscription not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already has this tier or higher
    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
    if (tierHierarchy[subscription.plan_tier as 'free' | 'pro' | 'enterprise'] >= tierHierarchy[tier]) {
      return new Response(JSON.stringify({
        error: 'You already have this subscription tier or higher'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get price ID based on tier
    const priceId = tier === 'pro' ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_ENTERPRISE_PRICE_ID;

    // Create Stripe client
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);

    // Create checkout session
    const checkoutSession = await createCheckoutSession(stripe, {
      customerId: subscription.stripe_customer_id as string,
      customerEmail: user.email as string,
      priceId,
      successUrl: `${new URL(request.url).origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${new URL(request.url).origin}/pricing`,
      trialDays: tier === 'pro' ? 14 : 0, // 14-day trial for Pro tier
      metadata: {
        user_id: userId,
        tier,
        previous_tier: subscription.plan_tier as string
      }
    });

    return new Response(JSON.stringify({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
