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

  it('returns 500 for direct SportsDataIO routes when API key is missing', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('SPORTS_DATA_IO_API_KEY not configured'),
      }),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('proxies /api/cfb-espn/* to Pages unchanged', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/cfb-espn/scoreboard?date=2026-02-12');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/cfb-espn/scoreboard?date=2026-02-12',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    );
  });

  it('proxies /api/football/* to Pages unchanged', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/football/scores?season=2026&week=1');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/football/scores?season=2026&week=1',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    );
  });

  it('proxies /api/basketball/* to Pages unchanged', async () => {
    mockPagesResponse({ games: [] });

    const req = new Request('https://blazesportsintel.com/api/basketball/scoreboard?date=2026-02-12');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/basketball/scoreboard?date=2026-02-12',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    );
  });

  it('proxies /api/ncaa/* to Pages unchanged', async () => {
    mockPagesResponse({ standings: [] });

    const req = new Request('https://blazesportsintel.com/api/ncaa/rankings?sport=football');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/ncaa/rankings?sport=football',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    );
  });

  it('returns structured /api/live-scores fallback with source metadata and security headers', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('upstream down')) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/live-scores');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('X-BSI-API-Proxy')).toBeNull();
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Cache')).toBe('FALLBACK');
    expect(body).toEqual(
      expect.objectContaining({
        mlb: expect.any(Array),
        nfl: expect.any(Array),
        nba: expect.any(Array),
        collegeBaseball: expect.any(Array),
        meta: expect.objectContaining({
          source: expect.any(String),
          fetched_at: expect.any(String),
          timezone: 'America/Chicago',
        }),
      }),
    );
  });

  it('serves stale /api/live-scores cache when upstream feeds are delayed', async () => {
    await env.KV.put(
      'live-scores:aggregate:v1',
      JSON.stringify({
        mlb: [],
        nfl: [],
        nba: [],
        collegeBaseball: [],
        meta: {
          source: 'SportsDataIO MLB + ESPN College Baseball',
          fetched_at: '2026-02-17T00:00:00.000Z',
          timezone: 'America/Chicago',
        },
      }),
    );
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('upstream down')) as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/live-scores');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('STALE');
    expect(body.meta).toEqual(
      expect.objectContaining({
        source: 'SportsDataIO MLB + ESPN College Baseball',
        fetched_at: '2026-02-17T00:00:00.000Z',
        timezone: 'America/Chicago',
      }),
    );
    expect(body.meta.note).toContain('cached snapshot');
  });

  it('denies camera and microphone permissions by default on standard API routes', async () => {
    mockPagesResponse({ sports: {} });

    const req = new Request('https://blazesportsintel.com/api/live-scores');
    const res = await worker.fetch(req, env);

    expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
  });

  it('allows same-origin camera and microphone on presence coach trends endpoint', async () => {
    const req = new Request('https://blazesportsintel.com/api/presence-coach/users/test-user/trends');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('Permissions-Policy')).toBe(
      'camera=(self), microphone=(self), geolocation=()',
    );
    expect(body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ id: 'test-user' }),
        meta: expect.objectContaining({ source: 'coach-d1', timezone: 'America/Chicago' }),
      }),
    );
  });

  it('returns 500 for direct NFL news route when API key is missing', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/nfl/news');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('SPORTS_DATA_IO_API_KEY not configured'),
      }),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not rewrite /api/nba/game/:id and proxies request to Pages', async () => {
    mockPagesResponse({ game: {} });

    const req = new Request('https://blazesportsintel.com/api/nba/game/12345');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/api/nba/game/12345',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    );
  });

  it('returns 500 for direct NFL leaders route when API key is missing', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const req = new Request('https://blazesportsintel.com/api/nfl/leaders?season=2024');
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('SPORTS_DATA_IO_API_KEY not configured'),
      }),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('allows same-origin camera and microphone on presence-coach page path', async () => {
    mockPagesResponse({ ok: true });

    const req = new Request('https://blazesportsintel.com/presence-coach/');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://test.pages.dev/presence-coach/',
      expect.objectContaining({ method: 'GET', redirect: 'follow' }),
    );
    expect(res.headers.get('Permissions-Policy')).toBe(
      'camera=(self), microphone=(self), geolocation=()',
    );
  });

  it('records valid college baseball standings share events', async () => {
    const requestBody = {
      event: 'share_clicked',
      surface: 'college_baseball_standings',
      conference: 'SEC',
      path: '/college-baseball/standings?conference=SEC',
      timestamp: '2026-02-12T18:00:00.000Z',
    };

    const req = new Request('https://blazesportsintel.com/api/events/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toEqual({ success: true });

    const dayKey = 'analytics:share:share_clicked:2026-02-12';
    const surfaceDayKey = 'analytics:share:college_baseball_standings:share_clicked:2026-02-12';
    await expect(env.KV.get(dayKey)).resolves.toBe('1');
    await expect(env.KV.get(surfaceDayKey)).resolves.toBe('1');
  });

  it('rejects invalid share event names', async () => {
    const req = new Request('https://blazesportsintel.com/api/events/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'share_started',
        surface: 'college_baseball_standings',
        conference: 'SEC',
        path: '/college-baseball/standings?conference=SEC',
        timestamp: '2026-02-12T18:00:00.000Z',
      }),
    });
    const res = await worker.fetch(req, env);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('Invalid share event'),
      }),
    );
  });
});
