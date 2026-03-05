/**
 * MMI (Momentum Magnitude Index) — Test Suite
 *
 * Tests the in-game momentum computation engine for baseball.
 * Signed output: -100 (away dominant) to +100 (home dominant).
 * Pure math — no network, no storage.
 *
 * All functions imported from @/lib/analytics/mmi.
 */

import { describe, it, expect } from 'vitest';
import {
  computeMMI,
  computeSD,
  computeRS,
  computeGP,
  computeBS,
  classifyMagnitude,
  classifyDirection,
  computeGameSummary,
  clamp,
  MAGNITUDE_THRESHOLDS,
  type MMIInput,
  type MMISnapshot,
} from '@/lib/analytics/mmi';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Build a valid MMIInput with neutral defaults. Override any field. */
function makeInput(overrides: Partial<MMIInput> = {}): MMIInput {
  return {
    gameId: overrides.gameId ?? 'game-001',
    inning: overrides.inning ?? 5,
    inningHalf: overrides.inningHalf ?? 'top',
    outs: overrides.outs ?? 1,
    homeScore: overrides.homeScore ?? 0,
    awayScore: overrides.awayScore ?? 0,
    runnersOn: overrides.runnersOn ?? [false, false, false],
    recentInnings: overrides.recentInnings ?? [],
    totalInnings: overrides.totalInnings ?? 9,
  };
}

/** Build a snapshot with the given value and direction for game summary tests. */
function makeSnapshot(value: number, overrides: Partial<MMISnapshot> = {}): MMISnapshot {
  return {
    value,
    direction: overrides.direction ?? classifyDirection(value),
    magnitude: overrides.magnitude ?? classifyMagnitude(value),
    components: overrides.components ?? { sd: 0, rs: 0, gp: 1, bs: 0 },
    meta: overrides.meta ?? { source: 'bsi-mmi', computed_at: new Date().toISOString(), timezone: 'America/Chicago' },
  };
}

// ---------------------------------------------------------------------------
// Scenario: 0-0 game, 1st inning, no runners
// ---------------------------------------------------------------------------

describe('scenario: neutral game state', () => {
  it('0-0 in the 1st with no runners produces near-zero MMI', () => {
    const input = makeInput({
      inning: 1,
      homeScore: 0,
      awayScore: 0,
      runnersOn: [false, false, false],
      recentInnings: [],
    });
    const snap = computeMMI(input);

    expect(snap.value).toBeCloseTo(0, 0);
    expect(snap.direction).toBe('neutral');
  });
});

// ---------------------------------------------------------------------------
// Scenario: Blowout
// ---------------------------------------------------------------------------

describe('scenario: blowout', () => {
  it('home up 8-0 in the 7th produces high positive MMI', () => {
    const input = makeInput({
      inning: 7,
      inningHalf: 'bottom',
      homeScore: 8,
      awayScore: 0,
      runnersOn: [false, false, false],
      recentInnings: [
        { inning: 5, homeRuns: 3, awayRuns: 0 },
        { inning: 6, homeRuns: 2, awayRuns: 0 },
      ],
    });
    const snap = computeMMI(input);

    expect(snap.value).toBeGreaterThan(0);
    expect(snap.direction).toBe('home');
    expect(['high', 'extreme']).toContain(snap.magnitude);
  });
});

// ---------------------------------------------------------------------------
// Scenario: Close game, late
// ---------------------------------------------------------------------------

describe('scenario: close game in late innings', () => {
  it('home up 2-1 in bottom of 8th with RISP produces positive home-direction MMI', () => {
    const input = makeInput({
      inning: 8,
      inningHalf: 'bottom',
      homeScore: 2,
      awayScore: 1,
      runnersOn: [false, true, false], // runner on second (RISP)
      recentInnings: [
        { inning: 6, homeRuns: 1, awayRuns: 0 },
        { inning: 7, homeRuns: 0, awayRuns: 0 },
      ],
    });
    const snap = computeMMI(input);

    // Math: SD = 1-run lead, 1 inning left -> ~11. RS = net +1 -> ~16.7.
    // BS = RISP bottom = +10. GP = 1.3. Weighted ~ 14.2.
    // Positive, home direction. Magnitude is low because a 1-run lead
    // with modest recent scoring stays under the 25-point threshold.
    expect(snap.value).toBeGreaterThan(0);
    expect(snap.direction).toBe('home');
    expect(snap.components.gp).toBe(1.3);
    expect(snap.components.bs).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Scenario: Away team dominant
// ---------------------------------------------------------------------------

describe('scenario: away team dominant', () => {
  it('away up 5-0 in the 3rd produces negative MMI', () => {
    const input = makeInput({
      inning: 3,
      inningHalf: 'top',
      homeScore: 0,
      awayScore: 5,
      runnersOn: [false, false, false],
      recentInnings: [
        { inning: 1, homeRuns: 0, awayRuns: 3 },
        { inning: 2, homeRuns: 0, awayRuns: 2 },
      ],
    });
    const snap = computeMMI(input);

    expect(snap.value).toBeLessThan(0);
    expect(snap.direction).toBe('away');
  });
});

// ---------------------------------------------------------------------------
// Scenario: Extras amplification
// ---------------------------------------------------------------------------

describe('scenario: extras amplification', () => {
  it('tied 3-3 in 11th with bases loaded amplifies via GP=1.5', () => {
    const input = makeInput({
      inning: 11,
      inningHalf: 'bottom',
      homeScore: 3,
      awayScore: 3,
      runnersOn: [true, true, true], // bases loaded
      recentInnings: [
        { inning: 9, homeRuns: 2, awayRuns: 0 },
        { inning: 10, homeRuns: 1, awayRuns: 0 },
      ],
    });
    const snap = computeMMI(input);

    // GP should be 1.5 for extras (inning > totalInnings)
    expect(snap.components.gp).toBe(1.5);

    // Bases loaded in bottom half = positive BS (+15)
    expect(snap.components.bs).toBe(15);

    // RS from recent innings: net = (2-0)+(1-0) = 3 -> (3/6)*100 = 50
    expect(snap.components.rs).toBeGreaterThan(0);

    // SD is 0 (tied), but RS + BS amplified by GP 1.5 pushes positive
    // Weighted: (0*0.40 + 50*0.30 + 15*0.15) * 1.5 = (15 + 2.25)*1.5 = 25.875
    expect(snap.value).toBeGreaterThan(0);
    expect(snap.direction).toBe('home');
  });
});

// ---------------------------------------------------------------------------
// computeSD
// ---------------------------------------------------------------------------

describe('computeSD', () => {
  it('10-run differential hits the cap and returns 100 or -100', () => {
    // Home up 10, 0 innings remaining
    const result = computeSD(10, 0, 0, 9);
    expect(result).toBe(100);

    // Away up 10, 0 innings remaining
    const resultAway = computeSD(0, 10, 0, 9);
    expect(resultAway).toBe(-100);
  });

  it('0 run differential returns 0', () => {
    expect(computeSD(3, 3, 4, 9)).toBe(0);
  });

  it('leverage multiplier increases with more innings remaining', () => {
    // Same 2-run lead, different innings remaining
    const earlyGame = computeSD(2, 0, 7, 9); // 7 innings left
    const lateGame = computeSD(2, 0, 1, 9);  // 1 inning left

    // Early game has higher leverage multiplier so the raw value is larger,
    // but both are positive. The early game amplification makes the differential
    // feel bigger because there's more time for it to hold.
    expect(earlyGame).toBeGreaterThan(lateGame);
  });

  it('negative differential (away leading) produces negative SD', () => {
    const result = computeSD(1, 4, 3, 9);
    expect(result).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeRS
// ---------------------------------------------------------------------------

describe('computeRS', () => {
  it('returns 0 when no recent innings are provided', () => {
    expect(computeRS([])).toBe(0);
  });

  it('home scoring 3 runs in last 2 innings returns positive value', () => {
    const recent = [
      { inning: 4, homeRuns: 2, awayRuns: 0 },
      { inning: 5, homeRuns: 1, awayRuns: 0 },
    ];
    const result = computeRS(recent);
    expect(result).toBeGreaterThan(0);
  });

  it('away scoring dominance returns negative value', () => {
    const recent = [
      { inning: 4, homeRuns: 0, awayRuns: 3 },
      { inning: 5, homeRuns: 0, awayRuns: 2 },
    ];
    const result = computeRS(recent);
    expect(result).toBeLessThan(0);
  });

  it('caps at ±100 even with extreme scoring', () => {
    const recent = [
      { inning: 4, homeRuns: 10, awayRuns: 0 },
      { inning: 5, homeRuns: 10, awayRuns: 0 },
    ];
    const result = computeRS(recent);
    expect(result).toBe(100);
  });

  it('only considers the last 2 innings when more are provided', () => {
    const recent = [
      { inning: 3, homeRuns: 5, awayRuns: 0 }, // should be ignored
      { inning: 4, homeRuns: 0, awayRuns: 1 },
      { inning: 5, homeRuns: 0, awayRuns: 1 },
    ];
    const result = computeRS(recent);
    // Net from last 2: (0-1) + (0-1) = -2, scaled: -2/6 * 100 = -33.3...
    expect(result).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeGP
// ---------------------------------------------------------------------------

describe('computeGP', () => {
  it('returns 0.7 for innings 1-3 in a 9-inning game', () => {
    expect(computeGP(1, 9)).toBe(0.7);
    expect(computeGP(2, 9)).toBe(0.7);
    expect(computeGP(3, 9)).toBe(0.7);
  });

  it('returns 1.0 for innings 4-6 in a 9-inning game', () => {
    expect(computeGP(4, 9)).toBe(1.0);
    expect(computeGP(5, 9)).toBe(1.0);
    expect(computeGP(6, 9)).toBe(1.0);
  });

  it('returns 1.3 for innings 7-9 in a 9-inning game', () => {
    expect(computeGP(7, 9)).toBe(1.3);
    expect(computeGP(8, 9)).toBe(1.3);
    expect(computeGP(9, 9)).toBe(1.3);
  });

  it('returns 1.5 for extra innings', () => {
    expect(computeGP(10, 9)).toBe(1.5);
    expect(computeGP(11, 9)).toBe(1.5);
    expect(computeGP(15, 9)).toBe(1.5);
  });

  it('scales correctly for 7-inning doubleheader games', () => {
    // earlyEnd = ceil(7/3) = 3, midEnd = ceil(14/3) = 5
    expect(computeGP(1, 7)).toBe(0.7);
    expect(computeGP(3, 7)).toBe(0.7);
    expect(computeGP(4, 7)).toBe(1.0);
    expect(computeGP(5, 7)).toBe(1.0);
    expect(computeGP(6, 7)).toBe(1.3);
    expect(computeGP(7, 7)).toBe(1.3);
    expect(computeGP(8, 7)).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// computeBS
// ---------------------------------------------------------------------------

describe('computeBS', () => {
  it('bases loaded in bottom half returns +15', () => {
    expect(computeBS([true, true, true], 'bottom')).toBe(15);
  });

  it('bases loaded in top half returns -15', () => {
    expect(computeBS([true, true, true], 'top')).toBe(-15);
  });

  it('empty bases returns 0 regardless of half', () => {
    // Top half with magnitude 0 produces -0 in JavaScript (unary negation of 0).
    // Both -0 and +0 are semantically zero for MMI purposes.
    const topResult = computeBS([false, false, false], 'top');
    const bottomResult = computeBS([false, false, false], 'bottom');
    expect(topResult + 0).toBe(0); // -0 + 0 === 0
    expect(bottomResult).toBe(0);
    expect(Math.abs(topResult)).toBe(0);
    expect(Math.abs(bottomResult)).toBe(0);
  });

  it('RISP (runner on second) returns ±10', () => {
    expect(computeBS([false, true, false], 'bottom')).toBe(10);
    expect(computeBS([false, true, false], 'top')).toBe(-10);
  });

  it('RISP (runner on third) returns ±10', () => {
    expect(computeBS([false, false, true], 'bottom')).toBe(10);
    expect(computeBS([false, false, true], 'top')).toBe(-10);
  });

  it('runner on first only returns ±3', () => {
    expect(computeBS([true, false, false], 'bottom')).toBe(3);
    expect(computeBS([true, false, false], 'top')).toBe(-3);
  });

  it('first and second (RISP via second) returns ±10', () => {
    expect(computeBS([true, true, false], 'bottom')).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// classifyMagnitude
// ---------------------------------------------------------------------------

describe('classifyMagnitude', () => {
  it('absolute value 0 classifies as low', () => {
    expect(classifyMagnitude(0)).toBe('low');
  });

  it('absolute value 24 classifies as low', () => {
    expect(classifyMagnitude(24)).toBe('low');
    expect(classifyMagnitude(-24)).toBe('low');
  });

  it('absolute value 30 classifies as medium', () => {
    expect(classifyMagnitude(30)).toBe('medium');
    expect(classifyMagnitude(-30)).toBe('medium');
  });

  it('absolute value 60 classifies as high', () => {
    expect(classifyMagnitude(60)).toBe('high');
    expect(classifyMagnitude(-60)).toBe('high');
  });

  it('absolute value 80 classifies as extreme', () => {
    expect(classifyMagnitude(80)).toBe('extreme');
    expect(classifyMagnitude(-80)).toBe('extreme');
  });

  it('threshold boundaries: 25=medium, 50=high, 75=extreme', () => {
    expect(classifyMagnitude(MAGNITUDE_THRESHOLDS.low)).toBe('medium');
    expect(classifyMagnitude(MAGNITUDE_THRESHOLDS.medium)).toBe('high');
    expect(classifyMagnitude(MAGNITUDE_THRESHOLDS.high)).toBe('extreme');
  });
});

// ---------------------------------------------------------------------------
// classifyDirection
// ---------------------------------------------------------------------------

describe('classifyDirection', () => {
  it('value < 5 absolute classifies as neutral', () => {
    expect(classifyDirection(3)).toBe('neutral');
    expect(classifyDirection(-3)).toBe('neutral');
    expect(classifyDirection(0)).toBe('neutral');
    expect(classifyDirection(4.9)).toBe('neutral');
  });

  it('value >= 5 classifies as home', () => {
    expect(classifyDirection(10)).toBe('home');
    expect(classifyDirection(5)).toBe('home');
    expect(classifyDirection(100)).toBe('home');
  });

  it('value <= -5 classifies as away', () => {
    expect(classifyDirection(-10)).toBe('away');
    expect(classifyDirection(-5)).toBe('away');
    expect(classifyDirection(-100)).toBe('away');
  });
});

// ---------------------------------------------------------------------------
// computeGameSummary
// ---------------------------------------------------------------------------

describe('computeGameSummary', () => {
  it('empty snapshots returns zeroed summary', () => {
    const summary = computeGameSummary('game-empty', []);

    expect(summary.gameId).toBe('game-empty');
    expect(summary.maxMmi).toBe(0);
    expect(summary.minMmi).toBe(0);
    expect(summary.avgMmi).toBe(0);
    expect(summary.volatility).toBe(0);
    expect(summary.leadChanges).toBe(0);
    expect(summary.maxSwing).toBe(0);
    expect(summary.swingInning).toBeNull();
    expect(summary.excitementRating).toBe('routine');
  });

  it('multi-snapshot game computes correct maxSwing', () => {
    const snapshots: MMISnapshot[] = [
      makeSnapshot(10),   // home momentum
      makeSnapshot(-20),  // swing of 30 toward away
      makeSnapshot(15),   // swing of 35 back toward home
      makeSnapshot(5),    // settling down
    ];
    const summary = computeGameSummary('game-swing', snapshots);

    // Max swing: from -20 to 15 = 35
    expect(summary.maxSwing).toBe(35);
    expect(summary.swingInning).toBe(3); // index 2, 1-indexed = 3
  });

  it('counts lead changes correctly', () => {
    const snapshots: MMISnapshot[] = [
      makeSnapshot(20),   // home
      makeSnapshot(10),   // still home
      makeSnapshot(-15),  // away — lead change 1
      makeSnapshot(-30),  // still away
      makeSnapshot(25),   // home — lead change 2
      makeSnapshot(3),    // neutral — ignored for lead change counting
      makeSnapshot(-10),  // away — lead change 3
    ];
    const summary = computeGameSummary('game-lc', snapshots);

    expect(summary.leadChanges).toBe(3);
  });

  it('computes correct max and min MMI', () => {
    const snapshots: MMISnapshot[] = [
      makeSnapshot(-40),
      makeSnapshot(60),
      makeSnapshot(20),
      makeSnapshot(-10),
    ];
    const summary = computeGameSummary('game-range', snapshots);

    expect(summary.maxMmi).toBe(60);
    expect(summary.minMmi).toBe(-40);
  });

  it('computes average MMI', () => {
    const snapshots: MMISnapshot[] = [
      makeSnapshot(10),
      makeSnapshot(20),
      makeSnapshot(30),
      makeSnapshot(40),
    ];
    const summary = computeGameSummary('game-avg', snapshots);

    expect(summary.avgMmi).toBe(25);
  });

  it('single snapshot has zero volatility and zero swing', () => {
    const snapshots: MMISnapshot[] = [makeSnapshot(15)];
    const summary = computeGameSummary('game-one', snapshots);

    expect(summary.volatility).toBe(0);
    expect(summary.maxSwing).toBe(0);
    expect(summary.swingInning).toBeNull();
    expect(summary.leadChanges).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// MMI clamping
// ---------------------------------------------------------------------------

describe('MMI clamped to [-100, 100]', () => {
  it('extreme home-favoring inputs do not exceed +100', () => {
    const input = makeInput({
      inning: 12, // extras, GP=1.5
      inningHalf: 'bottom',
      homeScore: 20,
      awayScore: 0,
      runnersOn: [true, true, true], // bases loaded = +15
      recentInnings: [
        { inning: 10, homeRuns: 10, awayRuns: 0 },
        { inning: 11, homeRuns: 10, awayRuns: 0 },
      ],
    });
    const snap = computeMMI(input);

    expect(snap.value).toBeLessThanOrEqual(100);
    expect(snap.value).toBe(100);
  });

  it('extreme away-favoring inputs do not go below -100', () => {
    const input = makeInput({
      inning: 12,
      inningHalf: 'top',
      homeScore: 0,
      awayScore: 20,
      runnersOn: [true, true, true],
      recentInnings: [
        { inning: 10, homeRuns: 0, awayRuns: 10 },
        { inning: 11, homeRuns: 0, awayRuns: 10 },
      ],
    });
    const snap = computeMMI(input);

    expect(snap.value).toBeGreaterThanOrEqual(-100);
    expect(snap.value).toBe(-100);
  });

  it('clamp utility enforces bounds', () => {
    expect(clamp(-100, 100, 150)).toBe(100);
    expect(clamp(-100, 100, -200)).toBe(-100);
    expect(clamp(-100, 100, 50)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// Integration: full computeMMI output structure
// ---------------------------------------------------------------------------

describe('computeMMI output structure', () => {
  it('returns all required fields with correct types', () => {
    const input = makeInput({ inning: 5, homeScore: 3, awayScore: 2 });
    const snap = computeMMI(input);

    expect(typeof snap.value).toBe('number');
    expect(['home', 'away', 'neutral']).toContain(snap.direction);
    expect(['low', 'medium', 'high', 'extreme']).toContain(snap.magnitude);

    expect(typeof snap.components.sd).toBe('number');
    expect(typeof snap.components.rs).toBe('number');
    expect(typeof snap.components.gp).toBe('number');
    expect(typeof snap.components.bs).toBe('number');

    expect(snap.meta.source).toBe('bsi-mmi');
    expect(snap.meta.timezone).toBe('America/Chicago');
    expect(snap.meta.computed_at).toBeTruthy();
  });

  it('defaults to 9 total innings when not specified', () => {
    const input = makeInput({ totalInnings: undefined, inning: 10 });
    const snap = computeMMI(input);

    // Inning 10 in a 9-inning game = extras = GP 1.5
    expect(snap.components.gp).toBe(1.5);
  });
});
