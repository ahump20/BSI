/**
 * ESPN Unified API Adapter
 *
 * Comprehensive ESPN API integration for all supported sports.
 * Leverages ESPN's hidden/undocumented endpoints discovered through research.
 *
 * Supported Sports:
 * - College Football (NCAAF) with conference filtering (groups param)
 * - College Basketball (Men's & Women's)
 * - College Baseball
 * - NFL
 * - NBA / WNBA
 * - MLB
 * - NHL
 *
 * Base URLs:
 * - site.api.espn.com/apis/site/v2/sports/ - General site data
 * - sports.core.api.espn.com/v2/ - Core sports data
 * - site.web.api.espn.com/apis/ - Web-specific APIs
 *
 * Cache Strategy:
 * - Live games: 30 seconds
 * - Scheduled games: 5 minutes
 * - Final scores: 1 hour
 * - Rankings: 30 minutes
 * - Team info: 24 hours
 *
 * @see https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SportKey = 'ncaaf' | 'ncaab' | 'wcbb' | 'nfl' | 'nba' | 'wnba' | 'mlb' | 'cbb' | 'nhl';

export type GameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' | 'DELAYED';

export interface ESPNGame {
  id: string;
  scheduledAt: string;
  status: GameStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamAbbrev: string;
  awayTeamAbbrev: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  homeRanking?: number;
  awayRanking?: number;
  venue?: string;
  venueCity?: string;
  broadcast?: string;
  conference?: string;
  isConferenceGame?: boolean;
  providerName: 'ESPN';
  feedPrecision: 'EVENT' | 'PLAY';
  // Sport-specific fields
  sportData?: FootballGameData | BasketballGameData | BaseballGameData | HockeyGameData;
}

export interface FootballGameData {
  sport: 'football';
  quarter?: number;
  timeRemaining?: string;
  possession?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  redZone?: boolean;
  homeTimeouts?: number;
  awayTimeouts?: number;
}

export interface BasketballGameData {
  sport: 'basketball';
  period?: number;
  timeRemaining?: string;
  homeFouls?: number;
  awayFouls?: number;
  possession?: string;
}

export interface BaseballGameData {
  sport: 'baseball';
  inning?: number;
  inningHalf?: 'TOP' | 'BOTTOM';
  outs?: number;
  balls?: number;
  strikes?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
}

export interface HockeyGameData {
  sport: 'hockey';
  period?: number;
  timeRemaining?: string;
  homePowerPlay?: boolean;
  awayPowerPlay?: boolean;
  homeSOG?: number;
  awaySOG?: number;
}

export interface ESPNTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  shortDisplayName: string;
  nickname?: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  conference?: string;
  division?: string;
  record?: string;
  ranking?: number;
}

export interface ESPNRanking {
  rank: number;
  team: string;
  teamId: string;
  conference: string;
  record: string;
  points?: number;
  firstPlaceVotes?: number;
  previousRank?: number;
  trend: 'up' | 'down' | 'same' | 'new';
}

export interface ESPNRankingPoll {
  poll: string;
  week: number;
  season: number;
  rankings: ESPNRanking[];
  lastUpdated: string;
}

export interface ESPNGameSummary {
  game: ESPNGame;
  boxscore?: any;
  leaders?: any;
  drives?: any;
  plays?: any[];
  winProbability?: number[];
}

export interface ScoreboardOptions {
  date?: string; // YYYYMMDD format
  week?: number;
  conference?: string;
  seasonType?: number; // 1=pre, 2=regular, 3=post, 4=off
  limit?: number;
}

// ============================================================================
// SPORT CONFIGURATION
// ============================================================================

interface SportConfig {
  sport: string;
  league: string;
  groups?: number; // For conference filtering
  hasWeeks?: boolean;
  hasRankings?: boolean;
}

const SPORT_CONFIG: Record<SportKey, SportConfig> = {
  ncaaf: {
    sport: 'football',
    league: 'college-football',
    groups: 80,
    hasWeeks: true,
    hasRankings: true,
  },
  ncaab: { sport: 'basketball', league: 'mens-college-basketball', hasRankings: true },
  wcbb: { sport: 'basketball', league: 'womens-college-basketball', hasRankings: true },
  nfl: { sport: 'football', league: 'nfl', hasWeeks: true },
  nba: { sport: 'basketball', league: 'nba' },
  wnba: { sport: 'basketball', league: 'wnba' },
  mlb: { sport: 'baseball', league: 'mlb' },
  cbb: { sport: 'baseball', league: 'college-baseball' },
  nhl: { sport: 'hockey', league: 'nhl' },
};

// Conference IDs for college football filtering
const CFB_CONFERENCES: Record<string, number> = {
  SEC: 8,
  'Big Ten': 5,
  'Big 12': 4,
  ACC: 1,
  'Pac-12': 9,
  American: 151,
  'Mountain West': 17,
  'Sun Belt': 37,
  MAC: 15,
  'Conference USA': 12,
  FBS: 80,
  FCS: 81,
  'Ivy League': 22,
  'Big Sky': 20,
  CAA: 18,
};

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  liveGames: number;
  scheduledGames: number;
  finalGames: number;
  rankings: number;
  teams: number;
  summary: number;
}

const CACHE_TTLS: CacheConfig = {
  liveGames: 30, // 30 seconds
  scheduledGames: 300, // 5 minutes
  finalGames: 3600, // 1 hour
  rankings: 1800, // 30 minutes
  teams: 86400, // 24 hours
  summary: 60, // 1 minute
};

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class ESPNUnifiedAdapter {
  private kv?: KVNamespace;
  private readonly siteUrl = 'https://site.api.espn.com/apis/site/v2/sports';
  private readonly coreUrl = 'https://sports.core.api.espn.com/v2/sports';
  private readonly webUrl = 'https://site.web.api.espn.com/apis';

  constructor(kv?: KVNamespace) {
    this.kv = kv;
  }

  // ==========================================================================
  // CORE FETCH UTILITIES
  // ==========================================================================

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number,
    skipCache = false
  ): Promise<T> {
    // Try KV cache first
    if (this.kv && !skipCache) {
      try {
        const cached = await this.kv.get(cacheKey, 'json');
        if (cached) {
          return cached as T;
        }
      } catch (error) {
        console.warn(`[ESPNUnifiedAdapter] KV cache read failed for ${cacheKey}:`, error);
      }
    }

    // Fetch from ESPN API
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BlazeSportsIntel/2.0 (https://blazesportsintel.com)',
        Referer: 'https://blazesportsintel.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText} for ${url}`);
    }

    const data = (await response.json()) as T;

    // Store in KV cache
    if (this.kv && !skipCache) {
      try {
        await this.kv.put(cacheKey, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn(`[ESPNUnifiedAdapter] KV cache write failed for ${cacheKey}:`, error);
      }
    }

    return data;
  }

  // ==========================================================================
  // SCOREBOARD ENDPOINTS
  // ==========================================================================

  /**
   * Get scoreboard/games for any supported sport
   * @param sportKey - Sport identifier (ncaaf, ncaab, nfl, etc.)
   * @param options - Optional filters (date, week, conference)
   */
  async getScoreboard(sportKey: SportKey, options: ScoreboardOptions = {}): Promise<ESPNGame[]> {
    const config = SPORT_CONFIG[sportKey];
    const params = new URLSearchParams();

    // Date filter
    if (options.date) {
      params.set('dates', options.date.replace(/-/g, ''));
    }

    // Week filter (football only)
    if (options.week && config.hasWeeks) {
      params.set('week', options.week.toString());
    }

    // Season type
    if (options.seasonType) {
      params.set('seasontype', options.seasonType.toString());
    }

    // Groups/Conference filter (college football)
    if (sportKey === 'ncaaf') {
      if (options.conference && CFB_CONFERENCES[options.conference]) {
        params.set('groups', CFB_CONFERENCES[options.conference].toString());
      } else if (config.groups) {
        params.set('groups', config.groups.toString());
      }
    }

    // Limit
    if (options.limit) {
      params.set('limit', options.limit.toString());
    }

    const url = `${this.siteUrl}/${config.sport}/${config.league}/scoreboard?${params}`;
    const cacheKey = `espn:scoreboard:${sportKey}:${params.toString()}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.scheduledGames);

    return (data.events || []).map((event: any) => this.transformEvent(event, sportKey));
  }

  /**
   * Get all FBS college football games (convenience method)
   */
  async getCFBScoreboard(
    options: Omit<ScoreboardOptions, 'conference'> & { conference?: string } = {}
  ): Promise<ESPNGame[]> {
    return this.getScoreboard('ncaaf', options);
  }

  /**
   * Get games for a specific conference
   */
  async getConferenceGames(
    sportKey: SportKey,
    conference: string,
    options: ScoreboardOptions = {}
  ): Promise<ESPNGame[]> {
    return this.getScoreboard(sportKey, { ...options, conference });
  }

  // ==========================================================================
  // GAME DETAILS
  // ==========================================================================

  /**
   * Get detailed game summary including boxscore, plays, drives
   */
  async getGameSummary(sportKey: SportKey, gameId: string): Promise<ESPNGameSummary> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.siteUrl}/${config.sport}/${config.league}/summary?event=${gameId}`;
    const cacheKey = `espn:summary:${sportKey}:${gameId}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.summary);

    return {
      game: this.transformEvent(data.header?.competitions?.[0] || data, sportKey),
      boxscore: data.boxscore,
      leaders: data.leaders,
      drives: data.drives,
      plays: data.plays,
      winProbability: data.winprobability?.map((wp: any) => wp.homeWinPercentage),
    };
  }

  /**
   * Get play-by-play data for a game
   */
  async getPlayByPlay(sportKey: SportKey, gameId: string): Promise<any[]> {
    const summary = await this.getGameSummary(sportKey, gameId);
    return summary.plays || [];
  }

  // ==========================================================================
  // TEAM ENDPOINTS
  // ==========================================================================

  /**
   * Get all teams for a sport
   */
  async getTeams(sportKey: SportKey): Promise<ESPNTeam[]> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.siteUrl}/${config.sport}/${config.league}/teams?limit=500`;
    const cacheKey = `espn:teams:${sportKey}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.teams);

    return (data.sports?.[0]?.leagues?.[0]?.teams || []).map((t: any) =>
      this.transformTeam(t.team)
    );
  }

  /**
   * Get specific team details
   */
  async getTeam(sportKey: SportKey, teamId: string): Promise<ESPNTeam | null> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.siteUrl}/${config.sport}/${config.league}/teams/${teamId}`;
    const cacheKey = `espn:team:${sportKey}:${teamId}`;

    try {
      const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.teams);
      return this.transformTeam(data.team);
    } catch {
      return null;
    }
  }

  /**
   * Get team roster
   */
  async getTeamRoster(sportKey: SportKey, teamId: string): Promise<any[]> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.siteUrl}/${config.sport}/${config.league}/teams/${teamId}/roster`;
    const cacheKey = `espn:roster:${sportKey}:${teamId}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.teams);
    return data.athletes || [];
  }

  /**
   * Get team schedule
   */
  async getTeamSchedule(sportKey: SportKey, teamId: string, season?: number): Promise<ESPNGame[]> {
    const config = SPORT_CONFIG[sportKey];
    const year = season || new Date().getFullYear();
    const url = `${this.siteUrl}/${config.sport}/${config.league}/teams/${teamId}/schedule?season=${year}`;
    const cacheKey = `espn:schedule:${sportKey}:${teamId}:${year}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.scheduledGames);
    return (data.events || []).map((event: any) => this.transformEvent(event, sportKey));
  }

  // ==========================================================================
  // RANKINGS ENDPOINTS
  // ==========================================================================

  /**
   * Get rankings for college sports
   */
  async getRankings(sportKey: 'ncaaf' | 'ncaab' | 'wcbb'): Promise<ESPNRankingPoll[]> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.siteUrl}/${config.sport}/${config.league}/rankings`;
    const cacheKey = `espn:rankings:${sportKey}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.rankings);

    return (data.rankings || []).map((poll: any) => ({
      poll: poll.name,
      week: poll.week,
      season: poll.season?.year || new Date().getFullYear(),
      lastUpdated: poll.headline || new Date().toISOString(),
      rankings: (poll.ranks || []).map((rank: any) => ({
        rank: rank.current,
        team: rank.team?.displayName || rank.team?.name,
        teamId: rank.team?.id?.toString(),
        conference: rank.team?.conference?.name || '',
        record: rank.recordSummary || '',
        points: rank.points,
        firstPlaceVotes: rank.firstPlaceVotes,
        previousRank: rank.previous,
        trend:
          rank.current < rank.previous
            ? 'up'
            : rank.current > rank.previous
              ? 'down'
              : rank.previous === 0
                ? 'new'
                : 'same',
      })),
    }));
  }

  /**
   * Get AP Top 25 (college football)
   */
  async getAPTop25(): Promise<ESPNRankingPoll | null> {
    const rankings = await this.getRankings('ncaaf');
    return rankings.find((r) => r.poll.toLowerCase().includes('ap')) || rankings[0] || null;
  }

  /**
   * Get CFP Rankings
   */
  async getCFPRankings(): Promise<ESPNRankingPoll | null> {
    const rankings = await this.getRankings('ncaaf');
    return rankings.find((r) => r.poll.toLowerCase().includes('playoff')) || null;
  }

  // ==========================================================================
  // ALL EVENTS (SEASON DATA)
  // ==========================================================================

  /**
   * Get all events for a season (uses core API with limit=1000)
   */
  async getAllSeasonEvents(
    sportKey: SportKey,
    season: number,
    seasonType: number = 2
  ): Promise<any[]> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.coreUrl}/${config.sport}/leagues/${config.league}/seasons/${season}/types/${seasonType}/events?limit=1000`;
    const cacheKey = `espn:season:${sportKey}:${season}:${seasonType}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.finalGames);
    return data.items || [];
  }

  // ==========================================================================
  // NEWS ENDPOINTS
  // ==========================================================================

  /**
   * Get latest news for a sport
   */
  async getNews(sportKey: SportKey, limit: number = 25): Promise<any[]> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.siteUrl}/${config.sport}/${config.league}/news?limit=${limit}`;
    const cacheKey = `espn:news:${sportKey}:${limit}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.scheduledGames);
    return data.articles || [];
  }

  // ==========================================================================
  // PLAYER ENDPOINTS
  // ==========================================================================

  /**
   * Get player stats
   */
  async getPlayerStats(sportKey: SportKey, athleteId: string): Promise<any> {
    const config = SPORT_CONFIG[sportKey];
    const url = `${this.webUrl}/common/v3/sports/${config.sport}/${config.league}/athletes/${athleteId}/stats`;
    const cacheKey = `espn:player:${sportKey}:${athleteId}`;

    return this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.scheduledGames);
  }

  // ==========================================================================
  // TRANSFORM HELPERS
  // ==========================================================================

  private transformEvent(event: any, sportKey: SportKey): ESPNGame {
    const competition = event.competitions?.[0] || event;
    const competitors = competition.competitors || [];
    const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0] || {};
    const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1] || {};

    const config = SPORT_CONFIG[sportKey];
    const sportData = this.extractSportData(competition, config.sport);

    return {
      id: event.id?.toString() || competition.id?.toString() || '',
      scheduledAt: event.date || competition.date || '',
      status: this.mapStatus(competition.status?.type?.name || event.status?.type?.name),
      homeTeamId: home.team?.id?.toString() || home.id?.toString() || '',
      awayTeamId: away.team?.id?.toString() || away.id?.toString() || '',
      homeTeamName: home.team?.displayName || home.team?.name || '',
      awayTeamName: away.team?.displayName || away.team?.name || '',
      homeTeamAbbrev: home.team?.abbreviation || '',
      awayTeamAbbrev: away.team?.abbreviation || '',
      homeTeamLogo: home.team?.logo || home.team?.logos?.[0]?.href,
      awayTeamLogo: away.team?.logo || away.team?.logos?.[0]?.href,
      homeScore: this.parseScore(home.score),
      awayScore: this.parseScore(away.score),
      homeRanking: home.curatedRank?.current || home.rank,
      awayRanking: away.curatedRank?.current || away.rank,
      venue: competition.venue?.fullName || competition.venue?.name,
      venueCity: competition.venue?.address?.city,
      broadcast:
        competition.broadcasts?.[0]?.names?.[0] || competition.geoBroadcasts?.[0]?.media?.shortName,
      conference: competition.conferenceCompetition ? home.team?.conference?.name : undefined,
      isConferenceGame: competition.conferenceCompetition,
      providerName: 'ESPN',
      feedPrecision: 'EVENT',
      sportData,
    };
  }

  private extractSportData(
    competition: any,
    sport: string
  ): FootballGameData | BasketballGameData | BaseballGameData | HockeyGameData | undefined {
    const situation = competition.situation;
    const status = competition.status;

    if (sport === 'football' && situation) {
      return {
        sport: 'football',
        quarter: status?.period,
        timeRemaining: status?.displayClock,
        possession: situation.possession,
        down: situation.down,
        distance: situation.distance,
        yardLine: situation.yardLine,
        redZone: situation.isRedZone,
        homeTimeouts: situation.homeTimeouts,
        awayTimeouts: situation.awayTimeouts,
      };
    }

    if (sport === 'basketball') {
      return {
        sport: 'basketball',
        period: status?.period,
        timeRemaining: status?.displayClock,
        possession: situation?.possession,
      };
    }

    if (sport === 'baseball' && situation) {
      return {
        sport: 'baseball',
        inning: status?.period,
        inningHalf: status?.type?.description?.toLowerCase().includes('top') ? 'TOP' : 'BOTTOM',
        outs: situation.outs,
        balls: situation.balls,
        strikes: situation.strikes,
        onFirst: situation.onFirst,
        onSecond: situation.onSecond,
        onThird: situation.onThird,
      };
    }

    if (sport === 'hockey') {
      return {
        sport: 'hockey',
        period: status?.period,
        timeRemaining: status?.displayClock,
      };
    }

    return undefined;
  }

  private transformTeam(team: any): ESPNTeam {
    return {
      id: team.id?.toString() || '',
      name: team.name || '',
      displayName: team.displayName || team.name || '',
      abbreviation: team.abbreviation || '',
      shortDisplayName: team.shortDisplayName || team.displayName || '',
      nickname: team.nickname,
      location: team.location,
      color: team.color,
      alternateColor: team.alternateColor,
      logo: team.logo || team.logos?.[0]?.href,
      conference: team.groups?.parent?.name || team.conference?.name,
      division: team.groups?.name,
      record: team.record?.items?.[0]?.summary,
      ranking: team.rank,
    };
  }

  private mapStatus(statusName: string | undefined): GameStatus {
    const lower = (statusName || '').toLowerCase();
    if (lower.includes('scheduled') || lower.includes('pre')) return 'SCHEDULED';
    if (lower.includes('progress') || lower.includes('live') || lower.includes('in '))
      return 'LIVE';
    if (lower.includes('final') || lower.includes('end')) return 'FINAL';
    if (lower.includes('postponed')) return 'POSTPONED';
    if (lower.includes('cancel')) return 'CANCELLED';
    if (lower.includes('delay')) return 'DELAYED';
    return 'SCHEDULED';
  }

  private parseScore(score: any): number | null {
    if (score === null || score === undefined || score === '') return null;
    const parsed = parseFloat(score);
    return isNaN(parsed) ? null : parsed;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get available conferences for a sport
   */
  getAvailableConferences(sportKey: SportKey): string[] {
    if (sportKey === 'ncaaf') {
      return Object.keys(CFB_CONFERENCES);
    }
    return [];
  }

  /**
   * Get conference ID for filtering
   */
  getConferenceId(conference: string): number | undefined {
    return CFB_CONFERENCES[conference];
  }

  /**
   * Check if a game is currently live
   */
  isGameLive(game: ESPNGame): boolean {
    return game.status === 'LIVE';
  }

  /**
   * Get games by status
   */
  filterGamesByStatus(games: ESPNGame[], status: GameStatus | GameStatus[]): ESPNGame[] {
    const statuses = Array.isArray(status) ? status : [status];
    return games.filter((g) => statuses.includes(g.status));
  }
}
