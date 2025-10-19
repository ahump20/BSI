import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __bsiPrisma: PrismaClient | undefined;
}

const prisma = global.__bsiPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  global.__bsiPrisma = prisma;
}

export { prisma };
