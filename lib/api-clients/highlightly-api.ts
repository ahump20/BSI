/**
 * Highlightly API Client (RapidAPI)
 *
 * Enterprise-grade college baseball API with documented endpoints and SLA.
 * - Production D1 coverage with 1-minute live score updates
 * - Rosters, box scores, lineups, odds
 * - Rate limits exposed via response headers
 *
 * RapidAPI: https://rapidapi.com/highlightly/api/mlb-college-baseball-api
 * Direct: https://baseball.highlightly.net
 * Docs: https://highlightly.net/documentation/baseball/
 *
 * @priority 2 - Production D1 with SLA
 * @author BSI Team
 * @created 2025-01-16
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface HighlightlyApiConfig {
  /** RapidAPI key (required) */
  rapidApiKey: string;
  /** Base URL - RapidAPI or direct */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** User agent for requests */
  userAgent?: string;
}

// Match/Game Types
export interface HighlightlyMatch {
  id: number;
  homeTeam: HighlightlyTeam;
  awayTeam: HighlightlyTeam;
  homeScore: number;
  awayScore: number;
  status: HighlightlyMatchStatus;
  startTimestamp: number;
  tournament?: HighlightlyTournament;
  venue?: HighlightlyVenue;
  attendance?: number;
  weather?: HighlightlyWeather;
  innings?: HighlightlyInning[];
  currentInning?: number;
  currentInningHalf?: 'top' | 'bottom';
  outs?: number;
  bases?: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
}

export interface HighlightlyMatchStatus {
  code: number;
  type: 'notstarted' | 'inprogress' | 'finished' | 'postponed' | 'cancelled';
  description?: string;
}

export interface HighlightlyTeam {
  id: number;
  name: string;
  shortName?: string;
  slug?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  conference?: HighlightlyConference;
  ranking?: number;
  record?: {
    wins: number;
    losses: number;
    ties?: number;
  };
}

export interface HighlightlyConference {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
}

export interface HighlightlyTournament {
  id: number;
  name: string;
  shortName?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface HighlightlyVenue {
  id: number;
  name: string;
  city?: string;
  state?: string;
  capacity?: number;
  surface?: string;
}

export interface HighlightlyWeather {
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
  windDirection?: string;
}

export interface HighlightlyInning {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

// Player Types
export interface HighlightlyPlayer {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  jerseyNumber?: string;
  height?: string;
  weight?: number;
  dateOfBirth?: string;
  birthplace?: string;
  team?: HighlightlyTeam;
  statistics?: HighlightlyPlayerStats;
}

export interface HighlightlyPlayerStats {
  batting?: {
    games: number;
    atBats: number;
    runs: number;
    hits: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    rbi: number;
    walks: number;
    strikeouts: number;
    stolenBases: number;
    caughtStealing: number;
    battingAverage: number;
    onBasePercentage: number;
    sluggingPercentage: number;
    ops: number;
  };
  pitching?: {
    games: number;
    gamesStarted: number;
    wins: number;
    losses: number;
    saves: number;
    inningsPitched: number;
    hits: number;
    runs: number;
    earnedRuns: number;
    walks: number;
    strikeouts: number;
    homeRunsAllowed: number;
    era: number;
    whip: number;
    strikeoutsPerNine: number;
    walksPerNine: number;
  };
  fielding?: {
    games: number;
    putouts: number;
    assists: number;
    errors: number;
    doublePlays: number;
    fieldingPercentage: number;
  };
}

// Box Score Types
export interface HighlightlyBoxScore {
  matchId: number;
  home: HighlightlyBoxScoreTeam;
  away: HighlightlyBoxScoreTeam;
  linescores: HighlightlyInning[];
  plays?: HighlightlyPlay[];
}

export interface HighlightlyBoxScoreTeam {
  team: HighlightlyTeam;
  score: number;
  hits: number;
  errors: number;
  leftOnBase?: number;
  batting: HighlightlyBattingLine[];
  pitching: HighlightlyPitchingLine[];
}

export interface HighlightlyBattingLine {
  player: HighlightlyPlayer;
  battingOrder: number;
  position: string;
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  average?: number;
}

export interface HighlightlyPitchingLine {
  player: HighlightlyPlayer;
  inningsPitched: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  pitchCount?: number;
  strikes?: number;
  era?: number;
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS' | null;
}

export interface HighlightlyPlay {
  inning: number;
  half: 'top' | 'bottom';
  outs: number;
  description: string;
  homeScore: number;
  awayScore: number;
  bases?: { first: boolean; second: boolean; third: boolean };
  batter?: HighlightlyPlayer;
  pitcher?: HighlightlyPlayer;
}

// Lineup Types
export interface HighlightlyLineup {
  matchId: number;
  confirmed: boolean;
  home: HighlightlyLineupEntry[];
  away: HighlightlyLineupEntry[];
}

export interface HighlightlyLineupEntry {
  player: HighlightlyPlayer;
  battingOrder: number;
  position: string;
  isStarter: boolean;
}

// Standings Types
export interface HighlightlyStandings {
  conference: HighlightlyConference;
  teams: HighlightlyStandingsTeam[];
}

export interface HighlightlyStandingsTeam {
  team: HighlightlyTeam;
  rank: number;
  wins: number;
  losses: number;
  winPercentage: number;
  conferenceWins: number;
  conferenceLosses: number;
  conferenceWinPercentage?: number;
  gamesBack?: number;
  streak?: string;
  lastTen?: string;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
}

// Odds Types
export interface HighlightlyOdds {
  matchId: number;
  bookmaker: string;
  lastUpdate: string;
  moneyline?: {
    home: number;
    away: number;
  };
  spread?: {
    home: number;
    homeOdds: number;
    away: number;
    awayOdds: number;
  };
  total?: {
    over: number;
    overOdds: number;
    under: number;
    underOdds: number;
  };
}

// API Response Types
export interface HighlightlyPaginatedResponse<T> {
  data: T[];
  totalCount: number;
  offset: number;
  limit: number;
}

export interface HighlightlyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  source: 'highlightly';
  timestamp: string;
  duration_ms: number;
  rateLimitRemaining?: number;
}

// =============================================================================
// HIGHLIGHTLY API CLIENT CLASS
// =============================================================================

export class HighlightlyApiClient {
  private readonly config: Required<Omit<HighlightlyApiConfig, 'rapidApiKey'>> & {
    rapidApiKey: string;
  };

  // API endpoints
  public static readonly RAPIDAPI_HOST = 'mlb-college-baseball-api.p.rapidapi.com';
  public static readonly RAPIDAPI_BASE = 'https://mlb-college-baseball-api.p.rapidapi.com';
  public static readonly DIRECT_BASE = 'https://baseball.highlightly.net';

  constructor(config: HighlightlyApiConfig) {
    if (!config.rapidApiKey) {
      throw new Error('Highlightly API requires a RapidAPI key');
    }

    this.config = {
      rapidApiKey: config.rapidApiKey,
      baseUrl: config.baseUrl || HighlightlyApiClient.RAPIDAPI_BASE,
      timeout: config.timeout || 15000,
      userAgent: config.userAgent || 'BSI-Highlightly-Client/1.0',
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<HighlightlyApiResponse<T>> {
    const startTime = Date.now();

    // Build URL with query params
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': this.config.userAgent,
      'x-rapidapi-key': this.config.rapidApiKey,
      'x-rapidapi-host': HighlightlyApiClient.RAPIDAPI_HOST,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Extract rate limit info from headers
      const rateLimitRemaining = response.headers.get('x-ratelimit-requests-remaining');

      if (!response.ok) {
        return {
          success: false,
          error: `Highlightly API returned ${response.status}: ${response.statusText}`,
          source: 'highlightly',
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
        };
      }

      const data = (await response.json()) as T;

      return {
        success: true,
        data,
        source: 'highlightly',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: `Highlightly API request failed: ${errorMessage}`,
        source: 'highlightly',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get live matches/games
   *
   * @param league - League filter ('NCAA' for college)
   * @param date - Optional date filter (YYYY-MM-DD)
   */
  async getMatches(
    league: string = 'NCAA',
    date?: string
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyMatch>>> {
    const params: Record<string, string> = { league };
    if (date) params.date = date;
    return this.fetch<HighlightlyPaginatedResponse<HighlightlyMatch>>('/matches', params);
  }

  /**
   * Get live NCAA college baseball matches
   */
  async getLiveCollegeMatches(): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyMatch>>> {
    return this.getMatches('NCAA');
  }

  /**
   * Get match details by ID
   *
   * @param matchId - Match/game ID
   */
  async getMatch(matchId: number): Promise<HighlightlyApiResponse<HighlightlyMatch>> {
    return this.fetch<HighlightlyMatch>(`/matches/${matchId}`);
  }

  /**
   * Get all teams
   *
   * @param league - League filter ('NCAA' for college)
   */
  async getTeams(
    league: string = 'NCAA'
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyTeam>>> {
    return this.fetch<HighlightlyPaginatedResponse<HighlightlyTeam>>('/teams', { league });
  }

  /**
   * Get team details by ID
   *
   * @param teamId - Team ID
   */
  async getTeam(teamId: number): Promise<HighlightlyApiResponse<HighlightlyTeam>> {
    return this.fetch<HighlightlyTeam>(`/teams/${teamId}`);
  }

  /**
   * Get conference standings
   *
   * @param abbreviation - Conference/league abbreviation ('NCAA' for all)
   */
  async getStandings(
    abbreviation: string = 'NCAA'
  ): Promise<HighlightlyApiResponse<HighlightlyStandings[]>> {
    return this.fetch<HighlightlyStandings[]>('/standings', { abbreviation });
  }

  /**
   * Get player statistics
   *
   * @param playerId - Player ID
   */
  async getPlayerStatistics(
    playerId: number
  ): Promise<HighlightlyApiResponse<HighlightlyPlayerStats>> {
    return this.fetch<HighlightlyPlayerStats>(`/players/${playerId}/statistics`);
  }

  /**
   * Get box score for a match
   *
   * @param matchId - Match/game ID
   */
  async getBoxScore(matchId: number): Promise<HighlightlyApiResponse<HighlightlyBoxScore>> {
    return this.fetch<HighlightlyBoxScore>(`/box-scores/${matchId}`);
  }

  /**
   * Get starting lineups for a match
   *
   * @param matchId - Match/game ID
   */
  async getLineups(matchId: number): Promise<HighlightlyApiResponse<HighlightlyLineup>> {
    return this.fetch<HighlightlyLineup>(`/lineups/${matchId}`);
  }

  /**
   * Get betting odds
   *
   * @param matchId - Optional match ID filter
   */
  async getOdds(matchId?: number): Promise<HighlightlyApiResponse<HighlightlyOdds[]>> {
    const params = matchId ? { matchId: String(matchId) } : undefined;
    return this.fetch<HighlightlyOdds[]>('/odds', params);
  }

  // ---------------------------------------------------------------------------
  // CONVENIENCE METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get today's college baseball games
   */
  async getTodayGames(): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyMatch>>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMatches('NCAA', today);
  }

  /**
   * Get games for a specific date
   */
  async getGamesByDate(
    date: Date
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyMatch>>> {
    const dateStr = date.toISOString().split('T')[0];
    return this.getMatches('NCAA', dateStr);
  }

  /**
   * Get all NCAA standings
   */
  async getNCAStandings(): Promise<HighlightlyApiResponse<HighlightlyStandings[]>> {
    return this.getStandings('NCAA');
  }

  /**
   * Health check - verify API is accessible and key is valid
   */
  async healthCheck(): Promise<{ healthy: boolean; latency_ms: number; rateLimitRemaining?: number; error?: string }> {
    const startTime = Date.now();
    try {
      // Make a lightweight request to verify credentials
      const response = await this.getTeams('NCAA');

      return {
        healthy: response.success,
        latency_ms: Date.now() - startTime,
        rateLimitRemaining: response.rateLimitRemaining,
        error: response.error,
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
 * Create a new Highlightly API client instance
 *
 * @param rapidApiKey - RapidAPI key (required)
 * @param config - Optional additional configuration
 * @returns HighlightlyApiClient instance
 */
export function createHighlightlyApiClient(
  rapidApiKey: string,
  config?: Partial<Omit<HighlightlyApiConfig, 'rapidApiKey'>>
): HighlightlyApiClient {
  return new HighlightlyApiClient({
    rapidApiKey,
    ...config,
  });
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default HighlightlyApiClient;
