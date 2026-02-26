/**
 * College Baseball Transform Tests
 *
 * Tests the data pipeline: raw API response → transform → frontend-expected shape.
 * Covers game detail, team detail, player detail, transfer portal, and news handlers.
 * Verifies Highlightly-first → ESPN fallback pattern and KV caching.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockEnv,
  createMockCtx,
  HIGHLIGHTLY_MATCH,
  HIGHLIGHTLY_BOXSCORE,
  mockFetchForHighlightly,
  mockFetchForEspn,
} from '../utils/mocks';

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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('game');
      expect(body).toHaveProperty('meta');
      expect(body.meta.timezone).toBe('America/Chicago');
    });

    it('transforms status correctly for finished game', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.game.status.isFinal).toBe(true);
      expect(body.game.status.isLive).toBe(false);
      expect(body.game.status.state).toBe('post');
    });

    it('transforms teams with name, abbreviation, score, isWinner', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.game.venue.name).toBe('UFCU Disch-Falk Field');
      expect(body.game.venue.city).toBe('Austin');
      expect(body.game.venue.state).toBe('TX');
    });

    it('caches to KV on success', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      await worker.fetch(req, env, createMockCtx());

      expect(env.KV.put).toHaveBeenCalledWith(
        'cb:game:401234567',
        expect.any(String),
        expect.objectContaining({ expirationTtl: expect.any(Number) })
      );
    });

    it('returns cached data on second request', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req1 = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      await worker.fetch(req1, env, createMockCtx());

      const req2 = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res2 = await worker.fetch(req2, env, createMockCtx());

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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.game).toBeDefined();
      expect(body.meta.source).toBe('espn');
    });

    it('falls back to ESPN when no RAPIDAPI_KEY', async () => {
      env = createMockEnv({ RAPIDAPI_KEY: undefined });
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.game).toBeDefined();
      expect(body.meta.source).toBe('espn');
    });

    it('transforms ESPN summary to correct shape', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.team).toBeDefined();
      expect(body.team.name).toBe('Texas Longhorns');
      expect(body.team.abbreviation).toBe('TEX');
      expect(body.team.mascot).toBe('Longhorns');
      expect(body.meta.source).toBe('espn');
    });

    it('includes roster from ESPN', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/teams/2633');
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('player');
      expect(body).toHaveProperty('statistics');
      expect(body).toHaveProperty('meta');
    });

    it('transforms Highlightly player with batting stats', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/1');
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.player).toBeDefined();
      expect(body.player.name).toBe('Jared Thomas');
      expect(body.meta.source).toBe('espn');
    });

    it('extracts batting stats from ESPN overview', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/1');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.statistics).toBeDefined();
      expect(body.statistics.batting).toBeDefined();
      expect(body.statistics.batting.games).toBe(50);
      expect(body.statistics.batting.battingAverage).toBe(0.350);
    });
  });

  // -----------------------------------------------------------------------
  // Transfer Portal
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/transfer-portal', () => {
    it('returns empty entries when KV has no data', async () => {
      globalThis.fetch = mockFetchForHighlightly();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/transfer-portal');
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.entries).toHaveLength(1);
      expect(body.entries[0].playerName).toBe('Test Player');
      expect(body.totalEntries).toBe(1);
      expect(body.meta.source).toBe('portal-sync');
    });
  });

  // -----------------------------------------------------------------------
  // News
  // -----------------------------------------------------------------------

  describe('GET /api/college-baseball/news', () => {
    it('returns { articles, meta } with category classification', async () => {
      globalThis.fetch = mockFetchForEspn();
      const req = new Request('https://blazesportsintel.com/api/college-baseball/news');
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
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
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body.game).toBeNull();
    });

    it('returns 502 with null team when both sources fail', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;
      const req = new Request('https://blazesportsintel.com/api/college-baseball/teams/999999');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body.team).toBeNull();
    });

    it('returns 502 with null player when both sources fail', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;
      const req = new Request('https://blazesportsintel.com/api/college-baseball/players/999999');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(502);
      expect(body.player).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases (from PR test analysis)
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('tied final game sets both isWinner to false', async () => {
      const tiedMatch = { ...HIGHLIGHTLY_MATCH, homeScore: 5, awayScore: 5 };
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        if (urlStr.includes('/matches/')) return new Response(JSON.stringify(tiedMatch), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (urlStr.includes('/box-scores/')) return new Response(JSON.stringify(HIGHLIGHTLY_BOXSCORE), { status: 200, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }) as unknown as typeof fetch;

      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.game.teams.home.isWinner).toBe(false);
      expect(body.game.teams.away.isWinner).toBe(false);
    });

    it('in-progress game transforms to isLive=true, isFinal=false', async () => {
      const liveMatch = { ...HIGHLIGHTLY_MATCH, status: { code: 50, type: 'inprogress' as const, description: 'Top 5th' }, homeScore: 3, awayScore: 2 };
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        if (urlStr.includes('/matches/')) return new Response(JSON.stringify(liveMatch), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (urlStr.includes('/box-scores/')) return new Response(JSON.stringify(HIGHLIGHTLY_BOXSCORE), { status: 200, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }) as unknown as typeof fetch;

      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(body.game.status.isLive).toBe(true);
      expect(body.game.status.isFinal).toBe(false);
      expect(body.game.status.state).toBe('in');
    });

    it('game without box score returns game without boxscore field', async () => {
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        if (urlStr.includes('/matches/')) return new Response(JSON.stringify(HIGHLIGHTLY_MATCH), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (urlStr.includes('/box-scores/')) return new Response('Not Found', { status: 404 });
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }) as unknown as typeof fetch;

      const req = new Request('https://blazesportsintel.com/api/college-baseball/game/401234567');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.game).toBeDefined();
      expect(body.game.teams.home.name).toBe('Texas Longhorns');
      // Linescore may still exist from match.innings, but boxscore batting/pitching should be absent
    });

    it('transfer portal with valid JSON but missing entries key returns empty', async () => {
      env.KV._store.set('portal:college-baseball:entries', JSON.stringify({ foo: 'bar' }));
      globalThis.fetch = mockFetchForHighlightly();

      const req = new Request('https://blazesportsintel.com/api/college-baseball/transfer-portal');
      const res = await worker.fetch(req, env, createMockCtx());
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.entries).toEqual([]);
      expect(body.totalEntries).toBe(0);
      expect(body.meta.source).toBe('portal-sync');
    });
  });
});
