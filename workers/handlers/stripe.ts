/**
 * Stripe handlers for Blaze Sports Intel
 *
 * POST /api/stripe/create-embedded-checkout
 *   Creates a Stripe Embedded Checkout session and returns the client_secret.
 *   The client uses this secret to render the Stripe-hosted checkout UI.
 *
 * Required secrets (set via `wrangler secret put --env production`):
 *   STRIPE_SECRET_KEY      — Stripe secret key (sk_live_* / sk_test_*)
 *   STRIPE_PRICE_PRO       — Stripe Price ID for the Pro monthly plan
 *   STRIPE_PRICE_ENTERPRISE — Stripe Price ID for the Enterprise monthly plan
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';
import type { KeyData } from '../shared/auth';

interface ExtendedEnv extends Env {
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
}

const STRIPE_API = 'https://api.stripe.com/v1';
const RETURN_URL = 'https://blazesportsintel.com/checkout/return/?session_id={CHECKOUT_SESSION_ID}';

/**
 * GET /api/stripe/session-status?session_id=cs_xxx
 *
 * Retrieves a Stripe Checkout Session by ID and returns its status.
 * Used by the /checkout/return page to verify payment after redirect.
 */
export async function handleSessionStatus(
  url: URL,
  env: ExtendedEnv,
): Promise<Response> {
  const { STRIPE_SECRET_KEY } = env;

  if (!STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured.' }, 503);
  }

  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return json({ error: 'Missing session_id parameter.' }, 400);
  }

  try {
    const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      const msg = err?.error?.message ?? 'Failed to retrieve session.';
      return json({ error: msg }, res.status as 400 | 404 | 500);
    }

    const session = (await res.json()) as {
      status?: string;
      customer_email?: string;
      customer_details?: { email?: string };
      subscription?: string;
      metadata?: { tier?: string };
      payment_status?: string;
    };

    // If a subscription exists, fetch it to get trial_end timestamp
    let trialEnd: number | null = null;
    if (session.subscription) {
      try {
        const subRes = await fetch(`${STRIPE_API}/subscriptions/${session.subscription}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        if (subRes.ok) {
          const sub = (await subRes.json()) as { trial_end?: number | null };
          trialEnd = sub.trial_end ?? null;
        }
      } catch {
        // Non-fatal — trial_end is optional enhancement
      }
    }

    return json({
      status: session.status ?? 'unknown',
      customer_email: session.customer_email ?? session.customer_details?.email ?? null,
      subscription_id: session.subscription ?? null,
      tier: session.metadata?.tier ?? null,
      payment_status: session.payment_status ?? 'unknown',
      trial_end: trialEnd,
    });
  } catch (err) {
    console.error('[stripe] session-status error:', err);
    return json({ error: 'Failed to verify session.' }, 502);
  }
}

export async function handleCreateEmbeddedCheckout(
  request: Request,
  env: ExtendedEnv,
): Promise<Response> {
  const { STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE } = env;

  if (!STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured.' }, 503);
  }

  let body: { tier?: string };
  try {
    body = await request.json() as { tier?: string };
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { tier } = body;
  if (tier !== 'pro' && tier !== 'enterprise') {
    return json({ error: 'Invalid tier. Must be "pro" or "enterprise".' }, 400);
  }

  const priceId = tier === 'pro' ? STRIPE_PRICE_PRO : STRIPE_PRICE_ENTERPRISE;
  if (!priceId) {
    return json({ error: `Price not configured for tier: ${tier}` }, 503);
  }

  // Build form-encoded body for Stripe API (no SDK needed in Workers runtime)
  const params = new URLSearchParams({
    'mode': 'subscription',
    'ui_mode': 'embedded',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'return_url': RETURN_URL,
    'metadata[tier]': tier,
  });

  // Pro tier gets a 14-day trial; Enterprise does not
  if (tier === 'pro') {
    params.set('subscription_data[trial_period_days]', '14');
  }

  try {
    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      const msg = err?.error?.message ?? 'Stripe session creation failed.';
      return json({ error: msg }, res.status as 400 | 402 | 500);
    }

    const session = (await res.json()) as { client_secret?: string };
    if (!session.client_secret) {
      return json({ error: 'No client_secret returned from Stripe.' }, 502);
    }

    return json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('[stripe] checkout session error:', err);
    return json({ error: 'Failed to create checkout session.' }, 502);
  }
}

/**
 * POST /api/stripe/customer-portal
 *
 * Creates a Stripe Customer Portal session so subscribers can manage
 * billing, update payment methods, cancel, or view invoices.
 * Requires a valid BSI API key in the X-BSI-Key header.
 */
export async function handleCustomerPortal(
  request: Request,
  env: ExtendedEnv,
): Promise<Response> {
  const { STRIPE_SECRET_KEY } = env;
  if (!STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured.' }, 503);
  }

  const apiKey = request.headers.get('X-BSI-Key');
  if (!apiKey) {
    return json({ error: 'API key required.' }, 401);
  }

  const raw = await env.BSI_KEYS?.get(`key:${apiKey}`);
  if (!raw) {
    return json({ error: 'Invalid API key.' }, 401);
  }

  const keyData: KeyData = JSON.parse(raw);
  if (!keyData.stripe_customer_id) {
    return json({ error: 'No billing account linked.' }, 404);
  }

  const params = new URLSearchParams({
    'customer': keyData.stripe_customer_id,
    'return_url': 'https://blazesportsintel.com/dashboard',
  });

  try {
    const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      const msg = err?.error?.message ?? 'Failed to create portal session.';
      return json({ error: msg }, res.status as 400 | 500);
    }

    const session = (await res.json()) as { url?: string };
    if (!session.url) {
      return json({ error: 'No portal URL returned from Stripe.' }, 502);
    }

    return json({ url: session.url });
  } catch (err) {
    console.error('[stripe] customer portal error:', err);
    return json({ error: 'Failed to create portal session.' }, 502);
  }
}
