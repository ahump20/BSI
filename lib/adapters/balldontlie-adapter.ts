/**
 * BALLDONTLIE API Adapter
 *
 * Comprehensive sports data API integration for:
 * - NCAAF (College Football)
 * - NCAAB (College Basketball)
 * - NFL
 * - NBA
 * - MLB
 * - NHL
 * - WNBA
 * - EPL (not used - soccer out of scope)
 *
 * Features:
 * - 120+ endpoints across all supported sports
 * - Official TypeScript SDK support
 * - Real-time game data, stats, odds, and injuries
 *
 * API Documentation: https://www.balldontlie.io/
 *
 * Note: No fake data. Real endpoints with proper error handling.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BDLSportKey = 'ncaaf' | 'ncaab' | 'nfl' | 'nba' | 'mlb' | 'nhl' | 'wnba';

export type BDLGameStatus = 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';

export interface BDLTeam {
  id: number;
  school?: string; // College sports
  name?: string; // Pro sports
  mascot?: string;
  abbreviation: string;
  conference?: string;
  division?: string;
  city?: string;
  state?: string;
}

export interface BDLGame {
  id: number;
  date: string;
  season: number;
  status: BDLGameStatus;
  period?: number;
  time?: string;
  postseason: boolean;
  home_team: BDLTeam;
  home_team_score: number | null;
  visitor_team: BDLTeam;
  visitor_team_score: number | null;
  // Football specific
  week?: number;
  // Basketball specific
  overtime?: boolean;
  // Baseball specific
  inning?: number;
  inning_half?: 'top' | 'bottom';
}

export interface BDLPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position?: string;
  height?: string;
  weight?: number;
  jersey_number?: string;
  college?: string;
  country?: string;
  draft_year?: number;
  draft_round?: number;
  draft_number?: number;
  team?: BDLTeam;
}

export interface BDLStats {
  id: number;
  player: BDLPlayer;
  team: BDLTeam;
  game?: BDLGame;
  season: number;
  // Generic stats (sport-specific fields vary)
  [key: string]: any;
}

export interface BDLStandings {
  team: BDLTeam;
  conference: string;
  division?: string;
  wins: number;
  losses: number;
  ties?: number;
  win_pct: number;
  conference_wins?: number;
  conference_losses?: number;
  home_wins?: number;
  home_losses?: number;
  away_wins?: number;
  away_losses?: number;
  streak?: string;
  last_10?: string;
  points_for?: number;
  points_against?: number;
  point_differential?: number;
}

export interface BDLInjury {
  id: number;
  player: BDLPlayer;
  team: BDLTeam;
  status: string;
  body_part?: string;
  description?: string;
  start_date?: string;
  return_date?: string;
}

export interface BDLOdds {
  id: number;
  game_id: number;
  bookmaker: string;
  home_team_odds: number;
  visitor_team_odds: number;
  spread?: number;
  over_under?: number;
  home_spread_odds?: number;
  visitor_spread_odds?: number;
  over_odds?: number;
  under_odds?: number;
}

export interface BDLPaginatedResponse<T> {
  data: T[];
  meta: {
    total_count?: number;
    total_pages?: number;
    current_page: number;
    per_page: number;
    next_cursor?: string;
  };
}

export interface BDLQueryParams {
  page?: number;
  per_page?: number;
  cursor?: string;
  seasons?: number[];
  team_ids?: number[];
  player_ids?: number[];
  game_ids?: number[];
  dates?: string[];
  start_date?: string;
  end_date?: string;
  postseason?: boolean;
  search?: string;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  games: number;
  liveGames: number;
  teams: number;
  players: number;
  stats: number;
  standings: number;
  injuries: number;
  odds: number;
}

const CACHE_TTLS: CacheConfig = {
  games: 300, // 5 minutes
  liveGames: 30, // 30 seconds
  teams: 86400, // 24 hours
  players: 3600, // 1 hour
  stats: 600, // 10 minutes
  standings: 300, // 5 minutes
  injuries: 1800, // 30 minutes
  odds: 60, // 1 minute
};

// ============================================================================
// API ENDPOINTS CONFIGURATION
// ============================================================================

const BASE_URL = 'https://api.balldontlie.io/v1';

const SPORT_ENDPOINTS: Record<BDLSportKey, string> = {
  ncaaf: 'ncaaf',
  ncaab: 'ncaab',
  nfl: 'nfl',
  nba: 'nba',
  mlb: 'mlb',
  nhl: 'nhl',
  wnba: 'wnba',
};

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class BalldontlieAdapter {
  private apiKey: string;
  private kv?: KVNamespace;

  constructor(apiKey: string, kv?: KVNamespace) {
    if (!apiKey) {
      throw new Error('[BalldontlieAdapter] API key is required');
    }
    this.apiKey = apiKey;
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
        console.warn(`[BalldontlieAdapter] KV cache read failed for ${cacheKey}:`, error);
      }
    }

    // Fetch from BALLDONTLIE API
    const response = await fetch(url, {
      headers: {
        Authorization: this.apiKey,
        Accept: 'application/json',
        'User-Agent': 'BlazeSportsIntel/2.0 (https://blazesportsintel.com)',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`BALLDONTLIE API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as T;

    // Store in KV cache
    if (this.kv && !skipCache) {
      try {
        await this.kv.put(cacheKey, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn(`[BalldontlieAdapter] KV cache write failed for ${cacheKey}:`, error);
      }
    }

    return data;
  }

  private buildUrl(sport: BDLSportKey, endpoint: string, params?: BDLQueryParams): string {
    const url = new URL(`${BASE_URL}/${SPORT_ENDPOINTS[sport]}/${endpoint}`);

    if (params) {
      if (params.page) url.searchParams.set('page', params.page.toString());
      if (params.per_page) url.searchParams.set('per_page', params.per_page.toString());
      if (params.cursor) url.searchParams.set('cursor', params.cursor);
      if (params.seasons?.length) {
        params.seasons.forEach((s) => url.searchParams.append('seasons[]', s.toString()));
      }
      if (params.team_ids?.length) {
        params.team_ids.forEach((t) => url.searchParams.append('team_ids[]', t.toString()));
      }
      if (params.player_ids?.length) {
        params.player_ids.forEach((p) => url.searchParams.append('player_ids[]', p.toString()));
      }
      if (params.game_ids?.length) {
        params.game_ids.forEach((g) => url.searchParams.append('game_ids[]', g.toString()));
      }
      if (params.dates?.length) {
        params.dates.forEach((d) => url.searchParams.append('dates[]', d));
      }
      if (params.start_date) url.searchParams.set('start_date', params.start_date);
      if (params.end_date) url.searchParams.set('end_date', params.end_date);
      if (params.postseason !== undefined) url.searchParams.set('postseason', params.postseason.toString());
      if (params.search) url.searchParams.set('search', params.search);
    }

    return url.toString();
  }

  // ==========================================================================
  // GAMES ENDPOINTS
  // ==========================================================================

  /**
   * Get games for any supported sport
   */
  async getGames(sport: BDLSportKey, params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    const url = this.buildUrl(sport, 'games', params);
    const cacheKey = `bdl:${sport}:games:${JSON.stringify(params || {})}`;

    // Use shorter TTL for live games
    const hasLiveGames = !params?.dates; // Assume live if no date filter
    const ttl = hasLiveGames ? CACHE_TTLS.liveGames : CACHE_TTLS.games;

    return this.fetchWithCache<BDLPaginatedResponse<BDLGame>>(url, cacheKey, ttl);
  }

  /**
   * Get a specific game by ID
   */
  async getGame(sport: BDLSportKey, gameId: number): Promise<BDLGame> {
    const url = `${BASE_URL}/${SPORT_ENDPOINTS[sport]}/games/${gameId}`;
    const cacheKey = `bdl:${sport}:game:${gameId}`;

    const response = await this.fetchWithCache<{ data: BDLGame }>(url, cacheKey, CACHE_TTLS.games);
    return response.data;
  }

  /**
   * Convenience: Get NCAAF games
   */
  async getNCAAFGames(params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    return this.getGames('ncaaf', params);
  }

  /**
   * Convenience: Get NCAAB games
   */
  async getNCAABGames(params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    return this.getGames('ncaab', params);
  }

  /**
   * Convenience: Get NFL games
   */
  async getNFLGames(params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    return this.getGames('nfl', params);
  }

  /**
   * Convenience: Get NBA games
   */
  async getNBAGames(params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    return this.getGames('nba', params);
  }

  /**
   * Convenience: Get MLB games
   */
  async getMLBGames(params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    return this.getGames('mlb', params);
  }

  /**
   * Convenience: Get NHL games
   */
  async getNHLGames(params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLGame>> {
    return this.getGames('nhl', params);
  }

  /**
   * Get games for today
   */
  async getTodaysGames(sport: BDLSportKey): Promise<BDLPaginatedResponse<BDLGame>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getGames(sport, { dates: [today] });
  }

  /**
   * Get live games (in progress)
   */
  async getLiveGames(sport: BDLSportKey): Promise<BDLGame[]> {
    const response = await this.getTodaysGames(sport);
    return response.data.filter((game) => game.status === 'in_progress');
  }

  // ==========================================================================
  // TEAMS ENDPOINTS
  // ==========================================================================

  /**
   * Get all teams for a sport
   */
  async getTeams(sport: BDLSportKey, params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLTeam>> {
    const url = this.buildUrl(sport, 'teams', params);
    const cacheKey = `bdl:${sport}:teams:${JSON.stringify(params || {})}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLTeam>>(url, cacheKey, CACHE_TTLS.teams);
  }

  /**
   * Get a specific team by ID
   */
  async getTeam(sport: BDLSportKey, teamId: number): Promise<BDLTeam> {
    const url = `${BASE_URL}/${SPORT_ENDPOINTS[sport]}/teams/${teamId}`;
    const cacheKey = `bdl:${sport}:team:${teamId}`;

    const response = await this.fetchWithCache<{ data: BDLTeam }>(url, cacheKey, CACHE_TTLS.teams);
    return response.data;
  }

  /**
   * Search teams by name
   */
  async searchTeams(sport: BDLSportKey, query: string): Promise<BDLPaginatedResponse<BDLTeam>> {
    return this.getTeams(sport, { search: query });
  }

  // ==========================================================================
  // PLAYERS ENDPOINTS
  // ==========================================================================

  /**
   * Get players for a sport
   */
  async getPlayers(sport: BDLSportKey, params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLPlayer>> {
    const url = this.buildUrl(sport, 'players', params);
    const cacheKey = `bdl:${sport}:players:${JSON.stringify(params || {})}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLPlayer>>(url, cacheKey, CACHE_TTLS.players);
  }

  /**
   * Get a specific player by ID
   */
  async getPlayer(sport: BDLSportKey, playerId: number): Promise<BDLPlayer> {
    const url = `${BASE_URL}/${SPORT_ENDPOINTS[sport]}/players/${playerId}`;
    const cacheKey = `bdl:${sport}:player:${playerId}`;

    const response = await this.fetchWithCache<{ data: BDLPlayer }>(url, cacheKey, CACHE_TTLS.players);
    return response.data;
  }

  /**
   * Search players by name
   */
  async searchPlayers(sport: BDLSportKey, query: string): Promise<BDLPaginatedResponse<BDLPlayer>> {
    return this.getPlayers(sport, { search: query });
  }

  // ==========================================================================
  // STATS ENDPOINTS
  // ==========================================================================

  /**
   * Get player stats
   */
  async getStats(sport: BDLSportKey, params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLStats>> {
    const url = this.buildUrl(sport, 'stats', params);
    const cacheKey = `bdl:${sport}:stats:${JSON.stringify(params || {})}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLStats>>(url, cacheKey, CACHE_TTLS.stats);
  }

  /**
   * Get season averages for players
   */
  async getSeasonAverages(
    sport: BDLSportKey,
    season: number,
    playerIds: number[]
  ): Promise<BDLPaginatedResponse<BDLStats>> {
    const url = this.buildUrl(sport, 'season_averages', {
      seasons: [season],
      player_ids: playerIds,
    });
    const cacheKey = `bdl:${sport}:averages:${season}:${playerIds.join(',')}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLStats>>(url, cacheKey, CACHE_TTLS.stats);
  }

  // ==========================================================================
  // STANDINGS ENDPOINTS
  // ==========================================================================

  /**
   * Get standings for a sport
   */
  async getStandings(sport: BDLSportKey, season?: number): Promise<BDLPaginatedResponse<BDLStandings>> {
    const year = season || new Date().getFullYear();
    const url = this.buildUrl(sport, 'standings', { seasons: [year] });
    const cacheKey = `bdl:${sport}:standings:${year}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLStandings>>(url, cacheKey, CACHE_TTLS.standings);
  }

  /**
   * Get conference standings
   */
  async getConferenceStandings(
    sport: BDLSportKey,
    conference: string,
    season?: number
  ): Promise<BDLStandings[]> {
    const standings = await this.getStandings(sport, season);
    return standings.data.filter(
      (s) => s.conference.toLowerCase() === conference.toLowerCase()
    );
  }

  // ==========================================================================
  // INJURIES ENDPOINTS
  // ==========================================================================

  /**
   * Get injuries for a sport
   */
  async getInjuries(sport: BDLSportKey, params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLInjury>> {
    const url = this.buildUrl(sport, 'injuries', params);
    const cacheKey = `bdl:${sport}:injuries:${JSON.stringify(params || {})}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLInjury>>(url, cacheKey, CACHE_TTLS.injuries);
  }

  /**
   * Get injuries for a specific team
   */
  async getTeamInjuries(sport: BDLSportKey, teamId: number): Promise<BDLPaginatedResponse<BDLInjury>> {
    return this.getInjuries(sport, { team_ids: [teamId] });
  }

  // ==========================================================================
  // ODDS ENDPOINTS
  // ==========================================================================

  /**
   * Get betting odds for games
   */
  async getOdds(sport: BDLSportKey, params?: BDLQueryParams): Promise<BDLPaginatedResponse<BDLOdds>> {
    const url = this.buildUrl(sport, 'odds', params);
    const cacheKey = `bdl:${sport}:odds:${JSON.stringify(params || {})}`;

    return this.fetchWithCache<BDLPaginatedResponse<BDLOdds>>(url, cacheKey, CACHE_TTLS.odds);
  }

  /**
   * Get odds for a specific game
   */
  async getGameOdds(sport: BDLSportKey, gameId: number): Promise<BDLPaginatedResponse<BDLOdds>> {
    return this.getOdds(sport, { game_ids: [gameId] });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Transform BALLDONTLIE game to standard ProviderGame format
   */
  transformToProviderGame(game: BDLGame, sport: BDLSportKey): any {
    return {
      id: game.id.toString(),
      scheduledAt: game.date,
      status: this.mapStatus(game.status),
      homeTeamId: game.home_team.id.toString(),
      awayTeamId: game.visitor_team.id.toString(),
      homeTeamName: game.home_team.school || game.home_team.name || '',
      awayTeamName: game.visitor_team.school || game.visitor_team.name || '',
      homeScore: game.home_team_score,
      awayScore: game.visitor_team_score,
      week: game.week,
      postseason: game.postseason,
      providerName: 'BALLDONTLIE',
      feedPrecision: 'GAME',
    };
  }

  private mapStatus(status: BDLGameStatus): 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' {
    const statusMap: Record<BDLGameStatus, 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED'> = {
      scheduled: 'SCHEDULED',
      in_progress: 'LIVE',
      final: 'FINAL',
      postponed: 'POSTPONED',
      cancelled: 'CANCELLED',
    };
    return statusMap[status] || 'SCHEDULED';
  }

  /**
   * Get all supported sports
   */
  getSupportedSports(): BDLSportKey[] {
    return Object.keys(SPORT_ENDPOINTS) as BDLSportKey[];
  }

  /**
   * Check if sport is supported
   */
  isSportSupported(sport: string): sport is BDLSportKey {
    return sport in SPORT_ENDPOINTS;
  }
}
