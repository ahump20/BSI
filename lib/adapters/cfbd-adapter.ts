/**
 * College Football Data (CFBD) API Adapter
 *
 * Comprehensive data layer for college football using the College Football Data API.
 * Provides real-time game data, team statistics, rankings, and advanced metrics.
 *
 * Data Sources:
 * - College Football Data API (api.collegefootballdata.com)
 * - Real-time scores and game information
 * - Team statistics and rankings
 * - Player data and advanced metrics
 *
 * Cache Strategy:
 * - Team info: 24 hours
 * - Rosters: 1 hour
 * - Rankings: 30 minutes
 * - Live scores: 30 seconds
 * - Completed games: 1 hour
 * - Stats: 1 hour
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CFBDTeam {
  id: number;
  school: string;
  mascot?: string;
  abbreviation?: string;
  altName1?: string;
  altName2?: string;
  altName3?: string;
  classification: 'fbs' | 'fcs' | 'ii' | 'iii';
  conference?: string;
  division?: string;
  color?: string;
  altColor?: string;
  logos?: string[];
  twitter?: string;
  location?: {
    venueId: number;
    name: string;
    city: string;
    state: string;
    zip?: string;
    countryCode: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    capacity?: number;
    yearConstructed?: number;
    grass: boolean;
    dome: boolean;
  };
}

export interface CFBDGame {
  id: number;
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason';
  startDate: string;
  startTimeTBD: boolean;
  completed: boolean;
  neutralSite: boolean;
  conferenceGame: boolean;
  attendance?: number;

  venueId?: number;
  venue?: string;

  homeId: number;
  homeTeam: string;
  homeClassification?: string;
  homeConference?: string;
  homePoints?: number;
  homeLineScores?: number[];
  homePostgameWinProbability?: number;
  homePregameElo?: number;
  homePostgameElo?: number;

  awayId: number;
  awayTeam: string;
  awayClassification?: string;
  awayConference?: string;
  awayPoints?: number;
  awayLineScores?: number[];
  awayPostgameWinProbability?: number;
  awayPregameElo?: number;
  awayPostgameElo?: number;

  excitementIndex?: number;
  highlights?: string;
  notes?: string;
}

export interface CFBDRanking {
  season: number;
  seasonType: 'regular' | 'postseason';
  week: number;
  poll: string; // "AP Top 25", "Coaches Poll", "Playoff Committee Rankings"
  ranks: Array<{
    rank: number;
    school: string;
    conference: string;
    firstPlaceVotes?: number;
    points?: number;
  }>;
}

export interface CFBDPlayer {
  id: number;
  team: string;
  name: string;
  firstName?: string;
  lastName?: string;
  weight?: number;
  height?: number;
  jersey?: number;
  year?: number;
  position?: string;
  homeCity?: string;
  homeState?: string;
  homeCountry?: string;
  homeLatitude?: number;
  homeLongitude?: number;
  homeCountyFips?: string;
  recruitRating?: number;
  recruitStars?: number;
}

export interface CFBDTeamStats {
  season: number;
  team: string;
  conference?: string;
  stats: Array<{
    statName: string;
    statValue: number;
  }>;
}

export interface CFBDScoreboard {
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason';
  games: CFBDGame[];
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  teamInfo: number;
  roster: number;
  rankings: number;
  liveScores: number;
  completedGames: number;
  stats: number;
  games: number;
}

const CACHE_TTLS: CacheConfig = {
  teamInfo: 86400,      // 24 hours
  roster: 3600,         // 1 hour
  rankings: 1800,       // 30 minutes
  liveScores: 30,       // 30 seconds
  completedGames: 3600, // 1 hour
  stats: 3600,          // 1 hour
  games: 300,           // 5 minutes
};

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class CFBDAdapter {
  private kv?: KVNamespace;
  private readonly baseUrl = 'https://api.collegefootballdata.com';
  private readonly apiKey: string;

  constructor(apiKey: string, kv?: KVNamespace) {
    this.apiKey = apiKey;
    this.kv = kv;
  }

  // ==========================================================================
  // CORE FETCH UTILITIES
  // ==========================================================================

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    // Try KV cache first
    if (this.kv) {
      try {
        const cached = await this.kv.get(cacheKey, 'json');
        if (cached) {
          return cached as T;
        }
      } catch (error) {
        console.warn(`KV cache read failed for ${cacheKey}:`, error);
      }
    }

    // Fetch from CFBD API with Bearer token
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CFBD API error: ${response.status} ${response.statusText} for ${url}`);
    }

    const data = await response.json() as T;

    // Store in KV cache
    if (this.kv) {
      try {
        await this.kv.put(cacheKey, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn(`KV cache write failed for ${cacheKey}:`, error);
      }
    }

    return data;
  }

  // ==========================================================================
  // TEAM DATA
  // ==========================================================================

  /**
   * Fetch team information
   * @param conference Optional conference filter (e.g., "SEC", "Big Ten")
   */
  async fetchTeams(conference?: string): Promise<CFBDTeam[]> {
    const url = conference
      ? `${this.baseUrl}/teams?conference=${encodeURIComponent(conference)}`
      : `${this.baseUrl}/teams`;
    const cacheKey = conference
      ? `cfbd:teams:conference:${conference}`
      : 'cfbd:teams:all';

    return await this.fetchWithCache<CFBDTeam[]>(
      url,
      cacheKey,
      CACHE_TTLS.teamInfo
    );
  }

  /**
   * Fetch team information by ID
   */
  async fetchTeamById(teamId: number): Promise<CFBDTeam | null> {
    const teams = await this.fetchTeams();
    return teams.find(t => t.id === teamId) || null;
  }

  /**
   * Fetch team roster
   */
  async fetchRoster(team: string, year?: number): Promise<CFBDPlayer[]> {
    const season = year || new Date().getFullYear();
    const url = `${this.baseUrl}/roster?team=${encodeURIComponent(team)}&year=${season}`;
    const cacheKey = `cfbd:roster:${team}:${season}`;

    return await this.fetchWithCache<CFBDPlayer[]>(
      url,
      cacheKey,
      CACHE_TTLS.roster
    );
  }

  // ==========================================================================
  // GAME DATA
  // ==========================================================================

  /**
   * Fetch games for a specific week
   * @param year Season year
   * @param week Week number
   * @param seasonType 'regular' or 'postseason'
   * @param conference Optional conference filter
   * @param team Optional team filter
   */
  async fetchGames(
    year: number,
    week: number,
    seasonType: 'regular' | 'postseason' = 'regular',
    conference?: string,
    team?: string
  ): Promise<CFBDGame[]> {
    const params = new URLSearchParams({
      year: year.toString(),
      week: week.toString(),
      seasonType,
    });

    if (conference) params.append('conference', conference);
    if (team) params.append('team', team);

    const url = `${this.baseUrl}/games?${params.toString()}`;
    const cacheKey = `cfbd:games:${year}:${week}:${seasonType}:${conference || 'all'}:${team || 'all'}`;

    // Use live cache if current week, longer cache for past weeks
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const isCurrentSeason = year === currentYear;

    const ttl = isCurrentSeason && week >= getCurrentWeek() - 1
      ? CACHE_TTLS.liveScores
      : CACHE_TTLS.completedGames;

    return await this.fetchWithCache<CFBDGame[]>(url, cacheKey, ttl);
  }

  /**
   * Fetch a single game by ID
   */
  async fetchGameById(gameId: number): Promise<CFBDGame | null> {
    const url = `${this.baseUrl}/games?id=${gameId}`;
    const cacheKey = `cfbd:game:${gameId}`;

    const games = await this.fetchWithCache<CFBDGame[]>(
      url,
      cacheKey,
      CACHE_TTLS.games
    );

    return games[0] || null;
  }

  /**
   * Fetch scoreboard for current week
   */
  async fetchScoreboard(
    year?: number,
    week?: number,
    conference?: string
  ): Promise<CFBDScoreboard> {
    const season = year || new Date().getFullYear();
    const currentWeek = week || getCurrentWeek();

    const games = await this.fetchGames(season, currentWeek, 'regular', conference);

    return {
      season,
      week: currentWeek,
      seasonType: 'regular',
      games,
    };
  }

  // ==========================================================================
  // RANKINGS
  // ==========================================================================

  /**
   * Fetch rankings for a specific week
   * @param year Season year
   * @param week Week number
   * @param seasonType 'regular' or 'postseason'
   */
  async fetchRankings(
    year: number,
    week: number,
    seasonType: 'regular' | 'postseason' = 'regular'
  ): Promise<CFBDRanking[]> {
    const params = new URLSearchParams({
      year: year.toString(),
      week: week.toString(),
      seasonType,
    });

    const url = `${this.baseUrl}/rankings?${params.toString()}`;
    const cacheKey = `cfbd:rankings:${year}:${week}:${seasonType}`;

    return await this.fetchWithCache<CFBDRanking[]>(
      url,
      cacheKey,
      CACHE_TTLS.rankings
    );
  }

  /**
   * Fetch latest AP Top 25
   */
  async fetchAPTop25(year?: number, week?: number): Promise<CFBDRanking | null> {
    const season = year || new Date().getFullYear();
    const currentWeek = week || getCurrentWeek();

    const rankings = await this.fetchRankings(season, currentWeek);
    return rankings.find(r => r.poll === 'AP Top 25') || null;
  }

  /**
   * Fetch College Football Playoff rankings
   */
  async fetchCFPRankings(year?: number, week?: number): Promise<CFBDRanking | null> {
    const season = year || new Date().getFullYear();
    const currentWeek = week || getCurrentWeek();

    const rankings = await this.fetchRankings(season, currentWeek);
    return rankings.find(r => r.poll === 'Playoff Committee Rankings') || null;
  }

  // ==========================================================================
  // TEAM STATISTICS
  // ==========================================================================

  /**
   * Fetch team statistics for a season
   * @param year Season year
   * @param team Optional team filter
   * @param conference Optional conference filter
   */
  async fetchTeamStats(
    year: number,
    team?: string,
    conference?: string
  ): Promise<CFBDTeamStats[]> {
    const params = new URLSearchParams({
      year: year.toString(),
    });

    if (team) params.append('team', team);
    if (conference) params.append('conference', conference);

    const url = `${this.baseUrl}/stats/season?${params.toString()}`;
    const cacheKey = `cfbd:stats:${year}:${team || 'all'}:${conference || 'all'}`;

    return await this.fetchWithCache<CFBDTeamStats[]>(
      url,
      cacheKey,
      CACHE_TTLS.stats
    );
  }

  /**
   * Fetch advanced team metrics (SP+, FPI, etc.)
   */
  async fetchAdvancedStats(
    year: number,
    team?: string
  ): Promise<any[]> {
    const params = new URLSearchParams({
      year: year.toString(),
    });

    if (team) params.append('team', team);

    const url = `${this.baseUrl}/ratings/sp?${params.toString()}`;
    const cacheKey = `cfbd:advanced:${year}:${team || 'all'}`;

    return await this.fetchWithCache<any[]>(
      url,
      cacheKey,
      CACHE_TTLS.stats
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current week number based on date
 * College football season typically starts late August/early September
 */
function getCurrentWeek(): number {
  const now = new Date();
  const year = now.getFullYear();

  // Season typically starts around September 1
  // Week 1 is first Saturday in September or last Saturday in August
  const seasonStart = new Date(year, 7, 25); // August 25 approximation

  if (now < seasonStart) {
    return 0; // Pre-season
  }

  const diffTime = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

  return Math.min(diffWeeks + 1, 15); // Cap at week 15 (regular season max)
}

/**
 * Check if a game is live
 */
export function isGameLive(game: CFBDGame): boolean {
  if (game.completed) return false;

  const now = new Date();
  const gameStart = new Date(game.startDate);

  // Game is live if it started within the last 4 hours and isn't completed
  const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));

  return gameStart < now && gameStart > fourHoursAgo;
}

/**
 * Get game state description
 */
export function getGameState(game: CFBDGame): 'scheduled' | 'live' | 'final' {
  if (game.completed) return 'final';
  if (isGameLive(game)) return 'live';
  return 'scheduled';
}

/**
 * Format team record from games
 */
export function calculateRecord(
  games: CFBDGame[],
  teamName: string
): { wins: number; losses: number; ties: number } {
  const record = { wins: 0, losses: 0, ties: 0 };

  games.forEach(game => {
    if (!game.completed) return;

    const isHome = game.homeTeam === teamName;
    const teamPoints = isHome ? game.homePoints : game.awayPoints;
    const opponentPoints = isHome ? game.awayPoints : game.homePoints;

    if (teamPoints === undefined || opponentPoints === undefined) return;

    if (teamPoints > opponentPoints) {
      record.wins++;
    } else if (teamPoints < opponentPoints) {
      record.losses++;
    } else {
      record.ties++;
    }
  });

  return record;
}
