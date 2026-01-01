// Portal Alert Subscription API - Cloudflare Pages Function
// Handles email subscription for portal alerts

import { ok, err, preflight, rateLimit, rateLimitError } from '../../_utils.js';

/**
 * Subscribe to portal alerts
 * POST /api/portal/alerts/subscribe
 * Body: { email: string, subscription_type: 'free' | 'pro', schools?: string[], conferences?: string[] }
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // Rate limiting: 10 subscriptions per hour per IP
  const limit = await rateLimit(env, request, 10, 3600000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const body = await request.json();
    const { email, subscription_type = 'free', schools = [], conferences = [] } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Valid email address is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Store subscription
    const subscription = {
      id: generateId(),
      email: email.toLowerCase(),
      subscription_type,
      schools,
      conferences,
      created_at: new Date().toISOString(),
      verified: false,
      active: true,
    };

    // Store in D1 if available, otherwise log for development
    const db = env.BSI_PORTAL_DB;
    if (db) {
      await db
        .prepare(
          `INSERT INTO portal_subscriptions (id, email, subscription_type, schools, conferences, created_at, verified, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
           subscription_type = excluded.subscription_type,
           schools = excluded.schools,
           conferences = excluded.conferences`
        )
        .bind(
          subscription.id,
          subscription.email,
          subscription.subscription_type,
          JSON.stringify(subscription.schools),
          JSON.stringify(subscription.conferences),
          subscription.created_at,
          0,
          1
        )
        .run();

      // Send verification email via email service
      if (env.EMAIL_API_KEY) {
        await sendVerificationEmail(env, subscription.email, subscription.id);
      }
    } else {
      console.log('New subscription (dev mode):', subscription);
    }

    return ok({
      success: true,
      message: 'Successfully subscribed to portal alerts',
      subscription_type,
      email: maskEmail(email),
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return err(error);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export function onRequestOptions() {
  return preflight();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate unique ID
 */
function generateId() {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mask email for response
 */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(1, local.length - 2)) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Send verification email
 */
async function sendVerificationEmail(env, email, subscriptionId) {
  try {
    const verifyUrl = `https://blazesportsintel.com/api/portal/alerts/verify?id=${subscriptionId}`;

    // Email sending logic would go here
    // Using the email service configured in env
    console.log(`Verification email would be sent to ${email} with link: ${verifyUrl}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}
