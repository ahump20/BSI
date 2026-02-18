/**
 * Stripe handlers for Blaze Sports Intel
 *
 * POST /api/stripe/create-embedded-checkout — embedded checkout session (existing /pricing flow)
 * GET  /api/stripe/session-status           — verify session after checkout return
 * GET  /api/key/from-session                — retrieve API key for a completed checkout session
 *
 * Webhook processing:
 *   handleStripeWebhook(event, env)         — handles 6 subscription lifecycle events
 *   verifyStripeSignature(body, header, secret) — HMAC-SHA256 verification via WebCrypto
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';
import {
  PRICE_TIER_MAP,
  provisionKey,
  upsertEntitlement,
  emailKey,
  sha256Hex,
  type Tier,
  type SubscriptionStatus,
  type KeyRecord,
} from '../shared/auth';

// ---------------------------------------------------------------------------
// Stripe REST API helpers (no SDK — raw fetch + WebCrypto)
// ---------------------------------------------------------------------------

const STRIPE_API = 'https://api.stripe.com/v1';

interface StripeSubscriptionItem {
  price?: { id?: string };
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  items: { data: StripeSubscriptionItem[] };
}

interface StripeCheckoutSession {
  id: string;
  status: 'open' | 'complete' | 'expired';
  payment_status: string;
  customer: string | null;
  customer_details?: { email?: string | null };
  customer_email?: string | null;
  subscription?: string | null;
  line_items?: { data: Array<{ price?: { id?: string } }> };
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

async function stripeGet<T>(
  path: string,
  secretKey: string,
  params?: Record<string, string>
): Promise<T | null> {
  const url = new URL(`${STRIPE_API}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

async function fetchStripeSubscription(
  subId: string,
  secretKey: string
): Promise<StripeSubscription | null> {
  return stripeGet<StripeSubscription>(`/subscriptions/${subId}`, secretKey, {
    'expand[]': 'items.data.price',
  });
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

/**
 * Verify the Stripe-Signature header using HMAC-SHA256 via WebCrypto.
 *
 * Uses crypto.subtle.verify() for constant-time comparison (no timing oracle).
 * Rejects events older than 5 minutes to prevent replay attacks.
 */
export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string
): Promise<boolean> {
  // Parse t=<timestamp>,v1=<hex>,...
  const parts = header.split(',');
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Parts = parts.filter((p) => p.startsWith('v1='));

  if (!tPart || v1Parts.length === 0) return false;

  const timestamp = parseInt(tPart.slice(2), 10);
  if (!Number.isFinite(timestamp)) return false;

  // Replay attack protection: reject events older than 5 minutes
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Check any v1 signature — Stripe rolls keys, multiple may be present
  for (const v1Part of v1Parts) {
    const hexSig = v1Part.slice(3);
    const sigBytes = hexToBytes(hexSig);
    if (!sigBytes) continue;
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(signedPayload)
    );
    if (valid) return true;
  }

  return false;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Webhook event processing
// ---------------------------------------------------------------------------

/**
 * Update an existing KeyRecord's subscription state.
 * Called on subscription lifecycle events (updated, deleted, invoice events).
 */
async function syncSubscription(
  sub: StripeSubscription,
  kv: KVNamespace,
  eventId: string
): Promise<void> {
  // Route via subscription ID index
  const keyHash = await kv.get(`sub:${sub.id}`);
  if (!keyHash) return; // subscription not in our system (e.g. pre-existing customer)

  const raw = await kv.get(`key:${keyHash}`);
  if (!raw) return;

  const record: KeyRecord = JSON.parse(raw);
  const priceId = sub.items?.data?.[0]?.price?.id ?? record.price_id;

  const updated: KeyRecord = {
    ...record,
    status: sub.status as SubscriptionStatus,
    current_period_end: sub.current_period_end,
    price_id: priceId,
    tier: PRICE_TIER_MAP[priceId] ?? record.tier,
    last_event_id: eventId,
  };

  await upsertEntitlement(kv, updated);
}

/**
 * Process a verified Stripe webhook event.
 *
 * Idempotent: deduplicates by event.id (7-day KV TTL).
 * Handles 6 subscription lifecycle event types.
 * Called inside waitUntil — runs after the 200 response is sent.
 */
export async function handleStripeWebhook(
  event: StripeEvent,
  env: Env
): Promise<void> {
  if (!env.BSI_KEYS) return;

  // Idempotency fence: skip duplicate deliveries (Stripe retries for days)
  const evtKey = `evt:${event.id}`;
  const seen = await env.BSI_KEYS.get(evtKey);
  if (seen) return;
  await env.BSI_KEYS.put(evtKey, '1', { expirationTtl: 7 * 86400 });

  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as StripeCheckoutSession;
      if (session.status !== 'complete' || !session.subscription) break;

      const sub = await fetchStripeSubscription(session.subscription, secretKey);
      if (!sub) break;

      const email =
        session.customer_details?.email ?? session.customer_email ?? '';
      if (!email) break;

      const priceId = sub.items?.data?.[0]?.price?.id ?? '';
      const tier: Tier = PRICE_TIER_MAP[priceId] ?? 'pro';
      const customerId =
        typeof sub.customer === 'string' ? sub.customer : '';

      // Check if this customer already has a key (idempotent provision)
      const existingHash = await env.BSI_KEYS.get(`cust:${customerId}`);
      if (existingHash) {
        // Already provisioned — just sync state
        await syncSubscription(sub, env.BSI_KEYS, event.id);
        break;
      }

      const apiKey = await provisionKey(
        env.BSI_KEYS,
        email,
        tier,
        customerId,
        sub.id,
        priceId
      );
      await emailKey(env.RESEND_API_KEY, email, apiKey, tier);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as unknown as StripeSubscription;
      await syncSubscription(sub, env.BSI_KEYS, event.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as unknown as StripeSubscription;
      // Force canceled status regardless of what Stripe sends
      await syncSubscription(
        { ...sub, status: 'canceled' },
        env.BSI_KEYS,
        event.id
      );
      break;
    }

    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as {
        subscription?: string | null;
      };
      if (!invoice.subscription) break;
      const sub = await fetchStripeSubscription(invoice.subscription, secretKey);
      if (!sub) break;
      await syncSubscription(sub, env.BSI_KEYS, event.id);
      break;
    }

    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Session status — used by /checkout/return page
// ---------------------------------------------------------------------------

/**
 * GET /api/stripe/session-status?session_id=cs_xxx
 *
 * Verifies a checkout session and returns its status + tier.
 * Used by the /checkout/return page to confirm a completed embedded checkout.
 */
export async function handleSessionStatus(
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, 503);

  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId) return json({ error: 'session_id required' }, 400);

  const session = await stripeGet<StripeCheckoutSession>(
    `/checkout/sessions/${sessionId}`,
    env.STRIPE_SECRET_KEY,
    { 'expand[]': 'line_items' }
  );

  if (!session) return json({ error: 'Session not found' }, 404);

  const priceId = session.line_items?.data?.[0]?.price?.id ?? '';
  const tier = PRICE_TIER_MAP[priceId] ?? 'pro';

  return json({
    status: session.status,
    customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    subscription_id: session.subscription ?? null,
    tier,
    payment_status: session.payment_status,
  });
}

// ---------------------------------------------------------------------------
// Key from session — used by /pro/success page
// ---------------------------------------------------------------------------

/**
 * GET /api/key/from-session?session_id=cs_xxx
 *
 * Retrieves (or provisions) the API key for a completed Payment Link checkout.
 * Returns the raw key only within 1 hour of provisioning (reveal TTL).
 * Used by the /pro/success page to display the key once.
 */
export async function handleKeyFromSession(
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, 503);
  if (!env.BSI_KEYS) return json({ error: 'Key store not available' }, 503);

  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId) return json({ error: 'session_id required' }, 400);

  const session = await stripeGet<StripeCheckoutSession>(
    `/checkout/sessions/${sessionId}`,
    env.STRIPE_SECRET_KEY,
    { 'expand[]': 'line_items' }
  );

  if (!session) return json({ error: 'Session not found' }, 404);
  if (session.status !== 'complete') {
    return json({ error: 'Payment not complete', status: session.status }, 402);
  }
  if (!session.subscription) {
    return json({ error: 'No subscription on session' }, 400);
  }

  const sub = await fetchStripeSubscription(session.subscription, env.STRIPE_SECRET_KEY);
  if (!sub) return json({ error: 'Subscription not found' }, 404);

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : '';
  const priceId = sub.items?.data?.[0]?.price?.id ?? '';
  const tier: Tier = PRICE_TIER_MAP[priceId] ?? 'pro';
  const email =
    session.customer_details?.email ?? session.customer_email ?? '';

  // Look up existing entitlement by customer ID
  const existingHash = customerId
    ? await env.BSI_KEYS.get(`cust:${customerId}`)
    : null;

  let keyHash: string;

  if (!existingHash) {
    // First time — provision key, email it, return it
    const apiKey = await provisionKey(
      env.BSI_KEYS,
      email,
      tier,
      customerId,
      sub.id,
      priceId
    );
    await emailKey(env.RESEND_API_KEY, email, apiKey, tier);
    const hash = await sha256Hex(apiKey);
    return json({ tier, api_key: apiKey, hash_prefix: hash.slice(0, 8) });
  }

  keyHash = existingHash;

  // Already provisioned — sync latest subscription state
  await syncSubscription(sub, env.BSI_KEYS, `claim:${sessionId}`);

  // Attempt to read one-time reveal (may be expired)
  const revealedKey = await env.BSI_KEYS.get(`reveal:${keyHash}`);

  return json({ tier, api_key: revealedKey ?? null });
}

// ---------------------------------------------------------------------------
// Embedded checkout session — existing /pricing flow
// ---------------------------------------------------------------------------

/**
 * POST /api/stripe/create-embedded-checkout
 * Creates a Stripe Embedded Checkout session and returns the client_secret.
 */
export async function handleCreateEmbeddedCheckout(
  request: Request,
  env: Env
): Promise<Response> {
  const { STRIPE_SECRET_KEY } = env;

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

  // Map tier names to the correct price IDs
  const priceId =
    tier === 'pro'
      ? 'price_1T1zmFLvpRBk20R2yz0RRnec'  // BSI Pro $12/mo
      : 'price_1SXBemLvpRBk20R2n81pZ7T5'; // BSI Data API $199/mo

  const params = new URLSearchParams({
    mode: 'subscription',
    ui_mode: 'embedded',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    return_url:
      'https://blazesportsintel.com/checkout?session_id={CHECKOUT_SESSION_ID}',
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
