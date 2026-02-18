// workers/shared/auth.ts
import type { Context, Next } from 'hono';
import type { Env } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tier = 'pro' | 'api' | 'embed';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

/**
 * Stored in KV at key:{sha256(apiKey)}.
 * Subscription state is authoritative — access is revoked immediately on cancel/failure.
 */
export interface KeyRecord {
  key_hash: string;
  tier: Tier;
  status: SubscriptionStatus;
  customer_id: string;
  subscription_id: string;
  price_id: string;
  email?: string;
  current_period_end?: number; // unix seconds — matches Stripe's field name
  created_at_ms: number;
  last_event_id?: string;
}

// ---------------------------------------------------------------------------
// Price → Tier mapping (lookups, not secrets — safe to hardcode)
// ---------------------------------------------------------------------------

export const PRICE_TIER_MAP: Record<string, Tier> = {
  'price_1T1zmFLvpRBk20R2yz0RRnec': 'pro',   // BSI Pro $12/mo
  'price_1T1zmXLvpRBk20R2gIDy02yg': 'pro',   // BSI Pro $99/yr
  'price_1SXBemLvpRBk20R2n81pZ7T5': 'api',   // BSI Data API $199/mo
  'price_1T1zncLvpRBk20R29wlTYXb5': 'embed', // BSI Embed License $79/mo
};

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

/** SHA-256 of a UTF-8 string, returned as lowercase hex. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generates a cryptographically random BSI API key (url-safe base64 with bsi_ prefix). */
function randomApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `bsi_${b64}`;
}

// ---------------------------------------------------------------------------
// KV operations
// ---------------------------------------------------------------------------

/**
 * KV key schema:
 *   key:{sha256(apiKey)}        → KeyRecord JSON      (primary, permanent)
 *   sub:{subscriptionId}        → hash                (index, permanent)
 *   cust:{customerId}           → hash                (index, permanent)
 *   email:{addr}                → hash                (index, permanent)
 *   reveal:{hash}               → raw API key         (1-hour TTL — one-time display)
 *   evt:{stripeEventId}         → "1"                 (7-day TTL — idempotency fence)
 */

/** Write all cross-reference KV entries for a KeyRecord. */
export async function upsertEntitlement(
  kv: KVNamespace,
  record: KeyRecord
): Promise<void> {
  await kv.put(`key:${record.key_hash}`, JSON.stringify(record));
  await kv.put(`sub:${record.subscription_id}`, record.key_hash);
  await kv.put(`cust:${record.customer_id}`, record.key_hash);
  if (record.email) {
    await kv.put(`email:${record.email.toLowerCase()}`, record.key_hash);
  }
}

/**
 * Provision a new API key for a subscriber.
 *
 * Generates a random key, hashes it, writes all KV entries, and stores the raw
 * key in reveal:{hash} for 1 hour. Returns the raw key for one-time display/email.
 */
export async function provisionKey(
  kv: KVNamespace,
  email: string,
  tier: Tier,
  customerId: string,
  subscriptionId: string,
  priceId: string
): Promise<string> {
  const apiKey = randomApiKey();
  const keyHash = await sha256Hex(apiKey);

  const record: KeyRecord = {
    key_hash: keyHash,
    tier,
    status: 'active',
    customer_id: customerId,
    subscription_id: subscriptionId,
    price_id: priceId,
    email: email.toLowerCase(),
    created_at_ms: Date.now(),
  };

  await upsertEntitlement(kv, record);
  // One-time reveal: expires in 1 hour. After TTL only email/rotation can recover key.
  await kv.put(`reveal:${keyHash}`, apiKey, { expirationTtl: 3600 });

  return apiKey;
}

// ---------------------------------------------------------------------------
// Hono middleware
// ---------------------------------------------------------------------------

/**
 * Gate routes behind a valid BSI API key.
 *
 * Accepts key via X-BSI-Key header (API clients) or ?key= query param (widget embeds).
 * Access requires status === 'active' | 'trialing' AND current_period_end in the future.
 * Sets c.var.tier on success.
 */
export async function requireApiKey(
  c: Context<{ Bindings: Env; Variables: { tier: Tier } }>,
  next: Next
): Promise<Response | void> {
  const apiKey = c.req.header('X-BSI-Key') ?? c.req.query('key');

  if (!apiKey) {
    return c.json(
      { error: 'API key required', upgrade: 'https://blazesportsintel.com/pro' },
      401
    );
  }

  if (!c.env.BSI_KEYS) {
    return c.json({ error: 'Key store not available' }, 503);
  }

  const keyHash = await sha256Hex(apiKey);
  const raw = await c.env.BSI_KEYS.get(`key:${keyHash}`);

  if (!raw) {
    return c.json({ error: 'Invalid key' }, 403);
  }

  const record: KeyRecord = JSON.parse(raw);

  const isActive = record.status === 'active' || record.status === 'trialing';
  const nowSec = Math.floor(Date.now() / 1000);
  const notExpired = !record.current_period_end || record.current_period_end > nowSec;

  if (!isActive || !notExpired) {
    return c.json(
      {
        error: 'Subscription inactive',
        status: record.status,
        upgrade: 'https://blazesportsintel.com/pro',
      },
      402
    );
  }

  c.set('tier', record.tier);
  await next();
}

// ---------------------------------------------------------------------------
// Email delivery
// ---------------------------------------------------------------------------

/**
 * Send the API key to the subscriber via Resend.
 * No-ops if RESEND_API_KEY is not set (development / pre-config).
 */
export async function emailKey(
  resendApiKey: string | undefined,
  email: string,
  apiKey: string,
  tier: Tier
): Promise<void> {
  if (!resendApiKey) return;

  const tierLabel =
    tier === 'api' ? 'Data API' : tier === 'embed' ? 'Embed License' : 'Pro';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BSI <noreply@blazesportsintel.com>',
      to: email,
      subject: `Your BSI ${tierLabel} API Key`,
      html: `
        <h2>Welcome to BSI ${tierLabel}</h2>
        <p>Your API key:</p>
        <pre style="background:#111;color:#BF5700;padding:16px;border-radius:4px;font-size:1.1em;font-family:monospace;">${apiKey}</pre>
        <p>Include it in every request as the <code>X-BSI-Key</code> header.</p>
        <p>This key is tied to your subscription — it stays active as long as your subscription is active.</p>
        <p>Lost it? Contact <a href="mailto:Austin@BlazeSportsIntel.com">Austin@BlazeSportsIntel.com</a></p>
        <p>— Austin @ BSI</p>
      `,
    }),
  });
}
