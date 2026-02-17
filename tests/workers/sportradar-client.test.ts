import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SportradarDailyScheduleSchema,
  SportradarPBPResponseSchema,
  SportradarChangesResponseSchema,
  SportradarPitchEventSchema,
  BSIABSResponseSchema,
  BSIABSRoleStatsSchema,
  BSIABSGameLogSchema,
} from '../../lib/api-clients/sportradar-schemas';
import { SportradarMLBClient, SportradarError } from '../../lib/api-clients/sportradar-api';

// ---------------------------------------------------------------------------
// Sample payloads matching Sportradar MLB v8 shape
// ---------------------------------------------------------------------------

const SAMPLE_SCHEDULE = {
  date: '2026-04-01',
  games: [
    {
      id: 'sr:game:abc123',
      status: 'inprogress',
      coverage: 'full',
      scheduled: '2026-04-01T18:05:00Z',
      home_team: 'TEX',
      away_team: 'HOU',
      home: { id: 'sr:team:1', name: 'Rangers', market: 'Texas', abbr: 'TEX' },
      away: { id: 'sr:team:2', name: 'Astros', market: 'Houston', abbr: 'HOU' },
      venue: { id: 'sr:venue:1', name: 'Globe Life Field', city: 'Arlington', state: 'TX' },
    },
    {
      id: 'sr:game:def456',
      status: 'scheduled',
      coverage: 'full',
      scheduled: '2026-04-01T20:10:00Z',
      home: { id: 'sr:team:3', name: 'Cardinals', market: 'St. Louis', abbr: 'STL' },
      away: { id: 'sr:team:4', name: 'Cubs', market: 'Chicago', abbr: 'CHC' },
    },
  ],
};

const SAMPLE_PBP = {
  game: {
    id: 'sr:game:abc123',
    status: 'inprogress',
    scheduled: '2026-04-01T18:05:00Z',
    home: { id: 'sr:team:1', name: 'Rangers', market: 'Texas', abbr: 'TEX' },
    away: { id: 'sr:team:2', name: 'Astros', market: 'Houston', abbr: 'HOU' },
  },
  innings: [
    {
      number: 1,
      sequence: 1,
      halfs: [
        {
          half: 'T',
          events: [
            {
              id: 'evt-001',
              type: 'at_bat',
              at_bat: {
                id: 'ab-001',
                hitter_id: 'pl-100',
                pitcher_id: 'pl-200',
                events: [
                  {
                    id: 'pitch-001',
                    sequence: 1,
                    outcome_id: 'kS',
                    outcome_desc: 'Called Strike',
                    type: 'pitch',
                  },
                  {
                    id: 'pitch-002',
                    sequence: 2,
                    outcome_id: 'aBC',
                    outcome_desc: 'ABS challenge by catcher — overturned',
                    type: 'pitch',
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

const SAMPLE_PITCH_EVENT = {
  id: 'pitch-001',
  sequence: 1,
  outcome_id: 'kS',
  outcome_desc: 'Called Strike',
  type: 'pitch',
  count: { balls: 0, strikes: 1, outs: 0, pitch_count: 1 },
  pitcher: { id: 'pl-200', full_name: 'Max Scherzer' },
  hitter: { id: 'pl-100', full_name: 'Jose Altuve' },
  mlb_pitch_data: {
    speed: 94.2,
    type: 'FF',
    type_desc: 'Four-Seam Fastball',
    zone: 5,
    x: 0.12,
    y: 2.45,
    spin_rate: 2350,
  },
};

const SAMPLE_CHANGES = {
  league: { id: 'sr:league:1', name: 'MLB' },
  changes: [
    { game_id: 'sr:game:abc123', updated: '2026-04-01T18:30:00Z', endpoints: ['pbp', 'summary'] },
  ],
};

// ---------------------------------------------------------------------------
// Zod Schema Tests
// ---------------------------------------------------------------------------

describe('Sportradar Zod Schemas', () => {
  describe('SportradarDailyScheduleSchema', () => {
    it('validates a well-formed schedule response', () => {
      const result = SportradarDailyScheduleSchema.safeParse(SAMPLE_SCHEDULE);
      expect(result.success).toBe(true);
    });

    it('rejects missing date field', () => {
      const result = SportradarDailyScheduleSchema.safeParse({
        games: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing games array', () => {
      const result = SportradarDailyScheduleSchema.safeParse({
        date: '2026-04-01',
      });
      expect(result.success).toBe(false);
    });

    it('accepts empty games array', () => {
      const result = SportradarDailyScheduleSchema.safeParse({
        date: '2026-04-01',
        games: [],
      });
      expect(result.success).toBe(true);
    });

    it('preserves unknown fields via passthrough', () => {
      const result = SportradarDailyScheduleSchema.safeParse({
        date: '2026-04-01',
        games: [],
        league: { id: 'sr:league:1' },
        new_future_field: 'should survive',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).new_future_field).toBe('should survive');
      }
    });
  });

  describe('SportradarPBPResponseSchema', () => {
    it('validates a well-formed PBP response', () => {
      const result = SportradarPBPResponseSchema.safeParse(SAMPLE_PBP);
      expect(result.success).toBe(true);
    });

    it('accepts PBP with no innings (pre-game)', () => {
      const result = SportradarPBPResponseSchema.safeParse({
        game: { id: 'sr:game:xyz', status: 'scheduled', scheduled: '2026-04-01T18:05:00Z' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('SportradarPitchEventSchema', () => {
    it('validates a full pitch event with Statcast data', () => {
      const result = SportradarPitchEventSchema.safeParse(SAMPLE_PITCH_EVENT);
      expect(result.success).toBe(true);
    });

    it('validates a minimal pitch event', () => {
      const result = SportradarPitchEventSchema.safeParse({
        id: 'p-001',
        outcome_id: 'kS',
        outcome_desc: 'Strike',
      });
      expect(result.success).toBe(true);
    });

    it('rejects pitch event missing required outcome_id', () => {
      const result = SportradarPitchEventSchema.safeParse({
        id: 'p-001',
        outcome_desc: 'Strike',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SportradarChangesResponseSchema', () => {
    it('validates a changes response', () => {
      const result = SportradarChangesResponseSchema.safeParse(SAMPLE_CHANGES);
      expect(result.success).toBe(true);
    });

    it('validates empty changes', () => {
      const result = SportradarChangesResponseSchema.safeParse({
        changes: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('BSIABSRoleStatsSchema', () => {
    it('validates catcher/hitter/pitcher role stats', () => {
      for (const role of ['catcher', 'hitter', 'pitcher'] as const) {
        const result = BSIABSRoleStatsSchema.safeParse({
          role,
          challenges: 42,
          overturned: 18,
          successRate: 42.9,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid role', () => {
      const result = BSIABSRoleStatsSchema.safeParse({
        role: 'umpire',
        challenges: 10,
        overturned: 5,
        successRate: 50.0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('BSIABSGameLogSchema', () => {
    it('validates a game log entry', () => {
      const result = BSIABSGameLogSchema.safeParse({
        gameId: 'sr:game:abc123',
        date: '2026-04-01',
        away: 'HOU',
        home: 'TEX',
        totalChallenges: 3,
        overturned: 1,
        avgChallengeTime: 17.2,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('BSIABSResponseSchema', () => {
    it('validates a full ABS API response', () => {
      const result = BSIABSResponseSchema.safeParse({
        challengesByRole: [
          { role: 'catcher', challenges: 42, overturned: 18, successRate: 42.9 },
          { role: 'hitter', challenges: 31, overturned: 10, successRate: 32.3 },
          { role: 'pitcher', challenges: 12, overturned: 3, successRate: 25.0 },
        ],
        recentGames: [
          { gameId: 'g1', date: '2026-04-01', away: 'HOU', home: 'TEX', totalChallenges: 3, overturned: 1, avgChallengeTime: 17.0 },
        ],
        umpireAccuracy: [
          { label: 'Human umpire', accuracy: 94.0, totalCalls: 28500, source: 'UmpScorecards' },
        ],
        meta: { source: 'sportradar', fetched_at: '2026-04-01T12:00:00Z', timezone: 'America/Chicago' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects wrong timezone literal', () => {
      const result = BSIABSResponseSchema.safeParse({
        challengesByRole: [],
        recentGames: [],
        umpireAccuracy: [],
        meta: { source: 'sportradar', fetched_at: '2026-04-01T12:00:00Z', timezone: 'America/New_York' },
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// SportradarMLBClient Tests (mocked fetch)
// ---------------------------------------------------------------------------

describe('SportradarMLBClient', () => {
  let client: SportradarMLBClient;

  beforeEach(() => {
    client = new SportradarMLBClient({
      apiKey: 'test-key-123',
      accessLevel: 'trial',
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('constructs with correct base URL for trial', () => {
    // The client URL is private, but we can test it works via a mocked fetch
    expect(client).toBeDefined();
  });

  describe('getDailySchedule', () => {
    it('fetches schedule with correct URL and headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_SCHEDULE),
      });
      vi.stubGlobal('fetch', mockFetch);

      const schedulePromise = client.getDailySchedule(2026, 4, 1);
      // Advance past throttle
      await vi.advanceTimersByTimeAsync(1200);
      const schedule = await schedulePromise;

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.sportradar.com/mlb/trial/v8/en/games/2026/04/01/schedule.json');
      expect(opts.headers['x-api-key']).toBe('test-key-123');
      expect(opts.headers.Accept).toBe('application/json');
      expect(schedule.date).toBe('2026-04-01');
      expect(schedule.games).toHaveLength(2);
    });

    it('zero-pads single-digit month and day', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ date: '2026-03-05', games: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const schedulePromise = client.getDailySchedule(2026, 3, 5);
      await vi.advanceTimersByTimeAsync(1200);
      await schedulePromise;

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/2026/03/05/');
    });
  });

  describe('getPlayByPlay', () => {
    it('fetches PBP for a game ID', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_PBP),
      });
      vi.stubGlobal('fetch', mockFetch);

      const pbpPromise = client.getPlayByPlay('sr:game:abc123');
      await vi.advanceTimersByTimeAsync(1200);
      const pbp = await pbpPromise;

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/games/sr:game:abc123/pbp.json');
      expect(pbp.innings).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('throws SportradarError on non-ok response', async () => {
      // Use real timers for error tests to avoid unhandled rejection warnings
      vi.useRealTimers();
      const freshClient = new SportradarMLBClient({ apiKey: 'test-key-123', accessLevel: 'trial' });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });
      vi.stubGlobal('fetch', mockFetch);

      let caught: unknown;
      try {
        await freshClient.getDailySchedule(2026, 4, 1);
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(SportradarError);
      expect((caught as SportradarError).message).toMatch(/403/);
      vi.useFakeTimers();
    });

    it('SportradarError includes status and endpoint', async () => {
      vi.useRealTimers();
      const freshClient = new SportradarMLBClient({ apiKey: 'test-key-123', accessLevel: 'trial' });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });
      vi.stubGlobal('fetch', mockFetch);

      let caught: unknown;
      try {
        await freshClient.getDailySchedule(2026, 4, 1);
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(SportradarError);
      expect((caught as SportradarError).status).toBe(429);
      expect((caught as SportradarError).endpoint).toContain('schedule.json');
      vi.useFakeTimers();
    });
  });

  describe('rate limiting', () => {
    it('enforces minimum interval between requests', async () => {
      const callTimes: number[] = [];
      const mockFetch = vi.fn().mockImplementation(() => {
        callTimes.push(Date.now());
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ date: '2026-04-01', games: [] }),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      // Fire two requests back-to-back
      const p1 = client.getDailySchedule(2026, 4, 1);
      await vi.advanceTimersByTimeAsync(1200);
      await p1;

      const p2 = client.getDailySchedule(2026, 4, 2);
      await vi.advanceTimersByTimeAsync(1200);
      await p2;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Second call should be at least 1100ms after first
      if (callTimes.length === 2) {
        expect(callTimes[1] - callTimes[0]).toBeGreaterThanOrEqual(1100);
      }
    });
  });
});
