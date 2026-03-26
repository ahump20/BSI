import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('generate-static-params build source handling', () => {
  const originalBaseUrl = process.env.BASE_URL;
  const originalStaticBaseUrl = process.env.BSI_STATIC_PARAMS_BASE_URL;

  beforeEach(() => {
    delete process.env.BASE_URL;
    delete process.env.BSI_STATIC_PARAMS_BASE_URL;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = originalBaseUrl;
    }

    if (originalStaticBaseUrl === undefined) {
      delete process.env.BSI_STATIC_PARAMS_BASE_URL;
    } else {
      process.env.BSI_STATIC_PARAMS_BASE_URL = originalStaticBaseUrl;
    }
  });

  it('returns placeholder params without fetching production when no base url is configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { mlbGameParams } = await import('@/lib/generate-static-params');

    await expect(mlbGameParams()).resolves.toEqual([{ gameId: 'placeholder' }]);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      '[generate-static-params] BSI_STATIC_PARAMS_BASE_URL not set; using placeholder-only params.'
    );
  });

  it('uses the configured build-time base url when one is provided', async () => {
    process.env.BSI_STATIC_PARAMS_BASE_URL = 'https://example.test';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            games: [{ id: 401696000 }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    const { mlbGameParams } = await import('@/lib/generate-static-params');

    await expect(mlbGameParams()).resolves.toEqual([
      { gameId: '401696000' },
      { gameId: 'placeholder' },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.test/api/mlb/scores', {
      headers: {
        'User-Agent': 'BSI-Build/1.0',
      },
    });
  });

  it('does not prefix ESPN MLB roster URLs with the static params base URL', async () => {
    process.env.BSI_STATIC_PARAMS_BASE_URL = 'https://example.test';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('', {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const { mlbPlayerParams } = await import('@/lib/generate-static-params');

    try {
      await mlbPlayerParams();
    } catch {
      // We only care about the URL passed to fetch, not the outcome.
    }

    expect(fetchSpy).toHaveBeenCalled();
    const fetchUrl = fetchSpy.mock.calls[0][0] as unknown;
    expect(typeof fetchUrl === 'string' || fetchUrl instanceof Request).toBe(true);

    const urlString =
      typeof fetchUrl === 'string' ? fetchUrl : (fetchUrl as Request).url;
    expect(urlString.startsWith(process.env.BSI_STATIC_PARAMS_BASE_URL!)).toBe(
      false
    );
  });

  it('does not prefix ESPN NBA roster URLs with the static params base URL', async () => {
    process.env.BSI_STATIC_PARAMS_BASE_URL = 'https://example.test';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('', {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const { nbaPlayerParams } = await import('@/lib/generate-static-params');

    try {
      await nbaPlayerParams();
    } catch {
      // We only care about the URL passed to fetch, not the outcome.
    }

    expect(fetchSpy).toHaveBeenCalled();
    const fetchUrl = fetchSpy.mock.calls[0][0] as unknown;
    expect(typeof fetchUrl === 'string' || fetchUrl instanceof Request).toBe(true);

    const urlString =
      typeof fetchUrl === 'string' ? fetchUrl : (fetchUrl as Request).url;
    expect(urlString.startsWith(process.env.BSI_STATIC_PARAMS_BASE_URL!)).toBe(
      false
    );
  });
});
