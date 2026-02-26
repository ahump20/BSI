/**
 * Auth handlers for Blaze Sports Intel
 *
 * POST /api/auth/login   — look up subscriber by email, re-send API key
 * GET  /api/auth/validate — validate an API key, return tier + email
 *
 * Auth model: Stripe is signup, email is the credential, API key is the session.
 * No passwords, no cookies — key lives in localStorage on the client.
 */

import type { Env } from '../shared/types';
import { json } from '../shared/helpers';
import { emailKey, type KeyData } from '../shared/auth';

/**
 * POST /api/auth/login
 *
 * Accepts { email } — looks up the subscriber's API key in KV and re-sends it.
 * Returns 404 if no subscription exists for that email.
 */
export async function handleLogin(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { email?: string };
  try {
    body = await request.json() as { email?: string };
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return json({ error: 'Email is required.' }, 400);
  }

  if (!env.BSI_KEYS) {
    return json({ error: 'Auth service not configured.' }, 503);
  }

  // Look up the API key associated with this email
  const apiKey = await env.BSI_KEYS.get(`email:${email}`);
  if (!apiKey) {
    return json({ error: 'No subscription found for this email.' }, 404);
  }

  // Verify the key still exists and hasn't been deleted
  const raw = await env.BSI_KEYS.get(`key:${apiKey}`);
  if (!raw) {
    return json({ error: 'No subscription found for this email.' }, 404);
  }

  const keyData: KeyData = JSON.parse(raw);

  // Re-send the API key via email
  await emailKey(env.RESEND_API_KEY, email, apiKey, keyData.tier);

  return json({
    success: true,
    message: 'API key sent to your email.',
  });
}

/**
 * GET /api/auth/validate
 *
 * Validates an API key passed in the X-BSI-Key header.
 * Returns key metadata on success, 401 on failure.
 */
export async function handleValidateKey(
  request: Request,
  env: Env,
): Promise<Response> {
  const apiKey = request.headers.get('X-BSI-Key');
  if (!apiKey) {
    return json({ valid: false, error: 'API key required.' }, 401);
  }

  if (!env.BSI_KEYS) {
    return json({ error: 'Auth service not configured.' }, 503);
  }

  const raw = await env.BSI_KEYS.get(`key:${apiKey}`);
  if (!raw) {
    return json({ valid: false, error: 'Invalid API key.' }, 401);
  }

  const keyData: KeyData = JSON.parse(raw);

  if (Date.now() > keyData.expires) {
    return json({
      valid: false,
      error: 'Subscription expired.',
      upgrade: 'https://blazesportsintel.com/pricing',
    }, 402);
  }

  return json({
    valid: true,
    tier: keyData.tier,
    email: keyData.email,
    expires_at: new Date(keyData.expires).toISOString(),
    has_billing: !!keyData.stripe_customer_id,
  });
}
