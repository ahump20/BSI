/**
 * BSI Predictive Modeling Engine - Explainability Module
 *
 * SHAP-based feature attribution and human-readable explanations.
 * Provides transparency into prediction factors for user trust.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

import type {
  ShapValue,
  MLFeatures,
  GamePrediction,
  PredictionExplanation,
  ConfidenceLevel,
  SubscriptionTier,
  SupportedSport,
  TeamState,
} from './types';

// ============================================================================
// Explanation Templates
// ============================================================================

const FACTOR_DESCRIPTIONS: Record<string, Record<'positive' | 'negative', string>> = {
  ratingDiff: {
    positive: 'The home team has a significantly higher power rating',
    negative: 'The away team holds a substantial power rating advantage',
  },
  pythagoreanDiff: {
    positive: "The home team's scoring efficiency gives them an edge",
    negative: "The away team's scoring efficiency is notably superior",
  },
  homeRecentWinPct: {
    positive: 'The home team has been winning consistently',
    negative: "The home team's recent form has been poor",
  },
  awayRecentWinPct: {
    positive: "The away team's recent struggles benefit the home team",
    negative: 'The away team enters on a strong run of form',
  },
  homeMomentum: {
    positive: 'The home team carries positive momentum from recent wins',
    negative: 'The home team is dealing with a losing streak',
  },
  awayMomentum: {
    positive: "The away team's momentum has stalled recently",
    negative: 'The away team is riding a hot streak',
  },
  homeFieldAdvantage: {
    positive: 'Home field provides a significant boost',
    negative: 'Playing on the road disadvantages the home team',
  },
  confidenceDiff: {
    positive: "The home team's psychological confidence is notably higher",
    negative: 'The away team appears more psychologically confident',
  },
  cohesionDiff: {
    positive: 'The home team shows stronger team chemistry',
    negative: 'The away team demonstrates superior team cohesion',
  },
  leadershipDiff: {
    positive: 'The home team benefits from stronger leadership presence',
    negative: "The away team's leadership gives them an edge",
  },
  clutchGeneDiff: {
    positive: 'The home team has proven clutch performance ability',
    negative: 'The away team excels in high-pressure moments',
  },
  mentalFortressDiff: {
    positive: 'The home team shows superior mental resilience',
    negative: 'The away team demonstrates stronger mental fortitude',
  },
  rivalryMultiplier: {
    positive: 'Historical rivalry dynamics favor the home team',
    negative: 'Rivalry intensity adds unpredictability',
  },
  restDaysDiff: {
    positive: 'The home team has had more rest between games',
    negative: 'The away team is better rested',
  },
};

// ============================================================================
// ExplainabilityEngine Class
// ============================================================================

export class ExplainabilityEngine {
  /**
   * Generate a complete explanation for a prediction.
   */
  generateExplanation(
    shapValues: ShapValue[],
    features: MLFeatures,
    prediction: { homeWinProb: number; awayWinProb: number },
    tier: SubscriptionTier
  ): PredictionExplanation {
    const topFactors = shapValues.slice(0, 5);
    const humanSummary = this.generateNarrativeSummary(topFactors, features, prediction);
    const confidence = this.assessConfidence(features, shapValues);
    const uncertaintyDrivers = this.identifyUncertainty(features, shapValues);

    return {
      topFactors,
      shapSummary: tier === 'free' ? [] : shapValues,
      humanSummary,
      confidence,
      uncertaintyDrivers,
      requiresSubscription: tier === 'free',
    };
  }

  // ============================================================================
  // Narrative Generation
  // ============================================================================

  /**
   * Generate a natural language summary of the prediction.
   */
  generateNarrativeSummary(
    topFactors: ShapValue[],
    features: MLFeatures,
    prediction: { homeWinProb: number; awayWinProb: number }
  ): string {
    const homeFavored = prediction.homeWinProb > 0.5;
    const probDiff = Math.abs(prediction.homeWinProb - 0.5);
    const favoredTeam = homeFavored ? 'home' : 'away';

    // Opening based on confidence level
    let opening: string;
    if (probDiff > 0.25) {
      opening = `The ${favoredTeam} team is heavily favored in this matchup.`;
    } else if (probDiff > 0.1) {
      opening = `The ${favoredTeam} team holds a moderate advantage.`;
    } else {
      opening = `This projects as a competitive, closely-contested game.`;
    }

    // Build factor explanations
    const explanations: string[] = [opening];

    // Add top positive factor
    const positiveFactors = topFactors.filter((f) => f.direction === 'positive');
    if (positiveFactors.length > 0) {
      const topPositive = positiveFactors[0];
      const desc = FACTOR_DESCRIPTIONS[topPositive.feature]?.positive;
      if (desc) {
        explanations.push(desc + '.');
      }
    }

    // Add top negative factor (for balance)
    const negativeFactors = topFactors.filter((f) => f.direction === 'negative');
    if (negativeFactors.length > 0) {
      const topNegative = negativeFactors[0];
      const desc = FACTOR_DESCRIPTIONS[topNegative.feature]?.negative;
      if (desc) {
        explanations.push('However, ' + desc.toLowerCase() + '.');
      }
    }

    // Add psychological insight if relevant
    if (Math.abs(features.confidenceDiff) > 0.15) {
      const psychTeam = features.confidenceDiff > 0 ? 'home' : 'away';
      explanations.push(
        `Psychological factors favor the ${psychTeam} team with a notable confidence edge.`
      );
    }

    return explanations.join(' ');
  }

  /**
   * Generate sport-specific narrative elements.
   */
  generateSportSpecificNarrative(
    sport: SupportedSport,
    features: MLFeatures,
    prediction: { homeWinProb: number }
  ): string {
    const sportNarratives: Record<SupportedSport, () => string> = {
      cfb: () => {
        if (features.homeFieldAdvantage > 0.5) {
          return 'College football home field advantage is significant here.';
        }
        return '';
      },
      cbb: () => {
        if (Math.abs(features.homeMomentum) > 0.5) {
          return 'March Madness momentum is a real factor in this matchup.';
        }
        return '';
      },
      nfl: () => {
        if (features.restDaysDiff > 3) {
          return 'The extra rest could prove decisive in the NFL.';
        }
        return '';
      },
      nba: () => {
        if (Math.abs(features.homeMomentum - features.awayMomentum) > 0.6) {
          return 'Recent form matters tremendously in the NBA grind.';
        }
        return '';
      },
      mlb: () => {
        if (prediction.homeWinProb > 0.55 && prediction.homeWinProb < 0.65) {
          return 'In baseball, even modest edges can swing series outcomes.';
        }
        return '';
      },
    };

    return sportNarratives[sport]?.() ?? '';
  }

  // ============================================================================
  // Factor Analysis
  // ============================================================================

  /**
   * Identify the key factors driving the prediction.
   */
  analyzeKeyFactors(shapValues: ShapValue[]): {
    primary: ShapValue;
    supporting: ShapValue[];
    opposing: ShapValue[];
  } {
    const sorted = [...shapValues].sort((a, b) => b.importance - a.importance);
    const primary = sorted[0];

    const supporting = sorted
      .slice(1)
      .filter((s) => s.direction === primary.direction)
      .slice(0, 2);

    const opposing = sorted.filter((s) => s.direction !== primary.direction).slice(0, 2);

    return { primary, supporting, opposing };
  }

  /**
   * Calculate the net psychological contribution.
   */
  calculatePsychContribution(shapValues: ShapValue[]): {
    total: number;
    factors: ShapValue[];
  } {
    const psychFeatures = [
      'confidenceDiff',
      'cohesionDiff',
      'leadershipDiff',
      'focusDiff',
      'clutchGeneDiff',
      'mentalFortressDiff',
    ];

    const psychFactors = shapValues.filter((s) => psychFeatures.includes(s.feature));

    const total = psychFactors.reduce((sum, f) => sum + f.shapValue, 0);

    return { total, factors: psychFactors };
  }

  // ============================================================================
  // Confidence Assessment
  // ============================================================================

  /**
   * Assess overall confidence in the prediction.
   */
  assessConfidence(features: MLFeatures, shapValues: ShapValue[]): ConfidenceLevel {
    let confidenceScore = 0.5; // Start neutral

    // Large rating difference increases confidence
    if (Math.abs(features.ratingDiff) > 150) {
      confidenceScore += 0.2;
    } else if (Math.abs(features.ratingDiff) > 75) {
      confidenceScore += 0.1;
    }

    // Agreement among top factors increases confidence
    const topFactors = shapValues.slice(0, 5);
    const sameDirection = topFactors.filter((f) => f.direction === topFactors[0].direction).length;
    confidenceScore += (sameDirection - 2) * 0.05;

    // Rivalry decreases confidence
    if (features.rivalryMultiplier > 0) {
      confidenceScore -= 0.15;
    }

    // Close matchup decreases confidence
    if (Math.abs(features.ratingDiff) < 30) {
      confidenceScore -= 0.15;
    }

    // Map to confidence level
    if (confidenceScore >= 0.65) {
      return 'high';
    } else if (confidenceScore >= 0.4) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Identify sources of uncertainty in the prediction.
   */
  identifyUncertainty(features: MLFeatures, shapValues: ShapValue[]): string[] {
    const uncertainties: string[] = [];

    // Close matchup
    if (Math.abs(features.ratingDiff) < 50) {
      uncertainties.push('Teams are closely matched in overall strength');
    }

    // Conflicting signals
    const topFactors = shapValues.slice(0, 5);
    const positiveCount = topFactors.filter((f) => f.direction === 'positive').length;
    if (positiveCount >= 2 && positiveCount <= 3) {
      uncertainties.push('Key factors point in different directions');
    }

    // Rivalry chaos
    if (features.rivalryMultiplier > 0) {
      uncertainties.push('Rivalry games historically defy predictions');
    }

    // Momentum instability
    if (Math.abs(features.homeMomentum) > 0.6 || Math.abs(features.awayMomentum) > 0.6) {
      uncertainties.push('Extreme momentum may not sustain');
    }

    // Psychological volatility
    if (Math.abs(features.confidenceDiff) > 0.25) {
      uncertainties.push('Large psychological gaps can narrow quickly');
    }

    return uncertainties;
  }

  // ============================================================================
  // Comparative Analysis
  // ============================================================================

  /**
   * Compare predictions between two matchups.
   */
  comparePredictions(
    pred1: GamePrediction,
    pred2: GamePrediction
  ): {
    moreConfident: string;
    keyDifferences: string[];
    betterValue: string | null;
  } {
    const conf1 = Math.abs(pred1.homeWinProbability - 0.5);
    const conf2 = Math.abs(pred2.homeWinProbability - 0.5);

    const moreConfident = conf1 > conf2 ? pred1.gameId : pred2.gameId;

    const keyDifferences: string[] = [];

    // Compare spread
    const spreadDiff = Math.abs(pred1.predictedSpread - pred2.predictedSpread);
    if (spreadDiff > 7) {
      keyDifferences.push(`Spread differs by ${spreadDiff.toFixed(1)} points`);
    }

    // Compare confidence levels
    if (pred1.explanation.confidence !== pred2.explanation.confidence) {
      keyDifferences.push(
        `Confidence levels differ (${pred1.explanation.confidence} vs ${pred2.explanation.confidence})`
      );
    }

    // Value assessment (would need actual betting lines)
    const betterValue = null;

    return { moreConfident, keyDifferences, betterValue };
  }

  // ============================================================================
  // Formatting
  // ============================================================================

  /**
   * Format SHAP value for display.
   */
  formatShapValue(shapValue: ShapValue): string {
    const sign = shapValue.shapValue >= 0 ? '+' : '';
    const pct = (shapValue.shapValue * 100).toFixed(1);
    return `${shapValue.displayName}: ${sign}${pct}%`;
  }

  /**
   * Format top factors as bullet points.
   */
  formatTopFactorsMarkdown(topFactors: ShapValue[]): string {
    return topFactors
      .map((f) => {
        const sign = f.shapValue >= 0 ? '▲' : '▼';
        const pct = Math.abs(f.shapValue * 100).toFixed(1);
        return `- ${sign} ${f.displayName}: ${pct}% impact`;
      })
      .join('\n');
  }

  /**
   * Generate explanation card for UI display.
   */
  generateExplanationCard(
    prediction: GamePrediction,
    tier: SubscriptionTier
  ): {
    title: string;
    summary: string;
    factors: Array<{ name: string; impact: string; direction: 'up' | 'down' }>;
    confidence: ConfidenceLevel;
    upgradePrompt: string | null;
  } {
    const homeFavored = prediction.homeWinProbability > 0.5;
    const favoredProb = homeFavored ? prediction.homeWinProbability : prediction.awayWinProbability;

    const title = `${Math.round(favoredProb * 100)}% ${
      homeFavored ? 'Home' : 'Away'
    } Win Probability`;

    const factors = prediction.explanation.topFactors.slice(0, 3).map((f) => ({
      name: f.displayName,
      impact: `${Math.abs(f.shapValue * 100).toFixed(1)}%`,
      direction: f.direction === 'positive' ? ('up' as const) : ('down' as const),
    }));

    const upgradePrompt =
      tier === 'free'
        ? 'Upgrade to Pro for detailed factor breakdown and psychological insights'
        : null;

    return {
      title,
      summary: prediction.explanation.humanSummary,
      factors,
      confidence: prediction.explanation.confidence,
      upgradePrompt,
    };
  }
}
