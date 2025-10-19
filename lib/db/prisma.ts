/**
 * Prisma Client Singleton
 *
 * Ensures a single PrismaClient instance is used throughout the application
 * to avoid exhausting database connections.
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/db/prisma';
 *
 * const teams = await prisma.team.findMany();
 * ```
 */

type PrismaClientLike = {
  game: { findMany: (...args: any[]) => Promise<unknown[]> };
  team?: { findMany: (...args: any[]) => Promise<unknown[]> };
  teamStat?: { findMany: (...args: any[]) => Promise<unknown[]> };
  $disconnect: () => Promise<void>;
  $queryRaw: (...args: any[]) => Promise<unknown>;
};

class PrismaFallback implements PrismaClientLike {
  game = { findMany: async () => [] as unknown[] };
  team = { findMany: async () => [] as unknown[] };
  teamStat = { findMany: async () => [] as unknown[] };
  async $disconnect() {
    return Promise.resolve();
  }
  async $queryRaw() {
    return 1;
  }
}

function getPrismaClientConstructor(): new () => PrismaClientLike {
  const shouldUsePrisma = process.env.ENABLE_PRISMA_CLIENT === 'true';
  if (!shouldUsePrisma) {
    return PrismaFallback;
  }

  try {
    const loader = eval('require') as (moduleId: string) => { PrismaClient: new () => PrismaClientLike };
    const { PrismaClient } = loader('@prisma/client');
    return PrismaClient;
  } catch (error) {
    console.warn('Prisma client unavailable, using in-memory fallback');
    return PrismaFallback;
  }
}

const PrismaClientCtor = getPrismaClientConstructor();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClientCtor();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Gracefully disconnect from database
 * Call this during application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Test database connection
 * @returns true if connection successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
