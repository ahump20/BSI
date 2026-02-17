import { describe, it, expect } from 'vitest';
import {
  computeMMI,
  computeMMIComponents,
  computeGameSummary,
  type MMIInput,
} from '@lib/analytics/mmi';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TIE_GAME_EARLY: MMIInput = {
  homeScore: 0, awayScore: 0,
  currentInning: 1, totalInnings: 9,
  inningHalf: 'top',
  recentHomeRuns: 0, recentAwayRuns: 0,
  bases: { first: false, second: false, third: false },
  outs: 0,
};

const HOME_LEADING_LATE: MMIInput = {
  homeScore: 5, awayScore: 2,
  currentInning: 8, totalInnings: 9,
  inningHalf: 'bottom',
  recentHomeRuns: 3, recentAwayRuns: 0,
  bases: { first: false, second: false, third: false },
  outs: 1,
};

const AWAY_RALLY: MMIInput = {
  homeScore: 3, awayScore: 5,
  currentInning: 7, totalInnings: 9,
  inningHalf: 'top',
  recentHomeRuns: 0, recentAwayRuns: 4,
  bases: { first: true, second: true, third: false },
  outs: 0,
};

const EXTRA_INNINGS: MMIInput = {
  homeScore: 4, awayScore: 4,
  currentInning: 11, totalInnings: 9,
  inningHalf: 'bottom',
  recentHomeRuns: 0, recentAwayRuns: 0,
  bases: { first: false, second: true, third: false },
  outs: 1,
};

const BASES_LOADED_BOTTOM_9: MMIInput = {
  homeScore: 3, awayScore: 4,
  currentInning: 9, totalInnings: 9,
  inningHalf: 'bottom',
  recentHomeRuns: 2, recentAwayRuns: 0,
  bases: { first: true, second: true, third: true },
  outs: 1,
};

// ---------------------------------------------------------------------------
// computeMMI
// ---------------------------------------------------------------------------

describe('computeMMI', () => {
  it('returns 0 for a 0-0 tie in the 1st inning', () => {
    const mmi = computeMMI(TIE_GAME_EARLY);
    expect(mmi).toBe(0);
  });

  it('is positive when home team leads late', () => {
    const mmi = computeMMI(HOME_LEADING_LATE);
    expect(mmi).toBeGreaterThan(0);
  });

  it('is negative when away team rallies', () => {
    const mmi = computeMMI(AWAY_RALLY);
    expect(mmi).toBeLessThan(0);
  });

  it('stays within -100 to +100 range', () => {
    const scenarios = [TIE_GAME_EARLY, HOME_LEADING_LATE, AWAY_RALLY, EXTRA_INNINGS, BASES_LOADED_BOTTOM_9];
    for (const input of scenarios) {
      const mmi = computeMMI(input);
      expect(mmi).toBeGreaterThanOrEqual(-100);
      expect(mmi).toBeLessThanOrEqual(100);
    }
  });

  it('extra innings amplifies game phase', () => {
    // Same score diff in regulation vs extras — extras should have higher magnitude
    const reg: MMIInput = {
      ...TIE_GAME_EARLY,
      homeScore: 5, awayScore: 4,
      currentInning: 9, totalInnings: 9,
      inningHalf: 'bottom',
    };
    const ext: MMIInput = {
      ...reg,
      currentInning: 12,
    };
    const regComponents = computeMMIComponents(reg);
    const extComponents = computeMMIComponents(ext);
    expect(Math.abs(extComponents.gp)).toBeGreaterThan(Math.abs(regComponents.gp));
  });

  it('bases loaded produces higher leverage than empty bases', () => {
    const loaded: MMIInput = {
      ...TIE_GAME_EARLY,
      currentInning: 5,
      inningHalf: 'bottom',
      bases: { first: true, second: true, third: true },
    };
    const empty: MMIInput = {
      ...TIE_GAME_EARLY,
      currentInning: 5,
      inningHalf: 'bottom',
      bases: { first: false, second: false, third: false },
    };
    const loadedBS = computeMMIComponents(loaded).bs;
    const emptyBS = computeMMIComponents(empty).bs;
    expect(Math.abs(loadedBS)).toBeGreaterThan(Math.abs(emptyBS));
  });
});

// ---------------------------------------------------------------------------
// computeMMIComponents
// ---------------------------------------------------------------------------

describe('computeMMIComponents', () => {
  it('returns all four components plus composite', () => {
    const result = computeMMIComponents(HOME_LEADING_LATE);
    expect(result).toHaveProperty('sd');
    expect(result).toHaveProperty('rs');
    expect(result).toHaveProperty('gp');
    expect(result).toHaveProperty('bs');
    expect(result).toHaveProperty('composite');
  });

  it('composite equals the weighted sum of components (clamped)', () => {
    const result = computeMMIComponents(HOME_LEADING_LATE);
    const raw = 0.40 * result.sd + 0.30 * result.rs + 0.15 * result.gp + 0.15 * result.bs;
    const expected = Math.max(-100, Math.min(100, raw));
    // Allow small floating point rounding
    expect(result.composite).toBeCloseTo(Math.round(expected * 10) / 10, 0);
  });

  it('bases loaded in bottom half is positive (home batting)', () => {
    const result = computeMMIComponents(BASES_LOADED_BOTTOM_9);
    expect(result.bs).toBeGreaterThan(0);
  });

  it('runners on in top half is negative (away batting)', () => {
    const result = computeMMIComponents(AWAY_RALLY);
    expect(result.bs).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeGameSummary
// ---------------------------------------------------------------------------

describe('computeGameSummary', () => {
  it('returns zeros for empty snapshots', () => {
    const summary = computeGameSummary([]);
    expect(summary.finalMMI).toBe(0);
    expect(summary.momentumSwings).toBe(0);
  });

  it('tracks momentum swings (sign changes)', () => {
    // Home starts strong, away comes back, home finishes
    const snapshots = [20, 30, 15, -5, -15, 10, 25];
    const summary = computeGameSummary(snapshots);
    expect(summary.momentumSwings).toBe(2); // positive→negative, negative→positive
  });

  it('finds max and min correctly', () => {
    const snapshots = [0, 10, -20, 30, -5];
    const summary = computeGameSummary(snapshots);
    expect(summary.maxMMI).toBe(30);
    expect(summary.minMMI).toBe(-20);
  });

  it('tracks biggest single-play swing', () => {
    const snapshots = [0, 5, 40, 38]; // biggest swing: 5→40 = 35
    const summary = computeGameSummary(snapshots);
    expect(summary.biggestSwing).toBe(35);
  });

  it('uses last snapshot as final MMI', () => {
    const snapshots = [10, 20, -5];
    const summary = computeGameSummary(snapshots);
    expect(summary.finalMMI).toBe(-5);
  });
});
