import type Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import {
  recordCheckoutSession,
  updateSubscriptionByCustomer,
  upsertSubscriptionSnapshot
} from '@/lib/subscriptions';
import type { SubscriptionStatus } from '@/lib/db/prisma';

export const runtime = 'nodejs';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function syncClerkProFlag(userId: string | null | undefined, isActive: boolean) {
  if (!userId) {
    return;
  }

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        diamondProActive: isActive
      }
    });
  } catch (error) {
    console.error('Failed to update Clerk metadata for user', userId, error);
  }
}

function resolveSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  const fallback: SubscriptionStatus = 'incomplete';
  if (!status) {
    return fallback;
  }

  const allowedStatuses: SubscriptionStatus[] = [
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired'
  ];

  return allowedStatuses.includes(status as SubscriptionStatus) ? (status as SubscriptionStatus) : fallback;
}

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Stripe webhook secret missing' }, { status: 500 });
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ message: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Invalid Stripe webhook signature', error);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? null;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
        const customerId = typeof session.customer === 'string' ? session.customer : null;

        if (!subscriptionId || !userId) {
          console.warn('Checkout session completed without required identifiers', {
            subscriptionId,
            userId
          });
          break;
        }

        const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as Stripe.Subscription;
        const currentPeriodEnd =
          'current_period_end' in subscription && typeof subscription.current_period_end === 'number'
            ? new Date(subscription.current_period_end * 1000)
            : null;
        const snapshot = await upsertSubscriptionSnapshot({
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          status: resolveSubscriptionStatus(subscription.status),
          currentPeriodEnd,
          checkoutSessionId: session.id
        });

        if (!snapshot && userId) {
          await recordCheckoutSession(userId, session.id, customerId);
        }

        await syncClerkProFlag(userId, ['active', 'trialing'].includes(subscription.status));
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const currentPeriodEnd =
          'current_period_end' in subscription && typeof subscription.current_period_end === 'number'
            ? new Date(subscription.current_period_end * 1000)
            : null;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
        const userId = subscription.metadata?.userId ?? null;
        const updated = customerId
          ? await updateSubscriptionByCustomer(customerId, {
              stripeSubscriptionId: subscription.id,
              status: resolveSubscriptionStatus(subscription.status),
              currentPeriodEnd
            })
          : null;

        if (!updated && userId) {
          await upsertSubscriptionSnapshot({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            status: resolveSubscriptionStatus(subscription.status),
            currentPeriodEnd,
            checkoutSessionId: null
          });
        }

        await syncClerkProFlag(userId ?? updated?.userId, ['active', 'trialing'].includes(subscription.status));
        break;
      }
      default:
        console.info(`Unhandled Stripe webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook event', event.type, error);
    return NextResponse.json({ message: 'Webhook handler error' }, { status: 500 });
  }
}
