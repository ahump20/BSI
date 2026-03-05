// workers/shared/auth.ts
import type { Context, Next } from 'hono';

export interface KeyData {
  tier: 'pro' | 'enterprise';
  expires: number;
  email: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface Env {
  BSI_KEYS: KVNamespace;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY?: string;
}

/**
 * Middleware: gate routes behind a valid BSI API key stored in KV.
 * Checks X-BSI-Key header. Returns 401/402/403 on failure.
 * Sets c.var.tier on success.
 */
export async function requireApiKey(c: Context<{ Bindings: Env }>, next: Next) {
  const apiKey = c.req.header('X-BSI-Key');
  if (!apiKey) {
    return c.json(
      { error: 'API key required', upgrade: 'https://blazesportsintel.com/pro' },
      401
    );
  }

  const raw = await c.env.BSI_KEYS.get(`key:${apiKey}`);
  if (!raw) {
    return c.json({ error: 'Invalid key' }, 403);
  }

  const keyData: KeyData = JSON.parse(raw);
  if (Date.now() > keyData.expires) {
    return c.json({ error: 'Subscription expired', upgrade: 'https://blazesportsintel.com/pro' }, 402);
  }

  c.set('tier', keyData.tier);
  await next();
}

/**
 * Provision a new API key for a subscriber. Stores two KV entries:
 *   key:{uuid}  → { tier, expires, email }
 *   email:{addr} → uuid  (for lookup / re-send)
 */
export async function provisionKey(
  kv: KVNamespace,
  email: string,
  tier: KeyData['tier'],
  stripeIds?: { customerId?: string; subscriptionId?: string },
): Promise<string> {
  const apiKey = crypto.randomUUID();
  const expires = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
  const keyData: KeyData = {
    tier,
    expires,
    email,
    stripe_customer_id: stripeIds?.customerId,
    stripe_subscription_id: stripeIds?.subscriptionId,
  };

  await kv.put(`key:${apiKey}`, JSON.stringify(keyData));
  await kv.put(`email:${email}`, apiKey);

  // Reverse lookup: Stripe customer ID → email (for lifecycle webhook events)
  if (stripeIds?.customerId) {
    await kv.put(`stripe:${stripeIds.customerId}`, email);
  }

  return apiKey;
}

/**
 * Send the API key to the subscriber via Resend.
 * No-ops if RESEND_API_KEY is not set.
 */
export async function emailKey(
  resendApiKey: string | undefined,
  email: string,
  apiKey: string,
  tier: KeyData['tier']
): Promise<void> {
  if (!resendApiKey) return;

  const tierLabel = tier === 'enterprise' ? 'Enterprise' : 'Pro';

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
        <pre style="background:#111;color:#BF5700;padding:16px;border-radius:4px;font-size:1.1em;">${apiKey}</pre>
        <p>Include it in every request as the <code>X-BSI-Key</code> header.</p>
        <p>Expires in 1 year. Questions? Reply to this email.</p>
        <p>— Austin @ BSI</p>
      `,
    }),
  });
}
