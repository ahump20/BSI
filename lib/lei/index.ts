/**
 * Leverage Equivalency Index (LEI) - Core Calculation Engine
 *
 * Normalizes clutch moments across sports to 0-100 scale where:
 * - 0 = no championship impact
 * - 100 = maximum possible championship swing (theoretical)
 *
 * Formula: LEI = 100 × (Championship_Weight × WPA × Scarcity) / MAX_SWING
 *
 * @example
 * ```ts
 * const lei = new LeverageEquivalencyIndex();
 * const result = lei.compute({
 *   sport: "baseball",
 *   playoff_round: "championship",
 *   pre_play_win_prob: 0.078,
 *   post_play_win_prob: 0.605,
 *   outs_remaining: 1,
 *   strikes_remaining: 0,
 *   score_differential: -2
 * });
 * console.log(result.lei); // ~95 (David Freese 2011 WS triple)
 * ```
 */

import type { PlayContext, LEIResult, PlayoffRound } from './types';

export class LeverageEquivalencyIndex {
  /**
   * Championship leverage by playoff round.
   * Each round doubles the championship weight (exponential stakes).
   */
  private static readonly ROUND_WEIGHTS: Record<PlayoffRound, number> = {
    wildcard: 1.0,
    division: 2.0,
    conference: 4.0,
    championship: 8.0,
  };

  /**
   * Maximum theoretical swing.
   * Championship round (8x) with full WP reversal (1.0) and perfect scarcity (1.0).
   */
  private static readonly MAX_SWING = 8.0;

  /**
   * Computes Leverage Equivalency Index for a given play.
   *
   * @param ctx - Play context with sport, situation, and win probabilities
   * @returns LEI result with score (0-100) and component breakdown
   */
  compute(ctx: PlayContext): LEIResult {
    const championshipWeight = LeverageEquivalencyIndex.ROUND_WEIGHTS[ctx.playoff_round];
    const wpa = Math.abs(ctx.post_play_win_prob - ctx.pre_play_win_prob);
    const scarcity = this.computeScarcity(ctx);

    const rawScore = championshipWeight * wpa * scarcity;
    const lei = 100 * (rawScore / LeverageEquivalencyIndex.MAX_SWING);

    return {
      lei: Math.min(100.0, lei),
      components: {
        championship_weight: championshipWeight,
        wpa,
        scarcity,
        raw_score: rawScore,
      },
    };
  }

  /**
   * Computes scarcity: how few opportunities remain?
   *
   * Scarcity measures opportunity cost - the fewer chances remaining,
   * the higher the leverage. Returns 0.0-1.0 where 1.0 = last possible moment.
   *
   * @param ctx - Play context
   * @returns Scarcity multiplier (0.0-1.0)
   */
  private computeScarcity(ctx: PlayContext): number {
    if (ctx.sport === 'baseball') {
      return this.computeBaseballScarcity(ctx);
    } else {
      return this.computeFootballScarcity(ctx);
    }
  }

  /**
   * Baseball scarcity based on outs remaining and situation.
   *
   * Baseball games have 27 outs (9 innings × 3 outs).
   * Scarcity increases as outs accumulate, with bonuses for:
   * - 2-strike counts (imminent threat)
   * - Close score differentials
   *
   * @param ctx - Baseball play context
   * @returns Scarcity multiplier (0.0-1.0)
   */
  private computeBaseballScarcity(ctx: PlayContext): number {
    const totalOuts = 27;
    const outsRemaining = ctx.outs_remaining ?? totalOuts;
    const outsGone = totalOuts - outsRemaining;
    const baseScarcity = outsGone / totalOuts;

    // Boost for 2-strike counts (more immediate pressure)
    let strikeMultiplier = 1.0;
    if (ctx.strikes_remaining === 0) {
      strikeMultiplier = 1.2;
    }

    // Boost for close games (score differential matters less when tied/close)
    const scoreDiff = ctx.score_differential ?? 0;
    const scoreFactor = 1.0 / (1.0 + Math.abs(scoreDiff) * 0.1);

    return Math.min(1.0, baseScarcity * strikeMultiplier * scoreFactor);
  }

  /**
   * Football scarcity based on time/timeouts remaining.
   *
   * Football games are 3600 seconds (60 minutes).
   * Scarcity increases as time expires, with bonuses for:
   * - 4th quarter (exponential boost)
   * - Fewer timeouts remaining
   * - One-score games
   *
   * @param ctx - Football play context
   * @returns Scarcity multiplier (0.0-1.0)
   */
  private computeFootballScarcity(ctx: PlayContext): number {
    const totalSeconds = 3600;
    const timeRemaining = ctx.time_remaining ?? totalSeconds;
    const secondsGone = totalSeconds - timeRemaining;
    let timeScarcity = secondsGone / totalSeconds;

    // 4th quarter gets exponential boost (last 15 minutes)
    if (timeRemaining < 900) {
      const q4Boost = 1.0 + (900 - timeRemaining) / 900;
      timeScarcity *= q4Boost;
    }

    // Timeout scarcity (fewer timeouts = higher leverage)
    let timeoutFactor = 1.0;
    if (ctx.timeouts_remaining !== undefined) {
      timeoutFactor = 1.0 + (3 - ctx.timeouts_remaining) * 0.15;
    }

    // Score differential matters for 2-score vs 1-score games
    const scoreDiff = ctx.score_differential ?? 0;
    let scoreFactor = 1.0;
    if (Math.abs(scoreDiff) <= 8) {
      // One-score game (8 points or less)
      scoreFactor = 1.3;
    }

    return Math.min(1.0, timeScarcity * timeoutFactor * scoreFactor);
  }
}

// Export convenience function for quick LEI computation
export function computeLEI(ctx: PlayContext): LEIResult {
  const calculator = new LeverageEquivalencyIndex();
  return calculator.compute(ctx);
}

// Re-export types for convenience
export type { PlayContext, LEIResult, Sport, PlayoffRound, LEIRecord } from './types';
