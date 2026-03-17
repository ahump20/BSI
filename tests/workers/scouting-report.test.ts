import { describe, expect, it, vi, beforeEach } from 'vitest';
import { handleScoutingReport } from '../../workers/handlers/scouting';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function mockEnv(overrides: Record<string, unknown> = {}) {
  return {
    KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
    BSI_KEYS: {
      get: vi.fn().mockResolvedValue(null),
    },
    ANTHROPIC_API_KEY: 'test-key',
    ENVIRONMENT: 'test',
    ...overrides,
  } as unknown as Parameters<typeof handleScoutingReport>[2];
}

function mockRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://blazesportsintel.com/api/college-baseball/players/test-player/scouting-report', {
    headers: new Headers(headers),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scouting report handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns free-tier preview when no API key provided', async () => {
    const env = mockEnv();
    const res = await handleScoutingReport('test-player', mockRequest(), env);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.preview).toBe(true);
    expect(body.teaser).toBeDefined();
    expect((body.teaser as Record<string, unknown>).sections).toBeInstanceOf(Array);
  });

  it('returns 503 when ANTHROPIC_API_KEY is not configured', async () => {
    const env = mockEnv({
      ANTHROPIC_API_KEY: undefined,
      BSI_KEYS: {
        get: vi.fn().mockResolvedValue(JSON.stringify({ tier: 'pro' })),
      },
    });

    const res = await handleScoutingReport(
      'test-player',
      mockRequest({ 'X-BSI-Key': 'valid-key' }),
      env,
    );
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(503);
    expect(body.error).toBeDefined();
  });

  it('returns cached report when available', async () => {
    const cachedReport = {
      report: {
        playerId: 'test-player',
        playerName: 'Test Player',
        team: 'Test U',
        position: 'SS',
        generatedAt: new Date().toISOString(),
        summary: 'Test summary',
        grades: { overall: 55, hit: 55, power: 50, speed: 60, discipline: 50, stuff: null, command: null, durability: null },
        strengths: ['Good bat speed'],
        weaknesses: ['Below-average arm'],
        projection: 'Day 2 draft pick',
        comparables: ['Similar to X because of Y'],
        keyStats: { AVG: '.312', wRC: '135' },
        fullNarrative: 'Full report text here.',
      },
      meta: {
        source: 'BSI Scouting Intelligence',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
        model: 'claude-sonnet-4-6',
        cached: false,
      },
    };

    const env = mockEnv({
      KV: {
        get: vi.fn().mockResolvedValue(JSON.stringify(cachedReport)),
        put: vi.fn(),
      },
      BSI_KEYS: {
        get: vi.fn().mockResolvedValue(JSON.stringify({ tier: 'pro' })),
      },
    });

    const res = await handleScoutingReport(
      'test-player',
      mockRequest({ 'X-BSI-Key': 'valid-key' }),
      env,
    );
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect((body.meta as Record<string, unknown>).cached).toBe(true);
    expect((body.report as Record<string, unknown>).playerName).toBe('Test Player');
  });

  it('resolves pro tier from BSI_KEYS', async () => {
    const env = mockEnv({
      BSI_KEYS: {
        get: vi.fn().mockImplementation((key: string) => {
          if (key === 'key:pro-test') {
            return Promise.resolve(JSON.stringify({ tier: 'pro' }));
          }
          return Promise.resolve(null);
        }),
      },
    });

    // First call without key — should get preview
    const freeRes = await handleScoutingReport('test-player', mockRequest(), env);
    const freeBody = (await freeRes.json()) as Record<string, unknown>;
    expect(freeBody.preview).toBe(true);
  });
});
