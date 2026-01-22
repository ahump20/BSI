/**
 * BSI Predictive Modeling Engine - ML Predictor
 *
 * Logistic regression model with psychological and contextual features.
 * Provides feature extraction and SHAP-compatible value calculation.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  SupportedSport,
  TeamState,
  GameContext,
  MLFeatures,
  ShapValue,
  PsychologicalState,
  TeamDiamondScores,
} from './types';

import { PYTHAGOREAN_EXPONENTS, HOME_ADVANTAGE } from './types';

// ============================================================================
// Model Weights
// ============================================================================

/**
 * Logistic regression weights for win probability.
 *
 * These are calibrated baseline weights. In production, would be trained
 * on historical data with gradient descent / scikit-learn equivalent.
 */
const MODEL_WEIGHTS: Record<string, number> = {
  // Core team strength
  ratingDiff: 0.012, // Per rating point difference
  pythagoreanDiff: 2.5, // Pythagorean expectation difference

  // Recent form
  homeRecentWinPct: 0.8,
  awayRecentWinPct: -0.8,
  homeMomentum: 0.15,
  awayMomentum: -0.15,

  // Context
  homeFieldAdvantage: 0.25, // Location multiplier
  restDaysDiff: 0.02, // Per day advantage
  travelDistance: -0.0001, // Per mile (away team travel)
  rivalryMultiplier: -0.1, // Rivalries are more unpredictable
  playoffMultiplier: 0.05, // Slight boost for higher-rated team

  // Psychological factors
  confidenceDiff: 0.6,
  cohesionDiff: 0.3,
  leadershipDiff: 0.4,
  focusDiff: 0.25,

  // Diamond Certainty
  clutchGeneDiff: 0.15,
  mentalFortressDiff: 0.12,

  // Intercept (bias)
  intercept: 0.0,
};

/**
 * Feature importance for SHAP-like calculation.
 * Maps to human-readable names and baseline values.
 */
const FEATURE_META: Record<string, { displayName: string; baseline: number }> = {
  ratingDiff: { displayName: 'Rating Advantage', baseline: 0 },
  pythagoreanDiff: { displayName: 'Efficiency Advantage', baseline: 0 },
  homeRecentWinPct: { displayName: 'Home Recent Form', baseline: 0.5 },
  awayRecentWinPct: { displayName: 'Away Recent Form', baseline: 0.5 },
  homeMomentum: { displayName: 'Home Momentum', baseline: 0 },
  awayMomentum: { displayName: 'Away Momentum', baseline: 0 },
  homeFieldAdvantage: { displayName: 'Home Field', baseline: 0.5 },
  restDaysDiff: { displayName: 'Rest Advantage', baseline: 0 },
  travelDistance: { displayName: 'Travel Impact', baseline: 0 },
  rivalryMultiplier: { displayName: 'Rivalry Factor', baseline: 0 },
  playoffMultiplier: { displayName: 'Playoff Stakes', baseline: 0 },
  confidenceDiff: { displayName: 'Confidence Edge', baseline: 0 },
  cohesionDiff: { displayName: 'Team Chemistry', baseline: 0 },
  leadershipDiff: { displayName: 'Leadership Factor', baseline: 0 },
  focusDiff: { displayName: 'Focus Advantage', baseline: 0 },
  clutchGeneDiff: { displayName: 'Clutch Performance', baseline: 0 },
  mentalFortressDiff: { displayName: 'Mental Toughness', baseline: 0 },
};

// ============================================================================
// MLPredictor Class
// ============================================================================

export class MLPredictor {
  private readonly weights: Record<string, number>;

  constructor(weights?: Record<string, number>) {
    this.weights = weights ?? MODEL_WEIGHTS;
  }

  // ============================================================================
  // Feature Extraction
  // ============================================================================

  /**
   * Extract ML features from team states and game context.
   */
  extractFeatures(
    homeTeam: TeamState,
    awayTeam: TeamState,
    context: GameContext,
    homeDiamond?: TeamDiamondScores,
    awayDiamond?: TeamDiamondScores
  ): MLFeatures {
    // Core metrics
    const homeRating = homeTeam.rating;
    const awayRating = awayTeam.rating;
    const ratingDiff = homeRating - awayRating;

    const homePythagorean = homeTeam.pythagoreanExpectation;
    const awayPythagorean = awayTeam.pythagoreanExpectation;

    // Recent form
    const homeRecentWinPct = this.calculateRecentWinPct(homeTeam.recentForm);
    const awayRecentWinPct = this.calculateRecentWinPct(awayTeam.recentForm);
    const homeMomentum = this.calculateMomentum(homeTeam);
    const awayMomentum = this.calculateMomentum(awayTeam);

    // Context
    const homeFieldAdvantage =
      context.location === 'home' ? 1 : context.location === 'away' ? 0 : 0.5;
    const restDaysDiff = context.restDays.home - context.restDays.away;
    const travelDistance = context.travelDistance ?? 0;
    const rivalryMultiplier = context.isRivalry ? 1 : 0;
    const playoffMultiplier = context.isPlayoff ? 1 : 0;

    // Psychological state
    const homeConfidence = homeTeam.confidence;
    const awayConfidence = awayTeam.confidence;
    const confidenceDiff = homeConfidence - awayConfidence;
    const homeCohesion = homeTeam.cohesion;
    const awayCohesion = awayTeam.cohesion;
    const homeLeadership = homeTeam.leadershipInfluence;
    const awayLeadership = awayTeam.leadershipInfluence;

    // Diamond Certainty dimensions
    const homeClutchGene = homeDiamond?.dimensions.clutchGene ?? 50;
    const awayClutchGene = awayDiamond?.dimensions.clutchGene ?? 50;
    const homeMentalFortress = homeDiamond?.dimensions.mentalFortress ?? 50;
    const awayMentalFortress = awayDiamond?.dimensions.mentalFortress ?? 50;

    // Sport-specific features
    const sportSpecific = this.extractSportSpecificFeatures(homeTeam, awayTeam, context);

    return {
      homeRating,
      awayRating,
      ratingDiff,
      homePythagorean,
      awayPythagorean,
      homeRecentWinPct,
      awayRecentWinPct,
      homeMomentum,
      awayMomentum,
      homeFieldAdvantage,
      restDaysDiff,
      travelDistance,
      rivalryMultiplier,
      playoffMultiplier,
      homeConfidence,
      awayConfidence,
      confidenceDiff,
      homeCohesion,
      awayCohesion,
      homeLeadership,
      awayLeadership,
      homeClutchGene,
      awayClutchGene,
      homeMentalFortress,
      awayMentalFortress,
      sportSpecific,
    };
  }

  /**
   * Calculate recent win percentage from form array.
   */
  private calculateRecentWinPct(recentForm: Array<'W' | 'L' | 'T'>): number {
    if (recentForm.length === 0) return 0.5;

    const wins = recentForm.filter((r) => r === 'W').length;
    const ties = recentForm.filter((r) => r === 'T').length;

    return (wins + ties * 0.5) / recentForm.length;
  }

  /**
   * Calculate momentum from streak information.
   */
  private calculateMomentum(team: TeamState): number {
    if (!team.streakType) return 0;

    const direction = team.streakType === 'W' ? 1 : -1;
    // Diminishing returns after 3 games
    const magnitude = Math.min(team.streakLength, 5) / 5;

    return direction * magnitude;
  }

  /**
   * Extract sport-specific features.
   */
  private extractSportSpecificFeatures(
    homeTeam: TeamState,
    awayTeam: TeamState,
    context: GameContext
  ): Record<string, number> {
    const sport = homeTeam.sport;
    const features: Record<string, number> = {};

    switch (sport) {
      case 'cfb':
        // College football specific
        features.homeRunningGameEdge = 0; // Would come from detailed stats
        features.passingEfficiencyDiff = 0;
        features.turnoverMarginDiff = 0;
        break;

      case 'cbb':
        // College basketball specific
        features.tempoMatch = 0; // Pace compatibility
        features.threePointDiff = 0;
        features.reboundingEdge = 0;
        break;

      case 'nfl':
        // NFL specific
        features.offensiveLineRating = 0;
        features.defensiveRating = 0;
        features.specialTeamsEdge = 0;
        break;

      case 'nba':
        // NBA specific
        features.netRatingDiff = 0;
        features.paceAdjustedEfficiency = 0;
        features.clutchNetRating = 0;
        break;

      case 'mlb':
        // MLB specific
        features.runDifferential =
          homeTeam.pointsFor -
          homeTeam.pointsAgainst -
          (awayTeam.pointsFor - awayTeam.pointsAgainst);
        features.startingPitcherEdge = 0;
        features.bullpenAdvantage = 0;
        break;
    }

    return features;
  }

  // ============================================================================
  // Prediction
  // ============================================================================

  /**
   * Predict home win probability using logistic regression.
   */
  predict(features: MLFeatures): number {
    // Calculate linear combination
    let linearSum = this.weights.intercept;

    // Rating and efficiency
    linearSum += features.ratingDiff * this.weights.ratingDiff;
    linearSum +=
      (features.homePythagorean - features.awayPythagorean) * this.weights.pythagoreanDiff;

    // Recent form
    linearSum += features.homeRecentWinPct * this.weights.homeRecentWinPct;
    linearSum += features.awayRecentWinPct * this.weights.awayRecentWinPct;
    linearSum += features.homeMomentum * this.weights.homeMomentum;
    linearSum += features.awayMomentum * this.weights.awayMomentum;

    // Context
    linearSum += features.homeFieldAdvantage * this.weights.homeFieldAdvantage;
    linearSum += features.restDaysDiff * this.weights.restDaysDiff;
    linearSum += features.travelDistance * this.weights.travelDistance;
    linearSum += features.rivalryMultiplier * this.weights.rivalryMultiplier;
    linearSum += features.playoffMultiplier * this.weights.playoffMultiplier;

    // Psychological
    linearSum += features.confidenceDiff * this.weights.confidenceDiff;
    linearSum += (features.homeCohesion - features.awayCohesion) * this.weights.cohesionDiff;
    linearSum += (features.homeLeadership - features.awayLeadership) * this.weights.leadershipDiff;

    // Diamond Certainty
    const clutchDiff = (features.homeClutchGene - features.awayClutchGene) / 100;
    const mentalDiff = (features.homeMentalFortress - features.awayMentalFortress) / 100;
    linearSum += clutchDiff * this.weights.clutchGeneDiff;
    linearSum += mentalDiff * this.weights.mentalFortressDiff;

    // Apply sigmoid function
    const probability = 1 / (1 + Math.exp(-linearSum));

    // Clamp to reasonable bounds
    return Math.max(0.03, Math.min(0.97, probability));
  }

  /**
   * Predict with confidence interval.
   */
  predictWithConfidence(features: MLFeatures): {
    probability: number;
    lower: number;
    upper: number;
  } {
    const probability = this.predict(features);

    // Uncertainty based on feature extremity
    const uncertaintyFactors = [
      Math.abs(features.ratingDiff) > 200 ? 0.02 : 0,
      features.rivalryMultiplier ? 0.03 : 0,
      Math.abs(features.confidenceDiff) > 0.3 ? 0.02 : 0,
    ];

    const totalUncertainty = 0.05 + uncertaintyFactors.reduce((a, b) => a + b, 0);

    return {
      probability,
      lower: Math.max(0.03, probability - totalUncertainty),
      upper: Math.min(0.97, probability + totalUncertainty),
    };
  }

  // ============================================================================
  // SHAP-like Feature Attribution
  // ============================================================================

  /**
   * Calculate SHAP-like values for each feature.
   *
   * Uses a simplified approach: contribution = weight * (value - baseline)
   * For full SHAP, would need model retraining with feature perturbation.
   */
  calculateShapValues(features: MLFeatures): ShapValue[] {
    const shapValues: ShapValue[] = [];

    // Calculate base probability (neutral features)
    const baseProb = 0.5;
    const actualProb = this.predict(features);

    // Calculate contribution of each feature
    const contributions = this.calculateFeatureContributions(features);

    for (const [feature, contribution] of Object.entries(contributions)) {
      const meta = FEATURE_META[feature];
      if (!meta) continue;

      const value = this.getFeatureValue(features, feature);

      shapValues.push({
        feature,
        displayName: meta.displayName,
        value,
        shapValue: contribution,
        direction: contribution >= 0 ? 'positive' : 'negative',
        importance: Math.abs(contribution),
      });
    }

    // Sort by importance
    shapValues.sort((a, b) => b.importance - a.importance);

    return shapValues;
  }

  /**
   * Calculate individual feature contributions.
   */
  private calculateFeatureContributions(features: MLFeatures): Record<string, number> {
    const contributions: Record<string, number> = {};

    // Rating contribution
    contributions.ratingDiff = features.ratingDiff * this.weights.ratingDiff;

    // Pythagorean contribution
    contributions.pythagoreanDiff =
      (features.homePythagorean - features.awayPythagorean) * this.weights.pythagoreanDiff;

    // Form contributions
    contributions.homeRecentWinPct =
      (features.homeRecentWinPct - 0.5) * this.weights.homeRecentWinPct;
    contributions.awayRecentWinPct =
      (features.awayRecentWinPct - 0.5) * this.weights.awayRecentWinPct;
    contributions.homeMomentum = features.homeMomentum * this.weights.homeMomentum;
    contributions.awayMomentum = features.awayMomentum * this.weights.awayMomentum;

    // Context contributions
    contributions.homeFieldAdvantage =
      (features.homeFieldAdvantage - 0.5) * this.weights.homeFieldAdvantage * 2;
    contributions.restDaysDiff = features.restDaysDiff * this.weights.restDaysDiff;
    contributions.rivalryMultiplier = features.rivalryMultiplier * this.weights.rivalryMultiplier;
    contributions.playoffMultiplier = features.playoffMultiplier * this.weights.playoffMultiplier;

    // Psychological contributions
    contributions.confidenceDiff = features.confidenceDiff * this.weights.confidenceDiff;
    contributions.cohesionDiff =
      (features.homeCohesion - features.awayCohesion) * this.weights.cohesionDiff;
    contributions.leadershipDiff =
      (features.homeLeadership - features.awayLeadership) * this.weights.leadershipDiff;
    contributions.focusDiff =
      (features.homeConfidence - features.awayConfidence) * this.weights.focusDiff;

    // Diamond contributions
    contributions.clutchGeneDiff =
      ((features.homeClutchGene - features.awayClutchGene) / 100) * this.weights.clutchGeneDiff;
    contributions.mentalFortressDiff =
      ((features.homeMentalFortress - features.awayMentalFortress) / 100) *
      this.weights.mentalFortressDiff;

    return contributions;
  }

  /**
   * Get feature value by name.
   */
  private getFeatureValue(features: MLFeatures, featureName: string): number {
    switch (featureName) {
      case 'ratingDiff':
        return features.ratingDiff;
      case 'pythagoreanDiff':
        return features.homePythagorean - features.awayPythagorean;
      case 'homeRecentWinPct':
        return features.homeRecentWinPct;
      case 'awayRecentWinPct':
        return features.awayRecentWinPct;
      case 'homeMomentum':
        return features.homeMomentum;
      case 'awayMomentum':
        return features.awayMomentum;
      case 'homeFieldAdvantage':
        return features.homeFieldAdvantage;
      case 'restDaysDiff':
        return features.restDaysDiff;
      case 'travelDistance':
        return features.travelDistance;
      case 'rivalryMultiplier':
        return features.rivalryMultiplier;
      case 'playoffMultiplier':
        return features.playoffMultiplier;
      case 'confidenceDiff':
        return features.confidenceDiff;
      case 'cohesionDiff':
        return features.homeCohesion - features.awayCohesion;
      case 'leadershipDiff':
        return features.homeLeadership - features.awayLeadership;
      case 'focusDiff':
        return features.homeConfidence - features.awayConfidence;
      case 'clutchGeneDiff':
        return (features.homeClutchGene - features.awayClutchGene) / 100;
      case 'mentalFortressDiff':
        return (features.homeMentalFortress - features.awayMentalFortress) / 100;
      default:
        return 0;
    }
  }

  /**
   * Get top N most important factors.
   */
  getTopFactors(features: MLFeatures, n: number = 5): ShapValue[] {
    const shapValues = this.calculateShapValues(features);
    return shapValues.slice(0, n);
  }

  // ============================================================================
  // Model Inspection
  // ============================================================================

  /**
   * Get model weights for inspection.
   */
  getWeights(): Record<string, number> {
    return { ...this.weights };
  }

  /**
   * Get feature importance rankings.
   */
  getFeatureImportance(): Array<{ feature: string; importance: number }> {
    return Object.entries(this.weights)
      .filter(([key]) => key !== 'intercept')
      .map(([feature, weight]) => ({
        feature,
        importance: Math.abs(weight),
      }))
      .sort((a, b) => b.importance - a.importance);
  }

  // ============================================================================
  // Spread & Total Prediction
  // ============================================================================

  /**
   * Predict point spread from win probability.
   *
   * Uses sport-specific conversion factors.
   */
  predictSpread(winProbability: number, sport: SupportedSport): number {
    // Convert probability to point spread
    // Based on historical relationship between moneyline and spread

    const spreadFactors: Record<SupportedSport, number> = {
      cfb: 14, // 50% = 0, 60% ≈ +7
      cbb: 8, // 50% = 0, 60% ≈ +4
      nfl: 10, // 50% = 0, 60% ≈ +5
      nba: 8, // 50% = 0, 60% ≈ +4
      mlb: 3, // 50% = 0, 60% ≈ +1.5
    };

    const factor = spreadFactors[sport];
    const logit = Math.log(winProbability / (1 - winProbability));

    return Math.round(logit * factor * 10) / 10;
  }

  /**
   * Predict total score.
   */
  predictTotal(homeTeam: TeamState, awayTeam: TeamState, context: GameContext): number {
    const sport = homeTeam.sport;

    // Average totals by sport
    const avgTotals: Record<SupportedSport, number> = {
      cfb: 52,
      cbb: 145,
      nfl: 46,
      nba: 224,
      mlb: 9,
    };

    const baseTotal = avgTotals[sport];

    // Adjust for team offensive/defensive strength
    const homePPG = homeTeam.pointsFor / Math.max(1, homeTeam.wins + homeTeam.losses);
    const awayPPG = awayTeam.pointsFor / Math.max(1, awayTeam.wins + awayTeam.losses);

    const ppgAvg = (homePPG + awayPPG) / 2;
    const adjustment = (ppgAvg / (baseTotal / 2) - 1) * baseTotal * 0.3;

    return Math.round((baseTotal + adjustment) * 10) / 10;
  }
}
