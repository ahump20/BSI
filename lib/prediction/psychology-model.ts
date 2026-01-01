/**
 * BSI Predictive Modeling Engine - Psychology Model
 *
 * Implements stateful psychological modeling with game-by-game updates.
 * State evolution follows: C_{t+1} = α * C_t + β * f(outcome, expectation_gap) + ε
 *
 * Integrates with Diamond Certainty Engine for 8 champion dimensions.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  PsychologicalState,
  TeamState as _TeamState,
  GameOutcome,
  StateUpdateParams,
  OffseasonTransition,
  GameContext,
  ChampionDimensionKey,
  TeamDiamondScores,
  SupportedSport,
  PSYCHOLOGY_PARAMS as _PSYCHOLOGY_PARAMS,
} from './types';

// Default parameters for state updates
const DEFAULT_PARAMS: StateUpdateParams = {
  alpha: 0.75, // Persistence factor
  beta: 0.2, // Outcome sensitivity
  epsilon: 0.03, // Random noise amplitude
};

// Outcome impact multipliers based on context
const OUTCOME_MULTIPLIERS = {
  upset: 1.5, // Winning/losing an upset has larger impact
  playoff: 1.3, // Playoff games matter more psychologically
  rivalry: 1.2, // Rivalry games have extra emotional weight
  blowout: 1.2, // Large margins affect confidence more
};

// Diamond Certainty dimension weights for psychological state
const DIAMOND_WEIGHTS: Record<ChampionDimensionKey, Record<keyof PsychologicalState, number>> = {
  clutchGene: { confidence: 0.4, focus: 0.3, cohesion: 0.1, leadershipInfluence: 0.2 },
  killerInstinct: { confidence: 0.5, focus: 0.2, cohesion: 0.1, leadershipInfluence: 0.2 },
  flowState: { confidence: 0.2, focus: 0.5, cohesion: 0.2, leadershipInfluence: 0.1 },
  mentalFortress: { confidence: 0.3, focus: 0.3, cohesion: 0.2, leadershipInfluence: 0.2 },
  predatorMindset: { confidence: 0.4, focus: 0.3, cohesion: 0.1, leadershipInfluence: 0.2 },
  championAura: { confidence: 0.3, focus: 0.1, cohesion: 0.3, leadershipInfluence: 0.3 },
  winnerDNA: { confidence: 0.4, focus: 0.2, cohesion: 0.2, leadershipInfluence: 0.2 },
  beastMode: { confidence: 0.3, focus: 0.4, cohesion: 0.1, leadershipInfluence: 0.2 },
};

/**
 * PsychologyModel - Handles psychological state evolution.
 */
export class PsychologyModel {
  private readonly params: StateUpdateParams;

  constructor(params?: Partial<StateUpdateParams>) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  // ============================================================================
  // Core State Updates
  // ============================================================================

  /**
   * Update psychological state after a game outcome.
   *
   * Implements: C_{t+1} = α * C_t + β * f(outcome, expectation_gap) + ε
   */
  updateState(
    currentState: PsychologicalState,
    outcome: GameOutcome,
    params?: StateUpdateParams
  ): PsychologicalState {
    const p = params ?? this.params;

    // Calculate outcome impact
    const impact = this.calculateOutcomeImpact(outcome);

    // Generate random noise
    const noise = this.generateNoise(p.epsilon);

    // Apply state update equation to each variable
    const newState: PsychologicalState = {
      confidence: this.boundedUpdate(
        currentState.confidence,
        impact.confidence,
        noise.confidence,
        p
      ),
      focus: this.boundedUpdate(currentState.focus, impact.focus, noise.focus, p),
      cohesion: this.boundedUpdate(currentState.cohesion, impact.cohesion, noise.cohesion, p),
      leadershipInfluence: this.boundedUpdate(
        currentState.leadershipInfluence,
        impact.leadershipInfluence,
        noise.leadershipInfluence,
        p
      ),
    };

    return newState;
  }

  /**
   * Apply the state update equation for a single variable.
   *
   * C_{t+1} = α * C_t + β * f(outcome) + ε
   */
  private boundedUpdate(
    current: number,
    impact: number,
    noise: number,
    params: StateUpdateParams
  ): number {
    const newValue = params.alpha * current + params.beta * impact + noise;

    // Clamp to [0, 1] range
    return Math.max(0, Math.min(1, newValue));
  }

  /**
   * Calculate the psychological impact of a game outcome.
   */
  private calculateOutcomeImpact(outcome: GameOutcome): PsychologicalState {
    const baseImpact = outcome.result === 'W' ? 0.6 : outcome.result === 'L' ? 0.4 : 0.5;

    // Adjust for context
    let multiplier = 1.0;
    if (outcome.wasUpset) multiplier *= OUTCOME_MULTIPLIERS.upset;
    if (outcome.isPlayoff) multiplier *= OUTCOME_MULTIPLIERS.playoff;
    if (outcome.isRivalry) multiplier *= OUTCOME_MULTIPLIERS.rivalry;

    // Larger margins have more psychological impact
    const marginFactor = Math.min(Math.abs(outcome.margin) / 20, 1);
    if (Math.abs(outcome.margin) >= 14) multiplier *= OUTCOME_MULTIPLIERS.blowout;

    // Expectation gap affects confidence more than other factors
    // Positive gap = performed better than expected
    const gapImpact = outcome.expectationGap / 30; // Normalize to ~[-1, 1]

    // Win increases everything, loss decreases
    const direction = outcome.result === 'W' ? 1 : outcome.result === 'L' ? -1 : 0;

    return {
      confidence:
        baseImpact + direction * multiplier * (0.15 + marginFactor * 0.1) + gapImpact * 0.1,
      focus: baseImpact + direction * multiplier * 0.08,
      cohesion: baseImpact + direction * multiplier * 0.05,
      leadershipInfluence: baseImpact + direction * multiplier * (outcome.isPlayoff ? 0.1 : 0.05),
    };
  }

  /**
   * Generate random noise for state update.
   */
  private generateNoise(amplitude: number): PsychologicalState {
    const rand = () => (Math.random() - 0.5) * 2 * amplitude;
    return {
      confidence: rand(),
      focus: rand(),
      cohesion: rand(),
      leadershipInfluence: rand(),
    };
  }

  // ============================================================================
  // Psychological Adjustments for Predictions
  // ============================================================================

  /**
   * Calculate psychological adjustment to win probability.
   * Returns a value between -0.10 and +0.10 to add to base probability.
   */
  calculatePsychAdjustment(
    homeState: PsychologicalState,
    awayState: PsychologicalState,
    context: GameContext
  ): number {
    // Calculate composite psychological advantage
    const homePsychScore = this.calculateCompositeScore(homeState);
    const awayPsychScore = this.calculateCompositeScore(awayState);

    const psychDiff = homePsychScore - awayPsychScore;

    // Base adjustment from psychological difference
    let adjustment = psychDiff * 0.15; // Max ~7.5% swing

    // Context multipliers
    if (context.isPlayoff) {
      // Psychology matters more in playoffs
      adjustment *= 1.3;
    }

    if (context.isRivalry) {
      // Rivalry games are more emotional
      adjustment *= 1.2;
    }

    // Home team cohesion bonus
    if (context.location === 'home' && homeState.cohesion > 0.7) {
      adjustment += 0.02;
    }

    // Leadership matters more in close games
    const leadershipDiff = homeState.leadershipInfluence - awayState.leadershipInfluence;
    adjustment += leadershipDiff * 0.05;

    // Clamp adjustment to ±10%
    return Math.max(-0.1, Math.min(0.1, adjustment));
  }

  /**
   * Calculate composite psychological score (0-1).
   */
  calculateCompositeScore(state: PsychologicalState): number {
    return (
      state.confidence * 0.35 +
      state.focus * 0.25 +
      state.cohesion * 0.2 +
      state.leadershipInfluence * 0.2
    );
  }

  /**
   * Calculate momentum score based on recent form.
   * Returns value from -1 (cold) to +1 (hot).
   */
  calculateMomentum(recentForm: Array<'W' | 'L' | 'T'>): number {
    if (recentForm.length === 0) return 0;

    // Weight recent games more heavily
    let weightedSum = 0;
    let totalWeight = 0;

    recentForm.forEach((result, index) => {
      const weight = Math.pow(1.5, recentForm.length - 1 - index); // Most recent = highest weight
      const value = result === 'W' ? 1 : result === 'L' ? -1 : 0;
      weightedSum += value * weight;
      totalWeight += weight;
    });

    return weightedSum / totalWeight;
  }

  // ============================================================================
  // Diamond Certainty Engine Integration
  // ============================================================================

  /**
   * Integrate Diamond Certainty Engine scores into psychological state.
   *
   * Diamond Certainty provides 8 champion dimensions:
   * - clutchGene, killerInstinct, flowState, mentalFortress
   * - predatorMindset, championAura, winnerDNA, beastMode
   */
  integrateChampionDimensions(
    currentState: PsychologicalState,
    diamondScores: TeamDiamondScores,
    weight: number = 0.3
  ): PsychologicalState {
    // Calculate weighted contribution from each dimension
    const dimensionContributions: PsychologicalState = {
      confidence: 0,
      focus: 0,
      cohesion: 0,
      leadershipInfluence: 0,
    };

    // Aggregate dimension scores weighted by their impact on each psych variable
    for (const [dimension, score] of Object.entries(diamondScores.dimensions)) {
      const weights = DIAMOND_WEIGHTS[dimension as ChampionDimensionKey];
      if (!weights) continue;

      // Normalize score to 0-1 range (Diamond scores are 0-100)
      const normalizedScore = score / 100;

      dimensionContributions.confidence += normalizedScore * weights.confidence;
      dimensionContributions.focus += normalizedScore * weights.focus;
      dimensionContributions.cohesion += normalizedScore * weights.cohesion;
      dimensionContributions.leadershipInfluence += normalizedScore * weights.leadershipInfluence;
    }

    // Normalize contributions (8 dimensions)
    const numDimensions = Object.keys(diamondScores.dimensions).length || 1;
    const normFactor = 1 / numDimensions;

    // Blend current state with Diamond Certainty insights
    return {
      confidence: this.blend(
        currentState.confidence,
        dimensionContributions.confidence * normFactor,
        weight
      ),
      focus: this.blend(currentState.focus, dimensionContributions.focus * normFactor, weight),
      cohesion: this.blend(
        currentState.cohesion,
        dimensionContributions.cohesion * normFactor,
        weight
      ),
      leadershipInfluence: this.blend(
        currentState.leadershipInfluence,
        dimensionContributions.leadershipInfluence * normFactor,
        weight
      ),
    };
  }

  /**
   * Map specific Diamond dimensions to prediction adjustments.
   */
  getDimensionAdjustments(diamondScores: TeamDiamondScores): Record<string, number> {
    const dims = diamondScores.dimensions;

    return {
      // Clutch gene affects close-game performance
      clutchGameBoost: (dims.clutchGene / 100 - 0.5) * 0.05,

      // Mental fortress affects bounce-back after losses
      adversityResilience: dims.mentalFortress / 100,

      // Flow state affects consistency
      consistencyFactor: dims.flowState / 100,

      // Champion aura affects road performance
      roadBonus: (dims.championAura / 100 - 0.5) * 0.03,

      // Killer instinct affects closing out games
      closeOutFactor: dims.killerInstinct / 100,
    };
  }

  // ============================================================================
  // Off-Season Transitions
  // ============================================================================

  /**
   * Apply off-season reset with roster changes.
   *
   * New season state depends on:
   * - Carryover from previous season
   * - Roster turnover impact
   * - Coaching changes
   * - Recruiting class quality
   */
  applyOffseasonReset(
    previousState: PsychologicalState,
    transition: OffseasonTransition
  ): PsychologicalState {
    // Calculate carryover factor based on continuity
    const continuityFactor = 1 - transition.rosterTurnoverPct;
    const carryover = transition.confidenceCarryover * continuityFactor;

    // Coaching change resets cohesion
    const cohesionMultiplier = transition.coachingChange ? 0.5 : 0.85;

    // Strong recruiting class boosts confidence
    const recruitingBoost = (transition.recruitingRankPctile - 50) / 200; // -0.25 to +0.25

    // Transfer portal impact
    const portalBoost = Math.max(-0.1, Math.min(0.1, transition.transferPortalNetGain * 0.02));

    // Calculate new state
    const baseConfidence = 0.5 + recruitingBoost + portalBoost;
    const baseCohesion = transition.coachingChange ? 0.4 : 0.5;

    return {
      confidence: this.blend(previousState.confidence, baseConfidence, 1 - carryover),
      focus: 0.5, // Reset to neutral
      cohesion: this.blend(
        previousState.cohesion * cohesionMultiplier,
        baseCohesion,
        transition.rosterTurnoverPct
      ),
      leadershipInfluence: this.calculateNewLeadership(
        previousState.leadershipInfluence,
        transition.keyDeparturesImpact,
        transition.rosterTurnoverPct
      ),
    };
  }

  /**
   * Calculate leadership influence for new season.
   */
  private calculateNewLeadership(
    previous: number,
    keyDeparturesImpact: number,
    rosterTurnover: number
  ): number {
    // Key departures significantly reduce leadership
    const departurePenalty = keyDeparturesImpact * 0.3;

    // High turnover reduces existing leadership carryover
    const carryover = (1 - rosterTurnover) * previous;

    // New leadership takes time to emerge
    const emergentLeadership = 0.4 + Math.random() * 0.2;

    return Math.max(
      0.2,
      Math.min(0.8, carryover * (1 - departurePenalty) + emergentLeadership * rosterTurnover)
    );
  }

  // ============================================================================
  // State Initialization
  // ============================================================================

  /**
   * Initialize state for a new team (no prior data).
   */
  initializeState(
    sport: SupportedSport,
    context?: {
      recruiting?: number; // 0-100 percentile
      returningStarters?: number; // Count
      preseasonRanking?: number; // Rank (lower = better)
    }
  ): PsychologicalState {
    // Default neutral state
    let confidence = 0.5;
    let cohesion = 0.5;
    let leadership = 0.5;

    if (context) {
      // Adjust based on recruiting
      if (context.recruiting !== undefined) {
        confidence += (context.recruiting - 50) / 200;
      }

      // Returning starters boost cohesion
      if (context.returningStarters !== undefined) {
        const starterBoost = Math.min(context.returningStarters / 15, 1);
        cohesion += starterBoost * 0.2;
        leadership += starterBoost * 0.15;
      }

      // Preseason ranking affects confidence
      if (context.preseasonRanking !== undefined) {
        const rankBoost = Math.max(0, (25 - context.preseasonRanking) / 50);
        confidence += rankBoost;
      }
    }

    return {
      confidence: Math.max(0.2, Math.min(0.8, confidence)),
      focus: 0.5,
      cohesion: Math.max(0.3, Math.min(0.8, cohesion)),
      leadershipInfluence: Math.max(0.3, Math.min(0.8, leadership)),
    };
  }

  // ============================================================================
  // Biometric Integration (WHOOP)
  // ============================================================================

  /**
   * Adjust psychological state based on biometric data.
   *
   * WHOOP provides:
   * - HRV (heart rate variability) - stress/recovery indicator
   * - Recovery score - readiness percentage
   * - Sleep performance - rest quality
   * - Strain level - accumulated fatigue
   */
  integratebiometrics(
    currentState: PsychologicalState,
    biometrics: {
      hrvDeviation?: number; // Deviation from baseline (negative = stressed)
      recoveryScore?: number; // 0-1
      sleepPerformance?: number; // 0-1
      strainLevel?: number; // 0-1 (higher = more fatigued)
    },
    weight: number = 0.2
  ): PsychologicalState {
    const adjustments: Partial<PsychologicalState> = {};

    // HRV deviation affects focus and confidence
    if (biometrics.hrvDeviation !== undefined) {
      const hrvImpact = Math.max(-0.15, Math.min(0.15, biometrics.hrvDeviation / 20));
      adjustments.focus = currentState.focus + hrvImpact * weight;
      adjustments.confidence = currentState.confidence + hrvImpact * 0.5 * weight;
    }

    // Recovery score affects overall readiness
    if (biometrics.recoveryScore !== undefined) {
      const recoveryImpact = (biometrics.recoveryScore - 0.5) * 0.3;
      adjustments.focus = (adjustments.focus ?? currentState.focus) + recoveryImpact * weight;
    }

    // Sleep performance affects focus
    if (biometrics.sleepPerformance !== undefined) {
      const sleepImpact = (biometrics.sleepPerformance - 0.5) * 0.2;
      adjustments.focus = (adjustments.focus ?? currentState.focus) + sleepImpact * weight;
    }

    // High strain reduces confidence slightly
    if (biometrics.strainLevel !== undefined && biometrics.strainLevel > 0.7) {
      const strainPenalty = (biometrics.strainLevel - 0.7) * 0.15;
      adjustments.confidence =
        (adjustments.confidence ?? currentState.confidence) - strainPenalty * weight;
    }

    return {
      confidence: Math.max(0, Math.min(1, adjustments.confidence ?? currentState.confidence)),
      focus: Math.max(0, Math.min(1, adjustments.focus ?? currentState.focus)),
      cohesion: currentState.cohesion, // Cohesion not affected by individual biometrics
      leadershipInfluence: currentState.leadershipInfluence,
    };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Blend two values with a weight factor.
   */
  private blend(a: number, b: number, weight: number): number {
    return a * (1 - weight) + b * weight;
  }

  /**
   * Get parameters for debugging/logging.
   */
  getParams(): StateUpdateParams {
    return { ...this.params };
  }
}
