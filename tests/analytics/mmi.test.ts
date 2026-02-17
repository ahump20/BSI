import { describe, it, expect } from 'vitest';
import { computeMMI, type GameSituation } from '../../lib/analytics/mmi';

describe('MMI (Momentum Magnitude Index) Engine', () => {
  const routineSituation: GameSituation = {
    inning: 3,
    inningHalf: 'top',
    outs: 1,
    homeScore: 2,
    awayScore: 0,
    runnersOn: 0,
    pitchCount: 40,
  };

  const highPressureSituation: GameSituation = {
    inning: 9,
    inningHalf: 'bottom',
    outs: 2,
    homeScore: 3,
    awayScore: 3,
    runnersOn: 2,
    pitchCount: 105,
  };

  const blowoutSituation: GameSituation = {
    inning: 7,
    inningHalf: 'top',
    outs: 0,
    homeScore: 12,
    awayScore: 2,
    runnersOn: 0,
    pitchCount: 80,
  };

  describe('computeMMI', () => {
    it('returns MMI between 0 and 100', () => {
      const result = computeMMI(routineSituation);
      expect(result.mmi).toBeGreaterThanOrEqual(0);
      expect(result.mmi).toBeLessThanOrEqual(100);
    });

    it('routine situation produces lower MMI', () => {
      const result = computeMMI(routineSituation);
      expect(['Routine', 'Moderate']).toContain(result.category);
      expect(result.mmi).toBeLessThan(55);
    });

    it('high-pressure situation produces higher MMI', () => {
      const result = computeMMI(highPressureSituation);
      expect(result.mmi).toBeGreaterThan(55);
      expect(['High Difficulty', 'Elite Pressure']).toContain(result.category);
    });

    it('high pressure beats routine', () => {
      const routine = computeMMI(routineSituation);
      const pressure = computeMMI(highPressureSituation);
      expect(pressure.mmi).toBeGreaterThan(routine.mmi);
    });

    it('blowout situation is lower than close game', () => {
      const blowout = computeMMI(blowoutSituation);
      const close = computeMMI(highPressureSituation);
      expect(blowout.mmi).toBeLessThan(close.mmi);
    });

    it('returns correct direction based on score', () => {
      const homeLeads = computeMMI({ ...routineSituation, homeScore: 5, awayScore: 2 });
      expect(homeLeads.direction).toBe('home');

      const awayLeads = computeMMI({ ...routineSituation, homeScore: 2, awayScore: 5 });
      expect(awayLeads.direction).toBe('away');

      const tied = computeMMI({ ...routineSituation, homeScore: 3, awayScore: 3 });
      expect(tied.direction).toBe('neutral');
    });

    it('includes all five components', () => {
      const result = computeMMI(routineSituation);
      expect(result.components.leverageIndex).toBeDefined();
      expect(result.components.pressure).toBeDefined();
      expect(result.components.fatigue).toBeDefined();
      expect(result.components.execution).toBeDefined();
      expect(result.components.bio).toBeDefined();
    });

    it('component weights sum to 1.0', () => {
      const result = computeMMI(routineSituation);
      const totalWeight =
        result.components.leverageIndex.weight +
        result.components.pressure.weight +
        result.components.fatigue.weight +
        result.components.execution.weight +
        result.components.bio.weight;
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });

    it('includes correct metadata', () => {
      const result = computeMMI(routineSituation);
      expect(result.meta.timezone).toBe('America/Chicago');
      expect(result.meta.source).toBe('bsi-mmi-engine');
      expect(result.situation.inning).toBe(3);
      expect(result.situation.half).toBe('top');
      expect(result.situation.outs).toBe(1);
    });

    it('9th inning tied game with bases loaded is elite', () => {
      const clutch: GameSituation = {
        inning: 9,
        inningHalf: 'bottom',
        outs: 2,
        homeScore: 5,
        awayScore: 5,
        runnersOn: 3,
        pitchCount: 110,
      };
      const result = computeMMI(clutch);
      expect(result.mmi).toBeGreaterThan(65);
    });
  });
});
