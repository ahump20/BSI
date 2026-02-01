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
  homeTeam: HighlightlyTeamDetail;
  awayTeam: HighlightlyTeamDetail;
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
  bases?: { first: boolean; second: boolean; third: boolean };
}

export interface HighlightlyMatchStatus {
  code: number;
  type: 'notstarted' | 'inprogress' | 'finished' | 'postponed' | 'cancelled';
  description?: string;
}

export interface HighlightlyTeamDetail {
  id: number;
  name: string;
  shortName?: string;
  slug?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  conference?: HighlightlyConference;
  ranking?: number;
  record?: { wins: number; losses: number; ties?: number };
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
  category?: { id: number; name: string };
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
  team?: HighlightlyTeamDetail;
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
  team: HighlightlyTeamDetail;
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

// Standings Types
export interface HighlightlyStandings {
  conference: HighlightlyConference;
  teams: HighlightlyStandingsTeam[];
}

export interface HighlightlyStandingsTeam {
  team: HighlightlyTeamDetail;
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

  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<HighlightlyApiResponse<T>> {
    const startTime = Date.now();

    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
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

  async getMatches(
    league: string = 'NCAA',
    date?: string
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyMatch>>> {
    const params: Record<string, string> = { league };
    if (date) params.date = date;
    return this.fetch<HighlightlyPaginatedResponse<HighlightlyMatch>>('/matches', params);
  }

  async getMatch(matchId: number): Promise<HighlightlyApiResponse<HighlightlyMatch>> {
    return this.fetch<HighlightlyMatch>(`/matches/${matchId}`);
  }

  async getTeams(
    league: string = 'NCAA'
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyTeamDetail>>> {
    return this.fetch<HighlightlyPaginatedResponse<HighlightlyTeamDetail>>('/teams', { league });
  }

  async getTeam(teamId: number): Promise<HighlightlyApiResponse<HighlightlyTeamDetail>> {
    return this.fetch<HighlightlyTeamDetail>(`/teams/${teamId}`);
  }

  async getTeamPlayers(
    teamId: number
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyPlayer>>> {
    return this.fetch<HighlightlyPaginatedResponse<HighlightlyPlayer>>(
      `/teams/${teamId}/players`
    );
  }

  async getStandings(
    abbreviation: string = 'NCAA'
  ): Promise<HighlightlyApiResponse<HighlightlyStandings[]>> {
    return this.fetch<HighlightlyStandings[]>('/standings', { abbreviation });
  }

  async getPlayer(playerId: number): Promise<HighlightlyApiResponse<HighlightlyPlayer>> {
    return this.fetch<HighlightlyPlayer>(`/players/${playerId}`);
  }

  async getPlayerStatistics(
    playerId: number
  ): Promise<HighlightlyApiResponse<HighlightlyPlayerStats>> {
    return this.fetch<HighlightlyPlayerStats>(`/players/${playerId}/statistics`);
  }

  async getBoxScore(matchId: number): Promise<HighlightlyApiResponse<HighlightlyBoxScore>> {
    return this.fetch<HighlightlyBoxScore>(`/box-scores/${matchId}`);
  }

  async getRankings(): Promise<
    HighlightlyApiResponse<
      Array<{
        rank: number;
        previousRank: number | null;
        team: HighlightlyTeamDetail;
        record: string;
        points: number | null;
        firstPlaceVotes: number | null;
        source: string;
      }>
    >
  > {
    return this.fetch('/rankings', { league: 'NCAA' });
  }

  async getSchedule(
    date: string,
    range: string = 'day'
  ): Promise<HighlightlyApiResponse<HighlightlyPaginatedResponse<HighlightlyMatch>>> {
    return this.fetch<HighlightlyPaginatedResponse<HighlightlyMatch>>('/matches', {
      league: 'NCAA',
      date,
      range,
    });
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    latency_ms: number;
    rateLimitRemaining?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
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
// FACTORY
// =============================================================================

export function createHighlightlyClient(
  rapidApiKey: string,
  config?: Partial<Omit<HighlightlyApiConfig, 'rapidApiKey'>>
): HighlightlyApiClient {
  return new HighlightlyApiClient({ rapidApiKey, ...config });
}

export default HighlightlyApiClient;
