'use server';

import { redirect } from 'next/navigation';
import { createProCheckoutSession, type BillingInterval } from '../../lib/stripe';
import { getSession } from '../../lib/session';

function getBaseUrl() {
  return process.env.APP_BASE_URL || 'http://localhost:3000';
}

export async function startDiamondProCheckout(formData: FormData) {
  const session = getSession();
  if (!session) {
    redirect('/auth/login?returnTo=/account');
  }

  const billingInterval = (formData.get('billingInterval') as BillingInterval) || 'monthly';
  const normalized: BillingInterval = billingInterval === 'annual' ? 'annual' : 'monthly';

  const successUrl = `${getBaseUrl()}/account?upgrade=success`;
  const cancelUrl = `${getBaseUrl()}/account?upgrade=cancelled`;

  const checkout = await createProCheckoutSession({
    userId: session.userId,
    email: session.email,
    billingInterval: normalized,
    successUrl,
    cancelUrl
  });

  redirect(checkout.url);
}
