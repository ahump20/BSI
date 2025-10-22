import { SubscriptionStatus } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

import { prisma } from '../db/client';
import { recordRuntimeEvent } from '../observability/datadog-runtime';
import { attachStripeCustomerId, getUserAccountSnapshot, upsertUser } from './user';

export const DIAMOND_PRO_CODE = 'diamond-pro';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  'TRIALING',
  'ACTIVE'
]);

export function fromUnix(timestamp?: number | null) {
  return typeof timestamp === 'number' ? new Date(timestamp * 1000) : undefined;
}

async function syncClerkEntitlements(clerkUserId: string) {
  try {
    const activeEntitlements = await prisma.entitlement.findMany({
      where: { user: { clerkId: clerkUserId }, active: true },
      select: { code: true }
    });

    const client = await clerkClient();

    await client.users.updateUser(clerkUserId, {
      publicMetadata: {
        entitlements: activeEntitlements.map((item) => item.code)
      }
    });
  } catch (error) {
    await recordRuntimeEvent('diamond_pro_metadata_sync_failed', {
      surface: 'clerk-sync'
    }, {
      clerkUserId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function ensureUser({
  clerkUserId,
  email,
  stripeCustomerId
}: {
  clerkUserId: string;
  email?: string | null;
  stripeCustomerId?: string | null;
}) {
  return upsertUser({ clerkUserId, email, stripeCustomerId });
}

export async function getActiveEntitlements(clerkUserId: string) {
  const snapshot = await getUserAccountSnapshot(clerkUserId);
  return snapshot?.entitlements ?? [];
}

export function hasDiamondProAccess(entitlements: { code: string; active: boolean }[]) {
  return entitlements.some((entitlement) => entitlement.active && entitlement.code === DIAMOND_PRO_CODE);
}

export async function grantDiamondPro({
  clerkUserId,
  stripeCustomerId,
  priceId,
  currentPeriodEnd,
  source = 'stripe'
}: {
  clerkUserId: string;
  stripeCustomerId?: string | null;
  priceId?: string | null;
  currentPeriodEnd?: Date;
  source?: string;
}) {
  const user = await upsertUser({ clerkUserId, stripeCustomerId });

  await prisma.entitlement.upsert({
    where: {
      userId_code: {
        userId: user.id,
        code: DIAMOND_PRO_CODE
      }
    },
    update: {
      active: true,
      expiresAt: currentPeriodEnd ?? undefined,
      source
    },
    create: {
      userId: user.id,
      code: DIAMOND_PRO_CODE,
      source,
      expiresAt: currentPeriodEnd ?? undefined
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      proSince: user.proSince ?? new Date()
    }
  });

  await syncClerkEntitlements(clerkUserId);

  await recordRuntimeEvent('diamond_pro_entitlement_granted', { surface: 'billing' }, {
    clerkUserId,
    priceId,
    source,
    expiresAt: currentPeriodEnd?.toISOString()
  });
}

export async function revokeDiamondPro({
  clerkUserId,
  reason,
  stripeCustomerId
}: {
  clerkUserId: string;
  reason: string;
  stripeCustomerId?: string | null;
}) {
  const user = await upsertUser({ clerkUserId, stripeCustomerId });

  await prisma.entitlement.updateMany({
    where: {
      userId: user.id,
      code: DIAMOND_PRO_CODE,
      active: true
    },
    data: { active: false }
  });

  await syncClerkEntitlements(clerkUserId);

  await recordRuntimeEvent('diamond_pro_entitlement_revoked', { surface: 'billing' }, {
    clerkUserId,
    reason
  });
}

export async function syncSubscriptionRecord({
  clerkUserId,
  subscriptionId,
  customerId,
  priceId,
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd
}: {
  clerkUserId: string;
  subscriptionId: string;
  customerId: string;
  priceId?: string | null;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: Date;
}) {
  const user = await upsertUser({ clerkUserId, stripeCustomerId: customerId });

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    update: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId ?? undefined,
      status,
      cancelAtPeriodEnd,
      currentPeriodEnd: currentPeriodEnd ?? undefined
    },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      stripePriceId: priceId ?? undefined,
      status,
      cancelAtPeriodEnd,
      currentPeriodEnd: currentPeriodEnd ?? undefined
    }
  });

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    await grantDiamondPro({
      clerkUserId,
      stripeCustomerId: customerId,
      priceId: priceId ?? undefined,
      currentPeriodEnd: currentPeriodEnd ?? undefined
    });
  } else if (status === 'CANCELED' || status === 'PAST_DUE' || status === 'UNPAID') {
    await revokeDiamondPro({ clerkUserId, reason: `subscription-${status.toLowerCase()}`, stripeCustomerId: customerId });
  }
}

export function resolveSubscriptionStatus(status: string): SubscriptionStatus {
  if ((Object.values(SubscriptionStatus) as string[]).includes(status)) {
    return status as SubscriptionStatus;
  }
  switch (status) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'unpaid':
      return 'UNPAID';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    default:
      return 'INCOMPLETE';
  }
}

export async function syncStripeCustomerId({
  clerkUserId,
  customerId
}: {
  clerkUserId: string;
  customerId: string;
}) {
  await attachStripeCustomerId(clerkUserId, customerId);
}

export const ACCOUNTING_STATUS_ACTIVE = ACTIVE_SUBSCRIPTION_STATUSES;
export const ACCOUNTING_STATUS_GRACE = new Set<SubscriptionStatus>(['PAST_DUE']);
