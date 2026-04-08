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

import type { Context } from 'hono';
import type { Env } from '../shared/types';
import { json } from '../shared/helpers';
import type { KeyData } from '../shared/auth';
import { provisionKey, emailKey, timingSafeCompare } from '../shared/auth';

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
  try {
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
    console.error('[handleCustomerPortal]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

/**
 * POST /webhooks/stripe
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 * Verifies HMAC-SHA256 signature when STRIPE_WEBHOOK_SECRET is configured.
 *
 * Events handled:
 *   checkout.session.completed        — provision API key for new subscriber
 *   customer.subscription.deleted     — revoke access
 *   customer.subscription.updated     — tier change
 *   customer.subscription.trial_will_end — loss-framed email 3 days before expiry
 *   invoice.payment_failed            — log (Stripe retries automatically)
 *   invoice.paid                      — extend expiry on successful renewal
 */
export async function handleStripeWebhook(c: Context<{ Bindings: Env }>): Promise<Response> {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature');
  const webhookSecret = (c.env as Env & { STRIPE_WEBHOOK_SECRET?: string }).STRIPE_WEBHOOK_SECRET;

  // HMAC-SHA256 signature verification using Web Crypto (Workers runtime)
  // When webhook secret is configured, signature is mandatory.
  if (webhookSecret && !sig) {
    return c.json({ error: 'Missing stripe-signature header' }, 401);
  }
  if (webhookSecret && sig) {
    const pairs = sig.split(',');
    const tEntry = pairs.find((p) => p.startsWith('t='));
    const v1Entry = pairs.find((p) => p.startsWith('v1='));
    if (!tEntry || !v1Entry) return c.json({ error: 'Invalid signature header' }, 400);

    const timestamp = tEntry.slice(2);
    const expected = v1Entry.slice(3);
    const payload = `${timestamp}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (!(await timingSafeCompare(computed, expected))) return c.json({ error: 'Invalid signature' }, 401);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!c.env.BSI_KEYS) {
    return c.json({ error: 'BSI_KEYS namespace not configured' }, 500);
  }

  const kv = c.env.BSI_KEYS;

  // --- checkout.session.completed: provision key for new subscriber ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      customer_email?: string;
      customer_details?: { email?: string };
      customer?: string;
      subscription?: string;
      metadata?: { tier?: string };
    };

    const email =
      session.customer_email ?? session.customer_details?.email ?? '';
    if (!email) return c.json({ error: 'No email in session' }, 400);

    const tier = (session.metadata?.tier as KeyData['tier']) ?? 'pro';

    const apiKey = await provisionKey(kv, email, tier, {
      customerId: session.customer as string | undefined,
      subscriptionId: session.subscription as string | undefined,
    });
    await emailKey(c.env.RESEND_API_KEY, email, apiKey, tier);
  }

  // --- customer.subscription.deleted: revoke access ---
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as { customer?: string };
    const customerId = sub.customer;
    if (customerId) {
      const email = await kv.get(`stripe:${customerId}`);
      if (email) {
        const keyUuid = await kv.get(`email:${email}`);
        if (keyUuid) await kv.delete(`key:${keyUuid}`);
        await kv.delete(`email:${email}`);
        await kv.delete(`stripe:${customerId}`);
        console.info(`[webhook] Revoked access for ${email} (subscription deleted)`);
      }
    }
  }

  // --- customer.subscription.updated: tier change ---
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as {
      customer?: string;
      metadata?: { tier?: string };
    };
    const customerId = sub.customer;
    const newTier = sub.metadata?.tier as KeyData['tier'] | undefined;
    if (customerId && newTier) {
      const email = await kv.get(`stripe:${customerId}`);
      if (email) {
        const keyUuid = await kv.get(`email:${email}`);
        if (keyUuid) {
          const raw = await kv.get(`key:${keyUuid}`);
          if (raw) {
            const keyData = JSON.parse(raw) as KeyData;
            keyData.tier = newTier;
            await kv.put(`key:${keyUuid}`, JSON.stringify(keyData));
            console.info(`[webhook] Updated tier to ${newTier} for ${email}`);
          }
        }
      }
    }
  }

  // --- customer.subscription.trial_will_end: loss-framed email 3 days before expiry ---
  if (event.type === 'customer.subscription.trial_will_end') {
    const sub = event.data.object as {
      customer?: string;
      trial_end?: number;
    };
    const customerId = sub.customer;
    if (customerId) {
      const email = await kv.get(`stripe:${customerId}`);
      if (email && (c.env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY) {
        const trialEndDate = sub.trial_end
          ? new Date(sub.trial_end * 1000).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })
          : 'soon';

        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${(c.env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BSI <noreply@blazesportsintel.com>',
              to: email,
              subject: 'Your BSI Pro trial ends in 3 days',
              html: `
                <h2>Your BSI Pro trial ends ${trialEndDate}</h2>
                <p>After your trial, here's what you'll lose access to:</p>
                <ul>
                  <li>Live scores across MLB, NFL, NBA, NCAA</li>
                  <li>Real-time game updates every 30 seconds</li>
                  <li>Transfer portal tracking</li>
                  <li>Player pro-projection comps</li>
                  <li>Complete box scores with batting/pitching lines</li>
                  <li>Conference standings and rankings</li>
                  <li>Player comparison tools</li>
                </ul>
                <p><strong>No action needed to keep access</strong> — your card will be charged $12/mo on ${trialEndDate}.</p>
                <p>Questions? Reply to this email.</p>
                <p>— Austin @ BSI</p>
              `,
            }),
          });
          if (emailRes.ok) {
            console.info(`[webhook] Trial ending email sent to ${email}`);
          } else {
            const errBody = await emailRes.text().catch(() => 'unknown');
            console.error(`[webhook] Trial email failed for ${email}: ${emailRes.status} — ${errBody}`);
          }
        } catch (emailErr) {
          console.error(`[webhook] Trial email error for ${email}:`, emailErr);
        }
      }
    }
  }

  // --- invoice.payment_failed: log but don't revoke (Stripe retries) ---
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as { customer?: string; attempt_count?: number };
    console.warn(`[webhook] Payment failed for customer ${invoice.customer} (attempt ${invoice.attempt_count ?? '?'})`);
  }

  // --- invoice.paid: extend expiry on successful renewal ---
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as { customer?: string; billing_reason?: string };
    // Only extend on renewal, not the initial subscription payment
    if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
      const email = await kv.get(`stripe:${invoice.customer}`);
      if (email) {
        const keyUuid = await kv.get(`email:${email}`);
        if (keyUuid) {
          const raw = await kv.get(`key:${keyUuid}`);
          if (raw) {
            const keyData = JSON.parse(raw) as KeyData;
            keyData.expires = Date.now() + 365 * 24 * 60 * 60 * 1000;
            await kv.put(`key:${keyUuid}`, JSON.stringify(keyData));
            console.info(`[webhook] Extended expiry for ${email} (renewal paid)`);
          }
        }
      }
    }
  }

  return c.json({ received: true });
}
