import { describe, it, expect } from 'vitest';
import { computeBatterHAVF, computePitcherHAVF, rankHAVFScores } from '../../lib/analytics/havf';
import type { BattingAdvanced, PitchingAdvanced } from '../../lib/analytics/sabermetrics';

describe('HAV-F Computation Engine', () => {
  const avgBatter: BattingAdvanced = {
    playerID: 'test-batter-avg',
    name: 'Average Joe',
    pos: 'SS',
    pa: 200,
    ab: 180,
    avg: 0.280,
    obp: 0.350,
    slg: 0.410,
    ops: 0.760,
    iso: 0.130,
    babip: 0.310,
    woba: 0.340,
    bbPct: 10.0,
    kPct: 20.0,
    hrPct: 3.0,
  };

  const eliteBatter: BattingAdvanced = {
    playerID: 'test-batter-elite',
    name: 'Elite Hitter',
    pos: '1B',
    pa: 250,
    ab: 220,
    avg: 0.340,
    obp: 0.430,
    slg: 0.600,
    ops: 1.030,
    iso: 0.260,
    babip: 0.380,
    woba: 0.430,
    bbPct: 16.0,
    kPct: 12.0,
    hrPct: 8.0,
  };

  const avgPitcher: PitchingAdvanced = {
    playerID: 'test-pitcher-avg',
    name: 'Average Arm',
    pos: 'SP',
    ip: 80,
    era: 4.20,
    fip: 4.20,
    whip: 1.35,
    kPer9: 8.0,
    bbPer9: 3.5,
    hrPer9: 1.0,
    kPct: 22.0,
    bbPct: 9.0,
    kBbRatio: 2.5,
  };

  describe('computeBatterHAVF', () => {
    it('produces scores between 0 and 100 for all components', () => {
      const result = computeBatterHAVF(avgBatter, 'Texas');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.components.hits).toBeGreaterThanOrEqual(0);
      expect(result.components.hits).toBeLessThanOrEqual(100);
      expect(result.components.atBats).toBeGreaterThanOrEqual(0);
      expect(result.components.atBats).toBeLessThanOrEqual(100);
      expect(result.components.velocity).toBeGreaterThanOrEqual(0);
      expect(result.components.velocity).toBeLessThanOrEqual(100);
      expect(result.components.fielding).toBeGreaterThanOrEqual(0);
      expect(result.components.fielding).toBeLessThanOrEqual(100);
    });

    it('average player scores near 50', () => {
      const result = computeBatterHAVF(avgBatter, 'Texas');
      expect(result.overall).toBeGreaterThan(40);
      expect(result.overall).toBeLessThan(60);
    });

    it('elite player scores significantly above average', () => {
      const avg = computeBatterHAVF(avgBatter, 'Texas');
      const elite = computeBatterHAVF(eliteBatter, 'Texas');
      expect(elite.overall).toBeGreaterThan(avg.overall);
      expect(elite.overall).toBeGreaterThan(60);
    });

    it('includes correct metadata', () => {
      const result = computeBatterHAVF(avgBatter, 'Texas');
      expect(result.playerId).toBe('test-batter-avg');
      expect(result.playerName).toBe('Average Joe');
      expect(result.team).toBe('Texas');
      expect(result.position).toBe('SS');
      expect(result.meta.timezone).toBe('America/Chicago');
      expect(result.meta.source).toBe('bsi-havf-engine');
      expect(result.meta.sample_size).toBe(200);
    });

    it('accounts for fielding input', () => {
      const withFielding = computeBatterHAVF(avgBatter, 'Texas', { fieldingPct: 0.990 });
      const withoutFielding = computeBatterHAVF(avgBatter, 'Texas');
      expect(withFielding.components.fielding).toBeGreaterThan(withoutFielding.components.fielding);
    });
  });

  describe('computePitcherHAVF', () => {
    it('produces scores between 0 and 100 for all components', () => {
      const result = computePitcherHAVF(avgPitcher, 'Texas');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.components.hits).toBeGreaterThanOrEqual(0);
      expect(result.components.hits).toBeLessThanOrEqual(100);
      expect(result.components.velocity).toBeGreaterThanOrEqual(0);
      expect(result.components.velocity).toBeLessThanOrEqual(100);
    });

    it('average pitcher scores near 50', () => {
      const result = computePitcherHAVF(avgPitcher, 'Texas');
      expect(result.overall).toBeGreaterThan(40);
      expect(result.overall).toBeLessThan(60);
    });
  });

  describe('rankHAVFScores', () => {
    it('assigns correct percentiles', () => {
      const scores = [
        computeBatterHAVF(avgBatter, 'Texas'),
        computeBatterHAVF(eliteBatter, 'LSU'),
      ];
      const ranked = rankHAVFScores(scores);
      expect(ranked[0].percentile).toBeGreaterThan(ranked[1].percentile);
      expect(ranked[0].overall).toBeGreaterThan(ranked[1].overall);
    });
  });
});
