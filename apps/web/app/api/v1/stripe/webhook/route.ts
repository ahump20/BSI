import type { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

import { getPrismaClient } from '@/lib/db';

const STRIPE_API_VERSION: Stripe.StripeConfig['apiVersion'] = '2024-06-20';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(stripeSecret, {
  apiVersion: STRIPE_API_VERSION,
  typescript: true,
});

export const dynamic = 'force-dynamic';

function toJsonPayload(event: Stripe.Event): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue;
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook secret is not configured.' },
      { status: 500 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header.' },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid Stripe signature.' },
      { status: 400 },
    );
  }

  try {
    const prisma = getPrismaClient();
    const existing = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existing) {
      return NextResponse.json(
        { received: true, idempotent: true },
        {
          status: 200,
          headers: {
            'cache-control': 'no-store',
          },
        },
      );
    }

    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        payload: toJsonPayload(event),
      },
    });

    // TODO: trigger business logic for handled event types (e.g., grant Diamond Pro access).

    return NextResponse.json(
      { received: true, idempotent: false },
      {
        status: 200,
        headers: {
          'cache-control': 'no-store',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to persist Stripe event.' },
      { status: 500 },
    );
  }
}
