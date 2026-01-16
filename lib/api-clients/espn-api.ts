/**
 * ESPN API Client (Hidden/Unofficial)
 *
 * ESPN's undocumented public API for college baseball data.
 * - Free, no authentication required
 * - Covers scoreboard, teams, standings, rankings
 * - Risk: Endpoints may change without notice
 *
 * WARNING: This is an unofficial API. Use for MVP/backup only.
 * No SLA, no support, potential legal/ToS risk.
 *
 * @priority 4 - MVP/backup only (risk of breaking)
 * @author BSI Team
 * @created 2025-01-16
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ESPNApiConfig {
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** User agent for requests */
  userAgent?: string;
}

// Scoreboard Types
export interface ESPNScoreboardResponse {
  leagues?: ESPNLeague[];
  events?: ESPNEvent[];
  season?: ESPNSeason;
  week?: ESPNWeek;
}

export interface ESPNLeague {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  midsizeName?: string;
  slug?: string;
  calendarType?: string;
  calendarIsWhitelist?: boolean;
  calendarStartDate?: string;
  calendarEndDate?: string;
}

export interface ESPNSeason {
  year: number;
  type: number;
  name?: string;
  displayName?: string;
  startDate?: string;
  endDate?: string;
}

export interface ESPNWeek {
  number: number;
  text?: string;
}

export interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName?: string;
  season?: ESPNSeason;
  week?: ESPNWeek;
  competitions?: ESPNCompetition[];
  status?: ESPNStatus;
  links?: ESPNLink[];
}

export interface ESPNCompetition {
  id: string;
  uid: string;
  date: string;
  attendance?: number;
  type?: { id: string; abbreviation: string };
  timeValid?: boolean;
  neutralSite?: boolean;
  conferenceCompetition?: boolean;
  recent?: boolean;
  venue?: ESPNVenue;
  competitors?: ESPNCompetitor[];
  status?: ESPNStatus;
  broadcasts?: ESPNBroadcast[];
  format?: { regulation: { periods: number } };
  startDate?: string;
  geoBroadcasts?: ESPNBroadcast[];
  headlines?: ESPNHeadline[];
  situation?: ESPNSituation;
}

export interface ESPNVenue {
  id: string;
  fullName: string;
  address?: { city: string; state?: string };
  capacity?: number;
  indoor?: boolean;
}

export interface ESPNCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score?: string;
  linescores?: { value: number }[];
  statistics?: ESPNStatistic[];
  records?: ESPNRecord[];
  curatedRank?: { current: number };
  winner?: boolean;
  hits?: number;
  errors?: number;
  probables?: ESPNProbable[];
}

export interface ESPNTeam {
  id: string;
  uid?: string;
  location?: string;
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  color?: string;
  alternateColor?: string;
  isActive?: boolean;
  logo?: string;
  logos?: ESPNLogo[];
  links?: ESPNLink[];
  record?: {
    items?: ESPNRecordItem[];
  };
  groups?: { id: string; parent: { id: string } };
  conferenceId?: string;
}

export interface ESPNLogo {
  href: string;
  width: number;
  height: number;
  alt?: string;
  rel?: string[];
}

export interface ESPNLink {
  language?: string;
  rel?: string[];
  href: string;
  text?: string;
  shortText?: string;
  isExternal?: boolean;
  isPremium?: boolean;
}

export interface ESPNStatistic {
  name: string;
  abbreviation?: string;
  displayValue: string;
}

export interface ESPNRecord {
  name: string;
  abbreviation?: string;
  type: string;
  summary: string;
}

export interface ESPNRecordItem {
  description?: string;
  type?: string;
  summary?: string;
  stats?: ESPNStatistic[];
}

export interface ESPNBroadcast {
  market?: string;
  names?: string[];
  type?: { id: string; shortName: string };
  media?: { shortName: string };
  lang?: string;
  region?: string;
}

export interface ESPNHeadline {
  description: string;
  type: string;
  shortLinkText?: string;
}

export interface ESPNStatus {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: {
    id: string;
    name: string;
    state: 'pre' | 'in' | 'post';
    completed: boolean;
    description?: string;
    detail?: string;
    shortDetail?: string;
  };
}

export interface ESPNSituation {
  lastPlay?: { id: string; type: { id: string; text: string }; text: string };
  balls?: number;
  strikes?: number;
  outs?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  batter?: { athlete: ESPNAthlete };
  pitcher?: { athlete: ESPNAthlete };
}

export interface ESPNProbable {
  name: string;
  abbreviation: string;
  playerId?: number;
  athlete?: ESPNAthlete;
  statistics?: ESPNStatistic[];
}

export interface ESPNAthlete {
  id: string;
  fullName: string;
  displayName?: string;
  shortName?: string;
  jersey?: string;
  headshot?: { href: string; alt: string };
  position?: { abbreviation: string };
}

// Teams Types
export interface ESPNTeamsResponse {
  sports?: {
    leagues?: {
      teams?: { team: ESPNTeam }[];
    }[];
  }[];
}

export interface ESPNTeamDetailsResponse {
  team: ESPNTeam & {
    standingSummary?: string;
    nextEvent?: ESPNEvent[];
    roster?: {
      athletes?: ESPNAthlete[];
    };
    record?: {
      items?: ESPNRecordItem[];
    };
  };
}

// Standings Types
export interface ESPNStandingsResponse {
  uid?: string;
  id?: string;
  name?: string;
  abbreviation?: string;
  children?: ESPNConferenceStandings[];
}

export interface ESPNConferenceStandings {
  uid?: string;
  id?: string;
  name?: string;
  abbreviation?: string;
  standings?: {
    id?: string;
    name?: string;
    displayName?: string;
    entries?: ESPNStandingsEntry[];
  };
}

export interface ESPNStandingsEntry {
  team: ESPNTeam;
  stats?: ESPNStandingsStatistic[];
  note?: { color: string; description: string; rank: number };
}

export interface ESPNStandingsStatistic {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  description?: string;
  abbreviation?: string;
  type?: string;
  value?: number;
  displayValue?: string;
}

// Rankings Types
export interface ESPNRankingsResponse {
  rankings?: ESPNRankingPoll[];
}

export interface ESPNRankingPoll {
  id: string;
  name: string;
  shortName?: string;
  type?: string;
  headline?: string;
  ranks?: ESPNRankedTeam[];
  date?: string;
  lastUpdated?: string;
}

export interface ESPNRankedTeam {
  current: number;
  previous?: number;
  team: ESPNTeam;
  points?: number;
  firstPlaceVotes?: number;
  trend?: string;
  recordSummary?: string;
}

// Game Summary Types
export interface ESPNGameSummaryResponse {
  boxscore?: ESPNBoxscore;
  header?: ESPNGameHeader;
  plays?: ESPNPlay[];
  winprobability?: ESPNWinProbability[];
  leaders?: ESPNLeader[];
  pickcenter?: ESPNPickcenter[];
  standings?: ESPNStandingsResponse;
}

export interface ESPNGameHeader {
  id: string;
  uid: string;
  season: ESPNSeason;
  competitions: ESPNCompetition[];
}

export interface ESPNBoxscore {
  teams?: ESPNBoxscoreTeam[];
  players?: ESPNBoxscorePlayer[];
}

export interface ESPNBoxscoreTeam {
  team: ESPNTeam;
  homeAway: 'home' | 'away';
  statistics?: ESPNStatistic[];
}

export interface ESPNBoxscorePlayer {
  team: ESPNTeam;
  statistics?: {
    name: string;
    keys?: string[];
    labels?: string[];
    descriptions?: string[];
    athletes?: {
      athlete: ESPNAthlete;
      stats: string[];
    }[];
  }[];
}

export interface ESPNPlay {
  id: string;
  sequenceNumber?: string;
  type: { id: string; text: string };
  text: string;
  awayScore?: number;
  homeScore?: number;
  period: { number: number; displayValue: string };
  clock?: { displayValue: string };
  scoringPlay?: boolean;
  participants?: {
    athlete: ESPNAthlete;
    type?: string;
  }[];
}

export interface ESPNWinProbability {
  tiePercentage: number;
  homeWinPercentage: number;
  secondsLeft: number;
  playId: string;
}

export interface ESPNLeader {
  name: string;
  displayName: string;
  shortDisplayName?: string;
  abbreviation?: string;
  leaders?: {
    displayValue: string;
    value: number;
    athlete: ESPNAthlete;
    team: ESPNTeam;
  }[];
}

export interface ESPNPickcenter {
  provider: { id: string; name: string; priority: number };
  details?: string;
  overUnder?: number;
  spread?: number;
  awayTeamOdds?: { favorite: boolean; underdog: boolean };
  homeTeamOdds?: { favorite: boolean; underdog: boolean };
}

// API Response wrapper
export interface ESPNApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  source: 'espn';
  timestamp: string;
  duration_ms: number;
}

// =============================================================================
// ESPN API CLIENT CLASS
// =============================================================================

export class ESPNApiClient {
  private readonly config: Required<ESPNApiConfig>;

  // Base URLs
  public static readonly BASE_URL =
    'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
  public static readonly COMMON_URL =
    'https://site.api.espn.com/apis/common/v3/sports/baseball/college-baseball';

  constructor(config?: ESPNApiConfig) {
    this.config = {
      timeout: config?.timeout || 10000,
      userAgent: config?.userAgent || 'BSI-ESPN-Client/1.0',
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async fetch<T>(url: string): Promise<ESPNApiResponse<T>> {
    const startTime = Date.now();

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.config.userAgent,
    };

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
          error: `ESPN API returned ${response.status}: ${response.statusText}`,
          source: 'espn',
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        };
      }

      const data = (await response.json()) as T;

      return {
        success: true,
        data,
        source: 'espn',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: `ESPN API request failed: ${errorMessage}`,
        source: 'espn',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get scoreboard (live scores)
   *
   * @param dates - Optional date filter (YYYYMMDD format)
   * @param groups - Optional conference group filter
   * @param limit - Optional limit on number of games
   */
  async getScoreboard(
    dates?: string,
    groups?: string,
    limit?: number
  ): Promise<ESPNApiResponse<ESPNScoreboardResponse>> {
    let url = `${ESPNApiClient.BASE_URL}/scoreboard`;
    const params = new URLSearchParams();
    if (dates) params.append('dates', dates);
    if (groups) params.append('groups', groups);
    if (limit) params.append('limit', String(limit));
    if (params.toString()) url += '?' + params.toString();
    return this.fetch<ESPNScoreboardResponse>(url);
  }

  /**
   * Get today's scoreboard
   */
  async getTodayScoreboard(): Promise<ESPNApiResponse<ESPNScoreboardResponse>> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return this.getScoreboard(today);
  }

  /**
   * Get all teams
   */
  async getTeams(): Promise<ESPNApiResponse<ESPNTeamsResponse>> {
    const url = `${ESPNApiClient.BASE_URL}/teams`;
    return this.fetch<ESPNTeamsResponse>(url);
  }

  /**
   * Get team details by ID
   *
   * @param teamId - ESPN team ID
   */
  async getTeam(teamId: string): Promise<ESPNApiResponse<ESPNTeamDetailsResponse>> {
    const url = `${ESPNApiClient.BASE_URL}/teams/${teamId}`;
    return this.fetch<ESPNTeamDetailsResponse>(url);
  }

  /**
   * Get conference standings
   */
  async getStandings(): Promise<ESPNApiResponse<ESPNStandingsResponse>> {
    const url = `${ESPNApiClient.BASE_URL}/standings`;
    return this.fetch<ESPNStandingsResponse>(url);
  }

  /**
   * Get rankings
   */
  async getRankings(): Promise<ESPNApiResponse<ESPNRankingsResponse>> {
    const url = `${ESPNApiClient.BASE_URL}/rankings`;
    return this.fetch<ESPNRankingsResponse>(url);
  }

  /**
   * Get game summary (box score, plays, etc.)
   *
   * @param eventId - ESPN event/game ID
   */
  async getGameSummary(eventId: string): Promise<ESPNApiResponse<ESPNGameSummaryResponse>> {
    const url = `${ESPNApiClient.BASE_URL}/summary?event=${eventId}`;
    return this.fetch<ESPNGameSummaryResponse>(url);
  }

  /**
   * Get season info
   */
  async getSeasonInfo(): Promise<ESPNApiResponse<ESPNSeason>> {
    const url = `${ESPNApiClient.COMMON_URL}/season`;
    return this.fetch<ESPNSeason>(url);
  }

  // ---------------------------------------------------------------------------
  // CONVENIENCE METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get games for a specific date
   *
   * @param date - Date object
   */
  async getGamesByDate(date: Date): Promise<ESPNApiResponse<ESPNScoreboardResponse>> {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return this.getScoreboard(dateStr);
  }

  /**
   * Get games for a date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   */
  async getGamesInRange(
    startDate: Date,
    endDate: Date
  ): Promise<ESPNApiResponse<ESPNScoreboardResponse>> {
    const start = startDate.toISOString().slice(0, 10).replace(/-/g, '');
    const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');
    return this.getScoreboard(`${start}-${end}`);
  }

  /**
   * Get live games only
   */
  async getLiveGames(): Promise<ESPNApiResponse<ESPNScoreboardResponse>> {
    const response = await this.getScoreboard();
    if (!response.success || !response.data) return response;

    // Filter to only in-progress games
    const liveEvents = response.data.events?.filter((event) => event.status?.type?.state === 'in');

    return {
      ...response,
      data: {
        ...response.data,
        events: liveEvents,
      },
    };
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; latency_ms: number; error?: string }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${ESPNApiClient.BASE_URL}/scoreboard?limit=1`, {
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
 * Create a new ESPN API client instance
 *
 * @param config - Optional configuration
 * @returns ESPNApiClient instance
 */
export function createESPNApiClient(config?: ESPNApiConfig): ESPNApiClient {
  return new ESPNApiClient(config);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default ESPNApiClient;
