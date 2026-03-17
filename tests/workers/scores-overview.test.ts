import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockCtx, createMockEnv } from '../utils/mocks';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createEspnEvent(options: {
  id: string;
  away: { abbreviation: string; name: string; score: string };
  home: { abbreviation: string; name: string; score: string };
  status: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    id: options.id,
    name: `${options.away.name} at ${options.home.name}`,
    shortName: `${options.away.abbreviation} @ ${options.home.abbreviation}`,
    date: '2026-04-02T19:00:00.000Z',
    competitions: [
      {
        competitors: [
          {
            id: `${options.id}-away`,
            homeAway: 'away',
            score: options.away.score,
            team: {
              id: `${options.id}-away-team`,
              abbreviation: options.away.abbreviation,
              displayName: options.away.name,
              logo: `https://img.test/${options.away.abbreviation}.png`,
            },
          },
          {
            id: `${options.id}-home`,
            homeAway: 'home',
            score: options.home.score,
            team: {
              id: `${options.id}-home-team`,
              abbreviation: options.home.abbreviation,
              displayName: options.home.name,
              logo: `https://img.test/${options.home.abbreviation}.png`,
            },
          },
        ],
        status: options.status,
        venue: { fullName: 'Test Park' },
      },
    ],
  };
}

function createScoreboardResponse(event: Record<string, unknown>) {
  return {
    day: { date: '2026-04-02' },
    events: [event],
    leagues: [],
  };
}

function installOverviewFetchMock(failingPath?: string) {
  const requestedUrls: string[] = [];

  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const rawUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    requestedUrls.push(rawUrl);
    const url = new URL(rawUrl);

    if (failingPath && url.pathname.includes(failingPath)) {
      return jsonResponse({ error: 'Upstream unavailable' }, 500);
    }

    if (url.pathname.includes('/baseball/college-baseball/scoreboard')) {
      return jsonResponse(
        createScoreboardResponse(
          createEspnEvent({
            id: 'cb-1',
            away: { abbreviation: 'LSU', name: 'LSU Tigers', score: '2' },
            home: { abbreviation: 'TEX', name: 'Texas Longhorns', score: '5' },
            status: {
              type: { state: 'in', detail: 'Top 7th', shortDetail: 'Top 7th', completed: false },
              period: 7,
            },
          }),
        ),
      );
    }

    if (url.pathname.includes('/baseball/mlb/scoreboard')) {
      return jsonResponse(
        createScoreboardResponse(
          createEspnEvent({
            id: 'mlb-1',
            away: { abbreviation: 'CHC', name: 'Chicago Cubs', score: '3' },
            home: { abbreviation: 'STL', name: 'St. Louis Cardinals', score: '4' },
            status: {
              isLive: true,
              detailedState: 'Top 8th',
              type: { state: 'in', completed: false },
            },
          }),
        ),
      );
    }

    if (url.pathname.includes('/football/nfl/scoreboard')) {
      return jsonResponse(
        createScoreboardResponse(
          createEspnEvent({
            id: 'nfl-1',
            away: { abbreviation: 'DAL', name: 'Dallas Cowboys', score: '17' },
            home: { abbreviation: 'HOU', name: 'Houston Texans', score: '21' },
            status: {
              type: { state: 'in', detail: 'Q3 10:00', shortDetail: 'Q3 10:00', completed: false },
              period: 3,
            },
          }),
        ),
      );
    }

    if (url.pathname.includes('/basketball/nba/scoreboard')) {
      return jsonResponse(
        createScoreboardResponse(
          createEspnEvent({
            id: 'nba-1',
            away: { abbreviation: 'PHX', name: 'Phoenix Suns', score: '102' },
            home: { abbreviation: 'SAS', name: 'San Antonio Spurs', score: '105' },
            status: {
              type: { state: 'post', detail: 'Final', shortDetail: 'Final', completed: true },
              period: 4,
            },
          }),
        ),
      );
    }

    if (url.pathname.includes('/football/college-football/scoreboard')) {
      return jsonResponse(
        createScoreboardResponse(
          createEspnEvent({
            id: 'cfb-1',
            away: { abbreviation: 'TAMU', name: 'Texas A&M Aggies', score: '14' },
            home: { abbreviation: 'TEX', name: 'Texas Longhorns', score: '10' },
            status: {
              type: { state: 'pre', detail: '7:00 PM', shortDetail: '7:00 PM', completed: false },
              period: 0,
            },
          }),
        ),
      );
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }) as unknown as typeof fetch;

  return requestedUrls;
}

describe('/api/scores/overview', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: {
    fetch: (request: Request, env: unknown, ctx?: ExecutionContext) => Promise<Response>;
  };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T13:00:00.000Z'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) worker = (worker as { default: typeof worker }).default;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aggregates all five sports behind /api/scores/overview', async () => {
    installOverviewFetchMock();

    const response = await worker.fetch(
      new Request('https://blazesportsintel.com/api/scores/overview'),
      env,
      createMockCtx(),
    );
    const body = (await response.json()) as Record<string, unknown>;
    const data = body.data as Record<string, Record<string, unknown>>;
    const errors = body.errors as Record<string, string>;
    const meta = body.meta as Record<string, unknown>;
    const sportMeta = meta.sports as Record<string, Record<string, string>>;

    expect(response.status).toBe(200);
    expect(Object.keys(data)).toEqual(
      expect.arrayContaining(['college-baseball', 'mlb', 'nfl', 'nba', 'cfb']),
    );
    expect((data['college-baseball'].data as unknown[]).length).toBe(1);
    expect((data.mlb.games as unknown[]).length).toBe(1);
    expect((data.nfl.games as unknown[]).length).toBe(1);
    expect((data.nba.games as unknown[]).length).toBe(1);
    expect((data.cfb.games as unknown[]).length).toBe(1);
    expect(errors).toEqual({});
    expect(meta.source).toBe('bsi-scores-overview');
    expect(meta.timezone).toBe('America/Chicago');
    expect(sportMeta['college-baseball'].source).toBe('ncaa');
    expect(sportMeta.mlb.source).toBe('espn');
  });

  it('returns partial errors without failing the whole overview payload', async () => {
    installOverviewFetchMock('/basketball/nba/scoreboard');

    const response = await worker.fetch(
      new Request('https://blazesportsintel.com/api/scores/overview'),
      env,
      createMockCtx(),
    );
    const body = (await response.json()) as Record<string, unknown>;
    const data = body.data as Record<string, Record<string, unknown> | null>;
    const errors = body.errors as Record<string, string>;

    expect(response.status).toBe(200);
    expect(errors.nba).toBe('nba scores temporarily unavailable');
    expect(data.nba).toBeNull();
    expect((data.mlb?.games as unknown[]).length).toBe(1);
    expect((data['college-baseball']?.data as unknown[]).length).toBe(1);
  });

  it('includes top-level meta and freshness headers', async () => {
    installOverviewFetchMock();

    const response = await worker.fetch(
      new Request('https://blazesportsintel.com/api/scores/overview'),
      env,
      createMockCtx(),
    );
    const body = (await response.json()) as Record<string, unknown>;
    const meta = body.meta as Record<string, unknown>;

    expect(response.headers.get('X-Cache')).toBe('MISS');
    expect(response.headers.get('X-Cache-State')).toBe('fresh');
    expect(response.headers.get('X-Data-Source')).toBe('bsi-scores-overview');
    expect(response.headers.get('X-Last-Updated')).toBeTruthy();
    expect(meta.fetched_at).toBe('2026-04-02T13:00:00.000Z');
    expect(meta.timezone).toBe('America/Chicago');
  });

  it('passes a requested date through to each upstream scoreboard handler', async () => {
    const requestedUrls = installOverviewFetchMock();

    await worker.fetch(
      new Request('https://blazesportsintel.com/api/scores/overview?date=2026-04-02'),
      env,
      createMockCtx(),
    );

    const scoreboardUrls = requestedUrls.filter((url) => url.includes('/scoreboard'));
    expect(scoreboardUrls).toHaveLength(5);
    for (const url of scoreboardUrls) {
      expect(url).toContain('dates=20260402');
    }
  });
});
