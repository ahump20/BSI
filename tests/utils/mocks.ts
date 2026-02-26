/**
 * Shared Test Utilities — College Baseball & Worker Tests
 *
 * Centralizes mock factories, fixture data, and fetch mocks used across
 * endpoint, transform, and ingest test suites.
 */
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock KV
// ---------------------------------------------------------------------------

export function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [] })),
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// Mock Env
// ---------------------------------------------------------------------------

export function createMockEnv(overrides: Record<string, unknown> = {}) {
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

// ---------------------------------------------------------------------------
// Highlightly fixtures
// ---------------------------------------------------------------------------

export const HIGHLIGHTLY_MATCH = {
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

export const HIGHLIGHTLY_BOXSCORE = {
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

// ---------------------------------------------------------------------------
// ESPN fixtures
// ---------------------------------------------------------------------------

export const ESPN_GAME_SUMMARY = {
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

export const ESPN_TEAM = {
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

export const ESPN_PLAYER = {
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

export const ESPN_PLAYER_OVERVIEW = {
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
// Ingest-level fixtures (simpler shapes for cron worker tests)
// ---------------------------------------------------------------------------

export const HIGHLIGHTLY_SCORES = {
  data: [
    { id: 1, homeTeam: { name: 'Texas' }, awayTeam: { name: 'A&M' }, homeScore: 7, awayScore: 3, status: { type: 'finished' } },
    { id: 2, homeTeam: { name: 'LSU' }, awayTeam: { name: 'Ole Miss' }, homeScore: 4, awayScore: 4, status: { type: 'inprogress' } },
  ],
  totalCount: 2,
};

export const ESPN_SCOREBOARD = {
  events: [
    { id: '101', name: 'Texas vs A&M', status: { type: { state: 'post' } } },
    { id: '102', name: 'LSU vs Ole Miss', status: { type: { state: 'in' } } },
  ],
};

export const HIGHLIGHTLY_STANDINGS = [
  { conference: 'SEC', teams: [{ name: 'Texas', wins: 30, losses: 10 }] },
];

export const ESPN_STANDINGS = {
  children: [
    {
      name: 'Southeastern Conference',
      standings: {
        entries: [
          { team: { id: '126', displayName: 'Texas Longhorns', abbreviation: 'TEX', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' }, wins: 30, losses: 10, winPercent: 0.75, leagueWinPercent: 0.80, streak: 'W5', pointDifferential: 62 },
          { team: { id: '123', displayName: 'Texas A&M Aggies', abbreviation: 'TAMU', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png' }, wins: 25, losses: 15, winPercent: 0.625, leagueWinPercent: 0.60, streak: 'L1', pointDifferential: 18 },
        ],
      },
    },
    {
      name: 'Big 12 Conference',
      standings: {
        entries: [
          { team: { id: '66', displayName: 'TCU Horned Frogs', abbreviation: 'TCU', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png' }, wins: 28, losses: 12, winPercent: 0.70, leagueWinPercent: 0.65, streak: 'W3', pointDifferential: 30 },
        ],
      },
    },
    { name: 'Atlantic Coast Conference', standings: { entries: [] } },
  ],
};

export const HIGHLIGHTLY_RANKINGS = {
  data: [{ rank: 1, team: 'Texas' }, { rank: 2, team: 'LSU' }],
};

export const ESPN_RANKINGS = {
  rankings: [{ name: 'D1 Baseball Top 25', ranks: [{ current: 1, team: { displayName: 'Texas' } }] }],
};

// ---------------------------------------------------------------------------
// Fetch mock factories
// ---------------------------------------------------------------------------

export function mockFetchForHighlightly() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/matches/')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_MATCH), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/box-scores/')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_BOXSCORE), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/teams/') && !urlStr.includes('/players')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_MATCH.homeTeam), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/statistics')) {
      return new Response(JSON.stringify({ batting: { games: 50, atBats: 200, hits: 70, battingAverage: 0.350, homeRuns: 8, rbi: 35, runs: 40, doubles: 15, triples: 3, walks: 20, strikeouts: 30, stolenBases: 10, caughtStealing: 2, onBasePercentage: 0.420, sluggingPercentage: 0.550, ops: 0.970 } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/teams/') && urlStr.includes('/players')) {
      return new Response(JSON.stringify({ data: [], totalCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/players/')) {
      return new Response(JSON.stringify({ id: 1, name: 'Jared Thomas', position: 'CF', jerseyNumber: '7', team: HIGHLIGHTLY_MATCH.homeTeam }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

export function mockFetchForEspn() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('espn.com') && urlStr.includes('/summary')) {
      return new Response(JSON.stringify(ESPN_GAME_SUMMARY), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/teams/') && urlStr.includes('roster')) {
      return new Response(JSON.stringify(ESPN_TEAM), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/teams/') && !urlStr.includes('roster')) {
      return new Response(JSON.stringify(ESPN_TEAM), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/athletes/') && urlStr.includes('/overview')) {
      return new Response(JSON.stringify(ESPN_PLAYER_OVERVIEW), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/athletes/')) {
      return new Response(JSON.stringify(ESPN_PLAYER), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/news')) {
      return new Response(JSON.stringify({
        articles: [
          { dataSourceIdentifier: 'espn-1', headline: 'Texas wins series', description: 'Summary', published: '2026-04-15T18:00Z', categories: [{ type: 'team', description: 'Texas' }], links: { web: { href: 'https://espn.com/1' } } },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Server Error', { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
}

/** Highlightly success mock for ingest-level tests (matches, standings, rankings) */
export function mockHighlightlySuccess() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/matches')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_SCORES), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_STANDINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('mlb-college-baseball-api') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify(HIGHLIGHTLY_RANKINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  }) as unknown as typeof fetch;
}

/** ESPN fallback mock — Highlightly returns 500, ESPN succeeds */
export function mockEspnFallback() {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.includes('mlb-college-baseball-api')) {
      return new Response('Error', { status: 500 });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/scoreboard')) {
      return new Response(JSON.stringify(ESPN_SCOREBOARD), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/standings')) {
      return new Response(JSON.stringify(ESPN_STANDINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (urlStr.includes('espn.com') && urlStr.includes('/rankings')) {
      return new Response(JSON.stringify(ESPN_RANKINGS), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  }) as unknown as typeof fetch;
}
