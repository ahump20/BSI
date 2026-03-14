import { afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_PROXY_BASE = process.env.BSI_DEV_PROXY_API_BASE;

async function loadConfigForEnv(nodeEnv: string, proxyBase?: string) {
  vi.resetModules();
  process.env.NODE_ENV = nodeEnv;

  if (proxyBase) {
    process.env.BSI_DEV_PROXY_API_BASE = proxyBase;
  } else {
    delete process.env.BSI_DEV_PROXY_API_BASE;
  }

  const module = await import('../../next.config');
  return module.default;
}

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;

  if (typeof ORIGINAL_PROXY_BASE === 'string') {
    process.env.BSI_DEV_PROXY_API_BASE = ORIGINAL_PROXY_BASE;
  } else {
    delete process.env.BSI_DEV_PROXY_API_BASE;
  }

  vi.resetModules();
});

describe('next.config rewrites', () => {
  it('proxies every API route through the Worker in development', async () => {
    const config = await loadConfigForEnv('development', 'https://example.test/');
    const rewrites = await config.rewrites?.();

    expect(rewrites).toEqual([
      {
        source: '/api/:path*',
        destination: 'https://example.test/api/:path*',
      },
    ]);
  });

  it('does not register development rewrites in production', async () => {
    const config = await loadConfigForEnv('production');
    const rewrites = await config.rewrites?.();

    expect(rewrites).toEqual([]);
  });
});
