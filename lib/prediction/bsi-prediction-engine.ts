/**
 * BSI Predictive Modeling Engine - Main Orchestrator
 *
 * Combines Monte Carlo simulation, ML prediction, and psychological modeling
 * into a unified prediction engine with caching and explainability.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  SupportedSport,
  TeamState,
  GameContext,
  GamePrediction,
  SeasonProjection,
  MultiSeasonProjection,
  PredictionEngineConfig,
  ScheduledGame,
  AggregatedSimulation,
  MLFeatures,
  ShapValue,
  PredictionExplanation,
  ConfidenceLevel,
  SubscriptionTier,
  TeamDiamondScores,
  CloudflareEnv,
  GameResult,
} from './types';

import { SimulationCore } from './simulation-core';
import { MLPredictor } from './ml-predictor';
import { PsychologyModel } from './psychology-model';
import { StateTracker } from './state-tracker';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: PredictionEngineConfig = {
  simulationCount: 10000,
  psychologyWeight: 0.15,
  mlWeight: 0.50,
  monteCarloWeight: 0.35,
  sport: 'cfb',
  modelVersion: '1.0.0',
};

const CACHE_TTL = {
  prediction: 3600, // 1 hour
  teamState: 300,   // 5 minutes
  calibration: 86400, // 24 hours
};

// ============================================================================
// BsiPredictionEngine Class
// ============================================================================

export class BsiPredictionEngine {
  private readonly simulationCore: SimulationCore;
  private readonly mlPredictor: MLPredictor;
  private readonly psychologyModel: PsychologyModel;
  private readonly stateTracker: StateTracker;
  private readonly config: PredictionEngineConfig;

  constructor(
    env: CloudflareEnv,
    config?: Partial<PredictionEngineConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.simulationCore = new SimulationCore(this.config.simulationCount);
    this.mlPredictor = new MLPredictor();
    this.psychologyModel = new PsychologyModel();
    this.stateTracker = new StateTracker(env);
  }

  // ============================================================================
  // Single Game Predictions
  // ============================================================================

  /**
   * Generate a complete prediction for a single game.
   *
   * Combines:
   * - Monte Carlo simulation (35%)
   * - ML logistic model (50%)
   * - Psychology adjustment (15%)
   */
  async predictGame(
    homeTeam: TeamState,
    awayTeam: TeamState,
    context: GameContext,
    options?: {
      tier?: SubscriptionTier;
      homeDiamond?: TeamDiamondScores;
      awayDiamond?: TeamDiamondScores;
    }
  ): Promise<GamePrediction> {
    const startTime = Date.now();
    const tier = options?.tier ?? 'free';

    // Check cache first
    const cacheKey = `prediction:${context.gameId}:${this.config.modelVersion}`;
    const cached = await this.stateTracker.getPrediction(context.gameId);
    if (cached && this.isCacheValid(cached.timestamp, CACHE_TTL.prediction)) {
      return this.formatCachedPrediction(cached, tier);
    }

    // Extract ML features
    const features = this.mlPredictor.extractFeatures(
      homeTeam,
      awayTeam,
      context,
      options?.homeDiamond,
      options?.awayDiamond
    );

    // Run Monte Carlo simulation
    const mcSimulation = await this.simulationCore.simulateGameN(
      homeTeam,
      awayTeam,
      context,
      this.config.simulationCount
    );

    // Get ML prediction
    const mlResult = this.mlPredictor.predictWithConfidence(features);

    // Calculate psychology adjustment
    const psychAdjustment = this.psychologyModel.calculatePsychAdjustment(
      { confidence: homeTeam.confidence, focus: homeTeam.focus, cohesion: homeTeam.cohesion, leadershipInfluence: homeTeam.leadershipInfluence },
      { confidence: awayTeam.confidence, focus: awayTeam.focus, cohesion: awayTeam.cohesion, leadershipInfluence: awayTeam.leadershipInfluence },
      context
    );

    // Blend predictions using configured weights
    const homeWinProb = this.blendPredictions(
      mcSimulation.homeWinProbability,
      mlResult.probability,
      psychAdjustment
    );

    const awayWinProb = 1 - homeWinProb;

    // Calculate spread and total
    const predictedSpread = this.mlPredictor.predictSpread(homeWinProb, context.sport);
    const predictedTotal = this.mlPredictor.predictTotal(homeTeam, awayTeam, context);

    // Generate explanation
    const explanation = this.generateExplanation(features, tier);

    // Calculate confidence interval
    const confidenceInterval = this.simulationCore.calculateConfidenceInterval(
      homeWinProb,
      this.config.simulationCount
    );

    const computeTime = Date.now() - startTime;

    const prediction: GamePrediction = {
      gameId: context.gameId,
      sport: context.sport,
      timestamp: new Date().toISOString(),
      homeTeam: {
        teamId: homeTeam.teamId,
        name: homeTeam.teamName,
        state: {
          confidence: homeTeam.confidence,
          focus: homeTeam.focus,
          cohesion: homeTeam.cohesion,
          leadershipInfluence: homeTeam.leadershipInfluence,
        },
      },
      awayTeam: {
        teamId: awayTeam.teamId,
        name: awayTeam.teamName,
        state: {
          confidence: awayTeam.confidence,
          focus: awayTeam.focus,
          cohesion: awayTeam.cohesion,
          leadershipInfluence: awayTeam.leadershipInfluence,
        },
      },
      homeWinProbability: Math.round(homeWinProb * 1000) / 1000,
      awayWinProbability: Math.round(awayWinProb * 1000) / 1000,
      confidenceInterval,
      predictedSpread,
      predictedTotal,
      spreadConfidence: this.calculateSpreadConfidence(mcSimulation),
      explanation,
      modelVersion: this.config.modelVersion,
      simulationCount: this.config.simulationCount,
      computeTimeMs: computeTime,
    };

    // Save prediction to D1
    await this.stateTracker.savePrediction(prediction);

    return prediction;
  }

  /**
   * Blend Monte Carlo, ML, and psychology predictions.
   */
  private blendPredictions(
    mcProb: number,
    mlProb: number,
    psychAdjustment: number
  ): number {
    const baseProb =
      this.config.monteCarloWeight * mcProb +
      this.config.mlWeight * mlProb;

    const adjustedProb = baseProb + this.config.psychologyWeight * psychAdjustment;

    // Ensure valid probability bounds
    return Math.max(0.03, Math.min(0.97, adjustedProb));
  }

  // ============================================================================
  // Season Projections
  // ============================================================================

  /**
   * Generate season projection for a team.
   */
  async projectSeason(
    team: TeamState,
    schedule: ScheduledGame[],
    opponents: Map<string, TeamState>
  ): Promise<SeasonProjection> {
    const seasonSim = await this.simulationCore.simulateSeason(
      team,
      schedule,
      opponents,
      this.config.simulationCount
    );

    // Calculate win distribution
    const winDistribution = this.calculateWinDistribution(
      seasonSim.winsPerSim,
      team.wins + team.losses + schedule.filter(g => !g.completed).length
    );

    // Calculate confidence interval
    const sortedWins = [...seasonSim.winsPerSim].sort((a, b) => a - b);
    const n = sortedWins.length;

    return {
      teamId: team.teamId,
      teamName: team.teamName,
      sport: team.sport,
      season: team.season,
      timestamp: new Date().toISOString(),
      projectedWins: seasonSim.avgWins,
      projectedLosses: seasonSim.avgLosses,
      winDistribution,
      playoffProbability: seasonSim.madePlayoffs / n,
      divisionWinProbability: seasonSim.wonDivision / n,
      conferenceWinProbability: seasonSim.wonConference / n,
      championshipProbability: seasonSim.wonChampionship / n,
      confidenceInterval: {
        lower: sortedWins[Math.floor(n * 0.05)],
        median: sortedWins[Math.floor(n * 0.5)],
        upper: sortedWins[Math.floor(n * 0.95)],
      },
      remainingGames: schedule.filter(g => !g.completed).length,
      strengthOfRemainingSchedule: this.calculateSOS(schedule, opponents),
      simulationCount: this.config.simulationCount,
      modelVersion: this.config.modelVersion,
    };
  }

  /**
   * Generate multi-season projection.
   */
  async projectMultiSeason(
    team: TeamState,
    schedules: Map<number, ScheduledGame[]>,
    opponents: Map<string, TeamState>,
    seasons: number[]
  ): Promise<MultiSeasonProjection> {
    const seasonProjections: SeasonProjection[] = [];

    let currentTeam = { ...team };

    for (const season of seasons) {
      const schedule = schedules.get(season) ?? [];

      const projection = await this.projectSeason(
        { ...currentTeam, season },
        schedule,
        opponents
      );

      seasonProjections.push(projection);

      // Apply off-season transition for next season
      if (season < seasons[seasons.length - 1]) {
        currentTeam = this.applyOffseasonDecay(currentTeam);
      }
    }

    // Aggregate multi-season metrics
    const totalWins = seasonProjections.reduce((sum, p) => sum + p.projectedWins, 0);
    const playoffApps = seasonProjections.reduce((sum, p) => sum + p.playoffProbability, 0);
    const anyChampionship = 1 - seasonProjections.reduce(
      (prod, p) => prod * (1 - p.championshipProbability),
      1
    );

    return {
      teamId: team.teamId,
      teamName: team.teamName,
      sport: team.sport,
      startSeason: seasons[0],
      endSeason: seasons[seasons.length - 1],
      seasonProjections,
      averageWinsPerSeason: totalWins / seasons.length,
      playoffAppearances: playoffApps,
      championshipProbability: anyChampionship,
      rosterTurnoverImpact: seasons.map(() => 0.15), // Placeholder
      coachingChangeRisk: seasons.map(() => 0.05), // Placeholder
      simulationCount: this.config.simulationCount,
      modelVersion: this.config.modelVersion,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // Batch Predictions
  // ============================================================================

  /**
   * Generate predictions for multiple games.
   */
  async predictBatch(
    games: Array<{
      homeTeam: TeamState;
      awayTeam: TeamState;
      context: GameContext;
    }>,
    tier: SubscriptionTier = 'free'
  ): Promise<GamePrediction[]> {
    const predictions: GamePrediction[] = [];

    for (const game of games) {
      const prediction = await this.predictGame(
        game.homeTeam,
        game.awayTeam,
        game.context,
        { tier }
      );
      predictions.push(prediction);
    }

    return predictions;
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Update team psychological state after a game.
   */
  async updateTeamStateAfterGame(
    teamId: string,
    sport: SupportedSport,
    season: number,
    outcome: {
      result: GameResult;
      margin: number;
      wasUpset: boolean;
      expectedMargin: number;
      opponentStrength: number;
      opponentId: string;
      gameNumber: number;
      winProbabilityPre: number;
      isPlayoff: boolean;
      isRivalry: boolean;
    }
  ): Promise<void> {
    // Fetch current state
    const currentState = await this.stateTracker.getTeamState(teamId, sport, season);

    // Get base psychological state or use defaults
    const currentPsych = currentState
      ? {
          confidence: currentState.confidence,
          focus: currentState.focus,
          cohesion: currentState.cohesion,
          leadershipInfluence: currentState.leadershipInfluence,
        }
      : {
          confidence: 0.5,
          focus: 0.5,
          cohesion: 0.5,
          leadershipInfluence: 0.5,
        };

    // Calculate new psychological state using the psychology model
    const gameOutcome = {
      result: outcome.result,
      margin: outcome.margin,
      wasUpset: outcome.wasUpset,
      expectationGap: outcome.margin - outcome.expectedMargin,
      performanceRating: outcome.result === 'W' ? 0.6 : 0.4,
      opponentStrength: outcome.opponentStrength,
      isPlayoff: outcome.isPlayoff,
      isRivalry: outcome.isRivalry,
    };

    const newPsych = this.psychologyModel.updateState(currentPsych, gameOutcome);

    // Save the updated state
    await this.stateTracker.updateTeamStateAfterGame(
      teamId,
      sport,
      season,
      outcome.gameNumber,
      {
        confidence: newPsych.confidence,
        focus: newPsych.focus,
        cohesion: newPsych.cohesion,
        leadershipInfluence: newPsych.leadershipInfluence,
        opponentId: outcome.opponentId,
        result: outcome.result,
        expectationGap: outcome.margin - outcome.expectedMargin,
        winProbabilityPre: outcome.winProbabilityPre,
      }
    );
  }

  /**
   * Get current team state (from cache or DB).
   */
  async getTeamState(
    teamId: string,
    sport: SupportedSport,
    season: number
  ): Promise<TeamState | null> {
    return this.stateTracker.getTeamState(teamId, sport, season);
  }

  // ============================================================================
  // Explainability
  // ============================================================================

  /**
   * Generate explanation for a prediction.
   */
  private generateExplanation(
    features: MLFeatures,
    tier: SubscriptionTier
  ): PredictionExplanation {
    const shapValues = this.mlPredictor.calculateShapValues(features);
    const topFactors = shapValues.slice(0, 5);

    // Generate human-readable summary
    const humanSummary = this.generateHumanSummary(topFactors, features);

    // Determine confidence level
    const confidence = this.determineConfidenceLevel(features);

    // Identify uncertainty drivers
    const uncertaintyDrivers = this.identifyUncertaintyDrivers(features);

    return {
      topFactors,
      shapSummary: tier === 'free' ? [] : shapValues,
      humanSummary,
      confidence,
      uncertaintyDrivers,
      requiresSubscription: tier === 'free',
    };
  }

  /**
   * Generate human-readable summary from SHAP values.
   */
  private generateHumanSummary(
    topFactors: ShapValue[],
    features: MLFeatures
  ): string {
    if (topFactors.length === 0) {
      return 'Unable to generate explanation.';
    }

    const parts: string[] = [];

    // Primary factor
    const primary = topFactors[0];
    if (primary.direction === 'positive') {
      parts.push(`The home team's ${primary.displayName.toLowerCase()} is the biggest factor favoring them.`);
    } else {
      parts.push(`The away team benefits most from their ${primary.displayName.toLowerCase()}.`);
    }

    // Secondary factors
    const positiveFactors = topFactors.filter(f => f.direction === 'positive').slice(0, 2);
    const negativeFactors = topFactors.filter(f => f.direction === 'negative').slice(0, 2);

    if (positiveFactors.length > 1) {
      parts.push(`Home advantages also include ${positiveFactors[1].displayName.toLowerCase()}.`);
    }

    if (negativeFactors.length > 0) {
      parts.push(`However, the away team has ${negativeFactors[0].displayName.toLowerCase()} working in their favor.`);
    }

    return parts.join(' ');
  }

  /**
   * Determine confidence level based on features.
   */
  private determineConfidenceLevel(features: MLFeatures): ConfidenceLevel {
    // Large rating difference = higher confidence
    const ratingSpread = Math.abs(features.ratingDiff);

    // Agreement between metrics = higher confidence
    const pythDiff = Math.abs(features.homePythagorean - features.awayPythagorean);

    // Rivalry games = lower confidence
    if (features.rivalryMultiplier > 0) {
      return 'medium';
    }

    if (ratingSpread > 150 && pythDiff > 0.15) {
      return 'high';
    } else if (ratingSpread < 50 || pythDiff < 0.05) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Identify sources of uncertainty.
   */
  private identifyUncertaintyDrivers(features: MLFeatures): string[] {
    const drivers: string[] = [];

    // Close matchup
    if (Math.abs(features.ratingDiff) < 50) {
      drivers.push('Teams are closely matched');
    }

    // Rivalry
    if (features.rivalryMultiplier > 0) {
      drivers.push('Rivalry games are historically unpredictable');
    }

    // Momentum mismatch
    if (Math.abs(features.homeMomentum - features.awayMomentum) > 0.6) {
      drivers.push('Significant momentum differential');
    }

    // Psychological instability
    if (Math.abs(features.confidenceDiff) > 0.3) {
      drivers.push('Large psychological state difference');
    }

    return drivers;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Calculate win distribution from simulation results.
   */
  private calculateWinDistribution(
    winsPerSim: number[],
    totalGames: number
  ): number[] {
    const distribution = new Array(totalGames + 1).fill(0);
    const n = winsPerSim.length;

    for (const wins of winsPerSim) {
      const idx = Math.min(Math.round(wins), totalGames);
      distribution[idx]++;
    }

    return distribution.map(count => count / n);
  }

  /**
   * Calculate strength of schedule.
   */
  private calculateSOS(
    schedule: ScheduledGame[],
    opponents: Map<string, TeamState>
  ): number {
    const remaining = schedule.filter(g => !g.completed);
    if (remaining.length === 0) return 0.5;

    let totalStrength = 0;
    let count = 0;

    for (const game of remaining) {
      const oppId = game.homeTeamId; // Simplified - would need team context
      const opponent = opponents.get(oppId);
      if (opponent) {
        totalStrength += opponent.pythagoreanExpectation;
        count++;
      }
    }

    return count > 0 ? totalStrength / count : 0.5;
  }

  /**
   * Calculate spread confidence from MC simulation.
   */
  private calculateSpreadConfidence(mcSim: AggregatedSimulation): number {
    // Higher confidence when distribution is tight
    const normalizedStdDev = mcSim.spreadStdDev / 15; // Normalize to typical range
    return Math.max(0.3, Math.min(0.95, 1 - normalizedStdDev));
  }

  /**
   * Apply off-season decay to team state.
   */
  private applyOffseasonDecay(team: TeamState): TeamState {
    return {
      ...team,
      confidence: team.confidence * 0.8 + 0.5 * 0.2,
      focus: 0.5,
      cohesion: team.cohesion * 0.7 + 0.5 * 0.3,
      leadershipInfluence: team.leadershipInfluence * 0.6 + 0.5 * 0.4,
      wins: 0,
      losses: 0,
      recentForm: [],
      streakType: null,
      streakLength: 0,
    };
  }

  /**
   * Check if cached data is still valid.
   */
  private isCacheValid(timestamp: string, ttlSeconds: number): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - cacheTime) < ttlSeconds * 1000;
  }

  /**
   * Format cached prediction with tier-appropriate data.
   */
  private formatCachedPrediction(
    cached: GamePrediction,
    tier: SubscriptionTier
  ): GamePrediction {
    if (tier === 'free') {
      return {
        ...cached,
        explanation: {
          ...cached.explanation,
          shapSummary: [],
          requiresSubscription: true,
        },
      };
    }
    return cached;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Get current configuration.
   */
  getConfig(): PredictionEngineConfig {
    return { ...this.config };
  }

  /**
   * Get model version.
   */
  getModelVersion(): string {
    return this.config.modelVersion;
  }
}
