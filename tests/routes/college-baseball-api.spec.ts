/**
 * College Baseball API Freshness Gate.
 * Checks live endpoints for structure, data presence, and freshness.
 * Runs against the target deploy URL (preview or production).
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://blazesportsintel.com';

// Season window: Feb 14 – Jun 30
const now = new Date();
const month = now.getMonth() + 1;
const day = now.getDate();
const IN_SEASON =
  (month === 2 && day >= 14) ||
  (month >= 3 && month <= 5) ||
  (month === 6 && day <= 30);

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function checkFreshness(fetchedAt: string, label: string): 'fresh' | 'warn' | 'stale' {
  const ts = new Date(fetchedAt).getTime();
  if (isNaN(ts)) return 'warn';
  const age = Date.now() - ts;
  if (age <= TWO_HOURS_MS) return 'fresh';
  if (age <= TWENTY_FOUR_HOURS_MS) return 'warn';
  return 'stale';
}

// ─────────────────────────────────────────────────────────────────────────────
// Rankings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API: /api/college-baseball/rankings', () => {
  test('returns 200 with rankings array and valid meta', async ({ request }) => {
    const res = await request.get(`${BASE}/api/college-baseball/rankings`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('source');

    const fetchedAt = data.meta?.fetched_at ?? data.meta?.lastUpdated ?? data.timestamp;
    expect(fetchedAt).toBeTruthy();

    const freshness = checkFreshness(fetchedAt, 'rankings');
    if (IN_SEASON) {
      // Hard fail if stale > 24h
      expect(freshness).not.toBe('stale');
      if (freshness === 'warn') {
        console.warn(`[rankings] fetched_at is between 2h and 24h old (${fetchedAt})`);
      }
    }

    // Rankings array should be present
    const rankings = data.rankings ?? data.data;
    expect(Array.isArray(rankings)).toBe(true);
    if (IN_SEASON) {
      expect(rankings.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scores
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API: /api/college-baseball/scores', () => {
  test('returns 200 with games/data array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/college-baseball/scores`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    const games = data.games ?? data.data;
    expect(Array.isArray(games)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Standings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API: /api/college-baseball/standings', () => {
  test('returns 200 with standings array; entries have wins field', async ({ request }) => {
    const res = await request.get(`${BASE}/api/college-baseball/standings`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    const standings = data.standings ?? data.data;
    expect(Array.isArray(standings)).toBe(true);
    expect(standings.length).toBeGreaterThan(0);

    // Entries may have wins flat or nested under overallRecord/conferenceRecord
    const withWins = standings.filter(
      (s: Record<string, unknown>) =>
        'wins' in s ||
        'w' in s ||
        (s.overallRecord && typeof s.overallRecord === 'object' && 'wins' in (s.overallRecord as Record<string, unknown>)) ||
        (s.conferenceRecord && typeof s.conferenceRecord === 'object' && 'wins' in (s.conferenceRecord as Record<string, unknown>))
    );
    expect(withWins.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Teams (bulk)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API: /api/college-baseball/teams/all', () => {
  test('returns 200 with >100 teams; sample team has record field', async ({ request }) => {
    const res = await request.get(`${BASE}/api/college-baseball/teams/all`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    const teams = data.teams ?? data.data;
    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThan(100);

    // Sample team should have a record
    const sample = teams[0];
    expect(sample).toHaveProperty('name');
    // record may be nested or flat
    const hasRecord = 'record' in sample || 'wins' in sample;
    expect(hasRecord).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Team detail — Texas
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API: /api/college-baseball/teams/texas', () => {
  test('returns 200 with team object and non-0-0 record in season', async ({ request }) => {
    const res = await request.get(`${BASE}/api/college-baseball/teams/texas`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    const team = data.team ?? data.data ?? data;
    expect(team).toBeTruthy();
    expect(team).toHaveProperty('name');

    if (IN_SEASON) {
      // Record may be flat (team.wins) or nested (team.stats.wins)
      const wins = team.wins ?? team.stats?.wins ?? 0;
      const losses = team.losses ?? team.stats?.losses ?? 0;
      const record = team.record ?? `${wins}-${losses}`;
      expect(record).not.toBe('0-0');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Team detail — Vanderbilt
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API: /api/college-baseball/teams/vanderbilt', () => {
  test('returns 200 with team object that has a record', async ({ request }) => {
    const res = await request.get(`${BASE}/api/college-baseball/teams/vanderbilt`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    const team = data.team ?? data.data ?? data;
    expect(team).toBeTruthy();
    expect(team).toHaveProperty('name');

    // Record may be flat or nested under stats
    const hasRecord = 'record' in team || 'wins' in team || (team.stats && 'wins' in team.stats);
    expect(hasRecord).toBe(true);
  });
});
