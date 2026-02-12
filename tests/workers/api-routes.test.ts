import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockD1() {
  return {
    prepare: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    }),
  };
}

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => store.set(key, value)),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => store.delete(key)),
    list: vi.fn(async () => ({ keys: [] })),
  };
}

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: createMockD1(),
    KV: createMockKV(),
    CACHE: {} as any,
    PORTAL_POLLER: {} as any,
    ASSETS_BUCKET: {} as any,
    ENVIRONMENT: 'test',
    API_VERSION: '1.0.0-test',
    PAGES_ORIGIN: 'https://test.pages.dev',
    ...overrides,
  };
}

describe('Worker SportsDataIO route proxy', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as any).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockPagesResponse(body: unknown = { ok: true }) {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
  }

  it('proxies canonical /api/mlb/scores to Pages Functions', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/mlb/scores',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(res.headers.get('X-BSI-API-Proxy')).toBe('pages-functions');
  });

  it('rewrites /api/cfb-espn/* to /api/cfb/*', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/cfb-espn/scoreboard?date=2026-02-12');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/cfb/scoreboard?date=2026-02-12',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rewrites /api/football/* to /api/cfb/*', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/football/scores?season=2026&week=1');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/cfb/scores?season=2026&week=1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rewrites /api/basketball/* to /api/cbb/*', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/basketball/scoreboard?date=2026-02-12');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/cbb/scoreboard?date=2026-02-12',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rewrites /api/ncaa/* football queries to /api/cfb/*', async () => {
    mockPagesResponse({ standings: [] });

    const req = new Request('https://blazesportsintel.com/api/ncaa/rankings?sport=football');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/cfb/standings?sport=football',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('proxies /api/live-scores and sets security headers', async () => {
    mockPagesResponse({ sports: {} });

    const req = new Request('https://blazesportsintel.com/api/live-scores');
    const res = await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/live-scores',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(res.headers.get('X-BSI-API-Proxy')).toBe('pages-functions');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('denies camera and microphone permissions by default on standard API routes', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);

    expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
  });

  it('allows same-origin camera and microphone on presence coach trends endpoint', async () => {
    const req = new Request('https://blazesportsintel.com/api/presence-coach/users/test-user/trends');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Permissions-Policy')).toBe(
      'camera=(self), microphone=(self), geolocation=()',
    );
  });

  it('proxies NFL news to Pages Functions', async () => {
    mockPagesResponse({ articles: [] });

    const req = new Request('https://blazesportsintel.com/api/nfl/news');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/nfl/news',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rewrites /api/nba/game/:id to /api/nba/games/:id', async () => {
    mockPagesResponse({ game: {} });

    const req = new Request('https://blazesportsintel.com/api/nba/game/12345');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/nba/games/12345',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('proxies NFL leaders to Pages Functions', async () => {
    mockPagesResponse({ categories: [] });

    const req = new Request('https://blazesportsintel.com/api/nfl/leaders?season=2024');
    await worker.fetch(req, env);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/nfl/leaders?season=2024',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
