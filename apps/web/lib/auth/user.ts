import { prisma } from '../db/client';

export interface UpsertUserOptions {
  clerkUserId: string;
  email?: string | null;
  stripeCustomerId?: string | null;
}

export async function upsertUser({ clerkUserId, email, stripeCustomerId }: UpsertUserOptions) {
  return prisma.user.upsert({
    where: { clerkId: clerkUserId },
    update: {
      email: email ?? undefined,
      stripeCustomerId: stripeCustomerId ?? undefined
    },
    create: {
      clerkId: clerkUserId,
      email: email ?? undefined,
      stripeCustomerId: stripeCustomerId ?? undefined
    }
  });
}

export async function attachStripeCustomerId(clerkUserId: string, stripeCustomerId: string) {
  return prisma.user.update({
    where: { clerkId: clerkUserId },
    data: { stripeCustomerId }
  });
}

export async function getUserAccountSnapshot(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: {
      entitlements: { where: { active: true } },
      subscriptions: { orderBy: { createdAt: 'desc' } }
    }
  });
}
