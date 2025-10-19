/**
 * Database client factory compatible with both Node.js and Edge/Worker runtimes.
 *
 * Workers run on V8 isolates without Node polyfills, so we rely on the Prisma
 * Edge client bundled via Accelerate/Data Proxy. The same client can also be
 * consumed by Next.js (Node) code as long as it communicates with the Data
 * Proxy endpoint.
 */

import { Prisma, PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/client/extension';

export type DatabaseClient = PrismaClient;

export interface DatabaseClientOptions {
  /** Fully qualified connection string for the Prisma Data Proxy/Accelerate */
  databaseUrl: string;
  /** Optional Accelerate URL (falls back to env configuration when omitted) */
  accelerateUrl?: string;
  /** Optional logging configuration mirrored from PrismaClientOptions */
  log?: Prisma.LogDefinition[] | Prisma.LogLevel[];
}

/**
 * Instantiate a Prisma client that works in both Workers and Node runtimes.
 */
export function createDatabaseClient({
  databaseUrl,
  accelerateUrl,
  log,
}: DatabaseClientOptions): DatabaseClient {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create a Prisma client.');
  }

  const client = new PrismaClient({
    datasourceUrl: databaseUrl,
    log,
  });

  if (accelerateUrl) {
    return client.$extends(withAccelerate({ url: accelerateUrl }));
  }

  return client;
}

/**
 * Convenience helper for Workers where env vars are passed explicitly.
 */
export function createWorkerDatabaseClient(env: {
  DATABASE_URL: string;
  PRISMA_ACCELERATE_URL?: string;
}): DatabaseClient {
  return createDatabaseClient({
    databaseUrl: env.DATABASE_URL,
    accelerateUrl: env.PRISMA_ACCELERATE_URL,
  });
}
