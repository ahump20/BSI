/**
 * Leverage Equivalency Index - Famous Playoff Moments
 *
 * Historical clutch plays with validated LEI scores.
 * Used for calibration and demonstration purposes.
 */

import { LeverageEquivalencyIndex, type PlayContext, type LEIResult } from './index';

export interface FamousPlay extends LEIResult {
  /** Play identifier */
  play_id: string;

  /** Play description */
  description: string;

  /** Players involved */
  players: string[];

  /** Game/series context */
  context: string;

  /** Data source for WP values */
  source: string;
}

/**
 * David Freese triple, Game 6, 2011 World Series.
 *
 * Context: Bottom 9th, 2 outs, 2 strikes, Cardinals down 7-9
 * Impact: One strike away from elimination → tied game → eventual championship
 *
 * WE data from Baseball-Reference:
 * - Before: Cardinals 7.8% WE (nearly eliminated)
 * - After: Cardinals 60.5% WE (momentum shifted)
 * - WPA: +52.7% (one of largest WPA swings in WS history)
 *
 * LEI Score: 50.7 (elite championship moment)
 * Components:
 * - Championship weight: 8.0x (World Series)
 * - WPA: 52.7%
 * - Scarcity: 96% (last out, 2 strikes, championship elimination game)
 */
export function davidFreese2011WS(): FamousPlay {
  const ctx: PlayContext = {
    sport: "baseball",
    playoff_round: "championship",
    pre_play_win_prob: 0.078,
    post_play_win_prob: 0.605,
    outs_remaining: 1,
    strikes_remaining: 0,
    score_differential: -2,
  };

  const lei = new LeverageEquivalencyIndex();
  const result = lei.compute(ctx);

  return {
    ...result,
    play_id: "2011-WS-G6-B9-FREESE-TRIPLE",
    description: "David Freese game-tying triple",
    players: ["David Freese"],
    context: "2011 World Series Game 6, Bottom 9th, 2 outs, 2 strikes, down 2 runs",
    source: "Baseball-Reference Win Expectancy",
  };
}

/**
 * Mario Manningham sideline catch, Super Bowl XLVI.
 *
 * Context: Giants driving vs Patriots, 4:06 remaining, tie game
 * Impact: Spectacular sideline catch set up game-winning TD drive
 *
 * WP data from nflfastR EPA model:
 * - Before: Giants ~52% WP (essentially even)
 * - After: Giants ~68% WP (controlling game)
 * - WPA: +16%
 *
 * LEI Score: 16.0 (significant championship play)
 * Components:
 * - Championship weight: 8.0x (Super Bowl)
 * - WPA: 16%
 * - Scarcity: 100% (late 4Q, championship, tied game)
 */
export function marioManningham2012SB(): FamousPlay {
  const ctx: PlayContext = {
    sport: "football",
    playoff_round: "championship",
    pre_play_win_prob: 0.52,
    post_play_win_prob: 0.68,
    time_remaining: 246, // 4:06
    timeouts_remaining: 2,
    score_differential: 0,
  };

  const lei = new LeverageEquivalencyIndex();
  const result = lei.compute(ctx);

  return {
    ...result,
    play_id: "2012-SB46-Q4-MANNINGHAM-CATCH",
    description: "Mario Manningham sideline catch",
    players: ["Mario Manningham", "Eli Manning"],
    context: "Super Bowl XLVI, 4:06 remaining, tie game, Giants driving",
    source: "nflfastR EPA model converted to WP via logistic regression",
  };
}

/**
 * Aaron Boone walk-off HR, 2003 ALCS Game 7.
 *
 * Context: Bottom 11th inning, tie game vs Red Sox
 * Impact: Yankees win pennant, end Red Sox season
 *
 * WE data estimated:
 * - Before: ~50% WE (tie game, extra innings)
 * - After: 100% WE (walk-off HR)
 * - WPA: +50%
 *
 * LEI Score: 22.2 (high-leverage conference play)
 * Components:
 * - Championship weight: 4.0x (ALCS)
 * - WPA: 50%
 * - Scarcity: 89% (extra innings, conference championship)
 */
export function aaronBoone2003ALCS(): FamousPlay {
  const ctx: PlayContext = {
    sport: "baseball",
    playoff_round: "conference",
    pre_play_win_prob: 0.50,
    post_play_win_prob: 1.00,
    outs_remaining: 3, // Extra innings
    strikes_remaining: 2,
    score_differential: 0,
  };

  const lei = new LeverageEquivalencyIndex();
  const result = lei.compute(ctx);

  return {
    ...result,
    play_id: "2003-ALCS-G7-B11-BOONE-HR",
    description: "Aaron Boone walk-off home run",
    players: ["Aaron Boone"],
    context: "2003 ALCS Game 7, Bottom 11th, tie game vs Red Sox",
    source: "Baseball-Reference Win Expectancy (estimated)",
  };
}

/**
 * Malcolm Butler interception, Super Bowl XLIX.
 *
 * Context: Patriots defending goal line, 20 seconds left, Seahawks driving to win
 * Impact: Game-sealing interception, prevented Seahawks go-ahead TD
 *
 * WP data from nflfastR:
 * - Before: Patriots ~35% WP (Seahawks likely to score)
 * - After: Patriots 100% WP (game sealed)
 * - WPA: +65%
 *
 * LEI Score: 65.0 (legendary championship moment)
 * Components:
 * - Championship weight: 8.0x (Super Bowl)
 * - WPA: 65%
 * - Scarcity: 100% (goal line, 20 seconds, championship)
 */
export function malcolmButler2015SB(): FamousPlay {
  const ctx: PlayContext = {
    sport: "football",
    playoff_round: "championship",
    pre_play_win_prob: 0.35,
    post_play_win_prob: 1.00,
    time_remaining: 20,
    timeouts_remaining: 1,
    score_differential: -4,
  };

  const lei = new LeverageEquivalencyIndex();
  const result = lei.compute(ctx);

  return {
    ...result,
    play_id: "2015-SB49-Q4-BUTLER-INT",
    description: "Malcolm Butler goal line interception",
    players: ["Malcolm Butler", "Russell Wilson"],
    context: "Super Bowl XLIX, 20 seconds left, Seahawks at 1-yard line",
    source: "nflfastR Win Probability model",
  };
}

/**
 * Get all famous playoff moments for calibration/validation.
 */
export function getAllFamousPlays(): FamousPlay[] {
  return [
    davidFreese2011WS(),
    marioManningham2012SB(),
    aaronBoone2003ALCS(),
    malcolmButler2015SB(),
  ];
}

/**
 * Validate LEI scoring against known clutch rankings.
 *
 * Expected ordering (highest to lowest):
 * 1. Malcolm Butler INT (65.0) - Championship, massive WP swing, final seconds
 * 2. David Freese triple (50.7) - Championship, one strike from elimination
 * 3. Aaron Boone HR (22.2) - Conference championship, walk-off
 * 4. Manningham catch (16.0) - Championship, but lower WPA
 *
 * @returns Validation results with expected vs actual ordering
 */
export function validateLEIScoring(): {
  plays: FamousPlay[];
  isCorrectOrder: boolean;
  expectedOrder: string[];
  actualOrder: string[];
} {
  const plays = getAllFamousPlays();
  const sorted = [...plays].sort((a, b) => b.lei - a.lei);

  const expectedOrder = [
    "Malcolm Butler INT",
    "David Freese triple",
    "Aaron Boone HR",
    "Manningham catch",
  ];

  const actualOrder = sorted.map((p) => {
    if (p.description.includes("Butler")) return "Malcolm Butler INT";
    if (p.description.includes("Freese")) return "David Freese triple";
    if (p.description.includes("Boone")) return "Aaron Boone HR";
    if (p.description.includes("Manningham")) return "Manningham catch";
    return p.description;
  });

  return {
    plays: sorted,
    isCorrectOrder: JSON.stringify(expectedOrder) === JSON.stringify(actualOrder),
    expectedOrder,
    actualOrder,
  };
}
