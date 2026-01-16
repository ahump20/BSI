/**
 * NCAA Baseball Adapter
 *
 * Comprehensive data layer for college baseball using ESPN's College Baseball API.
 * Addresses ESPN's massive coverage gap by providing FULL box scores, player stats,
 * and game details that ESPN app refuses to show.
 *
 * Data Sources:
 * - ESPN College Baseball API (site.api.espn.com)
 * - D1Baseball.com rankings (when available)
 * - NCAA Stats API (official)
 *
 * Cache Strategy:
 * - Team info: 24 hours
 * - Rosters: 1 hour
 * - Standings: 30 minutes
 * - Live scores: 30 seconds
 * - Completed games: 1 hour
 * - Rankings: 1 hour
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NCAATeam {
  id: string;
  uid: string;
  slug: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor?: string;
  logo: string;
  logos?: Array<{
    href: string;
    width: number;
    height: number;
    alt: string;
    rel: string[];
  }>;

  conference?: {
    id: string;
    name: string;
    abbreviation: string;
  };

  record?: {
    summary: string; // "56-13"
    wins: number;
    losses: number;
    ties?: number;
  };

  rank?: {
    current: number;
  };

  isActive: boolean;
  links?: Array<{
    rel: string[];
    href: string;
    text: string;
  }>;
}

export interface NCAAPlayer {
  id: string;
  uid: string;
  guid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  shortName: string;

  jersey?: string;
  position?: {
    abbreviation: string;
    name: string;
    displayName: string;
  };

  batting?: {
    hand: string; // "R" or "L" or "S" (switch)
  };
  throwing?: {
    hand: string; // "R" or "L"
  };

  height?: string; // "6' 2\""
  weight?: number;
  age?: number;
  dateOfBirth?: string;

  experience?: {
    years: number;
    displayValue: string; // "Junior", "Senior", etc.
  };

  hometown?: {
    city: string;
    state: string;
    country?: string;
  };

  headshot?: {
    href: string;
    alt: string;
  };

  statistics?: NCAAPlayerStats;
  active: boolean;
}

export interface NCAAPlayerStats {
  batting?: {
    gamesPlayed: number;
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
    avg: string; // ".315"
    obp: string; // ".425"
    slg: string; // ".583"
    ops: string; // "1.008"
  };

  pitching?: {
    gamesPlayed: number;
    gamesStarted: number;
    wins: number;
    losses: number;
    saves: number;
    inningsPitched: string; // "87.1"
    hits: number;
    runs: number;
    earnedRuns: number;
    walks: number;
    strikeouts: number;
    homeRuns: number;
    era: string; // "2.45"
    whip: string; // "1.15"
  };

  fielding?: {
    gamesPlayed: number;
    chances: number;
    putOuts: number;
    assists: number;
    errors: number;
    fieldingPct: string; // ".985"
    doublePlays: number;
  };
}

export interface NCAAGame {
  id: string;
  uid: string;
  date: string; // ISO 8601
  name: string; // "LSU Tigers at Coastal Carolina Chanticleers"
  shortName: string; // "LSU @ CCU"

  season: {
    year: number;
    type: number;
    slug: string;
  };

  status: {
    period: number; // Inning
    type: {
      id: string;
      name: string; // "STATUS_FINAL", "STATUS_IN_PROGRESS", "STATUS_SCHEDULED"
      state: string; // "post", "in", "pre"
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };

  competitions: NCAACompetition[];

  venue?: {
    id: string;
    fullName: string;
    address: {
      city: string;
      state: string;
    };
    capacity?: number;
    indoor: boolean;
  };

  attendance?: number;

  broadcast?: string;
  broadcasts?: Array<{
    market: string;
    names: string[];
  }>;

  highlights?: Array<{
    id: number;
    headline: string;
    description: string;
    duration: number;
    thumbnail: string;
    links: {
      web: { href: string };
      mobile: { href: string };
    };
  }>;

  notes?: Array<{
    type: string;
    headline: string;
  }>;

  links?: Array<{
    rel: string[];
    href: string;
    text: string;
  }>;
}

export interface NCAACompetition {
  id: string;
  uid: string;
  date: string;

  competitors: NCAACompetitor[];

  situation?: {
    lastPlay?: {
      id: string;
      type: {
        id: string;
        text: string;
      };
      text: string;
      scoreValue: number;
      atBatId: string;
    };
    onFirst?: boolean;
    onSecond?: boolean;
    onThird?: boolean;
    outs?: number;
    balls?: number;
    strikes?: number;
    batter?: {
      playerId: string;
      athlete: NCAAPlayer;
    };
    pitcher?: {
      playerId: string;
      athlete: NCAAPlayer;
    };
  };

  status: NCAAGame['status'];

  notes?: NCAAGame['notes'];

  series?: {
    type: string;
    title: string;
    summary: string;
    completed: boolean;
    totalCompetitions: number;
    competitors: Array<{
      id: string;
      uid: string;
      wins: number;
      ties: number;
    }>;
  };

  boxscore?: NCAABoxScore;
  playByPlayAvailable?: boolean;
}

export interface NCAACompetitor {
  id: string;
  uid: string;
  type: string; // "team"
  order: number;
  homeAway: 'home' | 'away';
  winner: boolean;

  team: NCAATeam;

  score: string;

  linescores?: Array<{
    value: number;
    displayValue: string;
    period: number; // Inning number
  }>;

  statistics: Array<{
    name: string;
    abbreviation: string;
    displayValue: string;
  }>;

  hits: number;
  errors: number;

  record: {
    summary: string;
    wins: number;
    losses: number;
  };

  rank?: {
    current: number;
  };

  leaders?: Array<{
    name: string;
    displayName: string;
    leaders: Array<{
      displayValue: string;
      athlete: NCAAPlayer;
    }>;
  }>;
}

export interface NCAABoxScore {
  teams: Array<{
    team: NCAATeam;
    statistics: Array<{
      name: string; // "batting" | "pitching" | "fielding"
      displayName: string;
      stats: Array<{
        name: string;
        displayName: string;
        shortDisplayName: string;
        description: string;
        abbreviation: string;
        value: number;
        displayValue: string;
      }>;
    }>;
  }>;

  players: Array<{
    team: NCAATeam;
    statistics: Array<{
      name: string;
      keys: string[]; // Column headers
      labels: string[]; // Row labels
      descriptions: string[];
      athletes: Array<{
        athlete: NCAAPlayer;
        stats: string[]; // Values matching keys
      }>;
    }>;
  }>;
}

export interface NCAAStandings {
  season: {
    year: number;
    type: number;
    name: string;
  };

  standings: Array<{
    id: string;
    name: string; // Conference name
    abbreviation: string;

    entries: Array<{
      team: NCAATeam;
      stats: Array<{
        name: string;
        displayName: string;
        shortDisplayName: string;
        description: string;
        abbreviation: string;
        type: string;
        value: number;
        displayValue: string;
      }>;
    }>;
  }>;
}

export interface NCAAScoreboard {
  season: {
    type: number;
    year: number;
  };

  day: {
    date: string; // "2025-06-22"
  };

  events: NCAAGame[];

  leagues: Array<{
    id: string;
    name: string;
    abbreviation: string;
    calendar: string[]; // Array of game dates
  }>;
}

export interface NCAAGameRecap {
  gameId: string;
  headline: string;
  summary: string; // One-paragraph summary

  keyPlays: Array<{
    inning: number;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;

  playerPerformances: Array<{
    player: NCAAPlayer;
    team: NCAATeam;
    performance: string;
    stats: string;
  }>;

  turningPoint?: {
    inning: number;
    description: string;
  };

  nextGame?: {
    date: string;
    opponent: string;
  };

  generated: {
    timestamp: string;
    model: string;
    confidence: number;
  };
}

export interface NCAAGamePreview {
  gameId: string;
  headline: string;
  matchup: string;

  teamAnalysis: Array<{
    team: NCAATeam;
    strengths: string[];
    weaknesses: string[];
    recentForm: string;
    keyPlayers: NCAAPlayer[];
  }>;

  prediction?: {
    winner: string;
    confidence: number;
    reasoning: string;
  };

  keysToVictory: Array<{
    team: string;
    keys: string[];
  }>;

  generated: {
    timestamp: string;
    model: string;
  };
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  teamInfo: number;
  roster: number;
  standings: number;
  liveScores: number;
  completedGames: number;
  rankings: number;
  gamePreview: number;
  gameRecap: number;
}

const CACHE_TTLS: CacheConfig = {
  teamInfo: 86400, // 24 hours
  roster: 3600, // 1 hour
  standings: 1800, // 30 minutes
  liveScores: 30, // 30 seconds
  completedGames: 3600, // 1 hour
  rankings: 3600, // 1 hour
  gamePreview: 7200, // 2 hours
  gameRecap: 86400, // 24 hours (recaps don't change)
};

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class NCAABaseballAdapter {
  private kv?: KVNamespace;
  private readonly baseUrl =
    'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

  constructor(kv?: KVNamespace) {
    this.kv = kv;
  }

  // ==========================================================================
  // CORE FETCH UTILITIES
  // ==========================================================================

  private async fetchWithCache<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
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

    // Fetch from ESPN API
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText} for ${url}`);
    }

    const data = (await response.json()) as T;

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
   */
  async fetchTeamInfo(teamId: string, season?: number): Promise<NCAATeam> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams/${teamId}?season=${year}`;
    const cacheKey = `ncaa:team:info:${teamId}:${year}`;

    const data = await this.fetchWithCache<{ team: NCAATeam }>(url, cacheKey, CACHE_TTLS.teamInfo);

    return data.team;
  }

  /**
   * Fetch team roster
   */
  async fetchRoster(teamId: string, season?: number): Promise<NCAAPlayer[]> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams/${teamId}/roster?season=${year}`;
    const cacheKey = `ncaa:team:roster:${teamId}:${year}`;

    const data = await this.fetchWithCache<{ athletes: NCAAPlayer[] }>(
      url,
      cacheKey,
      CACHE_TTLS.roster
    );

    return data.athletes || [];
  }

  /**
   * Fetch all Division I teams
   */
  async fetchAllTeams(season?: number): Promise<NCAATeam[]> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams?season=${year}&limit=400`;
    const cacheKey = `ncaa:teams:all:${year}`;

    const data = await this.fetchWithCache<{
      sports: Array<{ leagues: Array<{ teams: NCAATeam[] }> }>;
    }>(url, cacheKey, CACHE_TTLS.teamInfo);

    // Navigate ESPN's nested structure
    const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
    return teams;
  }

  // ==========================================================================
  // GAME DATA
  // ==========================================================================

  /**
   * Fetch live scoreboard
   */
  async fetchScoreboard(date?: string, limit: number = 100): Promise<NCAAScoreboard> {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const url = `${this.baseUrl}/scoreboard?dates=${dateStr}&limit=${limit}`;
    const cacheKey = `ncaa:scoreboard:${dateStr}:${limit}`;

    // Use live cache if today, longer cache for historical
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const ttl = isToday ? CACHE_TTLS.liveScores : CACHE_TTLS.completedGames;

    return await this.fetchWithCache<NCAAScoreboard>(url, cacheKey, ttl);
  }

  /**
   * Fetch detailed game summary with box score
   */
  async fetchGameSummary(gameId: string): Promise<{
    game: NCAAGame;
    boxscore: NCAABoxScore;
  }> {
    const url = `${this.baseUrl}/summary?event=${gameId}`;
    const cacheKey = `ncaa:game:summary:${gameId}`;

    const data = await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.completedGames);

    return {
      game: data.header?.competitions?.[0] || data.gamepackage?.game || {},
      boxscore: data.boxscore || {},
    };
  }

  /**
   * Fetch play-by-play data
   */
  async fetchPlayByPlay(gameId: string): Promise<any> {
    const url = `${this.baseUrl}/playbyplay?event=${gameId}`;
    const cacheKey = `ncaa:game:pbp:${gameId}`;

    return await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.completedGames);
  }

  // ==========================================================================
  // STANDINGS & RANKINGS
  // ==========================================================================

  /**
   * Fetch conference standings
   */
  async fetchStandings(season?: number): Promise<NCAAStandings> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/standings?season=${year}`;
    const cacheKey = `ncaa:standings:${year}`;

    return await this.fetchWithCache<NCAAStandings>(url, cacheKey, CACHE_TTLS.standings);
  }

  /**
   * Fetch national rankings
   */
  async fetchRankings(season?: number): Promise<any> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/rankings?season=${year}`;
    const cacheKey = `ncaa:rankings:${year}`;

    return await this.fetchWithCache<any>(url, cacheKey, CACHE_TTLS.rankings);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract batting statistics from boxscore
 */
export function extractBattingStats(
  boxscore: NCAABoxScore,
  teamId: string
): Record<string, string> {
  const teamData = boxscore.teams.find((t) => t.team.id === teamId);
  if (!teamData) return {};

  const battingStats = teamData.statistics.find((s) => s.name === 'batting');
  if (!battingStats) return {};

  const stats: Record<string, string> = {};
  battingStats.stats.forEach((stat) => {
    stats[stat.abbreviation] = stat.displayValue;
  });

  return stats;
}

/**
 * Extract pitching statistics from boxscore
 */
export function extractPitchingStats(
  boxscore: NCAABoxScore,
  teamId: string
): Record<string, string> {
  const teamData = boxscore.teams.find((t) => t.team.id === teamId);
  if (!teamData) return {};

  const pitchingStats = teamData.statistics.find((s) => s.name === 'pitching');
  if (!pitchingStats) return {};

  const stats: Record<string, string> = {};
  pitchingStats.stats.forEach((stat) => {
    stats[stat.abbreviation] = stat.displayValue;
  });

  return stats;
}

/**
 * Format line score for display
 */
export function formatLineScore(linescores: NCAACompetitor['linescores']): string {
  if (!linescores || linescores.length === 0) return '';

  return linescores.map((ls) => ls.displayValue).join('-');
}

/**
 * Determine game state
 */
export function getGameState(status: NCAAGame['status']): 'scheduled' | 'live' | 'final' {
  if (status.type.state === 'pre') return 'scheduled';
  if (status.type.state === 'in') return 'live';
  return 'final';
}

/**
 * Extract key performers from boxscore
 */
export function getKeyPerformers(boxscore: NCAABoxScore, teamId: string): NCAAPlayer[] {
  const teamData = boxscore.players?.find((p) => p.team.id === teamId);
  if (!teamData) return [];

  // Get batting leaders (most hits, RBIs)
  const battingStats = teamData.statistics.find((s) => s.name === 'batting');
  if (!battingStats) return [];

  // ESPN provides athletes with stats already sorted by performance
  const topPerformers = battingStats.athletes.slice(0, 3);

  return topPerformers.map((p) => p.athlete);
}
