/**
 * Scores Overview Endpoint Tests — handleScoresOverview
 *
 * Tests the aggregate /api/scores/overview handler that merges results
 * from all five sport-specific handlers into a single response.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleScoresOverview } from '../../workers/handlers/scores';
import { createMockEnv, createMockCtx } from '../utils/mocks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUrl(path = '/api/scores/overview', params?: Record<string, string>): URL {
  const url = new URL(path, 'https://blazesportsintel.com');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url;
}

// Mock all downstream handlers
vi.mock('../../workers/handlers/college-baseball', () => ({
  handleCollegeBaseballSchedule: vi.fn(),
}));
vi.mock('../../workers/handlers/mlb', () => ({
  handleMLBScores: vi.fn(),
}));
vi.mock('../../workers/handlers/nfl', () => ({
  handleNFLScores: vi.fn(),
}));
vi.mock('../../workers/handlers/nba', () => ({
  handleNBAScores: vi.fn(),
}));
vi.mock('../../workers/handlers/cfb', () => ({
  handleCFBScores: vi.fn(),
}));

// Import the mocked modules so we can configure per-test behavior
import { handleCollegeBaseballSchedule } from '../../workers/handlers/college-baseball';
import { handleMLBScores } from '../../workers/handlers/mlb';
import { handleNFLScores } from '../../workers/handlers/nfl';
import { handleNBAScores } from '../../workers/handlers/nba';
import { handleCFBScores } from '../../workers/handlers/cfb';

const mockedCBB = vi.mocked(handleCollegeBaseballSchedule);
const mockedMLB = vi.mocked(handleMLBScores);
const mockedNFL = vi.mocked(handleNFLScores);
const mockedNBA = vi.mocked(handleNBAScores);
const mockedCFB = vi.mocked(handleCFBScores);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleScoresOverview', () => {
  let env: ReturnType<typeof createMockEnv>;
  let ctx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    vi.clearAllMocks();
    env = createMockEnv();
    ctx = createMockCtx();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T18:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns aggregated data from all five sports', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [{ id: '1', status: 'live' }] }));
    mockedMLB.mockResolvedValue(jsonResponse({ games: [{ gamePk: 100 }] }));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [{ id: 200 }] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    const res = await handleScoresOverview(makeUrl(), env as any, ctx as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;

    // All five sport keys present in data
    expect(body.data['college-baseball']).toBeDefined();
    expect(body.data['college-baseball'].data).toHaveLength(1);
    expect(body.data.mlb).toBeDefined();
    expect(body.data.mlb.games).toHaveLength(1);
    expect(body.data.nfl).toBeDefined();
    expect(body.data.nba).toBeDefined();
    expect(body.data.cfb).toBeDefined();

    // No errors when all succeed
    expect(body.errors).toBeUndefined();
  });

  it('includes meta with source, fetched_at, timezone, and per-sport sources', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [] }));
    mockedMLB.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    const res = await handleScoresOverview(makeUrl(), env as any, ctx as any);
    const body = await res.json() as any;

    expect(body.meta.source).toBe('BSI Aggregate');
    expect(body.meta.timezone).toBe('America/Chicago');
    expect(body.meta.fetched_at).toBe('2026-03-17T18:00:00.000Z');
    expect(body.meta.sports.mlb).toBe('MLB Stats API');
    expect(body.meta.sports['college-baseball']).toBe('Highlightly / ESPN');
  });

  it('returns freshness headers', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [] }));
    mockedMLB.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    const res = await handleScoresOverview(makeUrl(), env as any, ctx as any);

    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30');
    expect(res.headers.get('X-BSI-Source')).toBe('scores-overview');
    expect(res.headers.get('X-BSI-Fetched-At')).toBe('2026-03-17T18:00:00.000Z');
  });

  it('isolates one-sport failure without affecting others', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [{ id: '1' }] }));
    mockedMLB.mockRejectedValue(new Error('MLB API timeout'));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    const res = await handleScoresOverview(makeUrl(), env as any, ctx as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;

    // College baseball still present
    expect(body.data['college-baseball']).toBeDefined();
    // MLB should be in errors, not in data
    expect(body.data.mlb).toBeUndefined();
    expect(body.errors.mlb).toBe('MLB API timeout');
    // Others still present
    expect(body.data.nfl).toBeDefined();
    expect(body.data.nba).toBeDefined();
    expect(body.data.cfb).toBeDefined();
  });

  it('passes date param to downstream handlers', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [] }));
    mockedMLB.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    await handleScoresOverview(makeUrl('/api/scores/overview', { date: '2026-03-15' }), env as any, ctx as any);

    // Check that each handler was called with a URL containing the date param
    for (const mock of [mockedCBB, mockedMLB, mockedNFL, mockedNBA, mockedCFB]) {
      const calledUrl = mock.mock.calls[0][0] as URL;
      expect(calledUrl.searchParams.get('date')).toBe('2026-03-15');
    }
  });

  it('omits date param from downstream when not provided', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [] }));
    mockedMLB.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    await handleScoresOverview(makeUrl(), env as any, ctx as any);

    for (const mock of [mockedCBB, mockedMLB, mockedNFL, mockedNBA, mockedCFB]) {
      const calledUrl = mock.mock.calls[0][0] as URL;
      expect(calledUrl.searchParams.has('date')).toBe(false);
    }
  });

  it('uses college-baseball schedule handler, not scores', async () => {
    mockedCBB.mockResolvedValue(jsonResponse({ data: [] }));
    mockedMLB.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNFL.mockResolvedValue(jsonResponse({ games: [] }));
    mockedNBA.mockResolvedValue(jsonResponse({ games: [] }));
    mockedCFB.mockResolvedValue(jsonResponse({ games: [] }));

    await handleScoresOverview(makeUrl(), env as any, ctx as any);

    // handleCollegeBaseballSchedule was called (imported as the CBB handler)
    expect(mockedCBB).toHaveBeenCalledTimes(1);
    const calledUrl = mockedCBB.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe('/api/college-baseball/schedule');
  });
});
