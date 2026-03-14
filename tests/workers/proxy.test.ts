import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxyToPages } from '@/workers/shared/proxy';

describe('proxyToPages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards POST bodies to the Pages origin', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } }));

    const request = new Request('https://blazesportsintel.com/api/ai/game-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'blazesportsintel.com',
      },
      body: JSON.stringify({ prompt: 'health check' }),
    });

    await proxyToPages(request, {
      PAGES_ORIGIN: 'https://blazesportsintel.pages.dev',
    } as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://blazesportsintel.pages.dev/api/ai/game-analysis');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeInstanceOf(ReadableStream);
    expect(new Headers(init?.headers).has('host')).toBe(false);
  });

  it('does not attach a body for GET requests', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } }));

    const request = new Request('https://blazesportsintel.com/scores/', {
      method: 'GET',
      headers: {
        Host: 'blazesportsintel.com',
      },
    });

    await proxyToPages(request, {
      PAGES_ORIGIN: 'https://blazesportsintel.pages.dev',
    } as never);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('GET');
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).has('host')).toBe(false);
  });
});
