import { prisma, type SubscriptionSnapshot, type SubscriptionStatus } from './db/prisma';

export async function getSubscriptionForUser(userId: string): Promise<SubscriptionSnapshot | null> {
  if (!userId) {
    return null;
  }

  if (!prisma?.userSubscription?.findUnique) {
    return null;
  }

  return prisma.userSubscription.findUnique({
    where: { userId }
  });
}

export async function upsertSubscriptionSnapshot(
  snapshot: SubscriptionSnapshot
): Promise<SubscriptionSnapshot> {
  if (!prisma?.userSubscription?.upsert) {
    return snapshot;
  }

  return prisma.userSubscription.upsert({
    where: { userId: snapshot.userId },
    create: {
      userId: snapshot.userId,
      stripeCustomerId: snapshot.stripeCustomerId,
      stripeSubscriptionId: snapshot.stripeSubscriptionId,
      status: snapshot.status,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      checkoutSessionId: snapshot.checkoutSessionId ?? null
    },
    update: {
      stripeCustomerId: snapshot.stripeCustomerId,
      stripeSubscriptionId: snapshot.stripeSubscriptionId,
      status: snapshot.status,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      checkoutSessionId: snapshot.checkoutSessionId ?? null
    }
  });
}

export async function updateSubscriptionByCustomer(
  stripeCustomerId: string,
  update: Partial<SubscriptionSnapshot>
): Promise<SubscriptionSnapshot | null> {
  if (!stripeCustomerId) {
    return null;
  }

  try {
    if (!prisma?.userSubscription?.update) {
      return null;
    }

    return prisma.userSubscription.update({
      where: { stripeCustomerId },
      data: {
        stripeSubscriptionId: update.stripeSubscriptionId,
        status: update.status as SubscriptionStatus,
        currentPeriodEnd: update.currentPeriodEnd ?? null,
        checkoutSessionId: update.checkoutSessionId ?? null
      }
    });
  } catch (error) {
    console.error('Failed to update subscription by customer', error);
    return null;
  }
}

export async function recordCheckoutSession(
  userId: string,
  sessionId: string,
  stripeCustomerId?: string | null
) {
  if (!prisma?.userSubscription?.upsert) {
    return null;
  }

  return prisma.userSubscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: null,
      status: 'incomplete',
      currentPeriodEnd: null,
      checkoutSessionId: sessionId
    },
    update: {
      stripeCustomerId: stripeCustomerId ?? null,
      checkoutSessionId: sessionId,
      status: 'incomplete'
    }
  });
}
