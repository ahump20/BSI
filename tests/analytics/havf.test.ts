import { describe, it, expect } from 'vitest';
import {
  computeHAVF,
  buildPercentileTable,
  type HAVFInput,
  type HAVFResult,
  type PercentileTable,
} from '@lib/analytics/havf';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ELITE_BATTER: HAVFInput = {
  batting: {
    avg: 0.320, obp: 0.400, slg: 0.570, woba: 0.410, iso: 0.250,
    bbPct: 12.0, kPct: 15.0, babip: 0.340, hrRate: 5.5,
  },
  fielding: {
    fieldingPct: 0.985, putouts: 250, assists: 80, games: 140, errors: 5,
  },
};

const AVERAGE_BATTER: HAVFInput = {
  batting: {
    avg: 0.260, obp: 0.330, slg: 0.420, woba: 0.320, iso: 0.160,
    bbPct: 8.5, kPct: 22.0, babip: 0.300, hrRate: 3.0,
  },
  fielding: {
    fieldingPct: 0.975, putouts: 200, assists: 60, games: 130, errors: 8,
  },
};

const BELOW_AVG_BATTER: HAVFInput = {
  batting: {
    avg: 0.220, obp: 0.280, slg: 0.340, woba: 0.270, iso: 0.120,
    bbPct: 5.0, kPct: 28.0, babip: 0.260, hrRate: 1.5,
  },
  fielding: {
    fieldingPct: 0.960, putouts: 150, assists: 40, games: 100, errors: 12,
  },
};

function buildTestPercentiles(): PercentileTable {
  // Build from a 3-player pool so percentiles are meaningful
  return buildPercentileTable([ELITE_BATTER, AVERAGE_BATTER, BELOW_AVG_BATTER]);
}

// ---------------------------------------------------------------------------
// computeHAVF
// ---------------------------------------------------------------------------

describe('computeHAVF', () => {
  const pct = buildTestPercentiles();

  it('returns all scores between 0 and 100', () => {
    const result = computeHAVF(AVERAGE_BATTER, pct);
    for (const key of ['hScore', 'aScore', 'vScore', 'fScore', 'composite'] as const) {
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(100);
    }
  });

  it('elite batter scores higher composite than average', () => {
    const elite = computeHAVF(ELITE_BATTER, pct);
    const avg = computeHAVF(AVERAGE_BATTER, pct);
    expect(elite.composite).toBeGreaterThan(avg.composite);
  });

  it('average batter scores higher composite than below-average', () => {
    const avg = computeHAVF(AVERAGE_BATTER, pct);
    const below = computeHAVF(BELOW_AVG_BATTER, pct);
    expect(avg.composite).toBeGreaterThan(below.composite);
  });

  it('hitting dimension (H) ranks elite highest', () => {
    const elite = computeHAVF(ELITE_BATTER, pct);
    const avg = computeHAVF(AVERAGE_BATTER, pct);
    expect(elite.hScore).toBeGreaterThan(avg.hScore);
  });

  it('fielding dimension (F) tracks fielding percentage', () => {
    const elite = computeHAVF(ELITE_BATTER, pct);
    const below = computeHAVF(BELOW_AVG_BATTER, pct);
    expect(elite.fScore).toBeGreaterThan(below.fScore);
  });

  it('velocity proxy (V) tracks power metrics', () => {
    const elite = computeHAVF(ELITE_BATTER, pct);
    const below = computeHAVF(BELOW_AVG_BATTER, pct);
    expect(elite.vScore).toBeGreaterThan(below.vScore);
  });

  it('handles zero games gracefully (no division by zero)', () => {
    const zeroGames: HAVFInput = {
      batting: { avg: 0, obp: 0, slg: 0, woba: 0, iso: 0, bbPct: 0, kPct: 0, babip: 0, hrRate: 0 },
      fielding: { fieldingPct: 0, putouts: 0, assists: 0, games: 0, errors: 0 },
    };
    const result = computeHAVF(zeroGames, pct);
    expect(result.composite).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.composite)).toBe(true);
  });

  it('composite equals weighted sum of components', () => {
    const result = computeHAVF(AVERAGE_BATTER, pct);
    const expected = 0.35 * result.hScore + 0.25 * result.aScore + 0.25 * result.vScore + 0.15 * result.fScore;
    expect(result.composite).toBeCloseTo(Math.round(expected * 10) / 10, 1);
  });
});

// ---------------------------------------------------------------------------
// buildPercentileTable
// ---------------------------------------------------------------------------

describe('buildPercentileTable', () => {
  it('produces sorted arrays for each stat', () => {
    const pct = buildTestPercentiles();
    for (const key of Object.keys(pct) as (keyof PercentileTable)[]) {
      const arr = pct[key];
      for (let i = 1; i < arr.length; i++) {
        expect(arr[i]).toBeGreaterThanOrEqual(arr[i - 1]);
      }
    }
  });

  it('has correct length matching player count', () => {
    const pct = buildTestPercentiles();
    expect(pct.avg).toHaveLength(3);
    expect(pct.fieldingPct).toHaveLength(3);
  });

  it('handles empty player array', () => {
    const pct = buildPercentileTable([]);
    expect(pct.avg).toHaveLength(0);
  });
});
