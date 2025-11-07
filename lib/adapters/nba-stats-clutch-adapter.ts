/**
 * NBA Stats API Clutch Adapter
 *
 * Integrates with NBA Stats API to fetch clutch performance data.
 * Clutch definition: Last 5:00 of 4th quarter or OT, score margin ≤5 points
 *
 * Data Sources:
 * - Play-by-play data (event logs with timestamps, scores, actions)
 * - Clutch player stats (leaderboards filtered by clutch criteria)
 * - Shot tracking data (expected points, shot quality)
 * - Player tracking data (defender distance, touch time)
 *
 * @see https://stats.nba.com/
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NBAStatsConfig {
  baseUrl?: string;
  userAgent?: string;
  referer?: string;
}

export interface ClutchCriteria {
  lastMinutes: number; // Last N minutes (default: 5)
  maxMargin: number; // Max score margin (default: 5)
  minPeriod: number; // Minimum period (default: 4 for 4th quarter)
}

// Zod schemas for validation
export const NBAPlayByPlayEventSchema = z.object({
  GAME_ID: z.string(),
  EVENTNUM: z.number(),
  EVENTMSGTYPE: z.number(),
  EVENTMSGACTIONTYPE: z.number(),
  PERIOD: z.number(),
  WCTIMESTRING: z.string(), // Wall clock time
  PCTIMESTRING: z.string(), // Game clock time (e.g., "5:00")
  HOMEDESCRIPTION: z.string().nullable(),
  NEUTRALDESCRIPTION: z.string().nullable(),
  VISITORDESCRIPTION: z.string().nullable(),
  SCORE: z.string().nullable(),
  SCOREMARGIN: z.string().nullable(),
  PERSON1TYPE: z.number().optional(),
  PLAYER1_ID: z.number().nullable(),
  PLAYER1_NAME: z.string().nullable(),
  PLAYER1_TEAM_ID: z.number().nullable(),
});

export const NBAClutchPlayerStatsSchema = z.object({
  PLAYER_ID: z.number(),
  PLAYER_NAME: z.string(),
  TEAM_ID: z.number(),
  TEAM_ABBREVIATION: z.string(),
  GP: z.number(), // Games played
  MIN: z.number(), // Minutes
  FGM: z.number(), // Field goals made
  FGA: z.number(), // Field goals attempted
  FG_PCT: z.number(), // Field goal percentage
  FG3M: z.number(), // 3-pointers made
  FG3A: z.number(), // 3-pointers attempted
  FTM: z.number(), // Free throws made
  FTA: z.number(), // Free throws attempted
  PTS: z.number(), // Points
  AST: z.number(), // Assists
  TOV: z.number(), // Turnovers
  STL: z.number(), // Steals
  BLK: z.number(), // Blocks
  PLUS_MINUS: z.number(),
});

export const NBAShotTrackingSchema = z.object({
  GAME_ID: z.string(),
  GAME_EVENT_ID: z.number(),
  PLAYER_ID: z.number(),
  PLAYER_NAME: z.string(),
  SHOT_DISTANCE: z.number(), // feet
  LOC_X: z.number(), // court coordinates
  LOC_Y: z.number(),
  SHOT_MADE_FLAG: z.number(), // 0 or 1
  SHOT_TYPE: z.string(), // "2PT Field Goal", "3PT Field Goal"
  SHOT_ZONE_BASIC: z.string(),
  SHOT_ZONE_AREA: z.string(),
  SHOT_ZONE_RANGE: z.string(),
  HTM: z.string(), // Home team
  VTM: z.string(), // Visiting team
});

// Normalized output types
export interface ClutchSituation {
  game_id: string;
  situation_type: 'clutch_time' | 'overtime' | 'final_possession' | 'playoff_elimination';
  start_timestamp: Date;
  end_timestamp: Date;
  game_clock_start: string;
  game_clock_end: string;
  period: number;
  score_margin: number;
  score_margin_absolute: number;
  home_score: number;
  away_score: number;
  is_clutch_time: boolean;
  clutch_intensity: number; // 0.0-1.0
  playoff_game: boolean;
  elimination_game: boolean;
  raw_payload: any;
  data_source: 'nba_stats_api';
}

export interface ClutchPlayerAction {
  situation_id?: string; // Filled later by database
  game_id: string;
  player_id: number;
  action_timestamp: Date;
  action_type: string;
  action_subtype: string | null;
  is_successful: boolean;
  points_scored: number;
  shot_distance: number | null;
  shot_location_x: number | null;
  shot_location_y: number | null;
  defender_distance: number | null;
  touch_time: number | null;
  expected_points: number | null;
  points_over_expected: number | null;
  raw_payload: any;
  data_source: 'nba_stats_api';
}

// Event type mappings (from NBA Stats API)
const EVENT_MSG_TYPES = {
  FIELD_GOAL_MADE: 1,
  FIELD_GOAL_MISSED: 2,
  FREE_THROW: 3,
  REBOUND: 4,
  TURNOVER: 5,
  FOUL: 6,
  VIOLATION: 7,
  SUBSTITUTION: 8,
  TIMEOUT: 9,
  JUMP_BALL: 10,
  EJECTION: 11,
  PERIOD_BEGIN: 12,
  PERIOD_END: 13,
};

// ============================================================================
// NBA STATS CLUTCH API CLIENT
// ============================================================================

export class NBAStatsClutchAdapter {
  private config: NBAStatsConfig;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: NBAStatsConfig = {}) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://stats.nba.com/stats';

    // NBA Stats API requires specific headers to avoid 403 errors
    this.headers = {
      'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: config.referer || 'https://stats.nba.com/',
      Origin: 'https://stats.nba.com',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
    };
  }

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  /**
   * Get play-by-play data for a game
   */
  async getPlayByPlay(gameId: string): Promise<any[]> {
    const params = new URLSearchParams({
      GameID: gameId,
      StartPeriod: '0',
      EndPeriod: '10', // Include all overtimes
    });

    const response = await this.makeRequest(`/playbyplayv2?${params.toString()}`);

    // NBA Stats API returns data in resultSets array format
    const resultSet = response.resultSets?.find((rs: any) => rs.name === 'PlayByPlay');
    if (!resultSet) {
      throw new Error(`No play-by-play data found for game ${gameId}`);
    }

    return this.parseResultSet(resultSet);
  }

  /**
   * Get clutch player stats (leaderboard)
   */
  async getClutchPlayerStats(
    season: string = '2024-25',
    seasonType: 'Regular Season' | 'Playoffs' = 'Regular Season',
    clutchTime: 'Last 5 Minutes' | 'Last 3 Minutes' | 'Last 1 Minute' | 'Last 30 Seconds' = 'Last 5 Minutes',
    pointDiff: number = 5
  ): Promise<any[]> {
    const params = new URLSearchParams({
      LeagueID: '00',
      Season: season,
      SeasonType: seasonType,
      PerMode: 'Totals',
      ClutchTime: clutchTime,
      AheadBehind: 'Ahead or Behind',
      PointDiff: pointDiff.toString(),
      GameScope: '',
      PlayerExperience: '',
      PlayerPosition: '',
      StarterBench: '',
    });

    const response = await this.makeRequest(`/leaguedashplayerclutch?${params.toString()}`);

    const resultSet = response.resultSets?.find((rs: any) => rs.name === 'LeagueDashPlayerClutch');
    if (!resultSet) {
      throw new Error('No clutch player stats found');
    }

    return this.parseResultSet(resultSet);
  }

  /**
   * Get shot log for a player (includes expected points data)
   */
  async getPlayerShotLog(
    playerId: number,
    season: string = '2024-25',
    seasonType: 'Regular Season' | 'Playoffs' = 'Regular Season'
  ): Promise<any[]> {
    const params = new URLSearchParams({
      PlayerID: playerId.toString(),
      Season: season,
      SeasonType: seasonType,
    });

    const response = await this.makeRequest(`/playerdashptshotlog?${params.toString()}`);

    const resultSet = response.resultSets?.[0];
    if (!resultSet) {
      throw new Error(`No shot log found for player ${playerId}`);
    }

    return this.parseResultSet(resultSet);
  }

  /**
   * Get game summary (scores, teams, playoff context)
   */
  async getGameSummary(gameId: string): Promise<any> {
    const params = new URLSearchParams({
      GameID: gameId,
    });

    const response = await this.makeRequest(`/boxscoresummaryv2?${params.toString()}`);
    return response;
  }

  // ==========================================================================
  // CLUTCH SITUATION DETECTION
  // ==========================================================================

  /**
   * Identify clutch situations from play-by-play data
   */
  identifyClutchSituations(
    playByPlayData: any[],
    gameId: string,
    criteria: Partial<ClutchCriteria> = {}
  ): ClutchSituation[] {
    const clutchCriteria: ClutchCriteria = {
      lastMinutes: criteria.lastMinutes || 5,
      maxMargin: criteria.maxMargin || 5,
      minPeriod: criteria.minPeriod || 4,
    };

    const situations: ClutchSituation[] = [];
    let currentSituation: Partial<ClutchSituation> | null = null;

    for (const event of playByPlayData) {
      const isClutch = this.isClutchEvent(event, clutchCriteria);

      if (isClutch && !currentSituation) {
        // Start new clutch window
        const { homeScore, awayScore } = this.parseScore(event.SCORE);

        currentSituation = {
          game_id: gameId,
          situation_type: 'clutch_time',
          start_timestamp: this.parseEventTimestamp(event),
          game_clock_start: event.PCTIMESTRING,
          period: event.PERIOD,
          home_score: homeScore,
          away_score: awayScore,
          score_margin: this.parseScoreMargin(event.SCOREMARGIN),
          is_clutch_time: true,
          playoff_game: false, // Set later from game summary
          elimination_game: false,
          data_source: 'nba_stats_api',
        };
      } else if (!isClutch && currentSituation) {
        // End current clutch window
        const { homeScore, awayScore } = this.parseScore(event.SCORE);

        situations.push({
          ...currentSituation,
          end_timestamp: this.parseEventTimestamp(event),
          game_clock_end: event.PCTIMESTRING,
          score_margin_absolute: Math.abs(currentSituation.score_margin || 0),
          clutch_intensity: this.calculateClutchIntensity(
            currentSituation.game_clock_start!,
            currentSituation.score_margin!
          ),
          raw_payload: {},
        } as ClutchSituation);

        currentSituation = null;
      }

      // Update current situation if ongoing
      if (currentSituation && isClutch) {
        const { homeScore, awayScore } = this.parseScore(event.SCORE);
        currentSituation.home_score = homeScore;
        currentSituation.away_score = awayScore;
        currentSituation.score_margin = this.parseScoreMargin(event.SCOREMARGIN);
      }
    }

    // Close any open situation at game end
    if (currentSituation) {
      const lastEvent = playByPlayData[playByPlayData.length - 1];
      situations.push({
        ...currentSituation,
        end_timestamp: this.parseEventTimestamp(lastEvent),
        game_clock_end: lastEvent.PCTIMESTRING,
        score_margin_absolute: Math.abs(currentSituation.score_margin || 0),
        clutch_intensity: this.calculateClutchIntensity(
          currentSituation.game_clock_start!,
          currentSituation.score_margin!
        ),
        raw_payload: {},
      } as ClutchSituation);
    }

    return situations;
  }

  /**
   * Extract player actions from clutch situations
   */
  extractClutchPlayerActions(
    playByPlayData: any[],
    clutchSituations: ClutchSituation[],
    gameId: string
  ): ClutchPlayerAction[] {
    const actions: ClutchPlayerAction[] = [];

    for (const situation of clutchSituations) {
      const eventsInWindow = playByPlayData.filter(event => {
        const eventTime = this.parseEventTimestamp(event);
        return eventTime >= situation.start_timestamp && eventTime <= situation.end_timestamp;
      });

      for (const event of eventsInWindow) {
        const action = this.parseEventToAction(event, gameId);
        if (action) {
          actions.push(action);
        }
      }
    }

    return actions;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Check if an event qualifies as clutch
   */
  private isClutchEvent(event: any, criteria: ClutchCriteria): boolean {
    const period = event.PERIOD;
    const gameClock = this.parseGameClock(event.PCTIMESTRING); // seconds remaining
    const scoreMargin = Math.abs(this.parseScoreMargin(event.SCOREMARGIN));

    // NBA standard: Last 5:00 of 4th quarter or OT, margin ≤5
    const isLateGame = period >= criteria.minPeriod;
    const isLastMinutes = gameClock <= (criteria.lastMinutes * 60);
    const isCloseGame = scoreMargin <= criteria.maxMargin;

    return isLateGame && isLastMinutes && isCloseGame;
  }

  /**
   * Parse game clock string (e.g., "5:00") to seconds
   */
  private parseGameClock(clockString: string): number {
    if (!clockString || clockString === '') return 0;

    const parts = clockString.split(':');
    if (parts.length !== 2) return 0;

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    return minutes * 60 + seconds;
  }

  /**
   * Parse score string (e.g., "95 - 92") to home/away scores
   */
  private parseScore(scoreString: string | null): { homeScore: number; awayScore: number } {
    if (!scoreString) return { homeScore: 0, awayScore: 0 };

    const parts = scoreString.split('-').map(s => parseInt(s.trim(), 10));
    return {
      homeScore: parts[0] || 0,
      awayScore: parts[1] || 0,
    };
  }

  /**
   * Parse score margin string (e.g., "+3", "-5", "TIE") to number
   */
  private parseScoreMargin(marginString: string | null): number {
    if (!marginString || marginString === 'TIE') return 0;
    return parseInt(marginString, 10) || 0;
  }

  /**
   * Calculate clutch intensity (0.0-1.0)
   * Higher intensity = less time remaining + closer score
   */
  private calculateClutchIntensity(gameClockStart: string, scoreMargin: number): number {
    const secondsRemaining = this.parseGameClock(gameClockStart);
    const marginAbsolute = Math.abs(scoreMargin);

    // Normalize time: 0-300 seconds → 1.0-0.0
    const timeIntensity = 1 - Math.min(secondsRemaining / 300, 1);

    // Normalize margin: 0-5 points → 1.0-0.0
    const marginIntensity = 1 - Math.min(marginAbsolute / 5, 1);

    // Weighted average (70% time, 30% margin)
    return parseFloat((0.7 * timeIntensity + 0.3 * marginIntensity).toFixed(2));
  }

  /**
   * Parse event timestamp (combine game date + wall clock time)
   */
  private parseEventTimestamp(event: any): Date {
    // WCTIMESTRING format: "9:30 PM" (wall clock time)
    // This is a simplification - in production, combine with actual game date
    // For now, use current date (will be replaced with actual game date in production)
    const now = new Date();
    return new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
  }

  /**
   * Parse play-by-play event to player action
   */
  private parseEventToAction(event: any, gameId: string): ClutchPlayerAction | null {
    if (!event.PLAYER1_ID) return null; // No player associated

    const eventType = event.EVENTMSGTYPE;
    let actionType = 'unknown';
    let actionSubtype: string | null = null;
    let isSuccessful = false;
    let pointsScored = 0;

    switch (eventType) {
      case EVENT_MSG_TYPES.FIELD_GOAL_MADE:
        actionType = 'field_goal_made';
        isSuccessful = true;
        // Determine 2PT or 3PT from description
        const description = event.HOMEDESCRIPTION || event.VISITORDESCRIPTION || '';
        if (description.includes('3PT')) {
          actionSubtype = 'three_pointer';
          pointsScored = 3;
        } else {
          actionSubtype = 'two_pointer';
          pointsScored = 2;
        }
        break;

      case EVENT_MSG_TYPES.FIELD_GOAL_MISSED:
        actionType = 'field_goal_missed';
        isSuccessful = false;
        actionSubtype = event.HOMEDESCRIPTION?.includes('3PT') || event.VISITORDESCRIPTION?.includes('3PT')
          ? 'three_pointer'
          : 'two_pointer';
        break;

      case EVENT_MSG_TYPES.FREE_THROW:
        actionType = 'free_throw';
        isSuccessful = event.HOMEDESCRIPTION?.includes('MISS') === false &&
                       event.VISITORDESCRIPTION?.includes('MISS') === false;
        pointsScored = isSuccessful ? 1 : 0;
        break;

      case EVENT_MSG_TYPES.REBOUND:
        actionType = 'rebound';
        isSuccessful = true;
        break;

      case EVENT_MSG_TYPES.TURNOVER:
        actionType = 'turnover';
        isSuccessful = false;
        break;

      case EVENT_MSG_TYPES.FOUL:
        actionType = 'foul';
        isSuccessful = false;
        break;

      default:
        return null; // Skip other event types
    }

    return {
      game_id: gameId,
      player_id: event.PLAYER1_ID,
      action_timestamp: this.parseEventTimestamp(event),
      action_type: actionType,
      action_subtype: actionSubtype,
      is_successful: isSuccessful,
      points_scored: pointsScored,
      shot_distance: null, // Requires shot tracking data
      shot_location_x: null,
      shot_location_y: null,
      defender_distance: null,
      touch_time: null,
      expected_points: null, // Calculated separately from shot quality model
      points_over_expected: null,
      raw_payload: event,
      data_source: 'nba_stats_api',
    };
  }

  /**
   * Make HTTP request to NBA Stats API with retries
   */
  private async makeRequest(endpoint: string, retries = 3): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.headers,
      });

      if (response.status === 429) {
        // Rate limit
        if (retries > 0) {
          await this.sleep(5000);
          return this.makeRequest(endpoint, retries - 1);
        }
        throw new Error('NBA Stats API rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`NBA Stats API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.sleep(2000 * (4 - retries)); // Exponential backoff
        return this.makeRequest(endpoint, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Parse NBA Stats API resultSet format to array of objects
   */
  private parseResultSet(resultSet: any): any[] {
    const headers = resultSet.headers;
    const rows = resultSet.rowSet;

    return rows.map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index];
      });
      return obj;
    });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.message?.includes('fetch failed')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    if (error.message?.includes('500')) return true;
    if (error.message?.includes('502')) return true;
    if (error.message?.includes('503')) return true;
    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create NBA Stats clutch adapter instance
 */
export function createNBAStatsClutchAdapter(config?: NBAStatsConfig): NBAStatsClutchAdapter {
  return new NBAStatsClutchAdapter(config);
}

export default NBAStatsClutchAdapter;
