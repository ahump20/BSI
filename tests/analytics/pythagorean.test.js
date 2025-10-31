/**
 * Pythagorean Expectation Test Suite
 * Tests for baseball/football win expectation calculations
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';

describe('Pythagorean Expectation - Baseball', () => {
  const calculatePythagoreanExpectation = (runsScored, runsAllowed, exponent = 1.83) => {
    if (runsScored === 0 && runsAllowed === 0) return 0.500;
    return Math.pow(runsScored, exponent) /
           (Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent));
  };

  it('should calculate expected win percentage for dominant offense', () => {
    const runsScored = 750;
    const runsAllowed = 500;
    const expected = calculatePythagoreanExpectation(runsScored, runsAllowed);

    expect(expected).toBeGreaterThan(0.5);
    expect(expected).toBeCloseTo(0.692, 3);
  });

  it('should calculate expected win percentage for even teams', () => {
    const runsScored = 600;
    const runsAllowed = 600;
    const expected = calculatePythagoreanExpectation(runsScored, runsAllowed);

    expect(expected).toBeCloseTo(0.5, 2);
  });

  it('should handle edge case of zero runs', () => {
    const expected = calculatePythagoreanExpectation(0, 0);
    expect(expected).toBe(0.500);
  });

  it('should calculate expected wins for 162-game season', () => {
    const runsScored = 750;
    const runsAllowed = 600;
    const games = 162;
    const winPct = calculatePythagoreanExpectation(runsScored, runsAllowed);
    const expectedWins = Math.round(winPct * games);

    expect(expectedWins).toBeGreaterThan(81);
    expect(expectedWins).toBeLessThanOrEqual(162);
  });
});

describe('Pythagorean Expectation - Football', () => {
  const calculatePythagoreanExpectation = (pointsScored, pointsAllowed, exponent = 2.37) => {
    if (pointsScored === 0 && pointsAllowed === 0) return 0.500;
    return Math.pow(pointsScored, exponent) /
           (Math.pow(pointsScored, exponent) + Math.pow(pointsAllowed, exponent));
  };

  it('should calculate expected win percentage for strong defense', () => {
    const pointsScored = 350;
    const pointsAllowed = 200;
    const expected = calculatePythagoreanExpectation(pointsScored, pointsAllowed);

    expect(expected).toBeGreaterThan(0.7);
    expect(expected).toBeCloseTo(0.851, 3);
  });

  it('should calculate expected wins for 12-game season', () => {
    const pointsScored = 420;
    const pointsAllowed = 280;
    const games = 12;
    const winPct = calculatePythagoreanExpectation(pointsScored, pointsAllowed);
    const expectedWins = Math.round(winPct * games);

    expect(expectedWins).toBeGreaterThan(6);
    expect(expectedWins).toBeLessThanOrEqual(12);
  });
});

describe('Luck Factor Calculation', () => {
  it('should identify teams exceeding expectations', () => {
    const actualWins = 95;
    const expectedWins = 88;
    const luckFactor = actualWins - expectedWins;

    expect(luckFactor).toBeGreaterThan(0);
    expect(luckFactor).toBe(7);
  });

  it('should identify teams underperforming', () => {
    const actualWins = 82;
    const expectedWins = 90;
    const luckFactor = actualWins - expectedWins;

    expect(luckFactor).toBeLessThan(0);
    expect(luckFactor).toBe(-8);
  });
});

describe('Regression Analysis', () => {
  it('should predict regression to the mean for lucky teams', () => {
    const currentWins = 95;
    const expectedWins = 88;
    const gamesRemaining = 20;

    // Lucky teams tend to regress
    const projectedWinRate = expectedWins / (162 - gamesRemaining);
    const projectedAdditionalWins = Math.round(projectedWinRate * gamesRemaining);

    expect(projectedAdditionalWins).toBeLessThan(gamesRemaining);
  });
});
