/**
 * NCAA Enhanced API Adapter
 *
 * Based on the henrygd/ncaa-api pattern for comprehensive NCAA sports data.
 * Provides live scores, stats, standings, rankings, and play-by-play data
 * directly from NCAA sources.
 *
 * Supported Sports:
 * - Football (FBS, FCS, D2, D3)
 * - Men's Basketball (D1, D2, D3)
 * - Women's Basketball (D1, D2, D3)
 * - Baseball (D1, D2, D3)
 * - Softball (D1, D2, D3)
 * - And more NCAA sports
 *
 * Endpoints Pattern:
 * - /scoreboard/{sport}/{division}/{date} - Live scores
 * - /stats/{sport}/{division}/current/team/{id} - Team stats
 * - /stats/{sport}/{division}/current/individual/{id} - Player stats
 * - /rankings/{sport}/{division}/{poll} - Rankings
 * - /standings/{sport}/{division} - Conference standings
 * - /game/{gameId}/boxscore - Detailed box scores
 * - /game/{gameId}/play-by-play - Play-by-play data
 *
 * @see https://github.com/henrygd/ncaa-api
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type NCAASport =
  | 'football'
  | 'basketball-men'
  | 'basketball-women'
  | 'baseball'
  | 'softball'
  | 'soccer-men'
  | 'soccer-women'
  | 'volleyball-women'
  | 'ice-hockey-men'
  | 'ice-hockey-women'
  | 'lacrosse-men'
  | 'lacrosse-women';

export type NCADivision = 'fbs' | 'fcs' | 'd1' | 'd2' | 'd3';

export type NCAAGameState = 'pre' | 'live' | 'final' | 'postponed' | 'canceled';

export interface NCAATeam {
  id: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  mascot?: string;
  conference?: string;
  division?: string;
  logo?: string;
  color?: string;
  record?: string;
  ranking?: number;
  seed?: number; // For tournament brackets
}

export interface NCAAGame {
  id: string;
  date: string;
  time?: string;
  gameState: NCAAGameState;
  home: NCAATeam;
  away: NCAATeam;
  homeScore: number | null;
  awayScore: number | null;
  venue?: string;
  city?: string;
  venueState?: string;
  broadcast?: string;
  attendance?: number;
  // Period/timing info
  period?: number;
  periodName?: string;
  clock?: string;
  // Sport-specific data
  sportData?: NCAAFootballData | NCAABasketballData | NCAABaseballData;
}

export interface NCAAFootballData {
  sport: 'football';
  quarter?: number;
  possession?: string;
  down?: number;
  distance?: number;
  yardLine?: string;
  lastPlay?: string;
  homeTimeouts?: number;
  awayTimeouts?: number;
}

export interface NCAABasketballData {
  sport: 'basketball';
  half?: number;
  possession?: string;
  homeFouls?: number;
  awayFouls?: number;
  homeBonus?: boolean;
  awayBonus?: boolean;
}

export interface NCAABaseballData {
  sport: 'baseball';
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
  balls?: number;
  strikes?: number;
  runnersOn?: string[];
}

export interface NCAAScoreboard {
  sport: NCAASport;
  division: NCADivision;
  date: string;
  games: NCAAGame[];
}

export interface NCAATeamStats {
  team: NCAATeam;
  season: string;
  stats: Record<string, number | string>;
}

export interface NCAAPlayerStats {
  id: string;
  name: string;
  team: NCAATeam;
  position?: string;
  classYear?: string;
  stats: Record<string, number | string>;
}

export interface NCAAStandings {
  conference: string;
  teams: Array<{
    team: NCAATeam;
    conferenceRecord: { wins: number; losses: number };
    overallRecord: { wins: number; losses: number };
    streak?: string;
    homeRecord?: string;
    awayRecord?: string;
    pointsFor?: number;
    pointsAgainst?: number;
  }>;
}

export interface NCAABoxScore {
  game: NCAAGame;
  homeStats: NCAATeamStats;
  awayStats: NCAATeamStats;
  homePlayers: NCAAPlayerStats[];
  awayPlayers: NCAAPlayerStats[];
  scoring?: Array<{
    period: string;
    home: number;
    away: number;
  }>;
}

export interface NCAAPlay {
  id: string;
  period: number;
  time: string;
  team?: string;
  description: string;
  scoreHome?: number;
  scoreAway?: number;
  type?: string;
}

export interface NCAAPlayByPlay {
  game: NCAAGame;
  plays: NCAAPlay[];
}

export interface NCARanking {
  rank: number;
  team: NCAATeam;
  record: string;
  previousRank?: number;
  points?: number;
  firstPlaceVotes?: number;
}

export interface NCAASchool {
  id: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  mascot?: string;
  city?: string;
  state?: string;
  conference?: string;
  division?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  scoreboard: number;
  liveScoreboard: number;
  stats: number;
  standings: number;
  rankings: number;
  boxscore: number;
  playByPlay: number;
  schools: number;
}

const CACHE_TTLS: CacheConfig = {
  scoreboard: 300, // 5 minutes
  liveScoreboard: 30, // 30 seconds
  stats: 3600, // 1 hour
  standings: 300, // 5 minutes
  rankings: 1800, // 30 minutes
  boxscore: 60, // 1 minute (for live games)
  playByPlay: 30, // 30 seconds
  schools: 86400, // 24 hours
};

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class NCAAEnhancedAdapter {
  private baseUrl: string;
  private kv?: KVNamespace;
  private apiKey?: string;

  constructor(options: { baseUrl?: string; kv?: KVNamespace; apiKey?: string } = {}) {
    // Default to a self-hosted deployment or public instance
    this.baseUrl = options.baseUrl || 'https://ncaa-api.henrygd.me';
    this.kv = options.kv;
    this.apiKey = options.apiKey;
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
        console.warn(`[NCAAEnhancedAdapter] KV cache read failed for ${cacheKey}:`, error);
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'BlazeSportsIntel/2.0 (https://blazesportsintel.com)',
    };

    if (this.apiKey) {
      headers['x-ncaa-key'] = this.apiKey;
    }

    // Fetch from NCAA API
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`NCAA API error: ${response.status} ${response.statusText} for ${url}`);
    }

    const data = (await response.json()) as T;

    // Store in KV cache
    if (this.kv && !skipCache) {
      try {
        await this.kv.put(cacheKey, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn(`[NCAAEnhancedAdapter] KV cache write failed for ${cacheKey}:`, error);
      }
    }

    return data;
  }

  // ==========================================================================
  // SCOREBOARD ENDPOINTS
  // ==========================================================================

  /**
   * Get scoreboard/games for a specific date
   */
  async getScoreboard(params: {
    sport: NCAASport;
    division: NCADivision;
    year: number;
    month?: number;
    day?: number;
    week?: number;
    conference?: string;
  }): Promise<NCAAScoreboard> {
    let dateStr: string;

    // Football uses year/week format, others use year/month/day
    if (params.sport === 'football') {
      dateStr = `${params.year}/${params.week || 1}`;
    } else {
      const month = params.month?.toString().padStart(2, '0') || '01';
      const day = params.day?.toString().padStart(2, '0') || '01';
      dateStr = `${params.year}/${month}/${day}`;
    }

    const conf = params.conference || 'all-conf';
    const url = `${this.baseUrl}/scoreboard/${params.sport}/${params.division}/${dateStr}/${conf}`;
    const cacheKey = `ncaa:scoreboard:${params.sport}:${params.division}:${dateStr}:${conf}`;

    // Check if any games might be live
    const now = new Date();
    const isToday =
      params.year === now.getFullYear() &&
      params.month === now.getMonth() + 1 &&
      params.day === now.getDate();

    const ttl = isToday ? CACHE_TTLS.liveScoreboard : CACHE_TTLS.scoreboard;

    const data = await this.fetchWithCache<any>(url, cacheKey, ttl);

    return {
      sport: params.sport,
      division: params.division,
      date: dateStr,
      games: (data.games || []).map((game: any) => this.transformGame(game, params.sport)),
    };
  }

  /**
   * Get today's scoreboard
   */
  async getTodaysScoreboard(sport: NCAASport, division: NCADivision): Promise<NCAAScoreboard> {
    const now = new Date();
    return this.getScoreboard({
      sport,
      division,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    });
  }

  /**
   * Get current week's football scoreboard
   */
  async getFootballScoreboard(division: 'fbs' | 'fcs', week?: number): Promise<NCAAScoreboard> {
    const now = new Date();
    const currentWeek = week || this.calculateFootballWeek(now);
    return this.getScoreboard({
      sport: 'football',
      division,
      year: now.getFullYear(),
      week: currentWeek,
    });
  }

  // ==========================================================================
  // GAME DETAILS
  // ==========================================================================

  /**
   * Get detailed box score for a game
   */
  async getBoxScore(gameId: string): Promise<NCAABoxScore> {
    const url = `${this.baseUrl}/game/${gameId}/boxscore`;
    const cacheKey = `ncaa:boxscore:${gameId}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.boxscore);

    return {
      game: this.transformGame(data.game, 'football'), // Sport inferred from game
      homeStats: data.homeStats,
      awayStats: data.awayStats,
      homePlayers: data.homePlayers || [],
      awayPlayers: data.awayPlayers || [],
      scoring: data.scoring,
    };
  }

  /**
   * Get play-by-play data
   */
  async getPlayByPlay(gameId: string): Promise<NCAAPlayByPlay> {
    const url = `${this.baseUrl}/game/${gameId}/play-by-play`;
    const cacheKey = `ncaa:pbp:${gameId}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.playByPlay);

    return {
      game: this.transformGame(data.game, 'football'),
      plays: (data.plays || []).map((play: any) => ({
        id: play.id,
        period: play.period,
        time: play.time,
        team: play.team,
        description: play.description,
        scoreHome: play.homeScore,
        scoreAway: play.awayScore,
        type: play.type,
      })),
    };
  }

  /**
   * Get scoring summary for a game
   */
  async getScoringSummary(gameId: string): Promise<any> {
    const url = `${this.baseUrl}/game/${gameId}/scoring-summary`;
    const cacheKey = `ncaa:scoring:${gameId}`;

    return this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.boxscore);
  }

  /**
   * Get team stats for a game
   */
  async getGameTeamStats(gameId: string): Promise<any> {
    const url = `${this.baseUrl}/game/${gameId}/team-stats`;
    const cacheKey = `ncaa:gamestats:${gameId}`;

    return this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.boxscore);
  }

  // ==========================================================================
  // STATS ENDPOINTS
  // ==========================================================================

  /**
   * Get team stats for a season
   */
  async getTeamStats(params: {
    sport: NCAASport;
    division: NCADivision;
    teamId: number;
    season?: string;
  }): Promise<NCAATeamStats> {
    const season = params.season || 'current';
    const url = `${this.baseUrl}/stats/${params.sport}/${params.division}/${season}/team/${params.teamId}`;
    const cacheKey = `ncaa:teamstats:${params.sport}:${params.division}:${season}:${params.teamId}`;

    return this.fetchWithCache<NCAATeamStats>(url, cacheKey, CACHE_TTLS.stats);
  }

  /**
   * Get individual player stats
   */
  async getPlayerStats(params: {
    sport: NCAASport;
    division: NCADivision;
    playerId: number;
    season?: string;
  }): Promise<NCAAPlayerStats> {
    const season = params.season || 'current';
    const url = `${this.baseUrl}/stats/${params.sport}/${params.division}/${season}/individual/${params.playerId}`;
    const cacheKey = `ncaa:playerstats:${params.sport}:${params.division}:${season}:${params.playerId}`;

    return this.fetchWithCache<NCAAPlayerStats>(url, cacheKey, CACHE_TTLS.stats);
  }

  /**
   * Get stat leaders for a category
   */
  async getStatLeaders(params: {
    sport: NCAASport;
    division: NCADivision;
    category: string;
    season?: string;
  }): Promise<NCAAPlayerStats[]> {
    const season = params.season || 'current';
    const url = `${this.baseUrl}/stats/${params.sport}/${params.division}/${season}/leaders/${params.category}`;
    const cacheKey = `ncaa:leaders:${params.sport}:${params.division}:${season}:${params.category}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.stats);
    return data.leaders || [];
  }

  // ==========================================================================
  // STANDINGS ENDPOINTS
  // ==========================================================================

  /**
   * Get conference standings
   */
  async getStandings(sport: NCAASport, division: NCADivision): Promise<NCAAStandings[]> {
    const url = `${this.baseUrl}/standings/${sport}/${division}`;
    const cacheKey = `ncaa:standings:${sport}:${division}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.standings);
    return data.standings || [];
  }

  /**
   * Get standings for a specific conference
   */
  async getConferenceStandings(
    sport: NCAASport,
    division: NCADivision,
    conference: string
  ): Promise<NCAAStandings | null> {
    const standings = await this.getStandings(sport, division);
    return standings.find((s) => s.conference.toLowerCase() === conference.toLowerCase()) || null;
  }

  // ==========================================================================
  // RANKINGS ENDPOINTS
  // ==========================================================================

  /**
   * Get rankings for a poll
   */
  async getRankings(
    sport: NCAASport,
    division: NCADivision,
    poll: string = 'associated-press'
  ): Promise<NCARanking[]> {
    const url = `${this.baseUrl}/rankings/${sport}/${division}/${poll}`;
    const cacheKey = `ncaa:rankings:${sport}:${division}:${poll}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.rankings);
    return (data.rankings || []).map((rank: any) => ({
      rank: rank.rank,
      team: this.transformTeam(rank.team),
      record: rank.record,
      previousRank: rank.previousRank,
      points: rank.points,
      firstPlaceVotes: rank.firstPlaceVotes,
    }));
  }

  /**
   * Get AP Top 25 for football
   */
  async getAPTop25Football(division: 'fbs' | 'fcs' = 'fbs'): Promise<NCARanking[]> {
    return this.getRankings('football', division, 'associated-press');
  }

  /**
   * Get Coaches Poll for football
   */
  async getCoachesPollFootball(division: 'fbs' | 'fcs' = 'fbs'): Promise<NCARanking[]> {
    return this.getRankings('football', division, 'coaches');
  }

  /**
   * Get CFP Rankings
   */
  async getCFPRankings(): Promise<NCARanking[]> {
    return this.getRankings('football', 'fbs', 'cfp');
  }

  // ==========================================================================
  // SCHOOLS/TEAMS ENDPOINTS
  // ==========================================================================

  /**
   * Get all schools index
   */
  async getSchoolsIndex(): Promise<NCAASchool[]> {
    const url = `${this.baseUrl}/schools-index`;
    const cacheKey = `ncaa:schools`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.schools);
    return data.schools || [];
  }

  /**
   * Search schools by name
   */
  async searchSchools(query: string): Promise<NCAASchool[]> {
    const schools = await this.getSchoolsIndex();
    const lowerQuery = query.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(lowerQuery) ||
        school.shortName?.toLowerCase().includes(lowerQuery) ||
        school.abbreviation?.toLowerCase().includes(lowerQuery)
    );
  }

  // ==========================================================================
  // HISTORY ENDPOINTS
  // ==========================================================================

  /**
   * Get championship history
   */
  async getChampionshipHistory(sport: NCAASport, division: NCADivision): Promise<any[]> {
    const url = `${this.baseUrl}/history/${sport}/${division}`;
    const cacheKey = `ncaa:history:${sport}:${division}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.schools);
    return data.championships || [];
  }

  // ==========================================================================
  // TRANSFORM HELPERS
  // ==========================================================================

  private transformGame(game: any, sport: NCAASport): NCAAGame {
    const sportData = this.extractSportData(game, sport);

    return {
      id: game.gameID || game.id,
      date: game.startDate || game.date,
      time: game.startTime || game.time,
      gameState: this.mapGameState(game.gameState || game.state),
      home: this.transformTeam(game.home || game.homeTeam),
      away: this.transformTeam(game.away || game.awayTeam),
      homeScore: game.home?.score ?? game.homeScore ?? null,
      awayScore: game.away?.score ?? game.awayScore ?? null,
      venue: game.venue || game.location?.name,
      city: game.city || game.location?.city,
      venueState: game.state || game.location?.state,
      broadcast: game.network || game.broadcast,
      attendance: game.attendance,
      period: game.currentPeriod || game.period,
      periodName: game.currentPeriodName,
      clock: game.gameClock || game.clock,
      sportData,
    };
  }

  private transformTeam(team: any): NCAATeam {
    return {
      id: team.teamId?.toString() || team.id?.toString() || '',
      name: team.name || team.teamName || team.school || '',
      shortName: team.shortName || team.nickName,
      abbreviation: team.abbreviation || team.abbrev,
      mascot: team.mascot,
      conference: team.conference || team.conferenceAbbrev,
      division: team.division,
      logo: team.logo || team.logoUrl,
      color: team.color || team.primaryColor,
      record: team.record || team.overallRecord,
      ranking: team.ranking || team.rank,
      seed: team.seed,
    };
  }

  private extractSportData(
    game: any,
    sport: NCAASport
  ): NCAAFootballData | NCAABasketballData | NCAABaseballData | undefined {
    const situation = game.situation || game.currentSituation;

    if (sport === 'football' && situation) {
      return {
        sport: 'football',
        quarter: game.currentPeriod,
        possession: situation.possession,
        down: situation.down,
        distance: situation.distance,
        yardLine: situation.yardLine,
        lastPlay: situation.lastPlay,
        homeTimeouts: situation.homeTimeouts,
        awayTimeouts: situation.awayTimeouts,
      };
    }

    if ((sport === 'basketball-men' || sport === 'basketball-women') && situation) {
      return {
        sport: 'basketball',
        half: game.currentPeriod,
        possession: situation.possession,
        homeFouls: situation.homeFouls,
        awayFouls: situation.awayFouls,
        homeBonus: situation.homeBonus,
        awayBonus: situation.awayBonus,
      };
    }

    if (sport === 'baseball' && situation) {
      return {
        sport: 'baseball',
        inning: game.currentPeriod,
        inningHalf: situation.inningHalf,
        outs: situation.outs,
        balls: situation.balls,
        strikes: situation.strikes,
        runnersOn: situation.runnersOn,
      };
    }

    return undefined;
  }

  private mapGameState(state: string | undefined): NCAAGameState {
    const lower = (state || '').toLowerCase();
    if (lower === 'pre' || lower.includes('scheduled')) return 'pre';
    if (lower === 'live' || lower.includes('progress')) return 'live';
    if (lower === 'final' || lower.includes('end')) return 'final';
    if (lower.includes('postponed')) return 'postponed';
    if (lower.includes('cancel')) return 'canceled';
    return 'pre';
  }

  private calculateFootballWeek(date: Date): number {
    const year = date.getFullYear();
    // Season typically starts around September 1
    const seasonStart = new Date(year, 7, 25); // August 25

    if (date < seasonStart) {
      return 0; // Pre-season
    }

    const diffTime = date.getTime() - seasonStart.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

    return Math.min(Math.max(diffWeeks + 1, 1), 15); // Weeks 1-15
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Transform to standard ProviderGame format
   */
  transformToProviderGame(game: NCAAGame): any {
    return {
      id: game.id,
      scheduledAt: game.date,
      status: this.mapStateToStatus(game.gameState),
      homeTeamId: game.home.id,
      awayTeamId: game.away.id,
      homeTeamName: game.home.name,
      awayTeamName: game.away.name,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeRanking: game.home.ranking,
      awayRanking: game.away.ranking,
      venue: game.venue,
      broadcast: game.broadcast,
      providerName: 'NCAA',
      feedPrecision: 'GAME',
    };
  }

  private mapStateToStatus(
    state: NCAAGameState
  ): 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' {
    const statusMap: Record<
      NCAAGameState,
      'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED'
    > = {
      pre: 'SCHEDULED',
      live: 'LIVE',
      final: 'FINAL',
      postponed: 'POSTPONED',
      canceled: 'CANCELLED',
    };
    return statusMap[state] || 'SCHEDULED';
  }

  /**
   * Get supported sports
   */
  getSupportedSports(): NCAASport[] {
    return [
      'football',
      'basketball-men',
      'basketball-women',
      'baseball',
      'softball',
      'soccer-men',
      'soccer-women',
      'volleyball-women',
      'ice-hockey-men',
      'ice-hockey-women',
      'lacrosse-men',
      'lacrosse-women',
    ];
  }

  /**
   * Get available divisions for a sport
   */
  getDivisionsForSport(sport: NCAASport): NCADivision[] {
    if (sport === 'football') {
      return ['fbs', 'fcs', 'd2', 'd3'];
    }
    return ['d1', 'd2', 'd3'];
  }
}
