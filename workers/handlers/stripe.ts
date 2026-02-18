/**
 * Stripe handlers for Blaze Sports Intel
 *
 * POST /api/stripe/create-embedded-checkout
 *   Creates a Stripe Embedded Checkout session for the given tier/interval.
 *
 * GET /api/stripe/session-status?session_id=cs_xxx
 *   Returns checkout session status (called by the return page).
 *
 * Required secrets (set via `wrangler secret put --env production`):
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_ANNUAL
 *   STRIPE_PRICE_API / STRIPE_PRICE_EMBED
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';

const STRIPE_API = 'https://api.stripe.com/v1';
const RETURN_URL = 'https://blazesportsintel.com/checkout/return?session_id={CHECKOUT_SESSION_ID}';

type PaidTier = 'pro' | 'api' | 'embed';
type BillingInterval = 'monthly' | 'annual';

interface CheckoutRequest {
  tier?: string;
  interval?: string;
}

function getPriceId(env: Env, tier: PaidTier, interval: BillingInterval): string | undefined {
  if (tier === 'pro' && interval === 'annual') return env.STRIPE_PRICE_PRO_ANNUAL;
  if (tier === 'pro') return env.STRIPE_PRICE_PRO_MONTHLY;
  if (tier === 'api') return env.STRIPE_PRICE_API;
  if (tier === 'embed') return env.STRIPE_PRICE_EMBED;
  return undefined;
}

export async function handleCreateEmbeddedCheckout(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured.' }, 503);
  }

  let body: CheckoutRequest;
  try {
    body = await request.json() as CheckoutRequest;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { tier, interval = 'monthly' } = body;

  if (tier !== 'pro' && tier !== 'api' && tier !== 'embed') {
    return json({ error: 'Invalid tier. Must be "pro", "api", or "embed".' }, 400);
  }

  if (interval !== 'monthly' && interval !== 'annual') {
    return json({ error: 'Invalid interval. Must be "monthly" or "annual".' }, 400);
  }

  if (interval === 'annual' && tier !== 'pro') {
    return json({ error: 'Annual billing is only available for the Pro tier.' }, 400);
  }

  const priceId = getPriceId(env, tier, interval as BillingInterval);
  if (!priceId) {
    return json({ error: `Price not configured for tier: ${tier} (${interval})` }, 503);
  }

  const params = new URLSearchParams({
    'mode': 'subscription',
    'ui_mode': 'embedded',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'return_url': RETURN_URL,
    'metadata[tier]': tier,
    'metadata[interval]': interval,
  });

  // 14-day trial for Pro tier
  if (tier === 'pro') {
    params.set('subscription_data[trial_period_days]', '14');
  }

  try {
    const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
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
 * GET /api/stripe/session-status?session_id=cs_xxx
 *
 * Called by the checkout return page to verify session completion
 * and display the appropriate success/cancelled/error state.
 */
export async function handleSessionStatus(
  url: URL,
  env: Env,
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Stripe is not configured.' }, 503);
  }

  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return json({ error: 'Missing session_id parameter.' }, 400);
  }

  if (!sessionId.startsWith('cs_')) {
    return json({ error: 'Invalid session_id format.' }, 400);
  }

  try {
    const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      return json({ error: 'Failed to retrieve session from Stripe.' }, res.status as 400 | 404 | 500);
    }

    const session = (await res.json()) as {
      status: string;
      customer_email?: string;
      customer_details?: { email?: string };
      metadata?: { tier?: string };
      payment_status: string;
      subscription?: string;
    };

    return json({
      status: session.status,
      customer_email: session.customer_email ?? session.customer_details?.email ?? null,
      tier: session.metadata?.tier ?? null,
      payment_status: session.payment_status,
      subscription_id: session.subscription ?? null,
    });
  } catch (err) {
    console.error('[stripe] session status error:', err);
    return json({ error: 'Failed to check session status.' }, 502);
  }
}
