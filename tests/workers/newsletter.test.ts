import { describe, expect, it, vi } from 'vitest';

import { handleNewsletter } from '../../workers/handlers/lead';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

describe('/api/newsletter', () => {
  it('rejects invalid email addresses', async () => {
    const response = await handleNewsletter(
      new Request('https://blazesportsintel.com/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid', consent: true }),
      }),
      { KV: createMockKV() } as any,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Valid email is required',
    });
  });

  it('requires consent before subscribing', async () => {
    const response = await handleNewsletter(
      new Request('https://blazesportsintel.com/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'reader@example.com', consent: false }),
      }),
      { KV: createMockKV() } as any,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Consent to privacy policy is required',
    });
  });

  it('stores the subscription in Worker KV', async () => {
    const kv = createMockKV();
    const response = await handleNewsletter(
      new Request('https://blazesportsintel.com/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '127.0.0.1',
        },
        body: JSON.stringify({ email: 'Reader@Example.com', consent: true }),
      }),
      { KV: kv } as any,
    );

    expect(response.status).toBe(200);
    expect(kv.store.has('newsletter:reader@example.com')).toBe(true);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      message: 'Subscribed successfully',
    });
  });
});
