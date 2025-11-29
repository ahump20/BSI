/**
 * NCAA API Adapter
 *
 * Integration with ncaa.com's public data API for college sports.
 * Based on patterns from henrygd/ncaa-api GitHub repository.
 *
 * Endpoints available:
 * - Scores & schedules for all NCAA sports
 * - Standings by conference/division
 * - Rankings (polls)
 * - Game box scores and play-by-play
 * - Team and player statistics
 *
 * This adapter supplements the ESPN-based NCAA adapter with direct
 * ncaa.com data, providing an alternative data source for failover.
 *
 * @see https://github.com/henrygd/ncaa-api
 */

import type { CacheCategory } from '../cache/tiered-cache';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type NCAAApiSport =
  | 'baseball'
  | 'softball'
  | 'basketball-men'
  | 'basketball-women'
  | 'football'
  | 'soccer-men'
  | 'soccer-women'
  | 'volleyball-women'
  | 'hockey-men'
  | 'hockey-women'
  | 'lacrosse-men'
  | 'lacrosse-women';

export type NCAADivision = 'd1' | 'd2' | 'd3' | 'fbs' | 'fcs';

export interface NCAAApiTeam {
  id: string;
  seoName: string;
  shortName: string;
  fullName: string;
  nickname?: string;
  color?: string;
  conference?: string;
  division?: NCAADivision;
  logo?: string;
  record?: {
    overall: string;
    conference: string;
    wins: number;
    losses: number;
    confWins: number;
    confLosses: number;
  };
  ranking?: number;
}

export interface NCAAApiGame {
  id: string;
  slug: string;
  title: string;
  status: NCAAApiGameStatus;
  startDate: string;
  startTime?: string;
  startTimeEpoch?: number;
  finalMessage?: string;
  home: NCAAApiTeam;
  away: NCAAApiTeam;
  homeScore: number | null;
  awayScore: number | null;
  currentPeriod?: string;
  currentClock?: string;
  venue?: {
    name: string;
    city: string;
    state: string;
  };
  broadcast?: string;
  attendance?: number;
  sport: NCAAApiSport;
  seasonYear: number;
  gameType: 'regular' | 'conference' | 'postseason';
  conferenceGame: boolean;
  neutralSite: boolean;
}

export type NCAAApiGameStatus =
  | 'pre' // Scheduled
  | 'live' // In progress
  | 'final' // Completed
  | 'postponed'
  | 'canceled'
  | 'delayed';

export interface NCAAApiBoxScore {
  gameId: string;
  home: NCAAApiTeamBoxScore;
  away: NCAAApiTeamBoxScore;
  scoring: NCAAApiScoringSummary[];
  leaders?: NCAAApiGameLeaders;
}

export interface NCAAApiTeamBoxScore {
  team: NCAAApiTeam;
  score: number;
  stats: NCAAApiTeamStats;
  players: NCAAApiPlayerStats[];
}

export interface NCAAApiTeamStats {
  // Baseball specific
  runs?: number;
  hits?: number;
  errors?: number;
  leftOnBase?: number;
  // Basketball specific
  fieldGoals?: string;
  threePointers?: string;
  freeThrows?: string;
  rebounds?: number;
  assists?: number;
  turnovers?: number;
  // Football specific
  totalYards?: number;
  passingYards?: number;
  rushingYards?: number;
  firstDowns?: number;
  thirdDownConv?: string;
  timeOfPossession?: string;
  // General
  [key: string]: unknown;
}

export interface NCAAApiPlayerStats {
  id: string;
  name: string;
  position: string;
  stats: Record<string, string | number>;
}

export interface NCAAApiScoringSummary {
  period: string | number;
  home: number;
  away: number;
  description?: string;
}

export interface NCAAApiGameLeaders {
  home: NCAAApiLeaderCategory[];
  away: NCAAApiLeaderCategory[];
}

export interface NCAAApiLeaderCategory {
  category: string;
  leaders: Array<{
    name: string;
    value: string;
    position?: string;
  }>;
}

export interface NCAAApiStandings {
  sport: NCAAApiSport;
  division: NCAADivision;
  conference: string;
  season: number;
  teams: NCAAApiStandingsTeam[];
}

export interface NCAAApiStandingsTeam extends NCAAApiTeam {
  conferenceRank: number;
  overallRecord: string;
  conferenceRecord: string;
  streak?: string;
  lastTen?: string;
  homeRecord?: string;
  awayRecord?: string;
  pointsFor?: number;
  pointsAgainst?: number;
  winPct: number;
}

export interface NCAAApiRanking {
  rank: number;
  team: NCAAApiTeam;
  record: string;
  previousRank?: number;
  points?: number;
  firstPlaceVotes?: number;
}

export interface NCAAApiRankingPoll {
  poll: string;
  sport: NCAAApiSport;
  week: number;
  season: number;
  lastUpdated: string;
  rankings: NCAAApiRanking[];
}

export interface NCAAApiScoreboardResponse {
  sport: NCAAApiSport;
  division: NCAADivision;
  date: string;
  games: NCAAApiGame[];
}

export interface NCAAApiScheduleResponse {
  team: NCAAApiTeam;
  sport: NCAAApiSport;
  season: number;
  games: NCAAApiGame[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const NCAA_API_BASE = 'https://data.ncaa.com/casablanca/scoreboard';
const NCAA_SITE_BASE = 'https://ncaa.com';

// Sport path mapping for NCAA.com URLs
const SPORT_PATHS: Record<NCAAApiSport, string> = {
  baseball: 'baseball',
  softball: 'softball',
  'basketball-men': 'basketball-men',
  'basketball-women': 'basketball-women',
  football: 'football',
  'soccer-men': 'soccer-men',
  'soccer-women': 'soccer-women',
  'volleyball-women': 'volleyball-women',
  'hockey-men': 'ice-hockey-men',
  'hockey-women': 'ice-hockey-women',
  'lacrosse-men': 'lacrosse-men',
  'lacrosse-women': 'lacrosse-women',
};

const DIVISION_PATHS: Record<NCAADivision, string> = {
  d1: 'd1',
  d2: 'd2',
  d3: 'd3',
  fbs: 'fbs',
  fcs: 'fcs',
};

// Cache TTLs (in seconds)
const CACHE_TTLS: Record<string, number> = {
  scoreboard: 30, // Live scores update frequently
  boxscore: 60, // Box scores during game
  standings: 300, // 5 minutes
  rankings: 1800, // 30 minutes
  schedule: 3600, // 1 hour
  team: 86400, // 24 hours
};

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export interface NCAAApiAdapterOptions {
  kv?: KVNamespace;
  userAgent?: string;
  timeout?: number;
}

export class NCAAApiAdapter {
  private kv?: KVNamespace;
  private userAgent: string;
  private timeout: number;

  constructor(options: NCAAApiAdapterOptions = {}) {
    this.kv = options.kv;
    this.userAgent = options.userAgent || 'BSI-NCAA-Adapter/1.0 (BlazeSportsIntel)';
    this.timeout = options.timeout || 10000;
  }

  // ==========================================================================
  // PUBLIC API - SCOREBOARD
  // ==========================================================================

  /**
   * Get scoreboard for a specific sport, division, and date
   */
  async getScoreboard(
    sport: NCAAApiSport,
    division: NCAADivision,
    date?: Date
  ): Promise<NCAAApiScoreboardResponse> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);
    const cacheKey = `ncaa:scoreboard:${sport}:${division}:${dateStr}`;

    // Try cache first
    const cached = await this.getFromCache<NCAAApiScoreboardResponse>(cacheKey);
    if (cached) return cached;

    // Build URL path based on henrygd/ncaa-api pattern
    const sportPath = SPORT_PATHS[sport];
    const divisionPath = DIVISION_PATHS[division];
    const url = `${NCAA_API_BASE}/${sportPath}/${divisionPath}/${dateStr}/scoreboard.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    const result = this.transformScoreboardResponse(data, sport, division, dateStr);

    // Cache the result
    await this.setCache(cacheKey, result, CACHE_TTLS.scoreboard);

    return result;
  }

  /**
   * Get today's games for a sport/division
   */
  async getTodaysGames(sport: NCAAApiSport, division: NCAADivision = 'd1'): Promise<NCAAApiGame[]> {
    const scoreboard = await this.getScoreboard(sport, division);
    return scoreboard.games;
  }

  /**
   * Get live games across sports
   */
  async getLiveGames(
    sports: NCAAApiSport[] = ['baseball', 'basketball-men', 'football']
  ): Promise<NCAAApiGame[]> {
    const results = await Promise.allSettled(sports.map((sport) => this.getTodaysGames(sport)));

    const liveGames: NCAAApiGame[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        liveGames.push(...result.value.filter((g) => g.status === 'live'));
      }
    });

    return liveGames;
  }

  // ==========================================================================
  // PUBLIC API - BOX SCORES
  // ==========================================================================

  /**
   * Get detailed box score for a game
   */
  async getBoxScore(
    sport: NCAAApiSport,
    division: NCAADivision,
    gameId: string
  ): Promise<NCAAApiBoxScore> {
    const cacheKey = `ncaa:boxscore:${sport}:${division}:${gameId}`;

    const cached = await this.getFromCache<NCAAApiBoxScore>(cacheKey);
    if (cached) return cached;

    const sportPath = SPORT_PATHS[sport];
    const divisionPath = DIVISION_PATHS[division];
    const url = `${NCAA_API_BASE}/${sportPath}/${divisionPath}/game/${gameId}/boxscore.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    const result = this.transformBoxScoreResponse(data, gameId);

    await this.setCache(cacheKey, result, CACHE_TTLS.boxscore);

    return result;
  }

  /**
   * Get play-by-play for a game
   */
  async getPlayByPlay(sport: NCAAApiSport, division: NCAADivision, gameId: string): Promise<any[]> {
    const sportPath = SPORT_PATHS[sport];
    const divisionPath = DIVISION_PATHS[division];
    const url = `${NCAA_API_BASE}/${sportPath}/${divisionPath}/game/${gameId}/pbp.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    return this.transformPlayByPlayResponse(data);
  }

  // ==========================================================================
  // PUBLIC API - STANDINGS
  // ==========================================================================

  /**
   * Get conference standings
   */
  async getStandings(
    sport: NCAAApiSport,
    division: NCAADivision,
    conference?: string
  ): Promise<NCAAApiStandings[]> {
    const cacheKey = `ncaa:standings:${sport}:${division}:${conference || 'all'}`;

    const cached = await this.getFromCache<NCAAApiStandings[]>(cacheKey);
    if (cached) return cached;

    const sportPath = SPORT_PATHS[sport];
    const divisionPath = DIVISION_PATHS[division];
    const url = `${NCAA_API_BASE}/${sportPath}/${divisionPath}/standings.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    let standings = this.transformStandingsResponse(data, sport, division);

    // Filter by conference if specified
    if (conference) {
      standings = standings.filter((s) =>
        s.conference.toLowerCase().includes(conference.toLowerCase())
      );
    }

    await this.setCache(cacheKey, standings, CACHE_TTLS.standings);

    return standings;
  }

  // ==========================================================================
  // PUBLIC API - RANKINGS
  // ==========================================================================

  /**
   * Get current rankings/polls
   */
  async getRankings(
    sport: NCAAApiSport,
    division: NCAADivision = 'd1',
    poll?: string
  ): Promise<NCAAApiRankingPoll[]> {
    const cacheKey = `ncaa:rankings:${sport}:${division}:${poll || 'all'}`;

    const cached = await this.getFromCache<NCAAApiRankingPoll[]>(cacheKey);
    if (cached) return cached;

    const sportPath = SPORT_PATHS[sport];
    const divisionPath = DIVISION_PATHS[division];
    const url = `${NCAA_API_BASE}/${sportPath}/${divisionPath}/rankings.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    let rankings = this.transformRankingsResponse(data, sport);

    if (poll) {
      rankings = rankings.filter((r) => r.poll.toLowerCase().includes(poll.toLowerCase()));
    }

    await this.setCache(cacheKey, rankings, CACHE_TTLS.rankings);

    return rankings;
  }

  // ==========================================================================
  // PUBLIC API - TEAM DATA
  // ==========================================================================

  /**
   * Get team schedule
   */
  async getTeamSchedule(
    sport: NCAAApiSport,
    teamId: string,
    season?: number
  ): Promise<NCAAApiScheduleResponse> {
    const year = season || new Date().getFullYear();
    const cacheKey = `ncaa:schedule:${sport}:${teamId}:${year}`;

    const cached = await this.getFromCache<NCAAApiScheduleResponse>(cacheKey);
    if (cached) return cached;

    const sportPath = SPORT_PATHS[sport];
    const url = `${NCAA_API_BASE}/${sportPath}/team/${teamId}/schedule/${year}.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    const result = this.transformScheduleResponse(data, sport, year);

    await this.setCache(cacheKey, result, CACHE_TTLS.schedule);

    return result;
  }

  /**
   * Get team roster
   */
  async getTeamRoster(sport: NCAAApiSport, teamId: string): Promise<NCAAApiPlayerStats[]> {
    const cacheKey = `ncaa:roster:${sport}:${teamId}`;

    const cached = await this.getFromCache<NCAAApiPlayerStats[]>(cacheKey);
    if (cached) return cached;

    const sportPath = SPORT_PATHS[sport];
    const url = `${NCAA_API_BASE}/${sportPath}/team/${teamId}/roster.json`;

    const response = await this.fetch(url);
    const data = await response.json();

    const result = this.transformRosterResponse(data);

    await this.setCache(cacheKey, result, CACHE_TTLS.team);

    return result;
  }

  // ==========================================================================
  // COLLEGE BASEBALL SPECIFIC METHODS
  // ==========================================================================

  /**
   * Get college baseball scoreboard - specialized for BSI's focus area
   */
  async getCollegeBaseballScoreboard(
    division: NCAADivision = 'd1',
    date?: Date
  ): Promise<NCAAApiScoreboardResponse> {
    return this.getScoreboard('baseball', division, date);
  }

  /**
   * Get college baseball standings by conference
   */
  async getCollegeBaseballStandings(
    division: NCAADivision = 'd1',
    conference?: string
  ): Promise<NCAAApiStandings[]> {
    return this.getStandings('baseball', division, conference);
  }

  /**
   * Get college baseball rankings (D1Baseball, USA Today, etc.)
   */
  async getCollegeBaseballRankings(poll?: string): Promise<NCAAApiRankingPoll[]> {
    return this.getRankings('baseball', 'd1', poll);
  }

  /**
   * Get college baseball box score with full linescore
   */
  async getCollegeBaseballBoxScore(
    gameId: string,
    division: NCAADivision = 'd1'
  ): Promise<NCAAApiBoxScore> {
    return this.getBoxScore('baseball', division, gameId);
  }

  // ==========================================================================
  // TRANSFORM METHODS
  // ==========================================================================

  private transformScoreboardResponse(
    data: any,
    sport: NCAAApiSport,
    division: NCAADivision,
    dateStr: string
  ): NCAAApiScoreboardResponse {
    const games: NCAAApiGame[] = [];

    // NCAA API typically returns games array
    const rawGames = data?.games || data?.scoreboard?.games || [];

    for (const rawGame of rawGames) {
      try {
        games.push(this.transformGame(rawGame, sport));
      } catch (error) {
        console.warn('[NCAAApiAdapter] Failed to transform game:', error);
      }
    }

    return {
      sport,
      division,
      date: dateStr,
      games,
    };
  }

  private transformGame(rawGame: any, sport: NCAAApiSport): NCAAApiGame {
    const game = rawGame.game || rawGame;

    return {
      id: String(game.gameID || game.id || game.contest_id),
      slug: game.slug || '',
      title:
        game.title || `${game.away?.names?.full || 'Away'} at ${game.home?.names?.full || 'Home'}`,
      status: this.mapGameStatus(game.gameState || game.status || game.currentPeriod),
      startDate:
        game.startDate || game.startTimeEpoch
          ? new Date(game.startTimeEpoch * 1000).toISOString()
          : new Date().toISOString(),
      startTime: game.startTime,
      startTimeEpoch: game.startTimeEpoch,
      finalMessage: game.finalMessage || game.statusMessage,
      home: this.transformTeam(game.home),
      away: this.transformTeam(game.away),
      homeScore: game.home?.score ?? game.homeScore ?? null,
      awayScore: game.away?.score ?? game.awayScore ?? null,
      currentPeriod: game.currentPeriod || game.period,
      currentClock: game.clock || game.currentClock,
      venue: game.location
        ? {
            name: game.location.name || game.location.venue,
            city: game.location.city || '',
            state: game.location.state || '',
          }
        : undefined,
      broadcast: game.network || game.broadcast,
      attendance: game.attendance ? parseInt(game.attendance, 10) : undefined,
      sport,
      seasonYear: game.seasonYear || new Date().getFullYear(),
      gameType: this.mapGameType(game.contestType || game.gameType),
      conferenceGame: game.conferenceGame ?? game.isConference ?? false,
      neutralSite: game.neutralSite ?? false,
    };
  }

  private transformTeam(rawTeam: any): NCAAApiTeam {
    if (!rawTeam) {
      return {
        id: 'unknown',
        seoName: 'unknown',
        shortName: 'TBD',
        fullName: 'TBD',
      };
    }

    const names = rawTeam.names || {};
    const record = rawTeam.record || rawTeam.description || '';

    return {
      id: String(rawTeam.id || rawTeam.teamId || 'unknown'),
      seoName: rawTeam.seoname || rawTeam.slug || '',
      shortName: names.short || rawTeam.shortName || rawTeam.name || '',
      fullName: names.full || rawTeam.fullName || rawTeam.name || '',
      nickname: names.char6 || rawTeam.nickname,
      color: rawTeam.color,
      conference: rawTeam.conference || rawTeam.conferenceNames?.full,
      logo: rawTeam.logoUrl || rawTeam.logo,
      record: record ? this.parseRecord(record) : undefined,
      ranking: rawTeam.rank || rawTeam.ranking,
    };
  }

  private transformBoxScoreResponse(data: any, gameId: string): NCAAApiBoxScore {
    const boxscore = data?.boxscore || data;

    return {
      gameId,
      home: this.transformTeamBoxScore(boxscore.home || boxscore.homeTeam),
      away: this.transformTeamBoxScore(boxscore.away || boxscore.awayTeam),
      scoring: this.transformScoringSummary(boxscore.scoring || boxscore.periods || []),
      leaders: boxscore.leaders ? this.transformLeaders(boxscore.leaders) : undefined,
    };
  }

  private transformTeamBoxScore(rawTeam: any): NCAAApiTeamBoxScore {
    return {
      team: this.transformTeam(rawTeam?.team || rawTeam),
      score: rawTeam?.score ?? 0,
      stats: rawTeam?.stats || rawTeam?.statistics || {},
      players: (rawTeam?.players || rawTeam?.roster || []).map(
        this.transformPlayerStats.bind(this)
      ),
    };
  }

  private transformPlayerStats(rawPlayer: any): NCAAApiPlayerStats {
    return {
      id: String(rawPlayer.id || rawPlayer.playerId || 'unknown'),
      name:
        rawPlayer.name || rawPlayer.playerName || `${rawPlayer.firstName} ${rawPlayer.lastName}`,
      position: rawPlayer.position || rawPlayer.pos || '',
      stats: rawPlayer.stats || rawPlayer.statistics || {},
    };
  }

  private transformScoringSummary(rawScoring: any[]): NCAAApiScoringSummary[] {
    return rawScoring.map((period, index) => ({
      period: period.period || period.name || index + 1,
      home: period.home ?? period.homeScore ?? 0,
      away: period.away ?? period.awayScore ?? 0,
      description: period.description,
    }));
  }

  private transformLeaders(rawLeaders: any): NCAAApiGameLeaders {
    return {
      home: this.transformLeaderCategories(rawLeaders.home || []),
      away: this.transformLeaderCategories(rawLeaders.away || []),
    };
  }

  private transformLeaderCategories(rawCategories: any[]): NCAAApiLeaderCategory[] {
    return rawCategories.map((cat) => ({
      category: cat.category || cat.name,
      leaders: (cat.leaders || cat.players || []).map((leader: any) => ({
        name: leader.name || leader.playerName,
        value: String(leader.value || leader.stat),
        position: leader.position,
      })),
    }));
  }

  private transformPlayByPlayResponse(data: any): any[] {
    const plays = data?.plays || data?.pbp?.plays || [];
    return plays.map((play: any) => ({
      id: play.id || play.playId,
      period: play.period || play.inning,
      clock: play.clock || play.time,
      description: play.description || play.text,
      homeScore: play.homeScore,
      awayScore: play.awayScore,
      type: play.type || play.playType,
    }));
  }

  private transformStandingsResponse(
    data: any,
    sport: NCAAApiSport,
    division: NCAADivision
  ): NCAAApiStandings[] {
    const conferences = data?.standings || data?.conferences || [];
    const season = data?.season || new Date().getFullYear();

    return conferences.map((conf: any) => ({
      sport,
      division,
      conference: conf.conference || conf.name || 'Unknown',
      season,
      teams: (conf.teams || conf.standings || []).map((team: any, index: number) =>
        this.transformStandingsTeam(team, index + 1)
      ),
    }));
  }

  private transformStandingsTeam(rawTeam: any, rank: number): NCAAApiStandingsTeam {
    const baseTeam = this.transformTeam(rawTeam.team || rawTeam);

    return {
      ...baseTeam,
      conferenceRank: rawTeam.conferenceRank || rank,
      overallRecord: rawTeam.overallRecord || rawTeam.record || '',
      conferenceRecord: rawTeam.conferenceRecord || rawTeam.confRecord || '',
      streak: rawTeam.streak,
      lastTen: rawTeam.lastTen || rawTeam.l10,
      homeRecord: rawTeam.homeRecord,
      awayRecord: rawTeam.awayRecord || rawTeam.roadRecord,
      pointsFor: rawTeam.pointsFor || rawTeam.runsScored,
      pointsAgainst: rawTeam.pointsAgainst || rawTeam.runsAllowed,
      winPct: rawTeam.winPct || rawTeam.percentage || 0,
    };
  }

  private transformRankingsResponse(data: any, sport: NCAAApiSport): NCAAApiRankingPoll[] {
    const polls = data?.rankings || data?.polls || [];

    return polls.map((poll: any) => ({
      poll: poll.pollName || poll.name || 'Unknown Poll',
      sport,
      week: poll.week || poll.weekNumber || 0,
      season: poll.season || poll.year || new Date().getFullYear(),
      lastUpdated: poll.lastUpdated || poll.updated || new Date().toISOString(),
      rankings: (poll.rankings || poll.teams || []).map((team: any, index: number) => ({
        rank: team.rank || index + 1,
        team: this.transformTeam(team.team || team),
        record: team.record || team.overallRecord || '',
        previousRank: team.previousRank || team.lastWeekRank,
        points: team.points,
        firstPlaceVotes: team.firstPlaceVotes || team.votes,
      })),
    }));
  }

  private transformScheduleResponse(
    data: any,
    sport: NCAAApiSport,
    season: number
  ): NCAAApiScheduleResponse {
    return {
      team: this.transformTeam(data?.team),
      sport,
      season,
      games: (data?.games || data?.schedule || []).map((game: any) =>
        this.transformGame(game, sport)
      ),
    };
  }

  private transformRosterResponse(data: any): NCAAApiPlayerStats[] {
    const players = data?.roster || data?.players || [];
    return players.map(this.transformPlayerStats.bind(this));
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private mapGameStatus(status: string): NCAAApiGameStatus {
    const normalized = (status || '').toLowerCase();

    if (normalized.includes('final') || normalized.includes('f/')) return 'final';
    if (
      normalized.includes('live') ||
      normalized.includes('progress') ||
      /^\d+(st|nd|rd|th)/.test(normalized)
    )
      return 'live';
    if (normalized.includes('postponed')) return 'postponed';
    if (normalized.includes('cancel')) return 'canceled';
    if (normalized.includes('delay')) return 'delayed';

    return 'pre';
  }

  private mapGameType(type: string): 'regular' | 'conference' | 'postseason' {
    const normalized = (type || '').toLowerCase();

    if (
      normalized.includes('post') ||
      normalized.includes('tournament') ||
      normalized.includes('playoff')
    ) {
      return 'postseason';
    }
    if (normalized.includes('conf')) {
      return 'conference';
    }

    return 'regular';
  }

  private parseRecord(recordStr: string): NCAAApiTeam['record'] {
    // Parse records like "45-12" or "45-12, 18-6"
    const match = recordStr.match(/(\d+)-(\d+)/);
    const confMatch = recordStr.match(/,\s*(\d+)-(\d+)/);

    if (!match) return undefined;

    return {
      overall: recordStr.split(',')[0].trim(),
      conference: confMatch ? `${confMatch[1]}-${confMatch[2]}` : '',
      wins: parseInt(match[1], 10),
      losses: parseInt(match[2], 10),
      confWins: confMatch ? parseInt(confMatch[1], 10) : 0,
      confLosses: confMatch ? parseInt(confMatch[2], 10) : 0,
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  // ==========================================================================
  // FETCH & CACHE UTILITIES
  // ==========================================================================

  private async fetch(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`NCAA API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.kv) return null;

    try {
      const cached = await this.kv.get(key, 'json');
      return cached as T | null;
    } catch (error) {
      console.warn('[NCAAApiAdapter] Cache get error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.kv) return;

    try {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } catch (error) {
      console.warn('[NCAAApiAdapter] Cache set error:', error);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createNCAAApiAdapter(options?: NCAAApiAdapterOptions): NCAAApiAdapter {
  return new NCAAApiAdapter(options);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isNCAAApiGame(obj: unknown): obj is NCAAApiGame {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'status' in obj &&
    'home' in obj &&
    'away' in obj
  );
}

export function isNCAAApiBoxScore(obj: unknown): obj is NCAAApiBoxScore {
  return (
    typeof obj === 'object' && obj !== null && 'gameId' in obj && 'home' in obj && 'away' in obj
  );
}
