/**
 * Prisma Client Factory for Edge Runtimes
 *
 * Provides a helper to instantiate the Prisma Client configured for Prisma
 * Accelerate/Data Proxy so we can talk to Postgres over HTTPS from edge
 * environments like Cloudflare Workers or the Next.js edge runtime.
 */

import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export type EdgePrismaClient = ReturnType<typeof createPrismaClient>;

export interface CreatePrismaClientOptions {
  /**
   * The datasource URL to pass to Prisma. Typically this should point at the
   * Prisma Accelerate/Data Proxy endpoint rather than the direct database.
   */
  datasourceUrl?: string;
  /**
   * Optional explicit Accelerate URL. When omitted, the Accelerate extension
   * will fall back to `process.env.PRISMA_ACCELERATE_URL`.
   */
  accelerateUrl?: string;
}

/**
 * Create a new Prisma Client instance configured for edge runtimes.
 */
export function createPrismaClient(
  options: CreatePrismaClientOptions = {}
): PrismaClient {
  const env = typeof process !== 'undefined' ? process.env : undefined;

  const datasourceUrl =
    options.datasourceUrl ??
    env?.PRISMA_ACCELERATE_URL ??
    env?.DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error('Missing Prisma datasource URL for edge client.');
  }

  const accelerateUrl = options.accelerateUrl ?? env?.PRISMA_ACCELERATE_URL;

  const accelerateExtension = accelerateUrl
    ? withAccelerate({ accelerateUrl })
    : withAccelerate();

  return new PrismaClient({ datasourceUrl }).$extends(accelerateExtension);
}

const globalForPrisma = globalThis as unknown as {
  prisma: EdgePrismaClient | undefined;
};

export function getPrismaClientSingleton(): EdgePrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/**
 * Gracefully disconnect from database. Useful for scripts/tests that want to
 * ensure we release the Data Proxy connection at the end of execution.
 */
export async function disconnectDatabase(client?: EdgePrismaClient): Promise<void> {
  if (client) {
    await client.$disconnect();
    return;
  }

  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

/**
 * Test database connection for diagnostics.
 */
export async function testConnection(client?: EdgePrismaClient): Promise<boolean> {
  const prisma = client ?? getPrismaClientSingleton();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
