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

interface ExtendedEnv extends Env {
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  BSI_KEYS?: KVNamespace;
}

const STRIPE_API = 'https://api.stripe.com/v1';
const RETURN_URL = 'https://blazesportsintel.com/checkout?session_id={CHECKOUT_SESSION_ID}';

interface CheckoutSessionCompletedEvent {
  type: 'checkout.session.completed';
  data: {
    object: {
      customer_email?: string;
      customer?: string;
      customer_details?: { email?: string };
      metadata?: Record<string, string | undefined>;
    };
  };
}

function parseSignatureHeader(header: string): { timestamp: string; signature: string } | null {
  const items = header.split(',').map((item) => item.trim());
  const timestamp = items.find((item) => item.startsWith('t='))?.slice(2);
  const signature = items.find((item) => item.startsWith('v1='))?.slice(3);
  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(signedPayload),
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === parsed.signature;
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
    body = (await request.json()) as { tier?: string };
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
    mode: 'subscription',
    ui_mode: 'embedded',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    return_url: RETURN_URL,
  });

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

export async function handleStripeWebhook(request: Request, env: ExtendedEnv): Promise<Response> {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (env.STRIPE_WEBHOOK_SECRET) {
    if (!signature) return json({ error: 'Missing stripe-signature header.' }, 400);
    const valid = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return json({ error: 'Invalid webhook signature.' }, 400);
  }

  let event: CheckoutSessionCompletedEvent | { type?: string };
  try {
    event = JSON.parse(payload) as CheckoutSessionCompletedEvent;
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }

  if (event.type !== 'checkout.session.completed') {
    return json({ received: true, ignored: event.type || 'unknown' });
  }

  const session = event.data.object;
  const email = session.customer_email ?? session.customer_details?.email;
  if (!email) {
    return json({ error: 'Missing customer email in checkout session.' }, 400);
  }

  const tier = session.metadata?.tier || 'pro';
  const durationDaysRaw = session.metadata?.duration_days;
  const durationDays = durationDaysRaw ? Number(durationDaysRaw) : 365;
  const expires =
    Date.now() +
    (Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 365) * 24 * 60 * 60 * 1000;
  const apiKey = `bsi_${crypto.randomUUID().replace(/-/g, '')}`;

  const keysKv = env.BSI_KEYS ?? env.KV;
  await keysKv.put(
    `key:${apiKey}`,
    JSON.stringify({
      tier,
      expires,
      email,
      customerId: session.customer,
      createdAt: Date.now(),
    }),
  );
  await keysKv.put(`email:${email}`, apiKey);

  return json({ received: true, provisioned: true });
}
