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
 */

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
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
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const customerEmail = session.customer_email as string;

  console.log(`Checkout completed: ${customerId}, subscription: ${subscriptionId}`);

  // Store in D1
  try {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO subscriptions (customer_id, subscription_id, email, status, created_at, updated_at)
       VALUES (?, ?, ?, 'active', datetime('now'), datetime('now'))`
    )
      .bind(customerId, subscriptionId, customerEmail)
      .run();
  } catch (error) {
    console.error('DB error on checkout:', error);
  }

  // Cache subscription status in KV for fast lookups
  await env.KV.put(`sub:${customerId}`, JSON.stringify({ status: 'active', subscriptionId }), {
    expirationTtl: 86400,
  });
}

async function handleSubscriptionCreated(
  subscription: Record<string, unknown>,
  env: Env
): Promise<void> {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id as string;
  const status = subscription.status as string;
  const planId =
    (subscription.items as Record<string, unknown[]>)?.data?.[0]?.price?.id || 'unknown';

  console.log(`Subscription created: ${subscriptionId} for customer ${customerId}`);

  try {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO subscriptions (customer_id, subscription_id, status, plan_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(customerId, subscriptionId, status, planId)
      .run();
  } catch (error) {
    console.error('DB error on subscription create:', error);
  }

  await env.KV.put(`sub:${customerId}`, JSON.stringify({ status, subscriptionId, planId }), {
    expirationTtl: 86400,
  });
}

async function handleSubscriptionUpdated(
  subscription: Record<string, unknown>,
  env: Env
): Promise<void> {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id as string;
  const status = subscription.status as string;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end as boolean;

  console.log(`Subscription updated: ${subscriptionId}, status: ${status}`);

  try {
    await env.DB.prepare(
      `UPDATE subscriptions SET status = ?, cancel_at_period_end = ?, updated_at = datetime('now')
       WHERE subscription_id = ?`
    )
      .bind(status, cancelAtPeriodEnd ? 1 : 0, subscriptionId)
      .run();
  } catch (error) {
    console.error('DB error on subscription update:', error);
  }

  await env.KV.put(
    `sub:${customerId}`,
    JSON.stringify({ status, subscriptionId, cancelAtPeriodEnd }),
    { expirationTtl: 86400 }
  );
}

async function handleSubscriptionDeleted(
  subscription: Record<string, unknown>,
  env: Env
): Promise<void> {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id as string;

  console.log(`Subscription deleted: ${subscriptionId}`);

  try {
    await env.DB.prepare(
      `UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now')
       WHERE subscription_id = ?`
    )
      .bind(subscriptionId)
      .run();
  } catch (error) {
    console.error('DB error on subscription delete:', error);
  }

  await env.KV.delete(`sub:${customerId}`);
}

async function handlePaymentSucceeded(invoice: Record<string, unknown>, env: Env): Promise<void> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const amountPaid = invoice.amount_paid as number;
  const invoiceId = invoice.id as string;

  console.log(`Payment succeeded: ${invoiceId}, amount: ${amountPaid}`);

  try {
    await env.DB.prepare(
      `INSERT INTO payments (invoice_id, customer_id, subscription_id, amount, status, created_at)
       VALUES (?, ?, ?, ?, 'succeeded', datetime('now'))`
    )
      .bind(invoiceId, customerId, subscriptionId, amountPaid)
      .run();

    // Update subscription status to active
    await env.DB.prepare(
      `UPDATE subscriptions SET status = 'active', updated_at = datetime('now')
       WHERE subscription_id = ?`
    )
      .bind(subscriptionId)
      .run();
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

  try {
    await env.DB.prepare(
      `INSERT INTO payments (invoice_id, customer_id, subscription_id, amount, status, attempt_count, created_at)
       VALUES (?, ?, ?, 0, 'failed', ?, datetime('now'))`
    )
      .bind(invoiceId, customerId, subscriptionId, attemptCount)
      .run();

    // Update subscription status if multiple failures
    if (attemptCount >= 3) {
      await env.DB.prepare(
        `UPDATE subscriptions SET status = 'past_due', updated_at = datetime('now')
         WHERE subscription_id = ?`
      )
        .bind(subscriptionId)
        .run();

      await env.KV.put(
        `sub:${customerId}`,
        JSON.stringify({ status: 'past_due', subscriptionId }),
        {
          expirationTtl: 86400,
        }
      );
    }
  } catch (error) {
    console.error('DB error on payment failure:', error);
  }
}
