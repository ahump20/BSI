/**
 * BSI Predictive Modeling Engine - Simulation Core
 *
 * Monte Carlo simulation engine with stateful psychological evolution.
 * Ports existing engine and adds per-game psychological state updates.
 *
 * Optimized for Cloudflare Workers with chunked execution.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  SupportedSport,
  TeamState,
  TeamSimState,
  ScheduledGame,
  GameContext,
  SimulatedGameResult,
  AggregatedSimulation,
  SeasonSimulation,
  PsychologicalState,
  GameOutcome,
  GameResult,
} from './types';

import {
  PYTHAGOREAN_EXPONENTS,
  HOME_ADVANTAGE,
  PSYCHOLOGY_PARAMS,
} from './types';

import { PsychologyModel } from './psychology-model';

// ============================================================================
// Constants
// ============================================================================

// Default simulation count (10,000 standard, chunked for Workers)
const DEFAULT_SIMULATIONS = 10000;
const CHUNK_SIZE = 1000; // Process 1,000 sims at a time for CPU limits

// Playoff win thresholds by sport (as fraction of total games)
const PLAYOFF_THRESHOLDS: Record<SupportedSport, number> = {
  cfb: 0.75,  // ~9 wins in 12-game season
  cbb: 0.65,  // ~20 wins in 30+ games
  nfl: 0.53,  // ~9 wins in 17-game season
  nba: 0.52,  // ~42 wins in 82-game season
  mlb: 0.52,  // ~84 wins in 162-game season
};

// Division win thresholds
const DIVISION_THRESHOLDS: Record<SupportedSport, number> = {
  cfb: 0.80,
  cbb: 0.72,
  nfl: 0.65,
  nba: 0.60,
  mlb: 0.56,
};

// Championship probability thresholds
const CHAMPIONSHIP_THRESHOLDS: Record<SupportedSport, number> = {
  cfb: 0.90,  // Undefeated/1-loss typical
  cbb: 0.75,
  nfl: 0.75,  // ~13 wins
  nba: 0.67,  // ~55 wins
  mlb: 0.60,  // ~97 wins
};

// ============================================================================
// SimulationCore Class
// ============================================================================

export class SimulationCore {
  private readonly psychologyModel: PsychologyModel;
  private readonly simulationCount: number;

  constructor(simulationCount: number = DEFAULT_SIMULATIONS) {
    this.psychologyModel = new PsychologyModel();
    this.simulationCount = simulationCount;
  }

  // ============================================================================
  // Core Probability Calculations
  // ============================================================================

  /**
   * Calculate Pythagorean Win Expectation.
   *
   * P = PF^exp / (PF^exp + PA^exp)
   */
  calculatePythagorean(
    pointsFor: number,
    pointsAgainst: number,
    sport: SupportedSport
  ): number {
    if (pointsFor === 0 && pointsAgainst === 0) return 0.5;

    const exponent = PYTHAGOREAN_EXPONENTS[sport];
    const numerator = Math.pow(pointsFor, exponent);
    const denominator = numerator + Math.pow(pointsAgainst, exponent);

    return numerator / denominator;
  }

  /**
   * Calculate game win probability incorporating all factors.
   *
   * Factors:
   * - Base Pythagorean expectation
   * - Rating difference
   * - Home field advantage
   * - Psychological state differential
   * - Recent form / momentum
   * - Injury impact
   * - Context (rivalry, playoff, etc.)
   */
  calculateGameWinProbability(
    homeTeam: TeamSimState,
    awayTeam: TeamSimState,
    context: GameContext
  ): number {
    const sport = homeTeam.sport;

    // Base probability from Pythagorean expectation
    const homePyth = homeTeam.pythagorean;
    const awayPyth = awayTeam.pythagorean;

    // Log5 method for head-to-head probability
    const log5Prob = (homePyth * (1 - awayPyth)) /
      (homePyth * (1 - awayPyth) + awayPyth * (1 - homePyth));

    let winProb = log5Prob;

    // Home field advantage
    if (context.location === 'home') {
      winProb += HOME_ADVANTAGE[sport];
    } else if (context.location === 'away') {
      winProb -= HOME_ADVANTAGE[sport];
    }

    // Rating differential adjustment
    const ratingDiff = homeTeam.rating - awayTeam.rating;
    const ratingAdjustment = ratingDiff * 0.001; // 100 rating points ≈ 10%
    winProb += ratingAdjustment;

    // Psychological state adjustment
    const psychAdjustment = this.psychologyModel.calculatePsychAdjustment(
      homeTeam.psych,
      awayTeam.psych,
      context
    );
    winProb += psychAdjustment;

    // Recent form adjustment
    const homeFormFactor = this.calculateFormFactor(homeTeam);
    const awayFormFactor = this.calculateFormFactor(awayTeam);
    const formDiff = (homeFormFactor - awayFormFactor) * 0.05;
    winProb += formDiff;

    // Injury impact
    const injuryDiff = homeTeam.injuryImpact - awayTeam.injuryImpact;
    winProb += injuryDiff * 0.05;

    // Fatigue / rest advantage
    const restDiff = context.restDays.home - context.restDays.away;
    if (restDiff > 2) winProb += 0.02;
    else if (restDiff < -2) winProb -= 0.02;

    // Context multipliers
    if (context.isRivalry) {
      // Rivalry games are more unpredictable
      winProb = 0.5 + (winProb - 0.5) * 0.85;
    }

    // Clamp to reasonable bounds (no team is ever 100% or 0%)
    return Math.max(0.03, Math.min(0.97, winProb));
  }

  /**
   * Calculate form factor from recent results.
   * Returns value between 0.85 and 1.15.
   */
  private calculateFormFactor(team: TeamSimState): number {
    // Use psychology model's momentum calculation
    const recentForm: GameResult[] = [];
    const record = team.wins + team.losses;

    // Infer recent form from win percentage if not tracked
    const winPct = record > 0 ? team.wins / record : 0.5;

    // Convert win percentage to form factor
    return 0.85 + winPct * 0.30;
  }

  // ============================================================================
  // Single Game Simulation
  // ============================================================================

  /**
   * Simulate a single game.
   *
   * Returns the simulated result with scores and margin.
   */
  simulateGame(
    homeTeam: TeamSimState,
    awayTeam: TeamSimState,
    context: GameContext
  ): SimulatedGameResult {
    const winProb = this.calculateGameWinProbability(homeTeam, awayTeam, context);
    const random = Math.random();
    const homeWins = random < winProb;

    // Generate scores based on team strength and sport
    const { homeScore, awayScore } = this.generateScores(
      homeTeam,
      awayTeam,
      homeWins,
      context
    );

    const margin = homeScore - awayScore;
    const expectedMargin = (winProb - 0.5) * this.getTypicalMargin(homeTeam.sport);

    return {
      gameId: context.gameId,
      winnerId: homeWins ? homeTeam.teamId : awayTeam.teamId,
      loserId: homeWins ? awayTeam.teamId : homeTeam.teamId,
      homeScore,
      awayScore,
      margin,
      wasUpset: homeWins ? winProb < 0.35 : winProb > 0.65,
      expectationGap: margin - expectedMargin,
    };
  }

  /**
   * Generate realistic scores for a game.
   */
  private generateScores(
    homeTeam: TeamSimState,
    awayTeam: TeamSimState,
    homeWins: boolean,
    context: GameContext
  ): { homeScore: number; awayScore: number } {
    const sport = homeTeam.sport;

    // Average scores by sport
    const avgScores: Record<SupportedSport, number> = {
      cfb: 28,
      cbb: 72,
      nfl: 23,
      nba: 112,
      mlb: 4.5,
    };

    const avgScore = avgScores[sport];
    const variance = avgScore * 0.25;

    // Generate base scores with normal distribution
    const homeBase = avgScore + (Math.random() + Math.random() + Math.random() - 1.5) * variance;
    const awayBase = avgScore + (Math.random() + Math.random() + Math.random() - 1.5) * variance;

    // Adjust for team strength
    const homeStrength = (homeTeam.pythagorean - 0.5) * avgScore * 0.4;
    const awayStrength = (awayTeam.pythagorean - 0.5) * avgScore * 0.4;

    let homeScore = Math.max(0, homeBase + homeStrength);
    let awayScore = Math.max(0, awayBase + awayStrength);

    // Ensure winner actually wins
    if (homeWins && homeScore <= awayScore) {
      homeScore = awayScore + 1 + Math.random() * (avgScore * 0.3);
    } else if (!homeWins && awayScore <= homeScore) {
      awayScore = homeScore + 1 + Math.random() * (avgScore * 0.3);
    }

    // Round to appropriate precision
    if (sport === 'mlb') {
      return {
        homeScore: Math.round(homeScore),
        awayScore: Math.round(awayScore),
      };
    }

    return {
      homeScore: Math.round(homeScore),
      awayScore: Math.round(awayScore),
    };
  }

  /**
   * Get typical margin of victory for a sport.
   */
  private getTypicalMargin(sport: SupportedSport): number {
    const margins: Record<SupportedSport, number> = {
      cfb: 14,
      cbb: 10,
      nfl: 10,
      nba: 10,
      mlb: 3,
    };
    return margins[sport];
  }

  // ============================================================================
  // Aggregated Simulations
  // ============================================================================

  /**
   * Run N simulations of a single game.
   *
   * Uses chunked execution for Cloudflare Workers CPU limits.
   */
  async simulateGameN(
    homeTeam: TeamState,
    awayTeam: TeamState,
    context: GameContext,
    simulations: number = this.simulationCount
  ): Promise<AggregatedSimulation> {
    // Initialize sim states
    const homeSim = this.teamStateToSimState(homeTeam, true);
    const awaySim = this.teamStateToSimState(awayTeam, false);

    // Tracking variables
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalHomeScore = 0;
    let totalAwayScore = 0;
    const spreads: number[] = [];

    // Run in chunks to avoid CPU timeout
    const chunks = Math.ceil(simulations / CHUNK_SIZE);

    for (let chunk = 0; chunk < chunks; chunk++) {
      const chunkStart = chunk * CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, simulations);

      for (let i = chunkStart; i < chunkEnd; i++) {
        const result = this.simulateGame(homeSim, awaySim, context);

        if (result.homeScore > result.awayScore) {
          homeWins++;
        } else if (result.awayScore > result.homeScore) {
          awayWins++;
        } else {
          draws++;
        }

        totalHomeScore += result.homeScore;
        totalAwayScore += result.awayScore;
        spreads.push(result.margin);
      }

      // Yield to event loop between chunks (for Workers)
      if (chunk < chunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Calculate statistics
    const avgHomeScore = totalHomeScore / simulations;
    const avgAwayScore = totalAwayScore / simulations;
    const avgSpread = avgHomeScore - avgAwayScore;
    const avgTotal = avgHomeScore + avgAwayScore;

    // Standard deviation of spread
    const spreadVariance = spreads.reduce((sum, s) => {
      return sum + Math.pow(s - avgSpread, 2);
    }, 0) / simulations;
    const spreadStdDev = Math.sqrt(spreadVariance);

    // Sort spreads for confidence interval
    spreads.sort((a, b) => a - b);
    const lowerIdx = Math.floor(simulations * 0.05);
    const upperIdx = Math.floor(simulations * 0.95);

    return {
      gameId: context.gameId,
      simulationCount: simulations,
      homeWins,
      awayWins,
      draws,
      homeWinProbability: homeWins / simulations,
      awayWinProbability: awayWins / simulations,
      avgHomeScore: Math.round(avgHomeScore * 10) / 10,
      avgAwayScore: Math.round(avgAwayScore * 10) / 10,
      avgSpread: Math.round(avgSpread * 10) / 10,
      avgTotal: Math.round(avgTotal * 10) / 10,
      spreadStdDev: Math.round(spreadStdDev * 100) / 100,
      homeCoversSpread: 0, // Would need actual spread line to calculate
      confidenceInterval: {
        lower: spreads[lowerIdx],
        upper: spreads[upperIdx],
      },
    };
  }

  // ============================================================================
  // Season Simulation
  // ============================================================================

  /**
   * Simulate an entire season with psychological state evolution.
   *
   * Key feature: Team psychological state updates after each simulated game,
   * affecting subsequent game probabilities within each simulation run.
   */
  async simulateSeason(
    team: TeamState,
    schedule: ScheduledGame[],
    opponents: Map<string, TeamState>,
    simulations: number = this.simulationCount
  ): Promise<SeasonSimulation> {
    const winsPerSim: number[] = [];
    const confidenceTrajectory: number[] = [];
    let momentumPeaks = 0;

    // Track outcome counts
    let madePlayoffs = 0;
    let wonDivision = 0;
    let wonConference = 0;
    let wonChampionship = 0;

    const remainingGames = schedule.filter(g => !g.completed);
    const totalGames = team.wins + team.losses + remainingGames.length;

    // Thresholds for this sport
    const playoffThreshold = Math.floor(totalGames * PLAYOFF_THRESHOLDS[team.sport]);
    const divisionThreshold = Math.floor(totalGames * DIVISION_THRESHOLDS[team.sport]);
    const champThreshold = Math.floor(totalGames * CHAMPIONSHIP_THRESHOLDS[team.sport]);

    // Run simulations in chunks
    const chunks = Math.ceil(simulations / CHUNK_SIZE);

    for (let chunk = 0; chunk < chunks; chunk++) {
      const chunkStart = chunk * CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, simulations);

      for (let simIdx = chunkStart; simIdx < chunkEnd; simIdx++) {
        // Reset state for this simulation
        let currentPsych: PsychologicalState = { ...team };
        let wins = team.wins;
        let losses = team.losses;
        let streak = 0;
        let lastResult: GameResult | null = null;
        let peaksThisSim = 0;

        // Simulate each remaining game
        for (const game of remainingGames) {
          const opponentId = game.homeTeamId === team.teamId
            ? game.awayTeamId
            : game.homeTeamId;

          const opponent = opponents.get(opponentId);
          if (!opponent) continue;

          const isHome = game.homeTeamId === team.teamId;

          // Create sim states with current psychological state
          const teamSim = this.teamStateToSimState(
            { ...team, ...currentPsych },
            isHome
          );
          const oppSim = this.teamStateToSimState(opponent, !isHome);

          // Create game context
          const context: GameContext = {
            gameId: game.gameId,
            sport: team.sport,
            season: team.season,
            week: 0, // Would need schedule data
            date: game.date,
            location: isHome ? 'home' : 'away',
            isRivalry: false, // Would need rivalry data
            isPlayoff: false,
            isConference: true, // Assume conference game
            restDays: { home: 7, away: 7 },
          };

          // Simulate the game
          const result = this.simulateGame(
            isHome ? teamSim : oppSim,
            isHome ? oppSim : teamSim,
            context
          );

          // Determine if team won
          const teamWon = (isHome && result.homeScore > result.awayScore) ||
                         (!isHome && result.awayScore > result.homeScore);

          if (teamWon) {
            wins++;
            streak = lastResult === 'W' ? streak + 1 : 1;
            lastResult = 'W';
          } else {
            losses++;
            streak = lastResult === 'L' ? streak + 1 : 1;
            lastResult = 'L';
          }

          // Check for momentum peaks (3+ game swings)
          if (Math.abs(streak) >= 3 && lastResult !== null) {
            peaksThisSim++;
          }

          // Update psychological state based on outcome
          const gameOutcome: GameOutcome = {
            result: teamWon ? 'W' : 'L',
            margin: isHome
              ? result.homeScore - result.awayScore
              : result.awayScore - result.homeScore,
            wasUpset: result.wasUpset,
            expectationGap: result.expectationGap,
            performanceRating: teamWon ? 0.6 : 0.4,
            opponentStrength: opponent.pythagoreanExpectation,
            isPlayoff: false,
            isRivalry: false,
          };

          currentPsych = this.psychologyModel.updateState(currentPsych, gameOutcome);
        }

        // Record results for this simulation
        winsPerSim.push(wins);
        momentumPeaks += peaksThisSim;

        // Track outcome achievements
        if (wins >= playoffThreshold) madePlayoffs++;
        if (wins >= divisionThreshold) wonDivision++;
        if (wins >= champThreshold - 1) wonConference++; // Conference is slightly easier
        if (wins >= champThreshold) wonChampionship++;
      }

      // Yield between chunks
      if (chunk < chunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Calculate statistics
    const avgWins = winsPerSim.reduce((a, b) => a + b, 0) / simulations;
    const avgLosses = totalGames - avgWins;

    // Track confidence trajectory (average across sims at each game)
    // Simplified: just track initial confidence
    confidenceTrajectory.push(team.confidence);

    return {
      teamId: team.teamId,
      season: team.season,
      simulationRuns: simulations,
      winsPerSim,
      avgWins: Math.round(avgWins * 10) / 10,
      avgLosses: Math.round(avgLosses * 10) / 10,
      madePlayoffs,
      wonDivision,
      wonConference,
      wonChampionship,
      confidenceTrajectory,
      momentumPeaks: Math.round(momentumPeaks / simulations),
    };
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Simulate multiple games in batch.
   */
  async simulateGamesBatch(
    games: Array<{
      homeTeam: TeamState;
      awayTeam: TeamState;
      context: GameContext;
    }>,
    simulations: number = this.simulationCount
  ): Promise<AggregatedSimulation[]> {
    const results: AggregatedSimulation[] = [];

    for (const game of games) {
      const result = await this.simulateGameN(
        game.homeTeam,
        game.awayTeam,
        game.context,
        simulations
      );
      results.push(result);
    }

    return results;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Convert TeamState to TeamSimState.
   */
  private teamStateToSimState(team: TeamState, isHome: boolean): TeamSimState {
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      sport: team.sport,
      rating: team.rating,
      pythagorean: team.pythagoreanExpectation,
      psych: {
        confidence: team.confidence,
        focus: team.focus,
        cohesion: team.cohesion,
        leadershipInfluence: team.leadershipInfluence,
      },
      wins: team.wins,
      losses: team.losses,
      ties: team.ties ?? 0,
      isHome,
      fatigueIndex: team.fatigueIndex,
      injuryImpact: team.injuryImpact,
    };
  }

  /**
   * Calculate confidence interval for win probability.
   */
  calculateConfidenceInterval(
    winProbability: number,
    simulations: number
  ): { lower: number; upper: number } {
    // Wilson score interval for binomial proportion
    const z = 1.645; // 90% confidence
    const p = winProbability;
    const n = simulations;

    const denominator = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / denominator;
    const spread = (z / denominator) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));

    return {
      lower: Math.max(0, Math.round((center - spread) * 1000) / 1000),
      upper: Math.min(1, Math.round((center + spread) * 1000) / 1000),
    };
  }

  /**
   * Get simulation count.
   */
  getSimulationCount(): number {
    return this.simulationCount;
  }
}
