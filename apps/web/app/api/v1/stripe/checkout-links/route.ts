import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createProCheckoutSession, type BillingInterval } from '../../../../../lib/stripe';
import { decodeSession, SESSION_COOKIE_NAME } from '../../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { billingInterval?: string };
  const billingInterval: BillingInterval = body.billingInterval === 'annual' ? 'annual' : 'monthly';

  const origin = request.headers.get('origin') || process.env.APP_BASE_URL || 'http://localhost:3000';
  const successUrl = `${origin}/account?upgrade=success`;
  const cancelUrl = `${origin}/account?upgrade=cancelled`;

  try {
    const checkout = await createProCheckoutSession({
      userId: session.userId,
      email: session.email,
      billingInterval,
      successUrl,
      cancelUrl
    });

    return NextResponse.json({ url: checkout.url, billingInterval });
  } catch (error) {
    console.error('[stripe] failed to create checkout session', error);
    return NextResponse.json({ error: 'failed_to_create_session' }, { status: 500 });
  }
}
