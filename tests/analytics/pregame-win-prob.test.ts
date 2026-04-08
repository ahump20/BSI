import { describe, expect, it } from 'vitest';
import {
  estimatePregameWinProbability,
  homeEdgeBySport,
} from '@/lib/analytics/pregame-win-prob';

describe('homeEdgeBySport', () => {
  it('returns 0.04 for nba', () => {
    expect(homeEdgeBySport('nba')).toBe(0.04);
  });

  it('returns 0.04 for cbb', () => {
    expect(homeEdgeBySport('cbb')).toBe(0.04);
  });

  it('returns 0.045 for ncaafb', () => {
    expect(homeEdgeBySport('ncaafb')).toBe(0.045);
  });

  it('returns 0.03 for nfl', () => {
    expect(homeEdgeBySport('nfl')).toBe(0.03);
  });

  it('returns 0.035 for d1bb', () => {
    expect(homeEdgeBySport('d1bb')).toBe(0.035);
  });

  it('returns 0.025 for mlb (default)', () => {
    expect(homeEdgeBySport('mlb')).toBe(0.025);
  });
});

describe('estimatePregameWinProbability', () => {
  it('returns 50/50 when both records are undefined (with HFA offset)', () => {
    const { home, away } = estimatePregameWinProbability('mlb');
    expect(home + away).toBe(100);
    // home edge for mlb is 0.025 → home > 50
    expect(home).toBeGreaterThan(50);
  });

  it('returns probabilities that always sum to 100', () => {
    const pairs: [string | undefined, string | undefined][] = [
      ['30-10', '10-30'],
      ['0-42', '42-0'],
      ['21-21', '21-21'],
      [undefined, '20-10'],
      ['20-10', undefined],
    ];
    for (const [homeRec, awayRec] of pairs) {
      const { home, away } = estimatePregameWinProbability('nfl', homeRec, awayRec);
      expect(home + away).toBe(100);
    }
  });

  it('favors the clearly superior home team', () => {
    const { home } = estimatePregameWinProbability('mlb', '60-2', '2-60');
    expect(home).toBeGreaterThan(75);
  });

  it('favors the away team when away has a dominant record', () => {
    const { away } = estimatePregameWinProbability('mlb', '2-60', '60-2');
    expect(away).toBeGreaterThan(50);
  });

  it('clamps home probability to at most 88', () => {
    const { home } = estimatePregameWinProbability('nba', '999-0', '0-999');
    expect(home).toBeLessThanOrEqual(88);
  });

  it('clamps away probability such that home is at least 12', () => {
    const { home } = estimatePregameWinProbability('nba', '0-999', '999-0');
    expect(home).toBeGreaterThanOrEqual(12);
  });

  it('handles malformed record strings by treating as 0.5 win pct', () => {
    const { home, away } = estimatePregameWinProbability('mlb', 'invalid', 'also-bad');
    expect(home + away).toBe(100);
  });

  it('handles all supported sports without throwing', () => {
    const sports = ['nba', 'cbb', 'ncaafb', 'nfl', 'd1bb', 'mlb'] as const;
    for (const sport of sports) {
      expect(() => estimatePregameWinProbability(sport, '30-10', '20-20')).not.toThrow();
    }
  });
});
