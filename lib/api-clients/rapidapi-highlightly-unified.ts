/**
 * Unified RapidAPI Highlightly Sports Client
 *
 * Single client for all sports via RapidAPI Highlightly Sports Pro.
 * Supports: MLB, NFL, NBA, NCAAB, NCAA Football, NCAA Baseball
 *
 * RapidAPI Base: https://sport-highlights-api.p.rapidapi.com
 * Host: sport-highlights-api.p.rapidapi.com
 *
 * Features:
 * - Rate limit awareness via response headers
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Standardized error responses
 *
 * @see https://rapidapi.com/highlightly/api/sport-highlights-api
 * @author BSI Team
 * @created 2026-01-17
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type HighlightlySportType =
  | 'mlb'
  | 'nfl'
  | 'nba'
  | 'ncaab'
  | 'ncaa_football'
  | 'ncaa_baseball';

export interface RapidAPIConfig {
  /** RapidAPI key (required) */
  apiKey: string;
  /** Base URL override (default: RapidAPI) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Base retry delay in ms (default: 1000) */
  retryBaseDelay?: number;
  /** User agent string */
  userAgent?: string;
}

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  reset: number | null;
}

export interface HighlightlyAPIResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  source: 'highlightly';
  cached: boolean;
  fetchedAt: string;
  duration_ms: number;
  rateLimit: RateLimitInfo;
  sport: HighlightlySportType;
}

// Match/Game Types
export interface HighlightlyMatch {
  id: number | string;
  homeTeam: HighlightlyTeam;
  awayTeam: HighlightlyTeam;
  homeScore: number | null;
  awayScore: number | null;
  status: HighlightlyMatchStatus;
  startTimestamp: number;
  date: string;
  tournament?: HighlightlyTournament;
  venue?: HighlightlyVenue;
  league?: string;
  season?: number;
  week?: number;
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  quarter?: number;
  period?: number;
  clock?: string;
  outs?: number;
  bases?: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  down?: number;
  distance?: number;
  yardLine?: number;
  possession?: string;
  broadcast?: string;
  attendance?: number;
}

export interface HighlightlyMatchStatus {
  code: number;
  type: 'notstarted' | 'inprogress' | 'finished' | 'postponed' | 'cancelled' | 'delayed';
  description?: string;
}

export interface HighlightlyTeam {
  id: number | string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  logo?: string;
  primaryColor?: string;
  conference?: string;
  division?: string;
  ranking?: number;
  record?: {
    wins: number;
    losses: number;
    ties?: number;
    pct?: number;
  };
}

export interface HighlightlyTournament {
  id: number;
  name: string;
  shortName?: string;
}

export interface HighlightlyVenue {
  id: number;
  name: string;
  city?: string;
  state?: string;
  capacity?: number;
}

// Standings Types
export interface HighlightlyStandings {
  conference?: string;
  division?: string;
  teams: HighlightlyStandingsTeam[];
}

export interface HighlightlyStandingsTeam {
  team: HighlightlyTeam;
  rank: number;
  wins: number;
  losses: number;
  ties?: number;
  winPct: number;
  conferenceWins?: number;
  conferenceLosses?: number;
  divisionWins?: number;
  divisionLosses?: number;
  homeWins?: number;
  homeLosses?: number;
  awayWins?: number;
  awayLosses?: number;
  streak?: string;
  last10?: string;
  gamesBack?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  pointDiff?: number;
  runsScored?: number;
  runsAllowed?: number;
  runDiff?: number;
}

// Rankings Types
export interface HighlightlyRanking {
  rank: number;
  previousRank?: number;
  team: HighlightlyTeam;
  record: string;
  points?: number;
  firstPlaceVotes?: number;
  poll: string;
}

// Player Types
export interface HighlightlyPlayer {
  id: number | string;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  jerseyNumber?: string;
  team?: HighlightlyTeam;
  stats?: Record<string, number | string>;
}

// Box Score Types
export interface HighlightlyBoxScore {
  matchId: number | string;
  home: HighlightlyBoxScoreTeam;
  away: HighlightlyBoxScoreTeam;
  linescore?: Array<{ period: number; homeScore: number; awayScore: number }>;
}

export interface HighlightlyBoxScoreTeam {
  team: HighlightlyTeam;
  score: number;
  stats?: Record<string, number | string>;
  players?: HighlightlyPlayer[];
}

// Odds Types
export interface HighlightlyOdds {
  matchId: number | string;
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

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  totalCount?: number;
  offset?: number;
  limit?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: Omit<Required<RapidAPIConfig>, 'apiKey'> = {
  baseUrl: 'https://sport-highlights-api.p.rapidapi.com',
  timeout: 15000,
  maxRetries: 3,
  retryBaseDelay: 1000,
  userAgent: 'BSI-RapidAPI-Client/1.0',
};

const RAPIDAPI_HOST = 'sport-highlights-api.p.rapidapi.com';

// Sport-specific endpoint mapping
const SPORT_ENDPOINTS: Record<HighlightlySportType, string> = {
  mlb: '/baseball/mlb',
  nfl: '/american-football/nfl',
  nba: '/basketball/nba',
  ncaab: '/basketball/ncaa',
  ncaa_football: '/american-football/ncaa',
  ncaa_baseball: '/baseball/ncaa',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDateParam(date: Date | string): string {
  if (typeof date === 'string') {
    return date.replace(/-/g, '');
  }
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function getCurrentDateCST(): string {
  const now = new Date();
  const cstOffset = -6 * 60;
  const cstTime = new Date(now.getTime() + (cstOffset - now.getTimezoneOffset()) * 60000);
  return cstTime.toISOString().split('T')[0];
}

// =============================================================================
// UNIFIED RAPIDAPI HIGHLIGHTLY CLIENT
// =============================================================================

export class RapidAPIHighlightlyClient {
  private readonly config: Required<RapidAPIConfig>;

  constructor(config: RapidAPIConfig) {
    if (!config.apiKey) {
      throw new Error('RapidAPI key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_CONFIG.baseUrl,
      timeout: config.timeout || DEFAULT_CONFIG.timeout,
      maxRetries: config.maxRetries || DEFAULT_CONFIG.maxRetries,
      retryBaseDelay: config.retryBaseDelay || DEFAULT_CONFIG.retryBaseDelay,
      userAgent: config.userAgent || DEFAULT_CONFIG.userAgent,
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE FETCH METHODS
  // ---------------------------------------------------------------------------

  private async fetchWithRetry<T>(
    endpoint: string,
    sport: HighlightlySportType,
    params?: Record<string, string>
  ): Promise<HighlightlyAPIResponse<T>> {
    const startTime = Date.now();
    let lastError: Error = new Error('No attempts made');
    let rateLimitInfo: RateLimitInfo = { remaining: null, limit: null, reset: null };

    // Build URL
    const sportPath = SPORT_ENDPOINTS[sport];
    const url = new URL(this.config.baseUrl + sportPath + endpoint);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.config.userAgent,
      'x-rapidapi-key': this.config.apiKey,
      'x-rapidapi-host': RAPIDAPI_HOST,
    };

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Extract rate limit headers
        rateLimitInfo = {
          remaining: this.parseHeader(response.headers.get('x-ratelimit-requests-remaining')),
          limit: this.parseHeader(response.headers.get('x-ratelimit-requests-limit')),
          reset: this.parseHeader(response.headers.get('x-ratelimit-requests-reset')),
        };

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.config.retryBaseDelay * Math.pow(2, attempt);
          console.warn('[RapidAPI] Rate limited. Waiting ' + delay + 'ms before retry ' + (attempt + 1));
          await sleep(delay);
          continue;
        }

        if (!response.ok) {
          return {
            success: false,
            data: null,
            error: 'API returned ' + response.status + ': ' + response.statusText,
            source: 'highlightly',
            cached: false,
            fetchedAt: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            rateLimit: rateLimitInfo,
            sport,
          };
        }

        const data = (await response.json()) as T;

        return {
          success: true,
          data,
          error: null,
          source: 'highlightly',
          cached: false,
          fetchedAt: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          rateLimit: rateLimitInfo,
          sport,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Request timeout after ' + this.config.timeout + 'ms');
        } else {
          lastError = error instanceof Error ? error : new Error(String(error));
        }

        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryBaseDelay * Math.pow(2, attempt);
          console.warn(
            '[RapidAPI] Retry ' + (attempt + 1) + '/' + this.config.maxRetries + ' in ' + delay + 'ms: ' + lastError.message
          );
          await sleep(delay);
        }
      }
    }

    return {
      success: false,
      data: null,
      error: lastError.message,
      source: 'highlightly',
      cached: false,
      fetchedAt: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      rateLimit: rateLimitInfo,
      sport,
    };
  }

  private parseHeader(value: string | null): number | null {
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - MATCHES/GAMES
  // ---------------------------------------------------------------------------

  /**
   * Get matches/games for a sport
   */
  async getMatches(
    sport: HighlightlySportType,
    options: {
      date?: string | Date;
      week?: number;
      season?: number;
      teamId?: string;
      live?: boolean;
    } = {}
  ): Promise<HighlightlyAPIResponse<PaginatedResponse<HighlightlyMatch>>> {
    const params: Record<string, string> = {};

    if (options.date) {
      params.date = formatDateParam(options.date);
    }
    if (options.week !== undefined) {
      params.week = String(options.week);
    }
    if (options.season !== undefined) {
      params.season = String(options.season);
    }
    if (options.teamId) {
      params.teamId = options.teamId;
    }
    if (options.live) {
      params.live = 'true';
    }

    return this.fetchWithRetry<PaginatedResponse<HighlightlyMatch>>('/matches', sport, params);
  }

  /**
   * Get live matches for a sport
   */
  async getLiveMatches(
    sport: HighlightlySportType
  ): Promise<HighlightlyAPIResponse<PaginatedResponse<HighlightlyMatch>>> {
    return this.getMatches(sport, { live: true });
  }

  /**
   * Get today's matches for a sport
   */
  async getTodayMatches(
    sport: HighlightlySportType
  ): Promise<HighlightlyAPIResponse<PaginatedResponse<HighlightlyMatch>>> {
    return this.getMatches(sport, { date: getCurrentDateCST() });
  }

  /**
   * Get match details by ID
   */
  async getMatch(
    sport: HighlightlySportType,
    matchId: string | number
  ): Promise<HighlightlyAPIResponse<HighlightlyMatch>> {
    return this.fetchWithRetry<HighlightlyMatch>('/matches/' + matchId, sport);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - STANDINGS
  // ---------------------------------------------------------------------------

  /**
   * Get standings for a sport
   */
  async getStandings(
    sport: HighlightlySportType,
    options: {
      season?: number;
      conference?: string;
      division?: string;
    } = {}
  ): Promise<HighlightlyAPIResponse<HighlightlyStandings[]>> {
    const params: Record<string, string> = {};

    if (options.season !== undefined) {
      params.season = String(options.season);
    }
    if (options.conference) {
      params.conference = options.conference;
    }
    if (options.division) {
      params.division = options.division;
    }

    return this.fetchWithRetry<HighlightlyStandings[]>('/standings', sport, params);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - RANKINGS
  // ---------------------------------------------------------------------------

  /**
   * Get rankings for a sport
   */
  async getRankings(
    sport: HighlightlySportType,
    options: {
      season?: number;
      week?: number;
      poll?: string;
    } = {}
  ): Promise<HighlightlyAPIResponse<HighlightlyRanking[]>> {
    const params: Record<string, string> = {};

    if (options.season !== undefined) {
      params.season = String(options.season);
    }
    if (options.week !== undefined) {
      params.week = String(options.week);
    }
    if (options.poll) {
      params.poll = options.poll;
    }

    return this.fetchWithRetry<HighlightlyRanking[]>('/rankings', sport, params);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - TEAMS
  // ---------------------------------------------------------------------------

  /**
   * Get teams for a sport
   */
  async getTeams(
    sport: HighlightlySportType,
    options: {
      conference?: string;
      division?: string;
    } = {}
  ): Promise<HighlightlyAPIResponse<PaginatedResponse<HighlightlyTeam>>> {
    const params: Record<string, string> = {};

    if (options.conference) {
      params.conference = options.conference;
    }
    if (options.division) {
      params.division = options.division;
    }

    return this.fetchWithRetry<PaginatedResponse<HighlightlyTeam>>('/teams', sport, params);
  }

  /**
   * Get team by ID
   */
  async getTeam(
    sport: HighlightlySportType,
    teamId: string | number
  ): Promise<HighlightlyAPIResponse<HighlightlyTeam>> {
    return this.fetchWithRetry<HighlightlyTeam>('/teams/' + teamId, sport);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - BOX SCORES
  // ---------------------------------------------------------------------------

  /**
   * Get box score for a match
   */
  async getBoxScore(
    sport: HighlightlySportType,
    matchId: string | number
  ): Promise<HighlightlyAPIResponse<HighlightlyBoxScore>> {
    return this.fetchWithRetry<HighlightlyBoxScore>('/box-scores/' + matchId, sport);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - ODDS
  // ---------------------------------------------------------------------------

  /**
   * Get odds for matches
   */
  async getOdds(
    sport: HighlightlySportType,
    options: {
      matchId?: string | number;
      date?: string | Date;
    } = {}
  ): Promise<HighlightlyAPIResponse<HighlightlyOdds[]>> {
    const params: Record<string, string> = {};

    if (options.matchId !== undefined) {
      params.matchId = String(options.matchId);
    }
    if (options.date) {
      params.date = formatDateParam(options.date);
    }

    return this.fetchWithRetry<HighlightlyOdds[]>('/odds', sport, params);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS - PLAYERS
  // ---------------------------------------------------------------------------

  /**
   * Get player by ID
   */
  async getPlayer(
    sport: HighlightlySportType,
    playerId: string | number
  ): Promise<HighlightlyAPIResponse<HighlightlyPlayer>> {
    return this.fetchWithRetry<HighlightlyPlayer>('/players/' + playerId, sport);
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(
    sport: HighlightlySportType,
    playerId: string | number,
    options: {
      season?: number;
    } = {}
  ): Promise<HighlightlyAPIResponse<Record<string, number | string>>> {
    const params: Record<string, string> = {};

    if (options.season !== undefined) {
      params.season = String(options.season);
    }

    return this.fetchWithRetry<Record<string, number | string>>(
      '/players/' + playerId + '/statistics',
      sport,
      params
    );
  }

  // ---------------------------------------------------------------------------
  // HEALTH CHECK
  // ---------------------------------------------------------------------------

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(sport: HighlightlySportType = 'mlb'): Promise<{
    healthy: boolean;
    latency_ms: number;
    rateLimit: RateLimitInfo;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const response = await this.getTeams(sport);
      return {
        healthy: response.success,
        latency_ms: Date.now() - startTime,
        rateLimit: response.rateLimit,
        error: response.error || undefined,
      };
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - startTime,
        rateLimit: { remaining: null, limit: null, reset: null },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new RapidAPI Highlightly client
 */
export function createRapidAPIClient(
  apiKey: string,
  config?: Partial<Omit<RapidAPIConfig, 'apiKey'>>
): RapidAPIHighlightlyClient {
  return new RapidAPIHighlightlyClient({
    apiKey,
    ...config,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export default RapidAPIHighlightlyClient;
