/**
 * NCAA API Client (henrygd/ncaa-api)
 *
 * Open-source API wrapper for NCAA.com data.
 * - Free tier with 5 req/sec limit on public instance
 * - Self-hostable via Docker for production reliability
 * - Covers D1/D2/D3 baseball with live scores, stats, standings
 *
 * Public demo: https://ncaa-api.henrygd.me
 * GitHub: https://github.com/henrygd/ncaa-api
 *
 * @priority 1 - Recommended for free D1 coverage
 * @author BSI Team
 * @created 2025-01-16
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface NCAAApiConfig {
  /** Base URL - public instance or self-hosted */
  baseUrl: string;
  /** Optional API key for self-hosted instances */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** User agent for requests */
  userAgent?: string;
}

// Scoreboard Types
export interface NCAAGame {
  gameId: string;
  startDate: string;
  startTime?: string;
  status: 'pre' | 'in' | 'final';
  period?: number;
  clock?: string;
  home: NCAATeamScore;
  away: NCAATeamScore;
  venue?: string;
  attendance?: number;
  broadcasts?: string[];
  highlights?: string[];
}

export interface NCAATeamScore {
  teamId: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  logo?: string;
  score: number;
  record?: string;
  rank?: number;
  linescores?: number[];
}

export interface NCAAScoreboardResponse {
  date: string;
  league: string;
  division: string;
  games: NCAAGame[];
  count: number;
}

// Stats Types
export interface NCAATeamStat {
  rank: number;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  conference?: string;
  statValue: number;
  statName: string;
  gamesPlayed?: number;
}

export interface NCAAPlayerStat {
  rank: number;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  position?: string;
  year?: string;
  statValue: number;
  statName: string;
  gamesPlayed?: number;
}

export interface NCAAStatsResponse {
  statId: string;
  statName: string;
  season: string;
  division: string;
  stats: NCAATeamStat[] | NCAAPlayerStat[];
  count: number;
}

// Standings Types
export interface NCAAStandingsTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  conference: string;
  division?: string;
  overallWins: number;
  overallLosses: number;
  overallTies?: number;
  conferenceWins: number;
  conferenceLosses: number;
  conferenceTies?: number;
  winPct: number;
  conferenceWinPct?: number;
  streak?: string;
  homeRecord?: string;
  awayRecord?: string;
  neutralRecord?: string;
  lastFive?: string;
  pointsFor?: number;
  pointsAgainst?: number;
  rank?: number;
}

export interface NCAAStandingsResponse {
  season: string;
  division: string;
  conferences: {
    name: string;
    teams: NCAAStandingsTeam[];
  }[];
  totalTeams: number;
}

// Rankings Types
export interface NCAATeamRanking {
  rank: number;
  previousRank?: number;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  record?: string;
  points?: number;
  firstPlaceVotes?: number;
}

export interface NCAAWeeklyRanking {
  week: number;
  season: string;
  pollName: string;
  pollDate?: string;
  teams: NCAATeamRanking[];
}

export interface NCAASeasonRankings {
  season: string;
  division: string;
  weeks: NCAAWeeklyRanking[];
}

// Box Score Types
export interface NCAABoxScore {
  gameId: string;
  startDate: string;
  venue?: string;
  attendance?: number;
  home: NCAABoxScoreTeam;
  away: NCAABoxScoreTeam;
  plays?: NCAAPlay[];
}

export interface NCAABoxScoreTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  score: number;
  linescores: number[];
  stats: {
    batting?: NCAABattingStats[];
    pitching?: NCAPitchingStats[];
    fielding?: NCAAFieldingStats[];
  };
}

export interface NCAABattingStats {
  playerId: string;
  playerName: string;
  position: string;
  ab: number;
  runs: number;
  hits: number;
  rbi: number;
  bb: number;
  so: number;
  avg?: number;
  obp?: number;
  slg?: number;
}

export interface NCAPitchingStats {
  playerId: string;
  playerName: string;
  ip: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  pitches?: number;
  strikes?: number;
  era?: number;
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS';
}

export interface NCAAFieldingStats {
  playerId: string;
  playerName: string;
  position: string;
  putouts: number;
  assists: number;
  errors: number;
}

export interface NCAAPlay {
  period: number;
  clock?: string;
  description: string;
  homeScore: number;
  awayScore: number;
  type?: string;
}

// Schedule Types
export interface NCAAScheduleGame {
  gameId: string;
  date: string;
  time?: string;
  homeTeam: string;
  homeTeamId: string;
  homeLogo?: string;
  awayTeam: string;
  awayTeamId: string;
  awayLogo?: string;
  venue?: string;
  conference?: string;
  tvBroadcast?: string;
  result?: {
    homeScore: number;
    awayScore: number;
    status: 'final' | 'in' | 'postponed' | 'cancelled';
  };
}

export interface NCAAScheduleResponse {
  year: number;
  month: number;
  division: string;
  games: NCAAScheduleGame[];
  count: number;
}

// API Response wrapper
export interface NCAAApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  source: 'ncaa-api';
  timestamp: string;
  duration_ms: number;
}

// =============================================================================
// NCAA API CLIENT CLASS
// =============================================================================

export class NCAAApiClient {
  private readonly config: Required<NCAAApiConfig>;

  // Default public instance - 5 req/sec rate limit
  public static readonly PUBLIC_INSTANCE = 'https://ncaa-api.henrygd.me';

  // Stat IDs for baseball (from NCAA.com)
  public static readonly BASEBALL_STAT_IDS = {
    // Team Stats
    TEAM_BATTING_AVG: '210',
    TEAM_ERA: '211',
    TEAM_RUNS_SCORED: '212',
    TEAM_HOME_RUNS: '213',
    TEAM_STOLEN_BASES: '214',
    TEAM_FIELDING_PCT: '215',
    TEAM_DOUBLES: '216',
    TEAM_TRIPLES: '217',

    // Individual Batting
    BATTING_AVG: '220',
    ON_BASE_PCT: '221',
    SLUGGING_PCT: '222',
    HOME_RUNS: '223',
    RBI: '224',
    RUNS: '225',
    HITS: '226',
    DOUBLES: '227',
    TRIPLES: '228',
    STOLEN_BASES: '229',
    WALKS: '230',
    HIT_BY_PITCH: '231',

    // Individual Pitching
    ERA: '240',
    WINS: '241',
    STRIKEOUTS: '242',
    SAVES: '243',
    INNINGS_PITCHED: '244',
    WHIP: '245',
    OPPONENT_AVG: '246',
    STRIKEOUTS_PER_9: '247',
    WALKS_PER_9: '248',
  };

  constructor(config: Partial<NCAAApiConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || NCAAApiClient.PUBLIC_INSTANCE,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 10000,
      userAgent: config.userAgent || 'BSI-NCAA-API-Client/1.0',
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async fetch<T>(endpoint: string): Promise<NCAAApiResponse<T>> {
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.config.userAgent,
    };

    if (this.config.apiKey) {
      headers['x-ncaa-key'] = this.config.apiKey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `NCAA API returned ${response.status}: ${response.statusText}`,
          source: 'ncaa-api',
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        };
      }

      const data = (await response.json()) as T;

      return {
        success: true,
        data,
        source: 'ncaa-api',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: `NCAA API request failed: ${errorMessage}`,
        source: 'ncaa-api',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }
  }

  private formatDate(year: number, month: number, day: number): string {
    return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get live scoreboard for a specific date
   *
   * @param year - Year (e.g., 2025)
   * @param month - Month (1-12)
   * @param day - Day (1-31)
   * @param division - Division ('d1', 'd2', 'd3')
   * @param conference - Optional conference filter ('all-conf' for all)
   */
  async getScoreboard(
    year: number,
    month: number,
    day: number,
    division: 'd1' | 'd2' | 'd3' = 'd1',
    conference: string = 'all-conf'
  ): Promise<NCAAApiResponse<NCAAScoreboardResponse>> {
    const dateStr = this.formatDate(year, month, day);
    const endpoint = `/scoreboard/baseball/${division}/${dateStr}/${conference}`;
    return this.fetch<NCAAScoreboardResponse>(endpoint);
  }

  /**
   * Get today's scoreboard
   */
  async getTodayScoreboard(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAScoreboardResponse>> {
    const now = new Date();
    return this.getScoreboard(now.getFullYear(), now.getMonth() + 1, now.getDate(), division);
  }

  /**
   * Get team statistics for current season
   *
   * @param statId - Stat ID (use BASEBALL_STAT_IDS constants)
   * @param division - Division ('d1', 'd2', 'd3')
   */
  async getTeamStats(
    statId: string,
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    const endpoint = `/stats/baseball/${division}/current/team/${statId}`;
    return this.fetch<NCAAStatsResponse>(endpoint);
  }

  /**
   * Get individual player statistics for current season
   *
   * @param statId - Stat ID (use BASEBALL_STAT_IDS constants)
   * @param division - Division ('d1', 'd2', 'd3')
   */
  async getPlayerStats(
    statId: string,
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    const endpoint = `/stats/baseball/${division}/current/individual/${statId}`;
    return this.fetch<NCAAStatsResponse>(endpoint);
  }

  /**
   * Get conference standings
   *
   * @param division - Division ('d1', 'd2', 'd3')
   */
  async getStandings(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStandingsResponse>> {
    const endpoint = `/standings/baseball/${division}`;
    return this.fetch<NCAAStandingsResponse>(endpoint);
  }

  /**
   * Get weekly rankings
   *
   * @param division - Division ('d1', 'd2', 'd3')
   * @param week - Week number (optional, defaults to current)
   * @param type - Ranking type ('rpi', 'd1baseball', etc.)
   */
  async getRankings(
    division: 'd1' | 'd2' | 'd3' = 'd1',
    week?: number,
    type: string = 'rpi'
  ): Promise<NCAAApiResponse<NCAAWeeklyRanking>> {
    const weekStr = week ? String(week) : 'current';
    const endpoint = `/rankings/baseball/${division}/${weekStr}/${type}`;
    return this.fetch<NCAAWeeklyRanking>(endpoint);
  }

  /**
   * Get game box score
   *
   * @param gameId - NCAA game ID
   */
  async getBoxScore(gameId: string): Promise<NCAAApiResponse<NCAABoxScore>> {
    const endpoint = `/game/${gameId}/boxscore`;
    return this.fetch<NCAABoxScore>(endpoint);
  }

  /**
   * Get game play-by-play
   *
   * @param gameId - NCAA game ID
   */
  async getPlayByPlay(gameId: string): Promise<NCAAApiResponse<NCAAPlay[]>> {
    const endpoint = `/game/${gameId}/play-by-play`;
    return this.fetch<NCAAPlay[]>(endpoint);
  }

  /**
   * Get monthly schedule
   *
   * @param year - Year (e.g., 2025)
   * @param month - Month (1-12)
   * @param division - Division ('d1', 'd2', 'd3')
   */
  async getSchedule(
    year: number,
    month: number,
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAScheduleResponse>> {
    const endpoint = `/schedule/baseball/${division}/${year}/${String(month).padStart(2, '0')}`;
    return this.fetch<NCAAScheduleResponse>(endpoint);
  }

  /**
   * Get current month's schedule
   */
  async getCurrentSchedule(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAScheduleResponse>> {
    const now = new Date();
    return this.getSchedule(now.getFullYear(), now.getMonth() + 1, division);
  }

  // ---------------------------------------------------------------------------
  // CONVENIENCE METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get top batting leaders (batting average)
   */
  async getBattingLeaders(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    return this.getPlayerStats(NCAAApiClient.BASEBALL_STAT_IDS.BATTING_AVG, division);
  }

  /**
   * Get top pitching leaders (ERA)
   */
  async getPitchingLeaders(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    return this.getPlayerStats(NCAAApiClient.BASEBALL_STAT_IDS.ERA, division);
  }

  /**
   * Get top home run leaders
   */
  async getHomeRunLeaders(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    return this.getPlayerStats(NCAAApiClient.BASEBALL_STAT_IDS.HOME_RUNS, division);
  }

  /**
   * Get team batting averages
   */
  async getTeamBattingAverages(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    return this.getTeamStats(NCAAApiClient.BASEBALL_STAT_IDS.TEAM_BATTING_AVG, division);
  }

  /**
   * Get team ERAs
   */
  async getTeamERAs(
    division: 'd1' | 'd2' | 'd3' = 'd1'
  ): Promise<NCAAApiResponse<NCAAStatsResponse>> {
    return this.getTeamStats(NCAAApiClient.BASEBALL_STAT_IDS.TEAM_ERA, division);
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; latency_ms: number; error?: string }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.config.baseUrl}/`, {
        method: 'HEAD',
        headers: { 'User-Agent': this.config.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      return {
        healthy: response.ok,
        latency_ms: Date.now() - startTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new NCAA API client instance
 *
 * @param config - Optional configuration
 * @returns NCAAApiClient instance
 */
export function createNCAAApiClient(config?: Partial<NCAAApiConfig>): NCAAApiClient {
  return new NCAAApiClient(config);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default NCAAApiClient;
