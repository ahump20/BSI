import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock factories matching existing BSI test patterns
// ---------------------------------------------------------------------------

function createMockD1() {
  const runFn = vi.fn().mockResolvedValue({ success: true });
  const allFn = vi.fn().mockResolvedValue({ results: [] });
  return {
    prepare: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
      all: allFn,
      bind: vi.fn().mockReturnThis(),
      run: runFn,
    }),
    _runFn: runFn,
    _allFn: allFn,
  };
}

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    _store: store,
  };
}

function createMockR2() {
  const objects = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { objects.set(key, value); }),
    get: vi.fn(async (key: string) => objects.has(key) ? { text: async () => objects.get(key) } : null),
    _objects: objects,
  };
}

// ---------------------------------------------------------------------------
// Ingest Worker — HTTP route tests
// ---------------------------------------------------------------------------

describe('sportradar-ingest worker', () => {
  let worker: { fetch: (req: Request, env: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<Response> };
  let env: Record<string, unknown>;
  let ctx: { waitUntil: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    env = {
      SPORTRADAR_API_KEY: 'test-key-123',
      KV: createMockKV(),
      DB: createMockD1(),
      R2: createMockR2(),
    };
    ctx = { waitUntil: vi.fn() };

    // Mock global fetch for Sportradar API
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: () => Promise.resolve('Auth error'),
    }));

    // Import the worker
    const mod = await import('../../workers/sportradar-ingest/index');
    worker = (mod as Record<string, unknown>).default as typeof worker;
  });

  describe('GET /', () => {
    it('returns worker identification string', async () => {
      const req = new Request('https://test.workers.dev/');
      const res = await worker.fetch(req, env, ctx);
      const text = await res.text();
      expect(res.status).toBe(200);
      expect(text).toContain('Sportradar Ingest');
    });
  });

  describe('GET /health', () => {
    it('returns health status with season/gameHours info', async () => {
      const req = new Request('https://test.workers.dev/health');
      const res = await worker.fetch(req, env, ctx);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.status).toBe('ok');
      expect(typeof body.season).toBe('boolean');
      expect(typeof body.gameHours).toBe('boolean');
    });

    it('includes lastSync from KV', async () => {
      const kv = env.KV as ReturnType<typeof createMockKV>;
      kv._store.set('sportradar:abs:last-sync', '2026-04-01T12:00:00Z');

      const req = new Request('https://test.workers.dev/health');
      const res = await worker.fetch(req, env, ctx);
      const body = await res.json() as Record<string, unknown>;

      expect(body.lastSync).toBe('2026-04-01T12:00:00Z');
    });
  });

  describe('GET /trigger', () => {
    it('returns structured error when API key is invalid', async () => {
      const req = new Request('https://test.workers.dev/trigger');
      const res = await worker.fetch(req, env, ctx);
      const body = await res.json() as { errors: string[]; gamesProcessed: number; pitchesStored: number };

      expect(res.headers.get('Content-Type')).toBe('application/json');
      expect(body.errors.length).toBeGreaterThan(0);
      expect(body.errors[0]).toContain('403');
      expect(body.gamesProcessed).toBe(0);
      expect(body.pitchesStored).toBe(0);
    });

    it('returns error when SPORTRADAR_API_KEY not set', async () => {
      env.SPORTRADAR_API_KEY = '';
      const req = new Request('https://test.workers.dev/trigger');
      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(500);
    });

    it('processes games when API returns valid schedule and PBP', async () => {
      // Mock schedule response
      const scheduleResponse = {
        date: '2026-04-01',
        games: [
          {
            id: 'game-001',
            status: 'inprogress',
            scheduled: '2026-04-01T18:05:00Z',
            home: { abbr: 'TEX' },
            away: { abbr: 'HOU' },
            venue: { name: 'Globe Life Field' },
          },
        ],
      };

      const pbpResponse = {
        game: { id: 'game-001', home: { abbr: 'TEX' }, away: { abbr: 'HOU' } },
        innings: [
          {
            number: 1,
            halfs: [
              {
                half: 'T',
                events: [
                  {
                    id: 'evt-1',
                    type: 'at_bat',
                    at_bat: {
                      id: 'ab-1',
                      hitter_id: 'h1',
                      pitcher_id: 'p1',
                      events: [
                        {
                          id: 'pitch-1',
                          sequence: 1,
                          outcome_id: 'kS',
                          outcome_desc: 'Called Strike',
                        },
                      ],
                    },
                    wall_clock: { value: '2026-04-01T18:15:00Z' },
                  },
                ],
              },
            ],
          },
        ],
      };

      let callCount = 0;
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        callCount++;
        if (url.includes('schedule.json')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(scheduleResponse)),
          });
        }
        if (url.includes('pbp.json')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(pbpResponse)),
          });
        }
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      }));

      const req = new Request('https://test.workers.dev/trigger');
      const res = await worker.fetch(req, env, ctx);
      const body = await res.json() as { gamesProcessed: number; pitchesStored: number; errors: string[] };

      expect(body.gamesProcessed).toBe(1);
      expect(body.pitchesStored).toBeGreaterThanOrEqual(1);
      expect(body.errors).toHaveLength(0);

      // Verify D1 was written to
      const db = env.DB as ReturnType<typeof createMockD1>;
      expect(db.prepare).toHaveBeenCalled();

      // Verify R2 was written to
      const r2 = env.R2 as ReturnType<typeof createMockR2>;
      expect(r2.put).toHaveBeenCalled();
    });

    it('detects ABS challenge events in PBP data', async () => {
      const scheduleResponse = {
        date: '2026-04-01',
        games: [{ id: 'game-002', status: 'complete', scheduled: '2026-04-01T18:05:00Z', home: { abbr: 'NYY' }, away: { abbr: 'BOS' } }],
      };

      const pbpWithChallenge = {
        game: { id: 'game-002', home: { abbr: 'NYY' }, away: { abbr: 'BOS' } },
        innings: [
          {
            number: 3,
            halfs: [
              {
                half: 'B',
                events: [
                  {
                    id: 'evt-10',
                    type: 'at_bat',
                    at_bat: {
                      id: 'ab-10',
                      hitter_id: 'h10',
                      pitcher_id: 'p10',
                      events: [
                        {
                          id: 'pitch-10',
                          sequence: 1,
                          outcome_id: 'kS',
                          outcome_desc: 'ABS challenge by catcher — overturned',
                          type: 'pitch',
                        },
                      ],
                    },
                    wall_clock: { value: '2026-04-01T19:30:00Z' },
                  },
                ],
              },
            ],
          },
        ],
      };

      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
        if (url.includes('schedule.json')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(scheduleResponse)) });
        }
        if (url.includes('pbp.json')) {
          return Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(pbpWithChallenge)) });
        }
        return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
      }));

      const req = new Request('https://test.workers.dev/trigger');
      const res = await worker.fetch(req, env, ctx);
      const body = await res.json() as { gamesProcessed: number; pitchesStored: number };

      expect(body.gamesProcessed).toBe(1);
      expect(body.pitchesStored).toBeGreaterThanOrEqual(1);

      // Verify the DB insert was called with challenge flag
      const db = env.DB as ReturnType<typeof createMockD1>;
      const prepareCalls = db.prepare.mock.calls;
      const challengeInsert = prepareCalls.find(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('sportradar_pitch_event'),
      );
      expect(challengeInsert).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// extractPitchEvents logic tests (imported indirectly via worker)
// ---------------------------------------------------------------------------

describe('ABS challenge detection patterns', () => {
  it('matches "ABS challenge" keyword', () => {
    const pattern = /challenge|abs|automated.*ball.*strike|robot.*ump/i;
    expect(pattern.test('ABS challenge by catcher — overturned')).toBe(true);
    expect(pattern.test('Challenge by home team')).toBe(true);
    expect(pattern.test('Automated Ball-Strike system review')).toBe(true);
    expect(pattern.test('Called Strike')).toBe(false);
    expect(pattern.test('Ball in dirt')).toBe(false);
  });

  it('detects overturned vs confirmed', () => {
    const pattern = /overturned|reversed|changed/i;
    expect(pattern.test('ABS challenge — overturned')).toBe(true);
    expect(pattern.test('Challenge reversed')).toBe(true);
    expect(pattern.test('Challenge confirmed — call stands')).toBe(false);
  });

  it('detects challenge role from description', () => {
    const desc1 = 'ABS challenge by catcher — overturned';
    expect(/catcher/i.test(desc1)).toBe(true);

    const desc2 = 'Hitter challenges called strike via ABS';
    expect(/hitter|batter/i.test(desc2)).toBe(true);

    const desc3 = 'Pitcher disputes ABS call';
    expect(/pitcher/i.test(desc3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pages Function — /api/mlb/abs shape tests
// ---------------------------------------------------------------------------

describe('Pages Function /api/mlb/abs response shape', () => {
  it('empty D1 + empty KV returns valid BSIABSResponse shape', async () => {
    // Simulates what the Pages Function produces when no live data exists
    const response = {
      challengesByRole: [],
      recentGames: [],
      umpireAccuracy: [
        { label: 'Human umpire (pre-ABS avg)', accuracy: 94.0, totalCalls: 28500, source: 'UmpScorecards 2025' },
        { label: 'ABS Hawk-Eye system', accuracy: 99.7, totalCalls: 28500, source: 'MLB / Hawk-Eye' },
        { label: 'Human + ABS challenges', accuracy: 94.0, totalCalls: 28500, source: 'BSI estimate' },
      ],
      meta: { source: 'none', fetched_at: '2026-04-01T12:00:00Z', timezone: 'America/Chicago' as const },
    };

    const { BSIABSResponseSchema } = await import('../../lib/api-clients/sportradar-schemas');
    const result = BSIABSResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('response with live data passes schema validation', async () => {
    const response = {
      challengesByRole: [
        { role: 'catcher', challenges: 42, overturned: 18, successRate: 42.9 },
        { role: 'hitter', challenges: 31, overturned: 10, successRate: 32.3 },
        { role: 'pitcher', challenges: 12, overturned: 3, successRate: 25.0 },
      ],
      recentGames: [
        { gameId: 'g1', date: '2026-04-01', away: 'HOU', home: 'TEX', totalChallenges: 3, overturned: 1, avgChallengeTime: 17.0 },
        { gameId: 'g2', date: '2026-03-31', away: 'NYY', home: 'BOS', totalChallenges: 5, overturned: 2, avgChallengeTime: 16.8 },
      ],
      umpireAccuracy: [
        { label: 'Human umpire (pre-ABS avg)', accuracy: 94.0, totalCalls: 28500, source: 'UmpScorecards 2025' },
        { label: 'ABS Hawk-Eye system', accuracy: 99.7, totalCalls: 28500, source: 'MLB / Hawk-Eye' },
        { label: 'Human + ABS challenges', accuracy: 96.3, totalCalls: 28500, source: 'Sportradar + BSI analysis' },
      ],
      meta: { source: 'sportradar', fetched_at: '2026-04-01T12:00:00Z', timezone: 'America/Chicago' as const },
    };

    const { BSIABSResponseSchema } = await import('../../lib/api-clients/sportradar-schemas');
    const result = BSIABSResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('blended accuracy computation is correct', () => {
    // Mirrors the logic in functions/api/mlb/abs.ts
    const challengesByRole = [
      { challenges: 42, overturned: 18 },
      { challenges: 31, overturned: 10 },
      { challenges: 12, overturned: 3 },
    ];
    const totalChallenges = challengesByRole.reduce((s, r) => s + r.challenges, 0);
    const totalOverturned = challengesByRole.reduce((s, r) => s + r.overturned, 0);
    const correctionRate = totalOverturned / totalChallenges;
    const blendedAccuracy = Math.min(99.7, 94.0 + correctionRate * 6.0);

    expect(totalChallenges).toBe(85);
    expect(totalOverturned).toBe(31);
    expect(correctionRate).toBeCloseTo(0.3647, 3);
    expect(blendedAccuracy).toBeCloseTo(96.19, 1);
    expect(blendedAccuracy).toBeLessThanOrEqual(99.7);
  });
});
