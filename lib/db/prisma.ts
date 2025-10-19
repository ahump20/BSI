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

import { createDatabaseClient, type DatabaseClient } from '@/lib/db/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: DatabaseClient | undefined;
};

const logLevels =
  process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

export const prisma =
  globalForPrisma.prisma ??
  createDatabaseClient({
    databaseUrl: process.env.DATABASE_URL || '',
    accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
    log: logLevels,
  });

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
