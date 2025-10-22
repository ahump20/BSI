import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { assertStripeClient } from '../../../../lib/stripe';
import {
  recordConversionEvent
} from '../../../../lib/analytics/events';
import {
  fromUnix,
  resolveSubscriptionStatus,
  syncStripeCustomerId,
  syncSubscriptionRecord
} from '../../../../lib/auth/entitlements';

function extractClerkUserId(
  subscription: Stripe.Subscription,
  customer: Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  const fromSubscription = typeof subscription.metadata?.clerkUserId === 'string'
    ? subscription.metadata.clerkUserId
    : null;
  if (fromSubscription) return fromSubscription;

  if (customer && !('deleted' in customer)) {
    const fromCustomer = typeof customer.metadata?.clerkUserId === 'string'
      ? customer.metadata.clerkUserId
      : null;
    if (fromCustomer) return fromCustomer;
  }

  const clientReference = typeof subscription.metadata?.client_reference_id === 'string'
    ? subscription.metadata.client_reference_id
    : null;

  return clientReference;
}

async function resolveClerkUserId(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string | null> {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  return extractClerkUserId(subscription, customer);
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  const stripeClient = assertStripeClient();
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) {
    await recordConversionEvent('diamond_pro_subscription_event_missing_customer', { surface: 'stripe-webhook' }, {
      subscriptionId: subscription.id,
      eventType
    });
    return NextResponse.json({ error: 'Missing customer' }, { status: 200 });
  }

  const clerkUserId =
    typeof subscription.metadata?.clerkUserId === 'string'
      ? subscription.metadata.clerkUserId
      : await resolveClerkUserId(stripeClient, subscription);

  if (!clerkUserId) {
    await recordConversionEvent('diamond_pro_subscription_event_unmapped', { surface: 'stripe-webhook' }, {
      subscriptionId: subscription.id,
      customerId,
      eventType
    });
    return NextResponse.json({ received: true });
  }

  await syncStripeCustomerId({ clerkUserId, customerId });

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const status = resolveSubscriptionStatus(subscription.status ?? 'incomplete');
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  const currentPeriodEnd = fromUnix(
    'current_period_end' in subscription && typeof subscription.current_period_end === 'number'
      ? subscription.current_period_end
      : undefined
  );

  await syncSubscriptionRecord({
    clerkUserId,
    subscriptionId: subscription.id,
    customerId,
    priceId,
    status,
    cancelAtPeriodEnd,
    currentPeriodEnd
  });

  await recordConversionEvent('diamond_pro_subscription_event_processed', { surface: 'stripe-webhook' }, {
    clerkUserId,
    subscriptionId: subscription.id,
    status,
    eventType
  });

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  const stripe = assertStripeClient();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook signature validation failed.' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    await recordConversionEvent('diamond_pro_webhook_signature_failed', { surface: 'stripe-webhook' }, {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === 'string') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        return handleSubscriptionEvent(subscription, event.type);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      return handleSubscriptionEvent(subscription, event.type);
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

export const dynamic = 'force-dynamic';
