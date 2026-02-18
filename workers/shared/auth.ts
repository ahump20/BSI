// workers/shared/auth.ts
import type { Context, Next } from 'hono';
import type { Env } from './types';

export interface KeyData {
  tier: 'pro' | 'api' | 'embed';
  expires: number;
  email: string;
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
      { error: 'API key required', upgrade: 'https://blazesportsintel.com/pricing' },
      401
    );
  }

  const raw = await c.env.BSI_KEYS.get(`key:${apiKey}`);
  if (!raw) {
    return c.json({ error: 'Invalid key' }, 403);
  }

  const keyData: KeyData = JSON.parse(raw);
  if (Date.now() > keyData.expires) {
    return c.json({ error: 'Subscription expired', upgrade: 'https://blazesportsintel.com/pricing' }, 402);
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
  tier: KeyData['tier']
): Promise<string> {
  const apiKey = crypto.randomUUID();
  const expires = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
  const keyData: KeyData = { tier, expires, email };

  await kv.put(`key:${apiKey}`, JSON.stringify(keyData));
  await kv.put(`email:${email}`, apiKey);

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

  const tierLabel = tier === 'api' ? 'Data API' : tier === 'embed' ? 'Embed License' : 'Pro';

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

/**
 * Factory: restrict a route to specific tier(s).
 * Use after requireApiKey in the middleware chain.
 *
 * Example: app.get('/api/premium/exports/*', requireTier('api'));
 */
export function requireTier(...allowed: KeyData['tier'][]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const tier = c.get('tier') as KeyData['tier'] | undefined;
    if (!tier || !allowed.includes(tier)) {
      return c.json(
        { error: 'This endpoint requires a higher tier', upgrade: 'https://blazesportsintel.com/pricing' },
        403,
      );
    }
    await next();
  };
}
