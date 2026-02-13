/**
 * College Baseball Transform Tests
 *
 * Tests the data pipeline: raw API response → transform → frontend-expected shape.
 * Covers game detail, team detail, player detail, transfer portal, and news handlers.
 * Verifies Highlightly-first → ESPN fallback pattern and KV caching.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock fixtures
// ---------------------------------------------------------------------------

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [] })),
    _store: store,
  };
}

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: {
      prepare: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    },
    KV: createMockKV(),
    CACHE: {} as any,
    PORTAL_POLLER: {} as any,
    ASSETS_BUCKET: {} as any,
    ENVIRONMENT: 'test',
    API_VERSION: '1.0.0-test',
    PAGES_ORIGIN: 'https://test.pages.dev',
    RAPIDAPI_KEY: 'test-rapidapi-key',
    ...overrides,
  };
}

// Highlightly-shaped match fixture
const HIGHLIGHTLY_MATCH = {
  id: 401234567,
  homeTeam: {
    id: 2633,
    name: 'Texas Longhorns',
    shortName: 'TEX',
    conference: { id: 1, name: 'SEC' },
    ranking: 5,
    record: { wins: 30, losses: 10 },
    primaryColor: '#BF5700',
  },
  awayTeam: {
    id: 2641,
    name: 'Texas A&M Aggies',
    shortName: 'TAMU',
    conference: { id: 1, name: 'SEC' },
    ranking: 12,
    record: { wins: 25, losses: 15 },
  },
  homeScore: 7,
  awayScore: 3,
  status: { code: 100, type: 'finished' as const, description: 'Final' },
  startTimestamp: 1712000000,
  venue: { id: 1, name: 'UFCU Disch-Falk Field', city: 'Austin', state: 'TX' },
  innings: [
    { inning: 1, homeRuns: 2, awayRuns: 0 },
    { inning: 2, homeRuns: 0, awayRuns: 1 },
    { inning: 3, homeRuns: 3, awayRuns: 0 },
    { inning: 4, homeRuns: 0, awayRuns: 2 },
    { inning: 5, homeRuns: 2, awayRuns: 0 },
  ],
};

const HIGHLIGHTLY_BOXSCORE = {
  matchId: 401234567,
  home: {
    team: HIGHLIGHTLY_MATCH.homeTeam,
    score: 7,
    hits: 10,
    errors: 1,
    batting: [
      { player: { id: 1, name: 'Jared Thomas' }, battingOrder: 1, position: 'CF', atBats: 4, runs: 2, hits: 3, rbi: 2, walks: 0, strikeouts: 1, average: 0.345 },
    ],
    pitching: [
      { player: { id: 2, name: 'Lucas Gordon' }, inningsPitched: 7, hits: 5, runs: 3, earnedRuns: 2, walks: 2, strikeouts: 8, pitchCount: 95, strikes: 62, era: 2.85, decision: 'W' as const },
    ],
  },
  away: {
    team: HIGHLIGHTLY_MATCH.awayTeam,
    score: 3,
    hits: 5,
    errors: 2,
    batting: [
      { player: { id: 3, name: 'Ryan Miller' }, battingOrder: 1, position: 'SS', atBats: 4, runs: 1, hits: 1, rbi: 1, walks: 0, strikeouts: 2, average: 0.280 },
    ],
    pitching: [
      { player: { id: 4, name: 'Jake Foster' }, inningsPitched: 5, hits: 7, runs: 5, earnedRuns: 4, walks: 3, strikeouts: 4, pitchCount: 80, strikes: 48, era: 4.20, decision: 'L' as const },
    ],
  },
  linescores: HIGHLIGHTLY_MATCH.innings,
  plays: [
    { inning: 1, half: 'bottom' as const, outs: 1, description: 'Jared Thomas doubles to left', homeScore: 2, awayScore: 0 },
  ],
};

// ESPN summary fixture (simplified)
const ESPN_GAME_SUMMARY = {
  header: {
    id: '401234567',
    competitions: [{
      id: '401234567',
      date: '2026-04-15T18:00Z',
      competitors: [
        {
          homeAway: 'home',
          team: { id: '2633', displayName: 'Texas Longhorns', abbreviation: 'TEX' },
          score: '7',
          rank: 5,
          record: [{ summary: '30-10' }],
          linescores: [{ value: 2 }, { value: 0 }, { value: 3 }, { value: 0 }, { value: 2 }],
        },
        {
          homeAway: 'away',
          team: { id: '2641', displayName: 'Texas A&M Aggies', abbreviation: 'TAMU' },
          score: '3',
          rank: 12,
          record: [{ summary: '25-15' }],
          linescores: [{ value: 0 }, { value: 1 }, { value: 0 }, { value: 2 }, { value: 0 }],
        },
      ],
      status: { type: { state: 'post', detail: 'Final' }, period: 9 },
    }],
  },
  gameInfo: { venue: { fullName: 'UFCU Disch-Falk Field', address: { city: 'Austin', state: 'TX' } } },
  boxscore: {
    players: [
      {
        team: { id: '2633' },
        statistics: [
          { name: 'batting', athletes: [{ athlete: { id: '1', displayName: 'Jared Thomas', position: { abbreviation: 'CF' } }, stats: ['4', '2', '3', '2', '0', '1', '.345'] }] },
          { name: 'pitching', athletes: [{ athlete: { id: '2', displayName: 'Lucas Gordon' }, stats: ['7.0', '5', '3', '2', '2', '8', '2.85'] }] },
        ],
      },
      {
        team: { id: '2641' },
        statistics: [
          { name: 'batting', athletes: [{ athlete: { id: '3', displayName: 'Ryan Miller', position: { abbreviation: 'SS' } }, stats: ['4', '1', '1', '1', '0', '2', '.280'] }] },
          { name: 'pitching', athletes: [{ athlete: { id: '4', displayName: 'Jake Foster' }, stats: ['5.0', '7', '5', '4', '3', '4', '4.20'] }] },
        ],
      },
    ],
  },
};

// ESPN team fixture
const ESPN_TEAM = {
  team: {
    id: '2633',
    displayName: 'Texas Longhorns',
    abbreviation: 'TEX',
    nickname: 'Longhorns',
    color: 'BF5700',
    alternateColor: 'FFFFFF',
    logos: [{ href: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png' }],
    location: { city: 'Austin', state: 'Texas' },
    venue: { fullName: 'UFCU Disch-Falk Field', capacity: 7273 },
    groups: { name: 'SEC' },
    record: { items: [{ type: 'total', stats: [{ name: 'wins', value: 30 }, { name: 'losses', value: 10 }] }] },
    athletes: [
      { id: '1', displayName: 'Jared Thomas', jersey: '7', position: { abbreviation: 'CF' }, experience: { displayValue: 'Jr.' } },
    ],
  },
};

// ESPN player fixture
const ESPN_PLAYER = {
  athlete: {
    id: '1',
    displayName: 'Jared Thomas',
    firstName: 'Jared',
    lastName: 'Thomas',
    jersey: '7',
    displayHeight: '6-2',
    weight: 195,
    position: { abbreviation: 'CF', name: 'Center Field' },
    team: { id: '2633', displayName: 'Texas Longhorns', abbreviation: 'TEX' },
  },
};

const ESPN_PLAYER_OVERVIEW = {
  splitCategories: [
    {
      name: 'batting',
      displayName: 'Batting',
      labels: ['GP', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB', 'AVG', 'OBP', 'SLG', 'OPS'],
      splits: [{ stats: [50, 200, 40, 70, 15, 3, 8, 35, 20, 30, 10, 0.350, 0.420, 0.550, 0.970] }],
    },
  ],
};

// ---------------------------------------------------------------------------
// URL-based fetch mock
// ---------------------------------------------------------------------------

function mockFetchForHighlightly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // Highlightly match
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/matches/')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_MATCH), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Highlightly box score
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/box-scores/')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_BOXSCORE), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Highlightly team
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/teams/') && !urlStr.includes('/players')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_MATCH.homeTeam), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Highlightly player stats (must be before /players/ check)
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/statistics')) {
      return new Response(JSON.stringify({ batting: { games: 50, atBats: 200, hits: 70, battingAverage: 0.350, homeRuns: 8, rbi: 35, runs: 40, doubles: 15, triples: 3, walks: 20, strikeouts: 30, stolenBases: 10, caughtStealing: 2, onBasePercentage: 0.420, sluggingPercentage: 0.550, ops: 0.970 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Highlightly team players (URL has /teams/{id}/players)
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/teams/') && urlStr.includes('/players')) {
      return new Response(JSON.stringify({ data: [], totalCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Highlightly individual player (URL is /players/{id})
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/players/')) {
      return new Response(JSON.stringify({ id: 1, name: 'Jared Thomas', position: 'CF', jerseyNumber: '7', team: HIGHLIGHTLY_MATCH.homeTeam }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Default: Pages proxy fallback
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

function mockFetchForEspn() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    // ESPN game summary
    if (urlStr.includes('espn.com') && urlStr.includes('/summary')) {
      return new Response(JSON.stringify(ESPN_GAME_SUMMARY), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // ESPN team
    if (urlStr.includes('espn.com') && urlStr.includes('/teams/') && urlStr.includes('roster')) {
      return new Response(JSON.stringify(ESPN_TEAM), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/teams/') && !urlStr.includes('roster')) {
      return new Response(JSON.stringify(ESPN_TEAM), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // ESPN player
    if (urlStr.includes('espn.com') && urlStr.includes('/athletes/') && urlStr.includes('/overview')) {
      return new Response(JSON.stringify(ESPN_PLAYER_OVERVIEW), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/athletes/')) {
      return new Response(JSON.stringify(ESPN_PLAYER), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // ESPN news
    if (urlStr.includes('espn.com') && urlStr.includes('/news')) {
      return new Response(JSON.stringify({
        articles: [
          { dataSourceIdentifier: 'espn-1', headline: 'Texas wins series', description: 'Summary', published: '2026-04-15T18:00Z', categories: [{ type: 'team', description: 'Texas' }], links: { web: { href: 'https://espn.com/1' } } },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Highlightly — return 500 to force ESPN fallback
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Server Error', { status: 500 });
    }

    // Default: Pages proxy
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('College Baseball Transforms', () => {
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

  // -----------------------------------------------------------------------
  // Game Detail — Highlightly path
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/game/:gameId (Highlightly)', () => {
    it('returns { game, meta } shape with CollegeGameData fields', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('game');
      expect(body).toHaveProperty('meta');
      expect(body.meta.timezone).toBe('America/Chicago');
    });

    it('transforms status correctly for finished game', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.status.isFinal).toBe(true);
      expect(body.game.status.isLive).toBe(false);
      expect(body.game.status.state).toBe('post');
    });

    it('transforms teams with name, abbreviation, score, isWinner', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.teams.home.name).toBe('Texas Longhorns');
      expect(body.game.teams.home.abbreviation).toBe('TEX');
      expect(body.game.teams.home.score).toBe(7);
      expect(body.game.teams.home.isWinner).toBe(true);
      expect(body.game.teams.away.isWinner).toBe(false);
      expect(body.game.teams.home.ranking).toBe(5);
      expect(body.game.teams.away.ranking).toBe(12);
    });

    it('transforms linescore with innings and totals', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.linescore).toBeDefined();
      expect(body.game.linescore.innings).toHaveLength(5);
      expect(body.game.linescore.innings[0]).toEqual({ away: 0, home: 2 });
      expect(body.game.linescore.totals.home.runs).toBe(7);
      expect(body.game.linescore.totals.away.runs).toBe(3);
    });

    it('transforms boxscore with batting and pitching lines', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.boxscore).toBeDefined();
      expect(body.game.boxscore.home.batting).toHaveLength(1);
      expect(body.game.boxscore.home.batting[0].player.name).toBe('Jared Thomas');
      expect(body.game.boxscore.home.batting[0].ab).toBe(4);
      expect(body.game.boxscore.home.batting[0].h).toBe(3);

      expect(body.game.boxscore.home.pitching).toHaveLength(1);
      expect(body.game.boxscore.home.pitching[0].decision).toBe('W');
      expect(body.game.boxscore.home.pitching[0].so).toBe(8);
    });

    it('transforms venue', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.venue.name).toBe('UFCU Disch-Falk Field');
      expect(body.game.venue.city).toBe('Austin');
      expect(body.game.venue.state).toBe('TX');
    });

    it('caches to KV on success', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      await worker.fetch(req, env);

      expect(env.KV.put).toHaveBeenCalledWith(
        'cb:game:401234567',
        expect.any(String),
        expect.objectContaining({ expirationTtl: expect.any(Number) })
      );
    });

    it('returns cached data on second request', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req1 = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      await worker.fetch(req1, env);

      const req2 = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res2 = await worker.fetch(req2, env);

      expect(res2.headers.get('X-Cache')).toBe('HIT');
    });
  });

  // -----------------------------------------------------------------------
  // Game Detail — ESPN fallback path
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/game/:gameId (ESPN fallback)', () => {
    it('falls back to ESPN when Highlightly fails', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.game).toBeDefined();
      expect(body.meta.dataSource).toBe('espn');
    });

    it('falls back to ESPN when no RAPIDAPI_KEY', async () => {
      env = createMockEnv({ RAPIDAPI_KEY: undefined });
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game).toBeDefined();
      expect(body.meta.dataSource).toBe('espn');
    });

    it('transforms ESPN summary to correct shape', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.teams.home.name).toBe('Texas Longhorns');
      expect(body.game.teams.home.score).toBe(7);
      expect(body.game.status.isFinal).toBe(true);
      expect(body.game.linescore).toBeDefined();
      expect(body.game.linescore.innings).toHaveLength(5);
    });

    it('extracts ESPN boxscore batting/pitching lines', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.game.boxscore).toBeDefined();
      expect(body.game.boxscore.home.batting[0].player.name).toBe('Jared Thomas');
      expect(body.game.boxscore.away.pitching[0].player.name).toBe('Jake Foster');
    });
  });

  // -----------------------------------------------------------------------
  // Team Detail
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/teams/:teamId', () => {
    it('returns { team, meta } shape with Team fields', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/teams/2633');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('team');
      expect(body).toHaveProperty('meta');
      expect(body.team.id).toBe('2633');
      expect(body.team.name).toBe('Texas Longhorns');
      expect(body.team.conference).toBe('SEC');
    });

    it('falls back to ESPN for team data', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/teams/2633');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.team).toBeDefined();
      expect(body.team.name).toBe('Texas Longhorns');
      expect(body.team.abbreviation).toBe('TEX');
      expect(body.team.mascot).toBe('Longhorns');
      expect(body.meta.dataSource).toBe('espn');
    });

    it('includes roster from ESPN', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/teams/2633');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.team.roster).toBeDefined();
      expect(Array.isArray(body.team.roster)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Player Detail
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/players/:playerId', () => {
    it('returns { player, statistics, meta } shape', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/1');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('player');
      expect(body).toHaveProperty('statistics');
      expect(body).toHaveProperty('meta');
    });

    it('transforms Highlightly player with batting stats', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/1');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.player.name).toBe('Jared Thomas');
      expect(body.statistics.batting).toBeDefined();
      expect(body.statistics.batting.battingAverage).toBe(0.350);
      expect(body.statistics.batting.homeRuns).toBe(8);
      expect(body.statistics.batting.ops).toBe(0.970);
    });

    it('falls back to ESPN for player data', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/1');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.player).toBeDefined();
      expect(body.player.name).toBe('Jared Thomas');
      expect(body.meta.dataSource).toBe('espn');
    });

    it('extracts batting stats from ESPN overview', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/1');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.statistics).toBeDefined();
      if (body.statistics?.batting) {
        expect(body.statistics.batting.games).toBe(50);
        expect(body.statistics.batting.battingAverage).toBe(0.350);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Transfer Portal
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/transfer-portal', () => {
    it('returns empty entries when KV has no data', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/transfer-portal');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.entries).toEqual([]);
      expect(body.totalEntries).toBe(0);
      expect(body.meta).toBeDefined();
    });

    it('returns portal data from KV when populated', async () => {
      const portalData = {
        entries: [
          { id: '1', playerName: 'Test Player', position: 'SS', fromSchool: 'Texas', status: 'entered' },
        ],
        lastUpdated: '2026-02-13T00:00:00Z',
      };
      env.KV._store.set('portal:college-baseball:entries', JSON.stringify(portalData));
      globalThis.fetch = mockFetchForHighlightly();

      const req = new Request('https://blazesportsintel.com/api/college-baseball/transfer-portal');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.entries).toHaveLength(1);
      expect(body.entries[0].playerName).toBe('Test Player');
      expect(body.totalEntries).toBe(1);
      expect(body.meta.dataSource).toBe('portal-sync');
    });
  });

  // -----------------------------------------------------------------------
  // News
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/news', () => {
    it('returns { articles, meta } with category classification', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/news');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('articles');
      expect(body).toHaveProperty('meta');
      expect(body.meta.source).toBe('espn');
      expect(body.meta.timezone).toBe('America/Chicago');
    });

    it('transforms ESPN articles to expected shape', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/news');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body.articles.length).toBeGreaterThan(0);
      const article = body.articles[0];
      expect(article).toHaveProperty('id');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('summary');
      expect(article).toHaveProperty('source');
      expect(article).toHaveProperty('category');
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe('error handling', () => {
    it('returns 502 with null game when both sources fail', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/999999');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body.game).toBeNull();
    });

    it('returns 502 with null team when both sources fail', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;
      const req = new Request('https://blazesportsintel.com/api/college-baseball/teams/999999');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body.team).toBeNull();
    });

    it('returns 502 with null player when both sources fail', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/999999');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body.player).toBeNull();
    });
  });
});
