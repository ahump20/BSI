import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

type EnvMap = Record<string, string | undefined>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const runtimeEnv: EnvMap = (() => {
  const env: EnvMap = {};

  if (typeof process !== 'undefined' && process.env) {
    Object.assign(env, process.env);
  }

  if (typeof globalThis !== 'undefined') {
    const candidate = (globalThis as unknown as { ENV?: EnvMap }).ENV;
    if (candidate) {
      Object.assign(env, candidate);
    }
  }

  return env;
})();

function readEnv(key: string): string | undefined {
  const value = runtimeEnv[key];
  return value && value.length > 0 ? value : undefined;
}

function resolveDatasourceUrl(): string {
  const accelerateUrl = readEnv('PRISMA_ACCELERATE_URL');
  if (accelerateUrl) {
    return accelerateUrl;
  }

  const directUrl = readEnv('DATABASE_URL');
  if (!directUrl) {
    throw new Error('DATABASE_URL is not set. Add it to your environment configuration.');
  }

  return directUrl;
}

function buildClient(): PrismaClient {
  const client = new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log:
      readEnv('NODE_ENV') === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

  const accelerateUrl = readEnv('PRISMA_ACCELERATE_URL');
  if (accelerateUrl) {
    return client.$extends(withAccelerate());
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (readEnv('NODE_ENV') !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
