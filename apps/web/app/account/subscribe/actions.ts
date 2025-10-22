'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { recordConversionEvent } from '../../../lib/analytics/events';
import { assertStripeClient } from '../../../lib/stripe';
import { ensureUser, syncStripeCustomerId } from '../../../lib/auth/entitlements';

function resolveAppUrl() {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export async function createCheckoutSessionAction() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in?redirect_url=/account/subscribe');
  }

  const user = await currentUser();
  if (!user) {
    redirect('/auth/sign-in?redirect_url=/account/subscribe');
  }

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    undefined;

  const dbUser = await ensureUser({ clerkUserId: user.id, email });

  const stripe = assertStripeClient();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error('Missing STRIPE_PRO_PRICE_ID. Configure via Vercel/Cloudflare secrets.');
  }

  const baseUrl = resolveAppUrl().replace(/\/$/, '');

  const existingCustomerId = dbUser.stripeCustomerId;

  const customerId = existingCustomerId
    ? existingCustomerId
    : (
        await stripe.customers.create({
          email,
          metadata: {
            clerkUserId: user.id
          }
        })
      ).id;

  if (!existingCustomerId) {
    await syncStripeCustomerId({ clerkUserId: user.id, customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: `${baseUrl}/account/subscribe?state=success`,
    cancel_url: `${baseUrl}/account/subscribe?state=cancelled`,
    customer: customerId,
    client_reference_id: user.id,
    metadata: {
      clerkUserId: user.id
    },
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ]
  });

  await recordConversionEvent(
    'diamond_pro_checkout_session_created',
    { surface: 'account-subscribe' },
    { clerkUserId: user.id, checkoutSessionId: session.id, customerId }
  );

  redirect(session.url ?? '/account');
}
