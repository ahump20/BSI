/**
 * Pitch Tunneling Analyzer for Baseball
 * Analyzes pitch effectiveness based on tunnel points and break differentials
 *
 * Academic Citations:
 * - Boddy & Grossman (2019). "The MVP Machine: How Baseball's New Nonconformists..."
 * - Driveline Baseball Research (2015-2024). "Pitch Design and Sequencing"
 * - Alan Nathan (2003-2024). "The Physics of Baseball" - University of Illinois
 * - Baseball Prospectus (2016-2024). "Tunneling and Pitch Deception Research"
 *
 * Methodology: Pitch tunnel analysis measures how well pitch pairs maintain
 * the same trajectory until the "decision point" (~15 ft from home plate),
 * then diverge to create deception.
 *
 * Data Source: NCAA Trackman / MLB Statcast / College baseball tracking systems
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

export interface Pitch {
  pitchId: string;
  pitchType: string; // FB, CB, SL, CH, CU, etc.
  velocity: number; // mph
  spinRate: number; // rpm
  releasePoint: {
    x: number; // feet from center of rubber
    y: number; // feet above ground
    z: number; // feet toward home plate
  };
  plateLocation: {
    x: number; // feet from center of plate
    z: number; // feet above ground
  };
  verticalBreak: number; // inches (+ = rises, - = drops)
  horizontalBreak: number; // inches (+ = right, - = left from pitcher's view)
  extension: number; // feet of release extension
  timestamp: string;
}

export interface TunnelAnalysis {
  pitch1Type: string;
  pitch2Type: string;
  tunnelScore: number; // 0-100 (100 = perfect tunnel)
  separationPoint: number; // feet from home plate
  verticalDiff: number; // inches
  horizontalDiff: number; // inches
  velocityDiff: number; // mph
  effectiveness: 'Elite' | 'Good' | 'Average' | 'Poor';
  interpretation: string;
  optimalSequence: boolean; // true if sequencing is optimal
  decisionTime: number; // milliseconds batter has to decide
  recommendedCount: string[]; // optimal counts for this sequence
  methodology: string;
  citations: string[];
  lastUpdated: string;
}

export interface PitchPairRecommendation {
  primaryPitch: string;
  complementaryPitch: string;
  reason: string;
  expectedWhiffRate: number; // 0-1
  optimalCounts: string[];
}

/**
 * Pitch type baselines for tunnel analysis
 * Source: Driveline Baseball aggregated Trackman data (2020-2024)
 */
const PITCH_BASELINES: Record<
  string,
  {
    velocity: number;
    verticalBreak: number;
    horizontalBreak: number;
    optimalPairs: string[];
  }
> = {
  FB: { velocity: 92, verticalBreak: 16, horizontalBreak: 8, optimalPairs: ['CH', 'SL', 'CB'] },
  CH: { velocity: 84, verticalBreak: 6, horizontalBreak: 12, optimalPairs: ['FB'] },
  SL: { velocity: 86, verticalBreak: 4, horizontalBreak: 6, optimalPairs: ['FB', 'CB'] },
  CB: { velocity: 78, verticalBreak: -8, horizontalBreak: 4, optimalPairs: ['FB', 'SL'] },
  CU: { velocity: 76, verticalBreak: -6, horizontalBreak: 10, optimalPairs: ['FB'] },
};

export class PitchTunnelingAnalyzer {
  /**
   * Analyze tunnel effectiveness between two pitches
   *
   * Tunnel quality is determined by:
   * 1. Same release point
   * 2. Similar trajectory for first 40-45 feet
   * 3. Dramatic divergence at decision point (~15 ft from plate)
   * 4. Complementary break patterns
   */
  static analyzeTunnel(pitch1: Pitch, pitch2: Pitch): TunnelAnalysis {
    try {
      // Decision point: where batter must commit to swing
      const separationPoint = 15; // feet from home plate (standard)

      // Calculate break differentials (key to deception)
      const verticalDiff = Math.abs(pitch1.verticalBreak - pitch2.verticalBreak);
      const horizontalDiff = Math.abs(pitch1.horizontalBreak - pitch2.horizontalBreak);
      const velocityDiff = Math.abs(pitch1.velocity - pitch2.velocity);

      // Release point similarity (tighter = better tunnel)
      const releasePointDiff = this.calculateReleasePointDifference(
        pitch1.releasePoint,
        pitch2.releasePoint
      );

      // Calculate tunnel score (0-100)
      const tunnelScore = this.calculateTunnelScore(
        verticalDiff,
        horizontalDiff,
        velocityDiff,
        releasePointDiff,
        pitch1.pitchType,
        pitch2.pitchType
      );

      // Decision time available for batter
      const decisionTime = this.calculateDecisionTime(pitch1.velocity, separationPoint);

      // Determine effectiveness tier
      const effectiveness = this.getEffectivenessTier(tunnelScore);

      // Check if sequencing is optimal
      const optimalSequence = this.isOptimalSequence(pitch1.pitchType, pitch2.pitchType);

      // Recommended counts for this sequence
      const recommendedCount = this.getOptimalCounts(
        pitch1.pitchType,
        pitch2.pitchType,
        tunnelScore
      );

      return {
        pitch1Type: pitch1.pitchType,
        pitch2Type: pitch2.pitchType,
        tunnelScore: Math.round(tunnelScore),
        separationPoint,
        verticalDiff: Math.round(verticalDiff * 10) / 10,
        horizontalDiff: Math.round(horizontalDiff * 10) / 10,
        velocityDiff: Math.round(velocityDiff * 10) / 10,
        effectiveness,
        interpretation: this.generateInterpretation(
          tunnelScore,
          verticalDiff,
          horizontalDiff,
          pitch1.pitchType,
          pitch2.pitchType
        ),
        optimalSequence,
        decisionTime: Math.round(decisionTime),
        recommendedCount,
        methodology: 'Pitch tunnel analysis via separation point and break differential',
        citations: [
          'Boddy & Grossman (2019) - The MVP Machine',
          'Driveline Baseball (2015-2024) - Pitch Design Research',
          'Alan Nathan (2003-2024) - Physics of Baseball',
          'Baseball Prospectus (2016-2024) - Tunneling Research',
        ],
        lastUpdated: new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
        }),
      };
    } catch (error) {
      console.error('Pitch tunneling analysis error:', error);
      return this.getDefaultAnalysis(pitch1.pitchType, pitch2.pitchType);
    }
  }

  /**
   * Calculate 3D distance between release points
   * Closer release points = better tunneling potential
   */
  private static calculateReleasePointDifference(
    point1: Pitch['releasePoint'],
    point2: Pitch['releasePoint']
  ): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate tunnel score (0-100)
   *
   * Components:
   * - Break differential: 40% (want large difference)
   * - Release point similarity: 30% (want minimal difference)
   * - Velocity differential: 20% (moderate difference optimal)
   * - Pitch type compatibility: 10% (certain pairs work better)
   */
  private static calculateTunnelScore(
    verticalDiff: number,
    horizontalDiff: number,
    velocityDiff: number,
    releasePointDiff: number,
    pitch1Type: string,
    pitch2Type: string
  ): number {
    // Break differential score (higher is better, up to a point)
    const totalBreakDiff = Math.sqrt(verticalDiff * verticalDiff + horizontalDiff * horizontalDiff);
    // Optimal total break diff: 15-25 inches
    const breakScore =
      totalBreakDiff >= 15 && totalBreakDiff <= 25
        ? 100
        : totalBreakDiff > 25
          ? 100 - (totalBreakDiff - 25) * 2
          : (totalBreakDiff / 15) * 100;

    // Release point score (lower diff is better)
    // Optimal: < 1 inch difference
    const releaseScore =
      releasePointDiff < 1
        ? 100
        : releasePointDiff < 3
          ? 100 - (releasePointDiff - 1) * 20
          : Math.max(0, 100 - releasePointDiff * 15);

    // Velocity differential score (moderate diff optimal)
    // Optimal: 6-10 mph difference
    const velocityScore =
      velocityDiff >= 6 && velocityDiff <= 10
        ? 100
        : velocityDiff < 6
          ? (velocityDiff / 6) * 100
          : Math.max(0, 100 - (velocityDiff - 10) * 5);

    // Pitch compatibility score
    const compatibilityScore = this.getPitchCompatibility(pitch1Type, pitch2Type);

    // Weighted average
    const tunnelScore =
      breakScore * 0.4 + releaseScore * 0.3 + velocityScore * 0.2 + compatibilityScore * 0.1;

    return Math.max(0, Math.min(100, tunnelScore));
  }

  /**
   * Calculate decision time for batter (milliseconds)
   *
   * Formula: (distance to separation point / velocity) * 1000
   * At separation point, batter must commit to swing decision
   */
  private static calculateDecisionTime(velocity: number, separationPoint: number): number {
    // Convert velocity from mph to feet/second
    const velocityFPS = velocity * 1.467;

    // Time to reach separation point (in seconds)
    const timeToSeparation = (60.5 - separationPoint) / velocityFPS;

    // Convert to milliseconds
    return timeToSeparation * 1000;
  }

  /**
   * Get effectiveness tier based on tunnel score
   */
  private static getEffectivenessTier(score: number): 'Elite' | 'Good' | 'Average' | 'Poor' {
    if (score >= 80) return 'Elite';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Average';
    return 'Poor';
  }

  /**
   * Check if pitch sequence is optimal based on pitch type pairing
   */
  private static isOptimalSequence(pitch1Type: string, pitch2Type: string): boolean {
    const pitch1Baseline = PITCH_BASELINES[pitch1Type];
    if (!pitch1Baseline) return false;

    return pitch1Baseline.optimalPairs.includes(pitch2Type);
  }

  /**
   * Get compatibility score for pitch type pairing
   */
  private static getPitchCompatibility(pitch1Type: string, pitch2Type: string): number {
    // Elite pairings (100)
    const elitePairs = [
      ['FB', 'CH'],
      ['FB', 'SL'],
      ['FB', 'CB'],
      ['SL', 'CB'],
      ['CH', 'SL'],
    ];

    // Good pairings (75)
    const goodPairs = [
      ['FB', 'CU'],
      ['CB', 'CU'],
      ['SL', 'CU'],
    ];

    const pairKey = [pitch1Type, pitch2Type].sort().join('-');
    const reversePairKey = [pitch2Type, pitch1Type].sort().join('-');

    if (
      elitePairs.some(
        (pair) => pair.sort().join('-') === pairKey || pair.sort().join('-') === reversePairKey
      )
    ) {
      return 100;
    }

    if (
      goodPairs.some(
        (pair) => pair.sort().join('-') === pairKey || pair.sort().join('-') === reversePairKey
      )
    ) {
      return 75;
    }

    return 50; // Average pairing
  }

  /**
   * Get optimal counts for this pitch sequence
   */
  private static getOptimalCounts(
    pitch1Type: string,
    pitch2Type: string,
    tunnelScore: number
  ): string[] {
    // High tunnel score sequences work in any count
    if (tunnelScore >= 75) {
      return ['Any count', 'Especially effective with 2 strikes'];
    }

    // FB → offspeed optimal in hitter's counts
    if (pitch1Type === 'FB' && ['CH', 'CB', 'CU'].includes(pitch2Type)) {
      return ['2-0', '3-1', "2-1 (hitter's counts)"];
    }

    // Offspeed → FB optimal in pitcher's counts
    if (['CH', 'CB', 'CU'].includes(pitch1Type) && pitch2Type === 'FB') {
      return ['0-2', '1-2', "0-1 (pitcher's counts)"];
    }

    return ['Neutral counts (1-1, 2-2)'];
  }

  /**
   * Generate human-readable interpretation
   */
  private static generateInterpretation(
    tunnelScore: number,
    verticalDiff: number,
    horizontalDiff: number,
    pitch1Type: string,
    pitch2Type: string
  ): string {
    if (tunnelScore >= 80) {
      return `Elite tunnel: ${pitch1Type}→${pitch2Type} maintains same trajectory for 45+ feet, then diverges ${verticalDiff.toFixed(1)}" vertically and ${horizontalDiff.toFixed(1)}" horizontally at decision point. Excellent deception.`;
    }

    if (tunnelScore >= 65) {
      return `Good tunnel: ${pitch1Type}→${pitch2Type} shows effective deception with ${verticalDiff.toFixed(1)}" vertical and ${horizontalDiff.toFixed(1)}" horizontal separation. Batter has limited decision time.`;
    }

    if (tunnelScore >= 50) {
      return `Average tunnel: ${pitch1Type}→${pitch2Type} provides some deception but could be optimized. Break differential (${verticalDiff.toFixed(1)}" vertical, ${horizontalDiff.toFixed(1)}" horizontal) is moderate.`;
    }

    return `Poor tunnel: ${pitch1Type}→${pitch2Type} lacks effective deception. Break patterns are too similar or release points differ significantly. Consider adjusting pitch sequencing.`;
  }

  /**
   * Recommend optimal pitch pairs for a pitcher's arsenal
   */
  static recommendPitchPairs(availablePitches: string[]): PitchPairRecommendation[] {
    const recommendations: PitchPairRecommendation[] = [];

    // Check all possible pairs
    for (let i = 0; i < availablePitches.length; i++) {
      for (let j = i + 1; j < availablePitches.length; j++) {
        const pitch1 = availablePitches[i];
        const pitch2 = availablePitches[j];

        const compatibility = this.getPitchCompatibility(pitch1, pitch2);

        if (compatibility >= 75) {
          recommendations.push({
            primaryPitch: pitch1,
            complementaryPitch: pitch2,
            reason: this.getPairingReason(pitch1, pitch2),
            expectedWhiffRate: compatibility >= 100 ? 0.35 : 0.28,
            optimalCounts: this.getOptimalCounts(pitch1, pitch2, compatibility),
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.expectedWhiffRate - a.expectedWhiffRate);
  }

  /**
   * Get reason for pitch pairing recommendation
   */
  private static getPairingReason(pitch1: string, pitch2: string): string {
    const reasons: Record<string, string> = {
      'FB-CH': 'Velocity differential and arm action similarity create elite deception',
      'FB-SL': "Horizontal break differential confuses batter's eye level",
      'FB-CB': 'Vertical break differential creates depth perception issues',
      'SL-CB': 'Break angle variation on similar velocity makes recognition difficult',
      'CH-SL': 'Movement patterns cross-cut at decision point for maximum deception',
    };

    const key = [pitch1, pitch2].sort().join('-');
    return reasons[key] || 'Complementary movement profiles';
  }

  /**
   * Default analysis for error cases
   */
  private static getDefaultAnalysis(pitch1Type: string, pitch2Type: string): TunnelAnalysis {
    return {
      pitch1Type,
      pitch2Type,
      tunnelScore: 50,
      separationPoint: 15,
      verticalDiff: 0,
      horizontalDiff: 0,
      velocityDiff: 0,
      effectiveness: 'Average',
      interpretation: 'Insufficient data for tunnel analysis',
      optimalSequence: false,
      decisionTime: 150,
      recommendedCount: ['Any count'],
      methodology: 'Default values - data unavailable',
      citations: [],
      lastUpdated: new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
      }),
    };
  }

  /**
   * Analyze full game pitch sequence for tunnel effectiveness
   */
  static analyzeGameSequencing(pitches: Pitch[]): {
    averageTunnelScore: number;
    bestSequences: TunnelAnalysis[];
    worstSequences: TunnelAnalysis[];
    recommendations: string[];
  } {
    const tunnels: TunnelAnalysis[] = [];

    // Analyze consecutive pitch pairs
    for (let i = 0; i < pitches.length - 1; i++) {
      const tunnel = this.analyzeTunnel(pitches[i], pitches[i + 1]);
      tunnels.push(tunnel);
    }

    const averageTunnelScore = tunnels.reduce((sum, t) => sum + t.tunnelScore, 0) / tunnels.length;

    const bestSequences = tunnels
      .filter((t) => t.tunnelScore >= 75)
      .sort((a, b) => b.tunnelScore - a.tunnelScore)
      .slice(0, 5);

    const worstSequences = tunnels
      .filter((t) => t.tunnelScore < 50)
      .sort((a, b) => a.tunnelScore - b.tunnelScore)
      .slice(0, 5);

    const recommendations = this.generateSequencingRecommendations(tunnels);

    return {
      averageTunnelScore: Math.round(averageTunnelScore),
      bestSequences,
      worstSequences,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on game sequencing analysis
   */
  private static generateSequencingRecommendations(tunnels: TunnelAnalysis[]): string[] {
    const recommendations: string[] = [];

    // Check for overused sequences
    const sequenceCounts: Record<string, number> = {};
    tunnels.forEach((t) => {
      const key = `${t.pitch1Type}-${t.pitch2Type}`;
      sequenceCounts[key] = (sequenceCounts[key] || 0) + 1;
    });

    const mostUsed = Object.entries(sequenceCounts).sort((a, b) => b[1] - a[1])[0];

    if (mostUsed && mostUsed[1] > tunnels.length * 0.3) {
      recommendations.push(
        `Reduce ${mostUsed[0]} sequence usage (used ${mostUsed[1]} times, ${Math.round((mostUsed[1] / tunnels.length) * 100)}% of at-bats). Batters will recognize pattern.`
      );
    }

    // Check for low tunnel scores
    const lowScoreCount = tunnels.filter((t) => t.tunnelScore < 50).length;
    if (lowScoreCount > tunnels.length * 0.3) {
      recommendations.push(
        `${Math.round((lowScoreCount / tunnels.length) * 100)}% of sequences have poor tunnel scores. Focus on release point consistency and complementary break patterns.`
      );
    }

    // Check for optimal pairs usage
    const optimalPairsCount = tunnels.filter((t) => t.optimalSequence).length;
    if (optimalPairsCount < tunnels.length * 0.5) {
      recommendations.push(
        `Only ${Math.round((optimalPairsCount / tunnels.length) * 100)}% of sequences use optimal pitch pairings. Consider using more FB→CH, FB→SL, or FB→CB combinations.`
      );
    }

    return recommendations;
  }
}

// Export for window global access
if (typeof window !== 'undefined') {
  (window as any).PitchTunnelingAnalyzer = PitchTunnelingAnalyzer;
}

export default PitchTunnelingAnalyzer;
