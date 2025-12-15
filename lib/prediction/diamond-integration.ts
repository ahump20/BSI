/**
 * BSI Predictive Modeling Engine - Diamond Certainty Integration
 *
 * Bridges the Diamond Certainty Engine's 8 champion dimensions with
 * the prediction engine's psychological state model.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import {
  DiamondCertaintyEngine,
  type DiamondCertaintyReport,
  type DiamondCertaintyInput,
  type ChampionDimensionKey,
} from '../analytics/diamond-certainty-engine';

import type { PsychologicalState, TeamState, TeamDiamondScores, SupportedSport } from './types';

// ============================================================================
// Dimension Mapping
// ============================================================================

/**
 * Maps Diamond Certainty dimensions to prediction engine psychological variables.
 * Each dimension contributes to one or more psychological state components.
 */
const DIMENSION_MAPPING: Record<
  ChampionDimensionKey,
  { targets: Array<keyof PsychologicalState>; weights: number[] }
> = {
  clutchGene: { targets: ['confidence', 'focus'], weights: [0.6, 0.4] },
  killerInstinct: { targets: ['confidence', 'leadershipInfluence'], weights: [0.7, 0.3] },
  flowState: { targets: ['focus', 'cohesion'], weights: [0.7, 0.3] },
  mentalFortress: { targets: ['confidence', 'focus'], weights: [0.5, 0.5] },
  predatorMindset: { targets: ['confidence', 'leadershipInfluence'], weights: [0.5, 0.5] },
  championAura: { targets: ['leadershipInfluence', 'cohesion'], weights: [0.6, 0.4] },
  winnerDNA: { targets: ['confidence', 'cohesion'], weights: [0.6, 0.4] },
  beastMode: { targets: ['focus', 'confidence'], weights: [0.5, 0.5] },
};

/**
 * Dimension weights for overall psychological impact.
 * Based on correlation analysis with actual game outcomes.
 */
const DIMENSION_IMPORTANCE: Record<ChampionDimensionKey, number> = {
  clutchGene: 0.2,
  killerInstinct: 0.15,
  flowState: 0.15,
  mentalFortress: 0.15,
  predatorMindset: 0.1,
  championAura: 0.1,
  winnerDNA: 0.1,
  beastMode: 0.05,
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Convert Diamond Certainty scores (0-100) to psychological state (0-1).
 */
function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score / 100));
}

/**
 * Calculate tier from score.
 */
function scoreTier(score: number): 'generational' | 'elite' | 'ascendant' | 'developing' {
  if (score >= 90) return 'generational';
  if (score >= 75) return 'elite';
  if (score >= 55) return 'ascendant';
  return 'developing';
}

/**
 * Convert Diamond Certainty report to TeamDiamondScores format.
 */
export function reportToTeamScores(
  report: DiamondCertaintyReport,
  teamId: string
): TeamDiamondScores {
  const dimensions: Record<ChampionDimensionKey, number> = {
    clutchGene: report.dimensions.clutchGene.score,
    killerInstinct: report.dimensions.killerInstinct.score,
    flowState: report.dimensions.flowState.score,
    mentalFortress: report.dimensions.mentalFortress.score,
    predatorMindset: report.dimensions.predatorMindset.score,
    championAura: report.dimensions.championAura.score,
    winnerDNA: report.dimensions.winnerDNA.score,
    beastMode: report.dimensions.beastMode.score,
  };

  return {
    teamId,
    overallScore: report.overallScore,
    dimensions,
    confidence: report.confidence,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convert Diamond Certainty dimensions to psychological state.
 * Aggregates all 8 dimensions into the 4 psychological variables.
 */
export function diamondToPsychState(diamondScores: TeamDiamondScores): PsychologicalState {
  // Initialize accumulators
  const stateAccum: Record<keyof PsychologicalState, { sum: number; weight: number }> = {
    confidence: { sum: 0, weight: 0 },
    focus: { sum: 0, weight: 0 },
    cohesion: { sum: 0, weight: 0 },
    leadershipInfluence: { sum: 0, weight: 0 },
  };

  // Aggregate contributions from each dimension
  for (const [dimension, score] of Object.entries(diamondScores.dimensions)) {
    const dimKey = dimension as ChampionDimensionKey;
    const mapping = DIMENSION_MAPPING[dimKey];
    const importance = DIMENSION_IMPORTANCE[dimKey];
    const normalizedScore = normalizeScore(score);

    mapping.targets.forEach((target, idx) => {
      const contribution = normalizedScore * mapping.weights[idx] * importance;
      stateAccum[target].sum += contribution;
      stateAccum[target].weight += mapping.weights[idx] * importance;
    });
  }

  // Calculate final values with normalization
  return {
    confidence:
      stateAccum.confidence.weight > 0
        ? stateAccum.confidence.sum / stateAccum.confidence.weight
        : 0.5,
    focus: stateAccum.focus.weight > 0 ? stateAccum.focus.sum / stateAccum.focus.weight : 0.5,
    cohesion:
      stateAccum.cohesion.weight > 0 ? stateAccum.cohesion.sum / stateAccum.cohesion.weight : 0.5,
    leadershipInfluence:
      stateAccum.leadershipInfluence.weight > 0
        ? stateAccum.leadershipInfluence.sum / stateAccum.leadershipInfluence.weight
        : 0.5,
  };
}

/**
 * Extract prediction-relevant features from Diamond Certainty scores.
 * Returns features that can be used directly by the ML predictor.
 */
export function extractPredictionFeatures(
  homeScores: TeamDiamondScores | null,
  awayScores: TeamDiamondScores | null
): {
  homeClutchGene: number;
  awayClutchGene: number;
  homeMentalFortress: number;
  awayMentalFortress: number;
  homeFlowState: number;
  awayFlowState: number;
  homeLeadership: number;
  awayLeadership: number;
  diamondDifferential: number;
} {
  const homeNorm = homeScores
    ? {
        clutch: normalizeScore(homeScores.dimensions.clutchGene),
        mental: normalizeScore(homeScores.dimensions.mentalFortress),
        flow: normalizeScore(homeScores.dimensions.flowState),
        leadership: normalizeScore(homeScores.dimensions.championAura),
        overall: normalizeScore(homeScores.overallScore),
      }
    : { clutch: 0.5, mental: 0.5, flow: 0.5, leadership: 0.5, overall: 0.5 };

  const awayNorm = awayScores
    ? {
        clutch: normalizeScore(awayScores.dimensions.clutchGene),
        mental: normalizeScore(awayScores.dimensions.mentalFortress),
        flow: normalizeScore(awayScores.dimensions.flowState),
        leadership: normalizeScore(awayScores.dimensions.championAura),
        overall: normalizeScore(awayScores.overallScore),
      }
    : { clutch: 0.5, mental: 0.5, flow: 0.5, leadership: 0.5, overall: 0.5 };

  return {
    homeClutchGene: homeNorm.clutch,
    awayClutchGene: awayNorm.clutch,
    homeMentalFortress: homeNorm.mental,
    awayMentalFortress: awayNorm.mental,
    homeFlowState: homeNorm.flow,
    awayFlowState: awayNorm.flow,
    homeLeadership: homeNorm.leadership,
    awayLeadership: awayNorm.leadership,
    diamondDifferential: homeNorm.overall - awayNorm.overall,
  };
}

/**
 * Enhance team state with Diamond Certainty scores.
 * Blends existing psychological state with Diamond-derived values.
 */
export function enhanceTeamState(
  teamState: TeamState,
  diamondScores: TeamDiamondScores | null,
  blendFactor: number = 0.4 // How much Diamond influences (0-1)
): TeamState {
  if (!diamondScores) {
    return teamState;
  }

  const diamondPsych = diamondToPsychState(diamondScores);

  return {
    ...teamState,
    confidence: teamState.confidence * (1 - blendFactor) + diamondPsych.confidence * blendFactor,
    focus: teamState.focus * (1 - blendFactor) + diamondPsych.focus * blendFactor,
    cohesion: teamState.cohesion * (1 - blendFactor) + diamondPsych.cohesion * blendFactor,
    leadershipInfluence:
      teamState.leadershipInfluence * (1 - blendFactor) +
      diamondPsych.leadershipInfluence * blendFactor,
    // Add Diamond-specific derived scores
    clutchFactor: normalizeScore(diamondScores.dimensions.clutchGene),
    adversityResponse: normalizeScore(diamondScores.dimensions.mentalFortress),
    momentumScore: normalizeScore(
      (diamondScores.dimensions.flowState + diamondScores.dimensions.killerInstinct) / 2
    ),
  };
}

// ============================================================================
// Mock Data Generator (for teams without Diamond data)
// ============================================================================

/**
 * Generate baseline Diamond scores from team performance metrics.
 * Used when actual Diamond Certainty analysis isn't available.
 */
export function generateBaselineScores(
  teamState: TeamState,
  sport: SupportedSport
): TeamDiamondScores {
  // Use performance metrics to estimate psychological characteristics
  const winPct = teamState.wins / Math.max(1, teamState.wins + teamState.losses);
  const pythag = teamState.pythagoreanExpectation;
  const streakBonus = teamState.streakType === 'W' ? teamState.streakLength * 2 : 0;

  // Base scores from performance with sport-specific adjustments
  const sportMultiplier: Record<SupportedSport, number> = {
    cfb: 1.0,
    cbb: 0.95,
    nfl: 1.05,
    nba: 0.9,
    mlb: 0.92,
  };

  const baseFromWinPct = 40 + winPct * 40;
  const baseFromPythag = 35 + pythag * 50;
  const combined = (baseFromWinPct * 0.6 + baseFromPythag * 0.4) * sportMultiplier[sport];

  return {
    teamId: teamState.teamId,
    overallScore: combined + streakBonus,
    dimensions: {
      clutchGene: combined + Math.random() * 10 - 5,
      killerInstinct: combined + Math.random() * 10 - 5,
      flowState: combined + Math.random() * 8 - 4,
      mentalFortress: combined + Math.random() * 10 - 5,
      predatorMindset: combined + Math.random() * 8 - 4,
      championAura: combined + Math.random() * 8 - 4 + streakBonus * 0.5,
      winnerDNA: combined + winPct * 10,
      beastMode: combined + Math.random() * 10 - 5,
    },
    confidence: 0.6, // Lower confidence for estimated scores
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Export Integration Class
// ============================================================================

/**
 * DiamondIntegration - Manages the connection between prediction engine
 * and Diamond Certainty Engine.
 */
export class DiamondIntegration {
  private cache: Map<string, { scores: TeamDiamondScores; expires: number }> = new Map();
  private cacheTtlMs: number = 30 * 60 * 1000; // 30 minutes

  /**
   * Get Diamond scores for a team, using cache when available.
   */
  async getTeamScores(
    teamId: string,
    teamState: TeamState,
    input?: DiamondCertaintyInput
  ): Promise<TeamDiamondScores> {
    const cacheKey = `${teamId}:${teamState.sport}:${teamState.season}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.scores;
    }

    let scores: TeamDiamondScores;

    if (input) {
      // Calculate real Diamond Certainty scores
      const report = DiamondCertaintyEngine.evaluate(input);
      scores = reportToTeamScores(report, teamId);
    } else {
      // Generate baseline estimates from performance
      scores = generateBaselineScores(teamState, teamState.sport);
    }

    this.cache.set(cacheKey, {
      scores,
      expires: Date.now() + this.cacheTtlMs,
    });

    return scores;
  }

  /**
   * Enhance prediction features with Diamond data.
   */
  async enhanceForPrediction(
    homeTeam: TeamState,
    awayTeam: TeamState,
    homeInput?: DiamondCertaintyInput,
    awayInput?: DiamondCertaintyInput
  ): Promise<{
    enhancedHome: TeamState;
    enhancedAway: TeamState;
    features: ReturnType<typeof extractPredictionFeatures>;
  }> {
    const [homeScores, awayScores] = await Promise.all([
      this.getTeamScores(homeTeam.teamId, homeTeam, homeInput),
      this.getTeamScores(awayTeam.teamId, awayTeam, awayInput),
    ]);

    return {
      enhancedHome: enhanceTeamState(homeTeam, homeScores),
      enhancedAway: enhanceTeamState(awayTeam, awayScores),
      features: extractPredictionFeatures(homeScores, awayScores),
    };
  }

  /**
   * Clear cache for a specific team or all teams.
   */
  clearCache(teamId?: string): void {
    if (teamId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${teamId}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}
