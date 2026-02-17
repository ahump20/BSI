/**
 * HAV-F Computation Engine — Test Suite
 *
 * Tests the Hits / At-Bat Quality / Velocity / Fielding composite
 * player evaluation metric. Pure math — no network, no storage.
 *
 * All functions imported from @/lib/analytics/havf.
 */

import { describe, it, expect } from 'vitest';
import {
  percentileRank,
  computeHScore,
  computeAScore,
  computeVScore,
  computeFScore,
  computeHAVF,
  buildPercentileTable,
  batchComputeHAVF,
  HAVF_WEIGHTS,
  type HAVFInput,
  type PercentileTable,
} from '@/lib/analytics/havf';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Build a valid HAVFInput with realistic defaults. Override any field. */
function makePlayer(overrides: Partial<HAVFInput> = {}): HAVFInput {
  return {
    playerID: overrides.playerID ?? 'p-001',
    name: overrides.name ?? 'Test Player',
    team: overrides.team ?? 'Test U',
    league: overrides.league ?? 'Big 12',
    season: overrides.season ?? 2026,
    avg: overrides.avg ?? 0.275,
    obp: overrides.obp ?? 0.340,
    slg: overrides.slg ?? 0.430,
    woba: overrides.woba ?? 0.340,
    iso: overrides.iso ?? 0.155,
    bbPct: overrides.bbPct ?? 0.09,
    kPct: overrides.kPct ?? 0.18,
    babip: overrides.babip ?? 0.310,
    hrPct: overrides.hrPct ?? 0.035,
    fieldingPct: overrides.fieldingPct !== undefined ? overrides.fieldingPct : 0.975,
    rangeFactor: overrides.rangeFactor !== undefined ? overrides.rangeFactor : 4.5,
    games: overrides.games !== undefined ? overrides.games : 50,
  };
}

/** Build a cohort of players with varying stat lines for percentile context. */
function makeCohort(): HAVFInput[] {
  return [
    makePlayer({ playerID: 'p-low', name: 'Low Performer', avg: 0.200, obp: 0.260, slg: 0.300, woba: 0.260, iso: 0.100, bbPct: 0.04, kPct: 0.30, babip: 0.250, hrPct: 0.010, fieldingPct: 0.940, rangeFactor: 3.0 }),
    makePlayer({ playerID: 'p-belowavg', name: 'Below Average', avg: 0.235, obp: 0.300, slg: 0.360, woba: 0.300, iso: 0.125, bbPct: 0.06, kPct: 0.24, babip: 0.280, hrPct: 0.020, fieldingPct: 0.955, rangeFactor: 3.8 }),
    makePlayer({ playerID: 'p-avg', name: 'Average Joe', avg: 0.270, obp: 0.335, slg: 0.420, woba: 0.335, iso: 0.150, bbPct: 0.08, kPct: 0.19, babip: 0.305, hrPct: 0.030, fieldingPct: 0.970, rangeFactor: 4.3 }),
    makePlayer({ playerID: 'p-good', name: 'Good Player', avg: 0.295, obp: 0.370, slg: 0.480, woba: 0.370, iso: 0.185, bbPct: 0.11, kPct: 0.15, babip: 0.330, hrPct: 0.045, fieldingPct: 0.985, rangeFactor: 5.0 }),
    makePlayer({ playerID: 'p-elite', name: 'Elite Player', avg: 0.340, obp: 0.420, slg: 0.580, woba: 0.420, iso: 0.240, bbPct: 0.14, kPct: 0.10, babip: 0.360, hrPct: 0.065, fieldingPct: 0.995, rangeFactor: 5.8 }),
  ];
}

// ---------------------------------------------------------------------------
// percentileRank
// ---------------------------------------------------------------------------

describe('percentileRank', () => {
  it('returns near 0 for the lowest value in a distribution', () => {
    const dist = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = percentileRank(10, dist);
    expect(result).toBeLessThan(10);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('returns near 100 for the highest value in a distribution', () => {
    const dist = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = percentileRank(100, dist);
    expect(result).toBeGreaterThan(90);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns 50 for an empty distribution', () => {
    expect(percentileRank(0.300, [])).toBe(50);
  });

  it('returns approximately 50 for the median value', () => {
    const dist = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = percentileRank(55, dist);
    expect(result).toBeGreaterThan(40);
    expect(result).toBeLessThan(60);
  });

  it('handles a single-element distribution', () => {
    const result = percentileRank(42, [42]);
    // Only one element; the value matches it, so midpoint of tie range = 50
    expect(result).toBe(50);
  });

  it('handles duplicates in the distribution', () => {
    const dist = [10, 10, 10, 50, 50, 90, 90, 90, 90, 90];
    const low = percentileRank(10, dist);
    const mid = percentileRank(50, dist);
    const high = percentileRank(90, dist);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it('returns 0 for a value below the entire distribution', () => {
    const dist = [10, 20, 30, 40, 50];
    const result = percentileRank(1, dist);
    expect(result).toBe(0);
  });

  it('returns 100 for a value above the entire distribution', () => {
    const dist = [10, 20, 30, 40, 50];
    const result = percentileRank(999, dist);
    expect(result).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// computeHScore
// ---------------------------------------------------------------------------

describe('computeHScore', () => {
  it('returns a value between 0 and 100 for known inputs', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);
    const avg = cohort[2]; // middle player
    const score = computeHScore(avg, table);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('elite hitter scores higher than a low performer', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    const elite = computeHScore(cohort[4], table);
    const low = computeHScore(cohort[0], table);

    expect(elite).toBeGreaterThan(low);
  });

  it('returns 50 when percentile table has no data', () => {
    const player = makePlayer();
    const emptyTable: PercentileTable = {};
    const score = computeHScore(player, emptyTable);
    // Each percentile returns 50 (empty dist), so weighted sum = 50
    expect(score).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// computeAScore
// ---------------------------------------------------------------------------

describe('computeAScore', () => {
  it('low K% produces a higher A-score than high K% (K% inversion)', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    // Elite: kPct 0.10, Low: kPct 0.30
    const disciplined = computeAScore(cohort[4], table);
    const freeSwinger = computeAScore(cohort[0], table);

    expect(disciplined).toBeGreaterThan(freeSwinger);
  });

  it('returns a value between 0 and 100', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);
    const score = computeAScore(cohort[2], table);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// computeVScore
// ---------------------------------------------------------------------------

describe('computeVScore', () => {
  it('power hitter with high ISO, SLG, HR% scores high', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    const power = computeVScore(cohort[4], table); // ISO 0.240, SLG 0.580, HR% 0.065
    expect(power).toBeGreaterThan(75);
  });

  it('contact hitter with low power metrics scores low', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    const slap = computeVScore(cohort[0], table); // ISO 0.100, SLG 0.300, HR% 0.010
    expect(slap).toBeLessThan(25);
  });

  it('returns a value between 0 and 100', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);
    for (const p of cohort) {
      const score = computeVScore(p, table);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// computeFScore
// ---------------------------------------------------------------------------

describe('computeFScore', () => {
  it('returns 50 (neutral) when fielding data is null', () => {
    const player = makePlayer({ fieldingPct: null, rangeFactor: null });
    const table = buildPercentileTable(makeCohort());
    const score = computeFScore(player, table);
    expect(score).toBe(50);
  });

  it('good fielder scores higher than poor fielder', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    const gold = computeFScore(cohort[4], table); // 0.995 fpct, 5.8 rf
    const error = computeFScore(cohort[0], table); // 0.940 fpct, 3.0 rf

    expect(gold).toBeGreaterThan(error);
  });

  it('handles partial fielding data (only fieldingPct, no rangeFactor)', () => {
    const player = makePlayer({ fieldingPct: 0.980, rangeFactor: null });
    const table = buildPercentileTable(makeCohort());
    const score = computeFScore(player, table);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles partial fielding data (only rangeFactor, no fieldingPct)', () => {
    const player = makePlayer({ fieldingPct: null, rangeFactor: 5.0 });
    const table = buildPercentileTable(makeCohort());
    const score = computeFScore(player, table);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// computeHAVF
// ---------------------------------------------------------------------------

describe('computeHAVF', () => {
  it('composite equals the weighted sum of components (H*0.30 + A*0.25 + V*0.25 + F*0.20)', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);
    const result = computeHAVF(cohort[3], table);

    const expected =
      HAVF_WEIGHTS.H * result.h_score +
      HAVF_WEIGHTS.A * result.a_score +
      HAVF_WEIGHTS.V * result.v_score +
      HAVF_WEIGHTS.F * result.f_score;

    // round2 precision
    expect(result.havf_composite).toBeCloseTo(expected, 1);
  });

  it('returns all required fields in the result', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);
    const result = computeHAVF(cohort[0], table);

    expect(result.playerID).toBe('p-low');
    expect(result.name).toBe('Low Performer');
    expect(result.team).toBe('Test U');
    expect(result.league).toBe('Big 12');
    expect(result.season).toBe(2026);
    expect(result.h_score).toBeDefined();
    expect(result.a_score).toBeDefined();
    expect(result.v_score).toBeDefined();
    expect(result.f_score).toBeDefined();
    expect(result.havf_composite).toBeDefined();
    expect(result.breakdown).toBeDefined();
    expect(result.meta.source).toBe('bsi-havf');
    expect(result.meta.timezone).toBe('America/Chicago');
    expect(result.meta.computed_at).toBeTruthy();
  });

  it('breakdown contains percentile values for each sub-stat', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);
    const result = computeHAVF(cohort[2], table);

    // H breakdown
    expect(result.breakdown.h.avg).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.h.obp).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.h.slg).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.h.woba).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.h.iso).toBeGreaterThanOrEqual(0);

    // A breakdown — kPctInv should be inverted
    expect(result.breakdown.a.kPctInv).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.a.kPctInv).toBeLessThanOrEqual(100);

    // V breakdown
    expect(result.breakdown.v.iso).toBeGreaterThanOrEqual(0);

    // F breakdown — non-null inputs should have values
    expect(result.breakdown.f.fieldingPct).not.toBeNull();
    expect(result.breakdown.f.rangeFactor).not.toBeNull();
  });

  it('composite stays between 0 and 100', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    for (const p of cohort) {
      const result = computeHAVF(p, table);
      expect(result.havf_composite).toBeGreaterThanOrEqual(0);
      expect(result.havf_composite).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// buildPercentileTable
// ---------------------------------------------------------------------------

describe('buildPercentileTable', () => {
  it('produces sorted arrays for each stat', () => {
    const cohort = makeCohort();
    const table = buildPercentileTable(cohort);

    const expectedStats = [
      'avg', 'obp', 'slg', 'woba', 'iso',
      'bbPct', 'kPct', 'babip', 'hrPct',
      'fieldingPct', 'rangeFactor',
    ];

    for (const stat of expectedStats) {
      expect(table[stat]).toBeDefined();
      expect(table[stat].length).toBeGreaterThan(0);

      // Verify sorted ascending
      for (let i = 1; i < table[stat].length; i++) {
        expect(table[stat][i]).toBeGreaterThanOrEqual(table[stat][i - 1]);
      }
    }
  });

  it('excludes null fielding values from fielding distributions', () => {
    const cohort = [
      makePlayer({ playerID: 'p-1', fieldingPct: 0.970, rangeFactor: null }),
      makePlayer({ playerID: 'p-2', fieldingPct: null, rangeFactor: null }),
      makePlayer({ playerID: 'p-3', fieldingPct: 0.990, rangeFactor: 5.0 }),
    ];
    const table = buildPercentileTable(cohort);

    // fieldingPct: two non-null values
    expect(table['fieldingPct'].length).toBe(2);
    // rangeFactor: one non-null value
    expect(table['rangeFactor'].length).toBe(1);
  });

  it('handles empty player array', () => {
    const table = buildPercentileTable([]);
    expect(table['avg']).toBeDefined();
    expect(table['avg'].length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// batchComputeHAVF
// ---------------------------------------------------------------------------

describe('batchComputeHAVF', () => {
  it('returns array of same length as input', () => {
    const cohort = makeCohort();
    const results = batchComputeHAVF(cohort);
    expect(results.length).toBe(cohort.length);
  });

  it('all composites are between 0 and 100', () => {
    const cohort = makeCohort();
    const results = batchComputeHAVF(cohort);

    for (const r of results) {
      expect(r.havf_composite).toBeGreaterThanOrEqual(0);
      expect(r.havf_composite).toBeLessThanOrEqual(100);
    }
  });

  it('preserves player identity through the batch', () => {
    const cohort = makeCohort();
    const results = batchComputeHAVF(cohort);

    for (let i = 0; i < cohort.length; i++) {
      expect(results[i].playerID).toBe(cohort[i].playerID);
      expect(results[i].name).toBe(cohort[i].name);
    }
  });

  it('returns empty array for empty input', () => {
    const results = batchComputeHAVF([]);
    expect(results).toEqual([]);
  });

  it('ranks elite player above low performer in composite', () => {
    const cohort = makeCohort();
    const results = batchComputeHAVF(cohort);

    const elite = results.find(r => r.playerID === 'p-elite')!;
    const low = results.find(r => r.playerID === 'p-low')!;

    expect(elite.havf_composite).toBeGreaterThan(low.havf_composite);
  });
});

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('edge case: single player batch', () => {
  it('returns approximately 50 for all components when only one player exists', () => {
    const solo = [makePlayer({ playerID: 'p-solo' })];
    const results = batchComputeHAVF(solo);

    expect(results.length).toBe(1);
    const r = results[0];

    // With a single player, every stat is at the 50th percentile of a
    // one-element distribution (midpoint of the tie range).
    expect(r.h_score).toBe(50);
    expect(r.a_score).toBe(50);
    expect(r.v_score).toBe(50);
    expect(r.f_score).toBe(50);
    expect(r.havf_composite).toBeCloseTo(50, 0);
  });
});

describe('edge case: all zeroes', () => {
  it('does not throw for a player with all-zero stats', () => {
    const zero = makePlayer({
      playerID: 'p-zero',
      avg: 0,
      obp: 0,
      slg: 0,
      woba: 0,
      iso: 0,
      bbPct: 0,
      kPct: 0,
      babip: 0,
      hrPct: 0,
      fieldingPct: 0,
      rangeFactor: 0,
    });
    const cohort = [...makeCohort(), zero];

    expect(() => batchComputeHAVF(cohort)).not.toThrow();

    const results = batchComputeHAVF(cohort);
    const zeroResult = results.find(r => r.playerID === 'p-zero')!;

    expect(zeroResult.havf_composite).toBeGreaterThanOrEqual(0);
    expect(zeroResult.havf_composite).toBeLessThanOrEqual(100);
  });

  it('all-zero player scores lowest in the cohort', () => {
    const zero = makePlayer({
      playerID: 'p-zero',
      avg: 0,
      obp: 0,
      slg: 0,
      woba: 0,
      iso: 0,
      bbPct: 0,
      kPct: 0,
      babip: 0,
      hrPct: 0,
      fieldingPct: 0,
      rangeFactor: 0,
    });
    const cohort = [...makeCohort(), zero];
    const results = batchComputeHAVF(cohort);

    const zeroComposite = results.find(r => r.playerID === 'p-zero')!.havf_composite;
    const otherComposites = results
      .filter(r => r.playerID !== 'p-zero')
      .map(r => r.havf_composite);

    for (const other of otherComposites) {
      expect(zeroComposite).toBeLessThan(other);
    }
  });
});
