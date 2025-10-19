import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSubscriptionForUser, recordCheckoutSession } from '@/lib/subscriptions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_DIAMOND_PRO_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ message: 'Stripe price not configured' }, { status: 500 });
  }

  const existingSubscription = await getSubscriptionForUser(userId);
  if (existingSubscription && ['active', 'trialing', 'past_due'].includes(existingSubscription.status)) {
    return NextResponse.json({
      url: `${process.env.APP_URL ?? request.headers.get('origin') ?? ''}/account`,
      message: 'Subscription already active'
    });
  }

  try {
    const origin = request.headers.get('origin') ?? process.env.APP_URL ?? 'http://localhost:3000';
    const successUrl = new URL('/account?checkout=success', origin).toString();
    const cancelUrl = new URL('/account?checkout=cancelled', origin).toString();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer: existingSubscription?.stripeCustomerId ?? undefined,
      metadata: { userId, tier: 'diamond_pro' },
      subscription_data: {
        metadata: { userId, tier: 'diamond_pro' }
      }
    });

    const customerId = typeof session.customer === 'string' ? session.customer : existingSubscription?.stripeCustomerId ?? null;

    await recordCheckoutSession(userId, session.id, customerId);

    if (!session.url) {
      return NextResponse.json({ message: 'Stripe did not return a checkout URL' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create Stripe checkout session', error);
    return NextResponse.json({ message: 'Unable to create checkout session' }, { status: 500 });
  }
}
