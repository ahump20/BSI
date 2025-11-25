// Blaze Sports Intel - Stripe Webhook Handler
import type { PagesFunction } from '@cloudflare/workers-types';
import { generateUUID } from '../../../lib/auth/auth-utils';
import { createStripeClient, mapStripeStatus, getPlanTierFromPriceId } from '../../../lib/stripe/stripe-utils';
import type Stripe from 'stripe';

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature provided', { status: 400 });
    }

    // Verify webhook signature
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    // Check for duplicate events
    const existingEvent = await env.DB.prepare(
      'SELECT id FROM webhook_events WHERE stripe_event_id = ?'
    ).bind(event.id).first();

    if (existingEvent) {
      console.log('Duplicate webhook event:', event.id);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log webhook event
    await env.DB.prepare(
      'INSERT INTO webhook_events (id, stripe_event_id, event_type, created_at) VALUES (?, ?, ?, ?)'
    ).bind(
      generateUUID(),
      event.id,
      event.type,
      Math.floor(Date.now() / 1000)
    ).run();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, env);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, env);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, env);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, env);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, env);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    // Mark event as processed
    await env.DB.prepare(
      'UPDATE webhook_events SET processed = 1 WHERE stripe_event_id = ?'
    ).bind(event.id).run();

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, env: Env) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier as 'pro' | 'enterprise';

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // The subscription will be updated via the subscription.created webhook
  console.log('Checkout session completed:', session.id, 'User:', userId, 'Tier:', tier);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, env: Env) {
  const customerId = subscription.customer as string;
  const now = Math.floor(Date.now() / 1000);

  // Get user from stripe_customer_id
  const userSubscription = await env.DB.prepare(
    'SELECT id, user_id FROM subscriptions WHERE stripe_customer_id = ?'
  ).bind(customerId).first();

  if (!userSubscription) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  // Get plan tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = getPlanTierFromPriceId(priceId, {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    proPriceId: env.STRIPE_PRO_PRICE_ID,
    enterprisePriceId: env.STRIPE_ENTERPRISE_PRICE_ID
  });

  if (!planTier) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Update subscription
  await env.DB.prepare(
    `UPDATE subscriptions
     SET stripe_subscription_id = ?,
         plan_tier = ?,
         status = ?,
         current_period_start = ?,
         current_period_end = ?,
         cancel_at_period_end = ?,
         trial_end = ?,
         updated_at = ?
     WHERE id = ?`
  ).bind(
    subscription.id,
    planTier,
    mapStripeStatus(subscription.status),
    subscription.current_period_start,
    subscription.current_period_end,
    subscription.cancel_at_period_end ? 1 : 0,
    subscription.trial_end || null,
    now,
    userSubscription.id
  ).run();

  // Log activity
  await env.DB.prepare(
    `INSERT INTO activity_log (id, user_id, action, metadata, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    generateUUID(),
    userSubscription.user_id,
    'subscription_updated',
    JSON.stringify({
      tier: planTier,
      status: subscription.status,
      subscription_id: subscription.id
    }),
    now
  ).run();

  console.log('Subscription updated:', subscription.id, 'Tier:', planTier, 'Status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, env: Env) {
  const customerId = subscription.customer as string;
  const now = Math.floor(Date.now() / 1000);

  // Get user subscription
  const userSubscription = await env.DB.prepare(
    'SELECT id, user_id FROM subscriptions WHERE stripe_customer_id = ?'
  ).bind(customerId).first();

  if (!userSubscription) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  await env.DB.prepare(
    `UPDATE subscriptions
     SET plan_tier = 'free',
         status = 'canceled',
         stripe_subscription_id = NULL,
         current_period_end = NULL,
         cancel_at_period_end = 0,
         updated_at = ?
     WHERE id = ?`
  ).bind(now, userSubscription.id).run();

  // Log activity
  await env.DB.prepare(
    `INSERT INTO activity_log (id, user_id, action, metadata, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    generateUUID(),
    userSubscription.user_id,
    'subscription_canceled',
    JSON.stringify({ subscription_id: subscription.id }),
    now
  ).run();

  console.log('Subscription deleted, downgraded to free:', subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice, env: Env) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const now = Math.floor(Date.now() / 1000);

  // Get user subscription
  const userSubscription = await env.DB.prepare(
    'SELECT id, user_id FROM subscriptions WHERE stripe_customer_id = ?'
  ).bind(customerId).first();

  if (!userSubscription) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  // Record payment
  await env.DB.prepare(
    `INSERT INTO payment_history (
      id, user_id, subscription_id, stripe_invoice_id,
      amount, currency, status, invoice_pdf, paid_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    generateUUID(),
    userSubscription.user_id,
    userSubscription.id,
    invoice.id,
    invoice.amount_paid,
    invoice.currency,
    'paid',
    invoice.invoice_pdf || null,
    invoice.status_transitions.paid_at || now,
    now
  ).run();

  // Log activity
  await env.DB.prepare(
    `INSERT INTO activity_log (id, user_id, action, metadata, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    generateUUID(),
    userSubscription.user_id,
    'payment_successful',
    JSON.stringify({
      invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency
    }),
    now
  ).run();

  console.log('Invoice paid:', invoice.id, 'Amount:', invoice.amount_paid);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, env: Env) {
  const customerId = invoice.customer as string;
  const now = Math.floor(Date.now() / 1000);

  // Get user subscription
  const userSubscription = await env.DB.prepare(
    'SELECT id, user_id FROM subscriptions WHERE stripe_customer_id = ?'
  ).bind(customerId).first();

  if (!userSubscription) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  // Record failed payment
  await env.DB.prepare(
    `INSERT INTO payment_history (
      id, user_id, subscription_id, stripe_invoice_id,
      amount, currency, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    generateUUID(),
    userSubscription.user_id,
    userSubscription.id,
    invoice.id,
    invoice.amount_due,
    invoice.currency,
    'failed',
    now
  ).run();

  // Update subscription status to past_due
  await env.DB.prepare(
    `UPDATE subscriptions
     SET status = 'past_due',
         updated_at = ?
     WHERE id = ?`
  ).bind(now, userSubscription.id).run();

  // Log activity
  await env.DB.prepare(
    `INSERT INTO activity_log (id, user_id, action, metadata, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    generateUUID(),
    userSubscription.user_id,
    'payment_failed',
    JSON.stringify({
      invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency
    }),
    now
  ).run();

  console.log('Invoice payment failed:', invoice.id, 'Amount:', invoice.amount_due);

  // TODO: Send email notification to user about failed payment
}
