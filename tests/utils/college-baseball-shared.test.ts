/**
 * Unit tests for pure functions in workers/handlers/college-baseball/shared.ts.
 * These functions are stateless transforms with no external dependencies.
 */
import { describe, expect, it } from 'vitest';
import { parseInningsToThirds, computeTrendSummary, transformTeamSchedule } from '../../workers/handlers/college-baseball/shared';

// ---------------------------------------------------------------------------
// parseInningsToThirds
// ---------------------------------------------------------------------------

describe('parseInningsToThirds', () => {
  it('converts whole innings correctly', () => {
    expect(parseInningsToThirds('6.0')).toBe(18);
    expect(parseInningsToThirds('7.0')).toBe(21);
    expect(parseInningsToThirds('9.0')).toBe(27);
  });

  it('converts partial innings: 6.1 = 19 thirds', () => {
    expect(parseInningsToThirds('6.1')).toBe(19);
  });

  it('converts partial innings: 6.2 = 20 thirds', () => {
    expect(parseInningsToThirds('6.2')).toBe(20);
  });

  it('handles zero innings', () => {
    expect(parseInningsToThirds('0.0')).toBe(0);
    expect(parseInningsToThirds('0.1')).toBe(1);
    expect(parseInningsToThirds('0.2')).toBe(2);
  });

  it('returns 0 for invalid input', () => {
    expect(parseInningsToThirds('')).toBe(0);
    expect(parseInningsToThirds('abc')).toBe(0);
    expect(parseInningsToThirds('NaN')).toBe(0);
  });

  it('handles large inning counts (extra innings)', () => {
    expect(parseInningsToThirds('12.0')).toBe(36);
    expect(parseInningsToThirds('10.2')).toBe(32);
  });
});

// ---------------------------------------------------------------------------
// computeTrendSummary
// ---------------------------------------------------------------------------

describe('computeTrendSummary', () => {
  it('returns N/A values for empty snapshots', () => {
    const result = computeTrendSummary([]);
    expect(result.currentStreak).toBe('N/A');
    expect(result.last10).toBe('N/A');
    expect(result.rankingChange).toBeNull();
  });

  it('detects a winning streak', () => {
    const snapshots = [
      { wins: 0, losses: 0, ranking: null },
      { wins: 1, losses: 0, ranking: null },
      { wins: 2, losses: 0, ranking: null },
      { wins: 3, losses: 0, ranking: null },
    ];
    const result = computeTrendSummary(snapshots);
    expect(result.currentStreak).toBe('W3');
  });

  it('detects a losing streak', () => {
    const snapshots = [
      { wins: 5, losses: 0, ranking: null },
      { wins: 5, losses: 1, ranking: null },
      { wins: 5, losses: 2, ranking: null },
    ];
    const result = computeTrendSummary(snapshots);
    expect(result.currentStreak).toBe('L2');
  });

  it('breaks streak correctly when type changes', () => {
    const snapshots = [
      { wins: 0, losses: 0, ranking: null },
      { wins: 1, losses: 0, ranking: null },
      { wins: 1, losses: 1, ranking: null }, // loss
      { wins: 2, losses: 1, ranking: null }, // win
      { wins: 3, losses: 1, ranking: null }, // win
    ];
    const result = computeTrendSummary(snapshots);
    expect(result.currentStreak).toBe('W2');
  });

  it('computes last10 correctly when enough snapshots exist', () => {
    // 12 snapshots — last 10 covers index 2 through 11
    const snapshots = Array.from({ length: 12 }, (_, i) => ({
      wins: i,
      losses: 0,
      ranking: null,
    }));
    const result = computeTrendSummary(snapshots);
    // last: wins=11, tenAgo: wins=1 → last10W = 10, last10L = 0
    expect(result.last10).toBe('10-0');
  });

  it('uses full range for last10 when fewer than 11 snapshots', () => {
    const snapshots = [
      { wins: 0, losses: 0, ranking: null },
      { wins: 3, losses: 2, ranking: null },
    ];
    const result = computeTrendSummary(snapshots);
    expect(result.last10).toBe('3-2');
  });

  it('computes ranking change (improvement = positive delta)', () => {
    const snapshots = [
      { wins: 0, losses: 0, ranking: 15 },
      { wins: 5, losses: 2, ranking: 10 },
    ];
    // firstRank=15, lastRank=10 → change = 15 - 10 = 5 (improved 5 spots)
    const result = computeTrendSummary(snapshots);
    expect(result.rankingChange).toBe(5);
  });

  it('returns null rankingChange when no rankings present', () => {
    const snapshots = [
      { wins: 1, losses: 0, ranking: null },
      { wins: 2, losses: 0, ranking: null },
    ];
    const result = computeTrendSummary(snapshots);
    expect(result.rankingChange).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// transformTeamSchedule
// ---------------------------------------------------------------------------

describe('transformTeamSchedule', () => {
  const makeEvent = (opts: {
    id?: string;
    date?: string;
    state?: string;
    homeAbbr?: string;
    homeShort?: string;
    awayAbbr?: string;
    awayShort?: string;
    homeScore?: string;
    awayScore?: string;
  }) => ({
    id: opts.id ?? '123',
    date: opts.date ?? '2026-03-10T18:00Z',
    competitions: [{
      competitors: [
        {
          homeAway: 'home',
          team: { id: '1', displayName: 'Texas Longhorns', abbreviation: opts.homeAbbr ?? 'TEX', shortDisplayName: opts.homeShort ?? 'Texas' },
          score: opts.homeScore ?? '0',
        },
        {
          homeAway: 'away',
          team: { id: '2', displayName: 'LSU Tigers', abbreviation: opts.awayAbbr ?? 'LSU', shortDisplayName: opts.awayShort ?? 'LSU' },
          score: opts.awayScore ?? '0',
        },
      ],
      status: { type: { state: opts.state ?? 'pre', shortDetail: '' } },
    }],
  });

  it('maps pre-game status correctly', () => {
    const events = [makeEvent({ state: 'pre' })];
    const result = transformTeamSchedule(events as any, 'TEX');
    expect(result[0].status).toBe('pre');
    expect(result[0].score).toBeNull();
    expect(result[0].result).toBeNull();
  });

  it('maps live game status and includes score', () => {
    const events = [makeEvent({ state: 'in', homeScore: '3', awayScore: '1' })];
    const result = transformTeamSchedule(events as any, 'TEX');
    expect(result[0].status).toBe('in');
    expect(result[0].score).toEqual({ team: 3, opponent: 1 });
    expect(result[0].result).toBeNull(); // no result until final
  });

  it('maps final game status and assigns W/L result', () => {
    const events = [makeEvent({ state: 'post', homeScore: '5', awayScore: '2' })];
    const result = transformTeamSchedule(events as any, 'TEX');
    expect(result[0].status).toBe('post');
    expect(result[0].score).toEqual({ team: 5, opponent: 2 });
    expect(result[0].result).toBe('W');
  });

  it('assigns L when team lost', () => {
    const events = [makeEvent({ state: 'post', homeScore: '2', awayScore: '7' })];
    const result = transformTeamSchedule(events as any, 'TEX');
    expect(result[0].result).toBe('L');
  });

  it('detects home game by abbreviation match', () => {
    const events = [makeEvent({ homeAbbr: 'TEX' })];
    const result = transformTeamSchedule(events as any, 'TEX');
    expect(result[0].isHome).toBe(true);
    expect(result[0].opponent.abbreviation).toBe('LSU');
  });

  it('detects away game when team is away', () => {
    const events = [makeEvent({ awayAbbr: 'TEX', homeAbbr: 'LSU', homeShort: 'LSU', awayShort: 'Texas' })];
    const result = transformTeamSchedule(events as any, 'Texas');
    expect(result[0].isHome).toBe(false);
    expect(result[0].opponent.abbreviation).toBe('LSU');
  });

  it('does not false-positive match "Texas" against "Texas A&M"', () => {
    // Strict match check — "texas" should NOT match "Texas A&M" abbreviation "TAMU"
    const events = [makeEvent({ homeAbbr: 'TAMU', homeShort: 'Texas A&M' })];
    const result = transformTeamSchedule(events as any, 'Texas');
    // "texas" !== "tamu" and "texas" !== "texas a&m" → isHome should be false
    expect(result[0].isHome).toBe(false);
  });

  it('assigns T result on tied final', () => {
    const events = [makeEvent({ state: 'post', homeScore: '3', awayScore: '3' })];
    const result = transformTeamSchedule(events as any, 'TEX');
    expect(result[0].result).toBe('T');
  });

  it('returns empty array for empty events', () => {
    expect(transformTeamSchedule([], 'TEX')).toEqual([]);
  });
});
