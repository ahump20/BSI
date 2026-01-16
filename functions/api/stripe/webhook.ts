/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe
 *
 * Events Handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - checkout.session.completed
 *
 * Security: Webhook signature verification required
 *
 * Database Schema (bsi-historical-db):
 * - subscriptions: stripe_customer_id, stripe_subscription_id, user_id, plan_tier, status
 * - payments: invoice_id, customer_id, subscription_id, user_id, amount, status
 * - users: id, email, tier
 */

import {
  sendEmail,
  paymentSuccessEmail,
  paymentFailedEmail,
  subscriptionCanceledEmail,
} from '../_email';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
  RESEND_API_KEY: string;
  DB: D1Database;
  KV: KVNamespace;
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

// Map Stripe price IDs to BSI tier names (built from env vars)
function buildPriceToTierMap(env: Env): Record<string, string> {
  const map: Record<string, string> = {};
  if (env.STRIPE_PRO_PRICE_ID) {
    map[env.STRIPE_PRO_PRICE_ID] = 'pro';
  }
  if (env.STRIPE_ENTERPRISE_PRICE_ID) {
    map[env.STRIPE_ENTERPRISE_PRICE_ID] = 'enterprise';
  }
  return map;
}

const corsHeaders = {
  'Content-Type': 'application/json',
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.text();

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Invalid Stripe signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const event: StripeEvent = JSON.parse(body);

    // Process event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, env);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, env);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, env);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, env);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, env);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, env);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

// Webhook signature verification using Web Crypto API
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const parts = signature.split(',');
    const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
    const sig = parts.find((p) => p.startsWith('v1='))?.slice(3);

    if (!timestamp || !sig) return false;

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return sig === expectedSig;
  } catch {
    return false;
  }
}

async function handleCheckoutCompleted(session: Record<string, unknown>, env: Env): Promise<void> {
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;
  const customerEmail = (session.customer_email as string)?.toLowerCase();

  console.log(`Checkout completed: ${stripeCustomerId}, subscription: ${stripeSubscriptionId}`);

  // Look up user by email to get user_id
  let userId: string | null = null;
  try {
    const userResult = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(customerEmail)
      .first<{ id: string }>();
    userId = userResult?.id || null;
  } catch (error) {
    console.error('Failed to look up user by email:', error);
  }

  if (!userId) {
    console.error(`No user found for email: ${customerEmail}`);
    return;
  }

  // Determine tier from session metadata or default to pro
  const tier = 'pro'; // Default for checkout - will be updated by subscription.created event

  // Store subscription in D1
  try {
    const subscriptionId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT OR REPLACE INTO subscriptions
       (id, user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', unixepoch(), unixepoch())`
    )
      .bind(subscriptionId, userId, stripeCustomerId, stripeSubscriptionId, tier)
      .run();

    // Update user tier
    await env.DB.prepare('UPDATE users SET tier = ?, updated_at = unixepoch() WHERE id = ?')
      .bind(tier, userId)
      .run();
  } catch (error) {
    console.error('DB error on checkout:', error);
  }

  // Cache subscription status in KV for fast lookups
  await env.KV.put(
    `sub:${stripeCustomerId}`,
    JSON.stringify({ status: 'active', subscriptionId: stripeSubscriptionId, tier, userId }),
    { expirationTtl: 86400 }
  );
}

async function handleSubscriptionCreated(
  subscription: Record<string, unknown>,
  env: Env
): Promise<void> {
  const stripeCustomerId = subscription.customer as string;
  const stripeSubscriptionId = subscription.id as string;
  const status = subscription.status as string;
  const items = subscription.items as { data?: Array<{ price?: { id?: string } }> };
  const priceId = items?.data?.[0]?.price?.id || '';
  const priceToTier = buildPriceToTierMap(env);
  const tier = priceToTier[priceId] || 'pro';
  const currentPeriodStart = subscription.current_period_start as number;
  const currentPeriodEnd = subscription.current_period_end as number;

  console.log(
    `Subscription created: ${stripeSubscriptionId} for customer ${stripeCustomerId}, tier: ${tier}`
  );

  // Look up existing subscription to get user_id
  let userId: string | null = null;
  try {
    const existing = await env.DB.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_customer_id = ?'
    )
      .bind(stripeCustomerId)
      .first<{ user_id: string }>();
    userId = existing?.user_id || null;
  } catch (error) {
    console.error('Failed to look up existing subscription:', error);
  }

  if (!userId) {
    console.error(`No user_id found for customer: ${stripeCustomerId}`);
    return;
  }

  try {
    // Update subscription with full details
    await env.DB.prepare(
      `UPDATE subscriptions
       SET stripe_subscription_id = ?, plan_tier = ?, status = ?,
           current_period_start = ?, current_period_end = ?, updated_at = unixepoch()
       WHERE stripe_customer_id = ?`
    )
      .bind(
        stripeSubscriptionId,
        tier,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        stripeCustomerId
      )
      .run();

    // Sync user tier
    await env.DB.prepare('UPDATE users SET tier = ?, updated_at = unixepoch() WHERE id = ?')
      .bind(tier, userId)
      .run();
  } catch (error) {
    console.error('DB error on subscription create:', error);
  }

  await env.KV.put(
    `sub:${stripeCustomerId}`,
    JSON.stringify({ status, subscriptionId: stripeSubscriptionId, tier, userId }),
    { expirationTtl: 86400 }
  );

  // Also cache by user_id for faster lookups
  await env.KV.put(`tier:${userId}`, tier, { expirationTtl: 300 });
}

async function handleSubscriptionUpdated(
  subscription: Record<string, unknown>,
  env: Env
): Promise<void> {
  const stripeCustomerId = subscription.customer as string;
  const stripeSubscriptionId = subscription.id as string;
  const status = subscription.status as string;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;
  const items = subscription.items as { data?: Array<{ price?: { id?: string } }> };
  const priceId = items?.data?.[0]?.price?.id || '';
  const priceToTier = buildPriceToTierMap(env);
  const tier = priceToTier[priceId] || 'pro';
  const currentPeriodEnd = subscription.current_period_end as number;

  console.log(`Subscription updated: ${stripeSubscriptionId}, status: ${status}, tier: ${tier}`);

  // Look up user_id from subscription
  let userId: string | null = null;
  try {
    const existing = await env.DB.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    )
      .bind(stripeSubscriptionId)
      .first<{ user_id: string }>();
    userId = existing?.user_id || null;
  } catch (error) {
    console.error('Failed to look up subscription:', error);
  }

  try {
    await env.DB.prepare(
      `UPDATE subscriptions
       SET status = ?, plan_tier = ?, cancel_at_period_end = ?, current_period_end = ?, updated_at = unixepoch()
       WHERE stripe_subscription_id = ?`
    )
      .bind(status, tier, cancelAtPeriodEnd ? 1 : 0, currentPeriodEnd, stripeSubscriptionId)
      .run();

    // Sync user tier (only if subscription is active)
    if (userId && status === 'active') {
      await env.DB.prepare('UPDATE users SET tier = ?, updated_at = unixepoch() WHERE id = ?')
        .bind(tier, userId)
        .run();
      await env.KV.put(`tier:${userId}`, tier, { expirationTtl: 300 });
    }
  } catch (error) {
    console.error('DB error on subscription update:', error);
  }

  await env.KV.put(
    `sub:${stripeCustomerId}`,
    JSON.stringify({
      status,
      subscriptionId: stripeSubscriptionId,
      cancelAtPeriodEnd,
      tier,
      userId,
    }),
    { expirationTtl: 86400 }
  );
}

async function handleSubscriptionDeleted(
  subscription: Record<string, unknown>,
  env: Env
): Promise<void> {
  const stripeCustomerId = subscription.customer as string;
  const stripeSubscriptionId = subscription.id as string;
  const currentPeriodEnd = subscription.current_period_end as number;

  console.log(`Subscription deleted: ${stripeSubscriptionId}`);

  // Look up user_id to reset their tier
  let userId: string | null = null;
  try {
    const existing = await env.DB.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    )
      .bind(stripeSubscriptionId)
      .first<{ user_id: string }>();
    userId = existing?.user_id || null;
  } catch (error) {
    console.error('Failed to look up subscription:', error);
  }

  try {
    await env.DB.prepare(
      `UPDATE subscriptions SET status = 'canceled', updated_at = unixepoch()
       WHERE stripe_subscription_id = ?`
    )
      .bind(stripeSubscriptionId)
      .run();

    // Reset user tier to free
    if (userId) {
      await env.DB.prepare('UPDATE users SET tier = ?, updated_at = unixepoch() WHERE id = ?')
        .bind('free', userId)
        .run();
      await env.KV.put(`tier:${userId}`, 'free', { expirationTtl: 300 });

      // Send cancellation email
      const user = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?')
        .bind(userId)
        .first<{ email: string; name: string }>();

      if (user?.email) {
        const endDate = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'America/Chicago',
            })
          : 'the end of your current billing period';

        const emailTemplate = subscriptionCanceledEmail(user.name || '', endDate);
        sendEmail(
          {
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
            userId,
            emailType: 'subscription_canceled',
          },
          env
        ).catch((err) => console.log('Cancellation email error:', err));
      }
    }
  } catch (error) {
    console.error('DB error on subscription delete:', error);
  }

  await env.KV.delete(`sub:${stripeCustomerId}`);
}

async function handlePaymentSucceeded(invoice: Record<string, unknown>, env: Env): Promise<void> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const amountPaid = invoice.amount_paid as number;
  const invoiceId = invoice.id as string;

  console.log(`Payment succeeded: ${invoiceId}, amount: ${amountPaid}`);

  // Look up user_id from subscription
  let userId: string | null = null;
  try {
    const existing = await env.DB.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    )
      .bind(subscriptionId)
      .first<{ user_id: string }>();
    userId = existing?.user_id || null;
  } catch (error) {
    console.error('Failed to look up subscription for payment:', error);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO payments (invoice_id, customer_id, subscription_id, user_id, amount, status)
       VALUES (?, ?, ?, ?, ?, 'succeeded')`
    )
      .bind(invoiceId, customerId, subscriptionId, userId, amountPaid)
      .run();

    // Update subscription status to active
    await env.DB.prepare(
      `UPDATE subscriptions SET status = 'active', updated_at = unixepoch()
       WHERE stripe_subscription_id = ?`
    )
      .bind(subscriptionId)
      .run();

    // Ensure user tier is synced if subscription is active
    if (userId) {
      const sub = await env.DB.prepare(
        'SELECT plan_tier FROM subscriptions WHERE stripe_subscription_id = ?'
      )
        .bind(subscriptionId)
        .first<{ plan_tier: string }>();

      if (sub?.plan_tier) {
        await env.DB.prepare('UPDATE users SET tier = ?, updated_at = unixepoch() WHERE id = ?')
          .bind(sub.plan_tier, userId)
          .run();
        await env.KV.put(`tier:${userId}`, sub.plan_tier, { expirationTtl: 300 });

        // Send payment success email
        const user = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?')
          .bind(userId)
          .first<{ email: string; name: string }>();

        if (user?.email) {
          const emailTemplate = paymentSuccessEmail(
            user.name || '',
            amountPaid,
            sub.plan_tier,
            invoiceId
          );
          sendEmail(
            {
              to: user.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
              userId,
              emailType: 'payment_success',
            },
            env
          ).catch((err) => console.log('Payment email failed:', err));
        }
      }
    }
  } catch (error) {
    console.error('DB error on payment success:', error);
  }
}

async function handlePaymentFailed(invoice: Record<string, unknown>, env: Env): Promise<void> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const invoiceId = invoice.id as string;
  const attemptCount = invoice.attempt_count as number;

  console.log(`Payment failed: ${invoiceId}, attempt: ${attemptCount}`);

  // Look up user_id from subscription
  let userId: string | null = null;
  try {
    const existing = await env.DB.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    )
      .bind(subscriptionId)
      .first<{ user_id: string }>();
    userId = existing?.user_id || null;
  } catch (error) {
    console.error('Failed to look up subscription for payment:', error);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO payments (invoice_id, customer_id, subscription_id, user_id, amount, status, attempt_count)
       VALUES (?, ?, ?, ?, 0, 'failed', ?)`
    )
      .bind(invoiceId, customerId, subscriptionId, userId, attemptCount)
      .run();

    // Update subscription status if multiple failures
    if (attemptCount >= 3) {
      await env.DB.prepare(
        `UPDATE subscriptions SET status = 'past_due', updated_at = unixepoch()
         WHERE stripe_subscription_id = ?`
      )
        .bind(subscriptionId)
        .run();

      await env.KV.put(
        `sub:${customerId}`,
        JSON.stringify({ status: 'past_due', subscriptionId, userId }),
        { expirationTtl: 86400 }
      );

      // Update user tier cache to reflect past_due state
      if (userId) {
        await env.KV.delete(`tier:${userId}`);
      }
    }

    // Send payment failed email
    if (userId) {
      const user = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?')
        .bind(userId)
        .first<{ email: string; name: string }>();

      if (user?.email) {
        const emailTemplate = paymentFailedEmail(user.name || '', attemptCount);
        sendEmail(
          {
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
            userId,
            emailType: 'payment_failed',
          },
          env
        ).catch((err) => console.log('Payment failed email error:', err));
      }
    }
  } catch (error) {
    console.error('DB error on payment failure:', error);
  }
}
