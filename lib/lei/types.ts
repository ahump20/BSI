/**
 * Leverage Equivalency Index (LEI) - Type Definitions
 * Normalizes clutch moments across sports to 0-100 scale
 */

export type Sport = "baseball" | "football";

export type PlayoffRound = "wildcard" | "division" | "conference" | "championship";

/**
 * Unified play context across sports.
 * Contains all necessary data to compute LEI for a given play.
 */
export interface PlayContext {
  /** Sport type */
  sport: Sport;

  /** Playoff round - higher rounds have exponentially higher championship weight */
  playoff_round: PlayoffRound;

  /** Win probability before the play (0.0-1.0) */
  pre_play_win_prob: number;

  /** Win probability after the play (0.0-1.0) */
  post_play_win_prob: number;

  /** Baseball: Number of outs remaining in game */
  outs_remaining?: number;

  /** Baseball: Number of strikes remaining for current batter */
  strikes_remaining?: number;

  /** Football: Time remaining in game (seconds) */
  time_remaining?: number;

  /** Football: Number of timeouts remaining for offense */
  timeouts_remaining?: number;

  /** Score differential (positive = leading, negative = trailing) */
  score_differential?: number;
}

/**
 * LEI computation result with breakdown of components
 */
export interface LEIResult {
  /** Final LEI score (0-100) */
  lei: number;

  /** Component breakdown for transparency */
  components: {
    /** Championship weight multiplier (1-8x based on playoff round) */
    championship_weight: number;

    /** Raw win probability added (0-1.0) */
    wpa: number;

    /** Scarcity multiplier (0-1.0, higher = fewer opportunities remaining) */
    scarcity: number;

    /** Raw score before scaling to 100 */
    raw_score: number;
  };
}

/**
 * Database record for storing LEI scores
 */
export interface LEIRecord extends PlayContext {
  /** Unique play identifier */
  play_id: string;

  /** Game identifier */
  game_id: string;

  /** Computed LEI score */
  lei_score: number;

  /** Player(s) involved */
  players: string[];

  /** Play description */
  description: string;

  /** Timestamp of play */
  timestamp: string;

  /** Season/year */
  season: number;
}
