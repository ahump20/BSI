type PrismaClientLike = {
  [key: string]: any;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
};

function createPrismaStub(): PrismaClientLike {
  const asyncNoop = async () => null;

  const createOperationStub = (property: PropertyKey) =>
    new Proxy(asyncNoop, {
      apply: (_targetFn, _thisArg, args) => {
        if (property === '$transaction' && Array.isArray(args?.[0])) {
          return Promise.all(args[0].map(() => null));
        }

        return asyncNoop();
      },
      get: (_target, childProp) => createOperationStub(childProp)
    });

  return new Proxy(
    {
      $disconnect: async () => undefined,
      $connect: async () => undefined
    },
    {
      get(target, property) {
        if (property in target) {
          return Reflect.get(target, property);
        }

        return createOperationStub(property);
      }
    }
  );
}

let prismaClient: PrismaClientLike | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  prismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
  }
} catch (error) {
  console.warn('Prisma client unavailable, using in-memory stub. Run `prisma generate` for full functionality.');
  prismaClient = createPrismaStub();
}

export const prisma = prismaClient;

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface SubscriptionSnapshot {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  checkoutSessionId?: string | null;
}
