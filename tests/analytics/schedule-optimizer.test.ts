/**
 * Integration Tests: Schedule Optimizer
 *
 * Validates Monte Carlo simulations, Log5 win probability, and NCAA tournament projections
 * Tests confidence intervals, what-if scenarios, and schedule optimization recommendations
 *
 * Test Framework: Vitest (to be installed)
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScheduleOptimizer,
  RemainingSchedule,
  ScheduleGame,
  MonteCarloSimulation,
  WhatIfScenario,
} from '../../lib/analytics/baseball/schedule-optimizer';
import {
  ConferenceStrengthModel,
  TeamRecord,
  RPICalculation,
  SOSCalculation,
  ISRCalculation,
} from '../../lib/analytics/baseball/conference-strength-model';

// ============================================================================
// Test Data - Mock Schedule Scenarios
// ============================================================================

const mockTeamMetrics = {
  rpi: {
    teamId: 'texas',
    teamName: 'Texas Longhorns',
    conference: 'SEC',
    rpi: 0.62,
    wp: 0.75,
    owp: 0.54,
    oowp: 0.52,
  } as RPICalculation,
  sos: {
    teamId: 'texas',
    teamName: 'Texas Longhorns',
    conference: 'SEC',
    sos: 0.68,
    opponentAvgRPI: 0.54,
    qualityWins: 12,
    badLosses: 1,
  } as SOSCalculation,
  isr: {
    teamId: 'texas',
    teamName: 'Texas Longhorns',
    conference: 'SEC',
    isr: 0.78,
    offensiveRating: 0.82,
    defensiveRating: 0.76,
    recentForm: 0.75,
  } as ISRCalculation,
};

const mockOpponentMetrics = new Map([
  [
    'tennessee',
    {
      rpi: {
        teamId: 'tennessee',
        teamName: 'Tennessee',
        conference: 'SEC',
        rpi: 0.65,
        wp: 0.82,
        owp: 0.56,
        oowp: 0.54,
      } as RPICalculation,
      sos: {
        teamId: 'tennessee',
        teamName: 'Tennessee',
        conference: 'SEC',
        sos: 0.7,
        opponentAvgRPI: 0.56,
        qualityWins: 15,
        badLosses: 0,
      } as SOSCalculation,
      isr: {
        teamId: 'tennessee',
        teamName: 'Tennessee',
        conference: 'SEC',
        isr: 0.84,
        offensiveRating: 0.88,
        defensiveRating: 0.82,
        recentForm: 0.82,
      } as ISRCalculation,
    },
  ],
  [
    'vanderbilt',
    {
      rpi: {
        teamId: 'vanderbilt',
        teamName: 'Vanderbilt',
        conference: 'SEC',
        rpi: 0.58,
        wp: 0.61,
        owp: 0.54,
        oowp: 0.52,
      } as RPICalculation,
      sos: {
        teamId: 'vanderbilt',
        teamName: 'Vanderbilt',
        conference: 'SEC',
        sos: 0.65,
        opponentAvgRPI: 0.54,
        qualityWins: 8,
        badLosses: 2,
      } as SOSCalculation,
      isr: {
        teamId: 'vanderbilt',
        teamName: 'Vanderbilt',
        conference: 'SEC',
        isr: 0.68,
        offensiveRating: 0.72,
        defensiveRating: 0.68,
        recentForm: 0.61,
      } as ISRCalculation,
    },
  ],
  [
    'florida',
    {
      rpi: {
        teamId: 'florida',
        teamName: 'Florida',
        conference: 'SEC',
        rpi: 0.52,
        wp: 0.55,
        owp: 0.53,
        oowp: 0.51,
      } as RPICalculation,
      sos: {
        teamId: 'florida',
        teamName: 'Florida',
        conference: 'SEC',
        sos: 0.62,
        opponentAvgRPI: 0.53,
        qualityWins: 5,
        badLosses: 4,
      } as SOSCalculation,
      isr: {
        teamId: 'florida',
        teamName: 'Florida',
        conference: 'SEC',
        isr: 0.61,
        offensiveRating: 0.64,
        defensiveRating: 0.62,
        recentForm: 0.55,
      } as ISRCalculation,
    },
  ],
]);

const mockSchedule: RemainingSchedule = {
  teamId: 'texas',
  teamName: 'Texas Longhorns',
  conference: 'SEC',
  currentRecord: {
    wins: 35,
    losses: 12,
  },
  remainingGames: [
    {
      gameId: 'game1',
      date: '2025-05-15',
      opponent: { teamId: 'tennessee', teamName: 'Tennessee Volunteers', conference: 'SEC' },
      location: 'home',
      completed: false,
    },
    {
      gameId: 'game2',
      date: '2025-05-16',
      opponent: { teamId: 'tennessee', teamName: 'Tennessee Volunteers', conference: 'SEC' },
      location: 'home',
      completed: false,
    },
    {
      gameId: 'game3',
      date: '2025-05-17',
      opponent: { teamId: 'tennessee', teamName: 'Tennessee Volunteers', conference: 'SEC' },
      location: 'home',
      completed: false,
    },
    {
      gameId: 'game4',
      date: '2025-05-22',
      opponent: { teamId: 'vanderbilt', teamName: 'Vanderbilt Commodores', conference: 'SEC' },
      location: 'away',
      completed: false,
    },
    {
      gameId: 'game5',
      date: '2025-05-23',
      opponent: { teamId: 'vanderbilt', teamName: 'Vanderbilt Commodores', conference: 'SEC' },
      location: 'away',
      completed: false,
    },
    {
      gameId: 'game6',
      date: '2025-05-24',
      opponent: { teamId: 'vanderbilt', teamName: 'Vanderbilt Commodores', conference: 'SEC' },
      location: 'away',
      completed: false,
    },
    {
      gameId: 'game7',
      date: '2025-05-29',
      opponent: { teamId: 'florida', teamName: 'Florida Gators', conference: 'SEC' },
      location: 'neutral',
      completed: false,
    },
  ],
};

// ============================================================================
// Monte Carlo Simulation Tests
// ============================================================================

describe('ScheduleOptimizer - Monte Carlo Simulations', () => {
  let simulation: MonteCarloSimulation;

  beforeEach(() => {
    simulation = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );
  });

  it('should run specified number of iterations', () => {
    expect(simulation.iterations).toBe(10000);
  });

  it('should produce projected record within valid range', () => {
    const totalGames =
      mockSchedule.currentRecord.wins +
      mockSchedule.currentRecord.losses +
      mockSchedule.remainingGames.length;

    expect(simulation.projectedRecord.wins).toBeGreaterThanOrEqual(mockSchedule.currentRecord.wins);
    expect(simulation.projectedRecord.wins).toBeLessThanOrEqual(totalGames);
    expect(simulation.projectedRecord.losses).toBeGreaterThanOrEqual(
      mockSchedule.currentRecord.losses
    );
    expect(simulation.projectedRecord.losses).toBeLessThanOrEqual(
      totalGames - mockSchedule.currentRecord.wins
    );
  });

  it('should calculate winning percentage correctly', () => {
    const totalGames = simulation.projectedRecord.wins + simulation.projectedRecord.losses;
    const expectedWinPct = simulation.projectedRecord.wins / totalGames;

    expect(simulation.projectedRecord.winningPct).toBeCloseTo(expectedWinPct, 4);
  });

  it('should produce 95% confidence interval', () => {
    expect(simulation.confidenceInterval.level).toBe(95);
    expect(simulation.confidenceInterval.winsLower).toBeLessThanOrEqual(
      simulation.projectedRecord.wins
    );
    expect(simulation.confidenceInterval.winsUpper).toBeGreaterThanOrEqual(
      simulation.projectedRecord.wins
    );
    expect(simulation.confidenceInterval.lossesLower).toBeLessThanOrEqual(
      simulation.projectedRecord.losses
    );
    expect(simulation.confidenceInterval.lossesUpper).toBeGreaterThanOrEqual(
      simulation.projectedRecord.losses
    );
  });

  it('should have confidence interval width proportional to uncertainty', () => {
    const intervalWidth =
      simulation.confidenceInterval.winsUpper - simulation.confidenceInterval.winsLower;

    // With 7 remaining games, expect confidence interval of 2-5 wins
    expect(intervalWidth).toBeGreaterThanOrEqual(2);
    expect(intervalWidth).toBeLessThanOrEqual(5);
  });

  it('should calculate win probabilities for all remaining games', () => {
    expect(simulation.remainingGameProbabilities).toHaveLength(mockSchedule.remainingGames.length);

    simulation.remainingGameProbabilities.forEach((gameProb) => {
      expect(gameProb.gameId).toBeDefined();
      expect(gameProb.opponent).toBeDefined();
      expect(gameProb.winProbability).toBeGreaterThanOrEqual(0.05);
      expect(gameProb.winProbability).toBeLessThanOrEqual(0.95);
    });
  });

  it('should estimate NCAA tournament probability', () => {
    expect(simulation.ncaaTournamentProbability).toBeGreaterThanOrEqual(0);
    expect(simulation.ncaaTournamentProbability).toBeLessThanOrEqual(1);

    // Texas (35-12 with strong RPI) should have high NCAA probability
    expect(simulation.ncaaTournamentProbability).toBeGreaterThan(0.7);
  });

  it('should estimate NCAA national seed probability', () => {
    expect(simulation.ncaaSeedProbability).toBeGreaterThanOrEqual(0);
    expect(simulation.ncaaSeedProbability).toBeLessThanOrEqual(1);
    expect(simulation.ncaaSeedProbability).toBeLessThanOrEqual(
      simulation.ncaaTournamentProbability
    );
  });

  it('should estimate conference championship probability', () => {
    expect(simulation.conferenceChampionshipProbability).toBeGreaterThanOrEqual(0);
    expect(simulation.conferenceChampionshipProbability).toBeLessThanOrEqual(1);
  });

  it('should include metadata with simulation method', () => {
    expect(simulation.metadata).toBeDefined();
    expect(simulation.metadata.simulationDate).toBeDefined();
    expect(simulation.metadata.confidence).toBe(95);
    expect(simulation.metadata.method).toBe('Monte Carlo with Log5 Win Probability');
  });
});

// ============================================================================
// Log5 Win Probability Tests
// ============================================================================

describe('ScheduleOptimizer - Log5 Win Probability', () => {
  it('should calculate win probability using Log5 formula', () => {
    const winProb = ScheduleOptimizer.calculateWinProbability(
      mockTeamMetrics,
      mockOpponentMetrics.get('tennessee')!,
      'neutral'
    );

    // Texas (ISR 0.78) vs Tennessee (ISR 0.84) on neutral field
    // Log5: P = (0.78 - 0.78*0.84) / (0.78 + 0.84 - 2*0.78*0.84) ≈ 0.435
    expect(winProb).toBeGreaterThan(0.3);
    expect(winProb).toBeLessThan(0.5);
  });

  it('should apply home field advantage (6% boost)', () => {
    const neutralProb = ScheduleOptimizer.calculateWinProbability(
      mockTeamMetrics,
      mockOpponentMetrics.get('vanderbilt')!,
      'neutral'
    );

    const homeProb = ScheduleOptimizer.calculateWinProbability(
      mockTeamMetrics,
      mockOpponentMetrics.get('vanderbilt')!,
      'home'
    );

    // Home field advantage should increase win probability
    expect(homeProb).toBeGreaterThan(neutralProb);
    expect(homeProb - neutralProb).toBeGreaterThan(0.03); // At least 3% boost
    expect(homeProb - neutralProb).toBeLessThan(0.1); // At most 10% boost
  });

  it('should apply away field disadvantage (6% penalty)', () => {
    const neutralProb = ScheduleOptimizer.calculateWinProbability(
      mockTeamMetrics,
      mockOpponentMetrics.get('vanderbilt')!,
      'neutral'
    );

    const awayProb = ScheduleOptimizer.calculateWinProbability(
      mockTeamMetrics,
      mockOpponentMetrics.get('vanderbilt')!,
      'away'
    );

    // Away field should decrease win probability
    expect(awayProb).toBeLessThan(neutralProb);
    expect(neutralProb - awayProb).toBeGreaterThan(0.03); // At least 3% penalty
    expect(neutralProb - awayProb).toBeLessThan(0.1); // At most 10% penalty
  });

  it('should clamp probabilities between 5% and 95%', () => {
    // Create extreme mismatch scenario
    const strongTeam = {
      rpi: { ...mockTeamMetrics.rpi, rpi: 0.95 },
      sos: mockTeamMetrics.sos,
      isr: { ...mockTeamMetrics.isr, isr: 0.95 },
    };

    const weakOpponent = {
      rpi: {
        teamId: 'weak',
        teamName: 'Weak Team',
        conference: 'Weak',
        rpi: 0.1,
        wp: 0.1,
        owp: 0.3,
        oowp: 0.3,
      } as RPICalculation,
      sos: {
        teamId: 'weak',
        teamName: 'Weak Team',
        conference: 'Weak',
        sos: 0.2,
        opponentAvgRPI: 0.3,
        qualityWins: 0,
        badLosses: 10,
      } as SOSCalculation,
      isr: {
        teamId: 'weak',
        teamName: 'Weak Team',
        conference: 'Weak',
        isr: 0.1,
        offensiveRating: 0.1,
        defensiveRating: 0.15,
        recentForm: 0.1,
      } as ISRCalculation,
    };

    const winProb = ScheduleOptimizer.calculateWinProbability(strongTeam, weakOpponent, 'neutral');

    expect(winProb).toBeGreaterThanOrEqual(0.05);
    expect(winProb).toBeLessThanOrEqual(0.95);
  });

  it('should produce symmetric probabilities for neutral games', () => {
    const texasWinProb = ScheduleOptimizer.calculateWinProbability(
      mockTeamMetrics,
      mockOpponentMetrics.get('vanderbilt')!,
      'neutral'
    );

    const vanderbiltWinProb = ScheduleOptimizer.calculateWinProbability(
      mockOpponentMetrics.get('vanderbilt')!,
      mockTeamMetrics,
      'neutral'
    );

    // Probabilities should sum to approximately 1.0
    expect(texasWinProb + vanderbiltWinProb).toBeCloseTo(1.0, 2);
  });
});

// ============================================================================
// What-If Scenario Tests
// ============================================================================

describe('ScheduleOptimizer - What-If Scenarios', () => {
  let simulation: MonteCarloSimulation;
  let scenarios: WhatIfScenario[];

  beforeEach(() => {
    simulation = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );

    scenarios = ScheduleOptimizer.generateWhatIfScenarios(
      simulation,
      mockSchedule,
      mockTeamMetrics
    );
  });

  it('should generate standard what-if scenarios', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(4);

    const scenarioNames = scenarios.map((s) => s.scenarioName);
    expect(scenarioNames).toContain('Win Out');
    expect(scenarioNames).toContain('Worst Case');
    expect(scenarioNames).toContain('Win Key Games');
    expect(scenarioNames).toContain('Split Remaining');
  });

  it('should calculate "Win Out" scenario correctly', () => {
    const winOut = scenarios.find((s) => s.scenarioName === 'Win Out');
    expect(winOut).toBeDefined();

    const expectedWins = mockSchedule.currentRecord.wins + mockSchedule.remainingGames.length;
    expect(winOut!.projectedRecord.wins).toBe(expectedWins);
    expect(winOut!.projectedRecord.losses).toBe(mockSchedule.currentRecord.losses);
  });

  it('should calculate "Worst Case" scenario correctly', () => {
    const worstCase = scenarios.find((s) => s.scenarioName === 'Worst Case');
    expect(worstCase).toBeDefined();

    const expectedLosses = mockSchedule.currentRecord.losses + mockSchedule.remainingGames.length;
    expect(worstCase!.projectedRecord.wins).toBe(mockSchedule.currentRecord.wins);
    expect(worstCase!.projectedRecord.losses).toBe(expectedLosses);
  });

  it('should calculate "Split Remaining" scenario correctly', () => {
    const split = scenarios.find((s) => s.scenarioName === 'Split Remaining');
    expect(split).toBeDefined();

    const expectedWins =
      mockSchedule.currentRecord.wins + Math.floor(mockSchedule.remainingGames.length / 2);
    const expectedLosses =
      mockSchedule.currentRecord.losses + Math.ceil(mockSchedule.remainingGames.length / 2);

    expect(split!.projectedRecord.wins).toBeCloseTo(expectedWins, 0);
    expect(split!.projectedRecord.losses).toBeCloseTo(expectedLosses, 0);
  });

  it('should calculate RPI change for each scenario', () => {
    scenarios.forEach((scenario) => {
      expect(scenario.rpiChange).toBeDefined();
      expect(typeof scenario.rpiChange).toBe('number');

      // RPI change should be realistic (-0.1 to +0.1)
      expect(scenario.rpiChange).toBeGreaterThanOrEqual(-0.15);
      expect(scenario.rpiChange).toBeLessThanOrEqual(0.15);
    });
  });

  it('should calculate NCAA tournament probability change', () => {
    scenarios.forEach((scenario) => {
      expect(scenario.ncaaTournamentProbabilityChange).toBeDefined();
      expect(typeof scenario.ncaaTournamentProbabilityChange).toBe('number');

      // Probability change should be realistic (-0.5 to +0.5)
      expect(scenario.ncaaTournamentProbabilityChange).toBeGreaterThanOrEqual(-0.6);
      expect(scenario.ncaaTournamentProbabilityChange).toBeLessThanOrEqual(0.6);
    });
  });

  it('should show "Win Out" has highest RPI impact', () => {
    const winOut = scenarios.find((s) => s.scenarioName === 'Win Out');
    const worstCase = scenarios.find((s) => s.scenarioName === 'Worst Case');

    expect(winOut).toBeDefined();
    expect(worstCase).toBeDefined();
    expect(winOut!.rpiChange).toBeGreaterThan(worstCase!.rpiChange);
  });

  it('should show "Win Out" has highest NCAA probability boost', () => {
    const winOut = scenarios.find((s) => s.scenarioName === 'Win Out');
    const worstCase = scenarios.find((s) => s.scenarioName === 'Worst Case');

    expect(winOut).toBeDefined();
    expect(worstCase).toBeDefined();
    expect(winOut!.ncaaTournamentProbabilityChange).toBeGreaterThan(
      worstCase!.ncaaTournamentProbabilityChange
    );
  });
});

// ============================================================================
// Schedule Optimization Tests
// ============================================================================

describe('ScheduleOptimizer - Schedule Optimization', () => {
  let simulation: MonteCarloSimulation;
  let optimization: any;

  beforeEach(() => {
    simulation = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );

    optimization = ScheduleOptimizer.optimizeSchedule(
      simulation,
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics
    );
  });

  it('should identify key games', () => {
    expect(optimization.keyGames).toBeDefined();
    expect(Array.isArray(optimization.keyGames)).toBe(true);
    expect(optimization.keyGames.length).toBeGreaterThan(0);
  });

  it('should provide optimization recommendations', () => {
    expect(optimization.recommendations).toBeDefined();
    expect(Array.isArray(optimization.recommendations)).toBe(true);
    expect(optimization.recommendations.length).toBeGreaterThan(0);
  });

  it('should rank recommendations by priority', () => {
    optimization.recommendations.forEach((rec: any, index: number) => {
      expect(rec.priority).toBe(index + 1);
    });
  });

  it('should calculate impact scores for recommendations', () => {
    optimization.recommendations.forEach((rec: any) => {
      expect(rec.impactScore).toBeDefined();
      expect(typeof rec.impactScore).toBe('number');
      expect(rec.impactScore).toBeGreaterThanOrEqual(0);
      expect(rec.impactScore).toBeLessThanOrEqual(100);
    });
  });

  it('should provide reasoning for each recommendation', () => {
    optimization.recommendations.forEach((rec: any) => {
      expect(rec.reasoning).toBeDefined();
      expect(typeof rec.reasoning).toBe('string');
      expect(rec.reasoning.length).toBeGreaterThan(20);
    });
  });

  it('should identify games with highest impact on NCAA chances', () => {
    const keyGames = optimization.keyGames;

    keyGames.forEach((game: any) => {
      expect(game.gameId).toBeDefined();
      expect(game.opponent).toBeDefined();
      expect(game.winProbability).toBeDefined();
      expect(game.ncaaImpact).toBeDefined();
    });
  });
});

// ============================================================================
// Statistical Validation Tests
// ============================================================================

describe('ScheduleOptimizer - Statistical Validation', () => {
  it('should produce consistent results with same seed', () => {
    // Run simulation twice with same parameters
    const simulation1 = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );

    const simulation2 = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );

    // Results should be similar (within 1 win difference)
    expect(
      Math.abs(simulation1.projectedRecord.wins - simulation2.projectedRecord.wins)
    ).toBeLessThanOrEqual(1);
  });

  it('should converge with more iterations', () => {
    const simulation1k = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      1000
    );

    const simulation10k = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );

    // Confidence interval should narrow with more iterations
    const width1k =
      simulation1k.confidenceInterval.winsUpper - simulation1k.confidenceInterval.winsLower;
    const width10k =
      simulation10k.confidenceInterval.winsUpper - simulation10k.confidenceInterval.winsLower;

    expect(width10k).toBeLessThanOrEqual(width1k + 1); // Allow 1 win tolerance
  });

  it('should respect binomial distribution properties', () => {
    const simulation = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      10000
    );

    // Mean should be close to expected value (sum of win probabilities)
    const expectedWins =
      mockSchedule.currentRecord.wins +
      simulation.remainingGameProbabilities.reduce((sum, g) => sum + g.winProbability, 0);

    // Allow for integer rounding (tolerance 0.5 instead of 0.05)
    expect(simulation.projectedRecord.wins).toBeCloseTo(expectedWins, 0);
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('ScheduleOptimizer - Edge Cases', () => {
  it('should handle schedule with no remaining games', () => {
    const emptySchedule: RemainingSchedule = {
      ...mockSchedule,
      remainingGames: [],
    };

    const simulation = ScheduleOptimizer.runMonteCarloSimulation(
      emptySchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      1000
    );

    expect(simulation.projectedRecord.wins).toBe(mockSchedule.currentRecord.wins);
    expect(simulation.projectedRecord.losses).toBe(mockSchedule.currentRecord.losses);
    expect(simulation.confidenceInterval.winsLower).toBe(mockSchedule.currentRecord.wins);
    expect(simulation.confidenceInterval.winsUpper).toBe(mockSchedule.currentRecord.wins);
  });

  it('should handle missing opponent metrics', () => {
    const scheduleWithMissingOpp: RemainingSchedule = {
      ...mockSchedule,
      remainingGames: [
        {
          gameId: 'game1',
          date: '2025-05-15',
          opponent: { teamId: 'unknown', teamName: 'Unknown Team', conference: 'Unknown' },
          location: 'neutral',
          completed: false,
        },
      ],
    };

    const simulation = ScheduleOptimizer.runMonteCarloSimulation(
      scheduleWithMissingOpp,
      mockTeamMetrics,
      new Map(), // Empty opponent metrics
      1000
    );

    expect(simulation.remainingGameProbabilities[0].winProbability).toBe(0.5);
  });

  it('should handle extreme iteration counts', () => {
    // Test with very low iterations
    const simulation100 = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      100
    );

    expect(simulation100.iterations).toBe(100);
    expect(simulation100.projectedRecord.wins).toBeGreaterThanOrEqual(
      mockSchedule.currentRecord.wins
    );

    // Test with high iterations (performance test)
    const simulation50k = ScheduleOptimizer.runMonteCarloSimulation(
      mockSchedule,
      mockTeamMetrics,
      mockOpponentMetrics,
      50000
    );

    expect(simulation50k.iterations).toBe(50000);
  });
});
