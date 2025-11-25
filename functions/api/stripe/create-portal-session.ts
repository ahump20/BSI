// Blaze Sports Intel - Create Stripe Customer Portal Session
import type { PagesFunction } from '@cloudflare/workers-types';
import { parseCookies, verifyJWT } from '../../../lib/auth/auth-utils';
import { createStripeClient, createCustomerPortalSession } from '../../../lib/stripe/stripe-utils';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
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

    // Get subscription info
    const subscription = await env.DB.prepare(
      `SELECT stripe_customer_id, plan_tier
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

    // Free tier users can't access billing portal
    if (subscription.plan_tier === 'free') {
      return new Response(JSON.stringify({
        error: 'Billing portal is only available for paid subscriptions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Stripe client
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);

    // Create customer portal session
    const portalSession = await createCustomerPortalSession(
      stripe,
      subscription.stripe_customer_id as string,
      `${new URL(request.url).origin}/dashboard/billing`
    );

    return new Response(JSON.stringify({
      url: portalSession.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create portal session error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create portal session'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
