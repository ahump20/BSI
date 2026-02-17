/**
 * Worker API Route Tests
 *
 * Tests the hybrid Workers router's API route handling.
 * The worker handles API routes directly (calling ESPN/SportsDataIO APIs),
 * NOT by proxying to Pages Functions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockEnv } from '../utils/mocks';

/**
 * Mock ESPN API response format (used by getScoreboard, getNews, etc.)
 * The worker calls ESPN APIs directly, so we mock the ESPN response shape.
 */
function mockESPNResponse(body: unknown = {}) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;
}

describe('Worker API route handling', () => {
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

  it('handles /api/mlb/scores directly via ESPN', async () => {
    // ESPN scoreboard returns events array
    mockESPNResponse({ events: [], leagues: [] });

    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    // Worker calls ESPN directly, not Pages
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('site.api.espn.com'),
      expect.anything(),
    );
  });

  it('handles /api/nfl/news directly via ESPN', async () => {
    mockESPNResponse({ articles: [] });

    const req = new Request('https://blazesportsintel.com/api/nfl/news');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('site.api.espn.com'),
      expect.anything(),
    );
  });

  it('handles /api/nfl/leaders directly via ESPN', async () => {
    mockESPNResponse({ leaders: [] });

    const req = new Request('https://blazesportsintel.com/api/nfl/leaders?season=2024');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('site.api.espn.com'),
      expect.anything(),
    );
  });

  it('handles /api/nba/game/:id directly', async () => {
    mockESPNResponse({ header: {}, boxscore: {} });

    const req = new Request('https://blazesportsintel.com/api/nba/game/12345');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('site.api.espn.com'),
      expect.anything(),
    );
  });

  it('routes /api/ncaa/scores?sport=football to CFB handler', async () => {
    mockESPNResponse({ events: [], leagues: [] });

    const req = new Request('https://blazesportsintel.com/api/ncaa/scores?sport=football');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    // Should call college-football ESPN endpoint
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('college-football'),
      expect.anything(),
    );
  });

  it('routes /api/ncaa/standings?sport=football to CFB standings', async () => {
    mockESPNResponse({ children: [] });

    const req = new Request('https://blazesportsintel.com/api/ncaa/standings?sport=football');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('college-football'),
      expect.anything(),
    );
  });

  it('sets security headers on API responses', async () => {
    mockESPNResponse({ events: [], leagues: [] });

    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('denies camera and microphone permissions on standard API routes', async () => {
    mockESPNResponse({ events: [], leagues: [] });

    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);

    expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
  });

  it('returns JSON content type for API routes', async () => {
    mockESPNResponse({ events: [], leagues: [] });

    const req = new Request('https://blazesportsintel.com/api/mlb/scores');
    const res = await worker.fetch(req, env);

    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('handles /api/cfb/scores directly via ESPN', async () => {
    mockESPNResponse({ events: [], leagues: [] });

    const req = new Request('https://blazesportsintel.com/api/cfb/scores');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('college-football'),
      expect.anything(),
    );
  });
});
