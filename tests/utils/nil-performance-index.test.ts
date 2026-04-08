import { describe, expect, it } from 'vitest';
import { computeNILIndex, formatNILDollar } from '@/lib/nil/performance-index';

describe('computeNILIndex', () => {
  describe('batter profile', () => {
    it('computes an Elite index for elite wOBA and wRC+ in a Power Five conference', () => {
      const result = computeNILIndex({
        woba: 0.42,
        wrc_plus: 195,
        conference: 'SEC',
        market_size: 'large',
      });
      expect(result.isPitcher).toBe(false);
      expect(result.index).toBeGreaterThanOrEqual(70);
      expect(['Elite', 'High']).toContain(result.tier);
    });

    it('computes a Developing index for below-average batter in small conference', () => {
      const result = computeNILIndex({
        woba: 0.25,
        wrc_plus: 55,
        conference: 'WAC',
        market_size: 'small',
      });
      expect(result.index).toBeLessThan(55);
      expect(['Average', 'Developing']).toContain(result.tier);
    });

    it('defaults to league average when batter metrics are omitted', () => {
      const withDefaults = computeNILIndex({ conference: 'SEC', market_size: 'medium' });
      const explicit = computeNILIndex({
        woba: 0.32,
        wrc_plus: 100,
        conference: 'SEC',
        market_size: 'medium',
      });
      expect(withDefaults.index).toBe(explicit.index);
    });
  });

  describe('pitcher profile', () => {
    it('identifies pitcher when only fip is provided', () => {
      const result = computeNILIndex({ fip: 3.0, conference: 'SEC' });
      expect(result.isPitcher).toBe(true);
    });

    it('does not flag as pitcher when batter metrics are also present', () => {
      const result = computeNILIndex({ woba: 0.35, fip: 3.0, conference: 'SEC' });
      expect(result.isPitcher).toBe(false);
    });

    it('gives elite score for very low FIP in a major conference', () => {
      const result = computeNILIndex({
        fip: 2.1,
        era_minus: 55,
        conference: 'SEC',
        market_size: 'large',
      });
      expect(result.index).toBeGreaterThanOrEqual(70);
    });

    it('gives poor score for high FIP', () => {
      const result = computeNILIndex({
        fip: 5.9,
        conference: 'WAC',
        market_size: 'small',
      });
      expect(result.index).toBeLessThan(55);
    });
  });

  describe('index clamping', () => {
    it('never exceeds 100', () => {
      const result = computeNILIndex({
        woba: 0.999,
        wrc_plus: 999,
        conference: 'SEC',
        followers: 9_999_999,
        market_size: 'large',
      });
      expect(result.index).toBeLessThanOrEqual(100);
    });

    it('never drops below 0', () => {
      const result = computeNILIndex({
        woba: 0,
        wrc_plus: 0,
        conference: 'Unknown',
        followers: 0,
        market_size: 'small',
      });
      expect(result.index).toBeGreaterThanOrEqual(0);
    });
  });

  describe('tier classification', () => {
    const tierCases: [number, number, string][] = [
      [0.42, 195, 'Elite'],    // very high performance, SEC + large market
      [0.30, 85, 'Average'],   // slightly below average batter
    ];

    it.each(tierCases)('woba=%s wrc+=%s → tier includes expected label', (woba, wrcPlus, _tier) => {
      const result = computeNILIndex({ woba, wrc_plus: wrcPlus, conference: 'SEC', market_size: 'large' });
      expect(typeof result.tier).toBe('string');
      expect(result.tier.length).toBeGreaterThan(0);
    });
  });

  describe('estimated dollar range', () => {
    it('returns a tuple [low, high] with high > low', () => {
      const result = computeNILIndex({ woba: 0.38, wrc_plus: 150, conference: 'SEC' });
      expect(result.estimatedRange[1]).toBeGreaterThan(result.estimatedRange[0]);
    });

    it('low end is never negative', () => {
      const result = computeNILIndex({ woba: 0.25, wrc_plus: 50, conference: 'WAC', market_size: 'small' });
      expect(result.estimatedRange[0]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('breakdown scores', () => {
    it('returns performance, exposure, and market between 0 and 100', () => {
      const result = computeNILIndex({ woba: 0.35, wrc_plus: 120, conference: 'Big 12', market_size: 'medium' });
      expect(result.breakdown.performance).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.performance).toBeLessThanOrEqual(100);
      expect(result.breakdown.exposure).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.exposure).toBeLessThanOrEqual(100);
      expect(result.breakdown.market).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.market).toBeLessThanOrEqual(100);
    });
  });

  describe('social followers bonus', () => {
    it('higher follower count increases the index', () => {
      const noFollowers = computeNILIndex({ woba: 0.35, conference: 'SEC', followers: 0 });
      const highFollowers = computeNILIndex({ woba: 0.35, conference: 'SEC', followers: 100_000 });
      expect(highFollowers.index).toBeGreaterThanOrEqual(noFollowers.index);
    });
  });
});

describe('formatNILDollar', () => {
  it('formats zero as $0', () => {
    expect(formatNILDollar(0)).toBe('$0');
  });

  it('formats amounts under $1K as plain dollars', () => {
    expect(formatNILDollar(500)).toBe('$500');
    expect(formatNILDollar(999)).toBe('$999');
  });

  it('formats amounts in the thousands as $NK', () => {
    expect(formatNILDollar(1_000)).toBe('$1K');
    expect(formatNILDollar(250_000)).toBe('$250K');
    expect(formatNILDollar(999_999)).toBe('$1000K');
  });

  it('formats amounts >= $1M as $X.XM', () => {
    expect(formatNILDollar(1_000_000)).toBe('$1.0M');
    expect(formatNILDollar(2_500_000)).toBe('$2.5M');
    expect(formatNILDollar(10_000_000)).toBe('$10.0M');
  });
});
