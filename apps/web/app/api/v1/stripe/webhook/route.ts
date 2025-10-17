import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClientForWebhook, getStripeWebhookSecret } from '../../../../../lib/stripe';
import { assignRoleToUser, ensureAuth0Roles } from '../../../../../lib/auth0';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  const stripe = getStripeClientForWebhook();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', getStripeWebhookSecret());
  } catch (error) {
    console.error('[stripe] webhook signature verification failed', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const auth0UserId = session.metadata?.auth0UserId || session.client_reference_id;

    if (auth0UserId) {
      try {
        await ensureAuth0Roles();
        await assignRoleToUser(auth0UserId, 'editor');
      } catch (error) {
        console.error('[auth0] failed to assign editor role', error);
        return NextResponse.json({ received: true, auth0Error: true });
      }
    }
  }

  return NextResponse.json({ received: true });
}
