/**
 * MLB Stats API Adapter
 *
 * TypeScript port of mlb-data-lab's MlbStatsClient for Cloudflare Workers
 * Provides real-time MLB data fetching with caching and error handling
 *
 * API Documentation: https://statsapi.mlb.com/docs/
 */

const MLB_STATS_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MLB_STATIC_BASE = 'https://www.mlbstatic.com';
const MLB_IMG_BASE = 'https://img.mlbstatic.com';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PlayerInfo {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryNumber: string;
  birthDate: string;
  currentAge: number;
  birthCity: string;
  birthStateProvince?: string;
  birthCountry: string;
  height: string;
  weight: number;
  active: boolean;
  currentTeam: {
    id: number;
    name: string;
    link: string;
  };
  primaryPosition: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  batSide: {
    code: 'L' | 'R' | 'S';
    description: string;
  };
  pitchHand: {
    code: 'L' | 'R';
    description: string;
  };
  mlbDebutDate?: string;
  draftYear?: number;
}

export interface SeasonStats {
  gamesPlayed: number;
  groundOuts: number;
  airOuts: number;
  runs: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  strikeOuts: number;
  baseOnBalls: number;
  intentionalWalks: number;
  hits: number;
  hitByPitch: number;
  avg: string;
  atBats: number;
  obp: string;
  slg: string;
  ops: string;
  caughtStealing: number;
  stolenBases: number;
  stolenBasePercentage: string;
  groundIntoDoublePlay: number;
  numberOfPitches?: number;
  plateAppearances: number;
  totalBases: number;
  rbi: number;
  leftOnBase: number;
  sacBunts: number;
  sacFlies: number;
  babip?: string;
  groundOutsToAirouts?: string;
  catchersInterference?: number;
  atBatsPerHomeRun?: string;
}

export interface PitchingStats {
  gamesPlayed: number;
  gamesStarted: number;
  groundOuts: number;
  airOuts: number;
  runs: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  strikeOuts: number;
  baseOnBalls: number;
  intentionalWalks: number;
  hits: number;
  hitByPitch: number;
  atBats: number;
  obp: string;
  caughtStealing: number;
  stolenBases: number;
  stolenBasePercentage: string;
  numberOfPitches: number;
  inningsPitched: string;
  wins: number;
  losses: number;
  saves: number;
  saveOpportunities: number;
  holds: number;
  blownSaves: number;
  earnedRuns: number;
  whip: string;
  battersFaced: number;
  outs: number;
  gamesPitched: number;
  completeGames: number;
  shutouts: number;
  strikes: number;
  strikePercentage: string;
  hitBatsmen: number;
  balks: number;
  wildPitches: number;
  pickoffs: number;
  groundOutsToAirouts: string;
  rbi: number;
  winPercentage: string;
  pitchesPerInning: string;
  gamesFinished: number;
  strikeoutWalkRatio: string;
  strikeoutsPer9Inn: string;
  walksPer9Inn: string;
  hitsPer9Inn: string;
  runsScoredPer9: string;
  homeRunsPer9: string;
  era: string;
}

export interface StatSplit {
  season: string;
  stat: SeasonStats | PitchingStats;
  team?: {
    id: number;
    name: string;
    link: string;
  };
  player?: {
    id: number;
    fullName: string;
    link: string;
  };
  league?: {
    id: number;
    name: string;
    link: string;
  };
  sport?: {
    id: number;
    link: string;
    name: string;
  };
  gameType?: string;
}

export interface TeamInfo {
  id: number;
  name: string;
  link: string;
  season: number;
  venue: {
    id: number;
    name: string;
    link: string;
  };
  teamCode: string;
  fileCode: string;
  abbreviation: string;
  teamName: string;
  locationName: string;
  firstYearOfPlay: string;
  league: {
    id: number;
    name: string;
    link: string;
  };
  division: {
    id: number;
    name: string;
    link: string;
  };
  sport: {
    id: number;
    link: string;
    name: string;
  };
  shortName: string;
  franchiseName: string;
  clubName: string;
  active: boolean;
}

export interface RosterEntry {
  person: {
    id: number;
    fullName: string;
    link: string;
  };
  jerseyNumber: string;
  position: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  status: {
    code: string;
    description: string;
  };
}

export interface GameLog {
  date: string;
  opponent: {
    id: number;
    name: string;
    link: string;
  };
  isHome: boolean;
  isWin: boolean;
  stat: SeasonStats | PitchingStats;
}

export interface StandingsRecord {
  team: {
    id: number;
    name: string;
    link: string;
  };
  seasonNumber: string;
  wins: number;
  losses: number;
  winningPercentage: string;
  gamesBack: string;
  wildCardGamesBack: string;
  leagueGamesBack: string;
  divisionGamesBack: string;
  conferenceGamesBack: string;
  leagueRank: string;
  wildCardRank: string;
  divisionRank: string;
  conferenceRank: string;
  divisionChamp: boolean;
  divisionLeader: boolean;
  hasWildcard: boolean;
  clinched: boolean;
  eliminationNumber: string;
  wildCardEliminationNumber: string;
  runsAllowed: number;
  runsScored: number;
  runDifferential: number;
  streak: {
    streakType: string;
    streakNumber: number;
    streakCode: string;
  };
  records: {
    splitRecords: Array<{
      type: string;
      wins: number;
      losses: number;
      pct: string;
    }>;
  };
}

// ============================================================================
// Situation Codes for Stat Splits
// ============================================================================

export const DEFAULT_SIT_CODES = [
  'vr',    // vs Right-handed pitcher
  'vl',    // vs Left-handed pitcher
  'h',     // Home
  'a',     // Away
  'd',     // Day games
  'n',     // Night games
  'preas', // Pre All-Star
  'posas', // Post All-Star
  'val',   // vs AL
  'vnl',   // vs NL
  'r0',    // Runners on base: 0
  'r123',  // Runners on base: 1-2-3
  'ron',   // Runners on
  'ac',    // Ahead in count
  'bc',    // Behind in count
] as const;

export type SituationCode = typeof DEFAULT_SIT_CODES[number];

// ============================================================================
// Cache Configuration
// ============================================================================

interface CacheConfig {
  playerInfo: number;        // 24 hours
  seasonStats: number;       // 1 hour during season
  statSplits: number;        // 6 hours
  teamInfo: number;          // 24 hours
  roster: number;            // 12 hours
  standings: number;         // 30 minutes
  schedule: number;          // 15 minutes
  gameLog: number;           // 1 hour
}

const CACHE_TTLS: CacheConfig = {
  playerInfo: 86400,      // 24 hours
  seasonStats: 3600,      // 1 hour
  statSplits: 21600,      // 6 hours
  teamInfo: 86400,        // 24 hours
  roster: 43200,          // 12 hours
  standings: 1800,        // 30 minutes
  schedule: 900,          // 15 minutes
  gameLog: 3600,          // 1 hour
};

// ============================================================================
// MLB Adapter Class
// ============================================================================

export class MlbAdapter {
  private kv?: KVNamespace;

  constructor(kv?: KVNamespace) {
    this.kv = kv;
  }

  // ==========================================================================
  // Cache Helper Methods
  // ==========================================================================

  private async getCached<T>(key: string): Promise<T | null> {
    if (!this.kv) return null;

    try {
      const cached = await this.kv.get(key, 'json');
      return cached as T | null;
    } catch (error) {
      console.warn(`Cache read error for ${key}:`, error);
      return null;
    }
  }

  private async setCached<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.kv) return;

    try {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } catch (error) {
      console.warn(`Cache write error for ${key}:`, error);
    }
  }

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API with retry logic
    const data = await this.fetchWithRetry<T>(url);

    // Cache the result
    await this.setCached(cacheKey, data, ttl);

    return data;
  }

  private async fetchWithRetry<T>(
    url: string,
    maxRetries = 3,
    timeout = 8000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 250ms, 500ms, 1000ms
          const delay = 250 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  // ==========================================================================
  // Player Methods
  // ==========================================================================

  /**
   * Fetch player information by MLBAM player ID
   * https://statsapi.mlb.com/api/v1/people?personIds=669373&hydrate=currentTeam
   */
  async fetchPlayerInfo(playerId: number): Promise<PlayerInfo> {
    const url = `${MLB_STATS_API_BASE}/people?personIds=${playerId}&hydrate=currentTeam,draft`;
    const cacheKey = `mlb:player:info:${playerId}`;

    const response = await this.fetchWithCache<{ people: PlayerInfo[] }>(
      url,
      cacheKey,
      CACHE_TTLS.playerInfo
    );

    if (!response.people || response.people.length === 0) {
      throw new Error(`Player ${playerId} not found`);
    }

    return response.people[0];
  }

  /**
   * Fetch player stats for a specific season
   * https://statsapi.mlb.com/api/v1/people/669373?hydrate=stats(group=hitting,type=season,season=2024)
   */
  async fetchPlayerStats(
    playerId: number,
    season: number,
    group: 'hitting' | 'pitching' | 'fielding' = 'hitting'
  ): Promise<StatSplit[]> {
    const url = `${MLB_STATS_API_BASE}/people/${playerId}?hydrate=stats(group=[${group}],type=[season,seasonAdvanced],season=${season})`;
    const cacheKey = `mlb:player:stats:${playerId}:${season}:${group}`;

    const response = await this.fetchWithCache<{
      people: Array<{
        stats?: Array<{
          splits: StatSplit[];
        }>;
      }>;
    }>(url, cacheKey, CACHE_TTLS.seasonStats);

    if (!response.people || response.people.length === 0) {
      throw new Error(`Stats not found for player ${playerId}`);
    }

    const stats = response.people[0].stats;
    if (!stats || stats.length === 0) {
      return [];
    }

    // Flatten all splits from all stat types
    return stats.flatMap(statGroup => statGroup.splits || []);
  }

  /**
   * Fetch batter stat splits for a player in a specific year
   * https://statsapi.mlb.com/api/v1/people?personIds=669373&hydrate=stats(group=hitting,type=statSplits,sitCodes=[vr,vl],season=2024)
   */
  async fetchBatterStatSplits(
    playerId: number,
    season: number,
    sitCodes: SituationCode[] = DEFAULT_SIT_CODES as unknown as SituationCode[]
  ): Promise<StatSplit[]> {
    const codeParam = sitCodes.join(',');
    const url = `${MLB_STATS_API_BASE}/people?personIds=${playerId}&hydrate=stats(group=[hitting],type=statSplits,sitCodes=[${codeParam}],season=${season})`;
    const cacheKey = `mlb:player:splits:batting:${playerId}:${season}`;

    const response = await this.fetchWithCache<{
      people: Array<{
        stats?: Array<{
          splits: StatSplit[];
        }>;
      }>;
    }>(url, cacheKey, CACHE_TTLS.statSplits);

    if (!response.people || response.people.length === 0) {
      return [];
    }

    const stats = response.people[0].stats;
    if (!stats || stats.length === 0) {
      return [];
    }

    return stats[0].splits || [];
  }

  /**
   * Fetch pitcher stat splits for a player in a specific year
   */
  async fetchPitcherStatSplits(
    playerId: number,
    season: number,
    sitCodes: SituationCode[] = DEFAULT_SIT_CODES as unknown as SituationCode[]
  ): Promise<StatSplit[]> {
    const codeParam = sitCodes.join(',');
    const url = `${MLB_STATS_API_BASE}/people?personIds=${playerId}&hydrate=stats(group=[pitching],type=statSplits,sitCodes=[${codeParam}],season=${season})`;
    const cacheKey = `mlb:player:splits:pitching:${playerId}:${season}`;

    const response = await this.fetchWithCache<{
      people: Array<{
        stats?: Array<{
          splits: StatSplit[];
        }>;
      }>;
    }>(url, cacheKey, CACHE_TTLS.statSplits);

    if (!response.people || response.people.length === 0) {
      return [];
    }

    const stats = response.people[0].stats;
    if (!stats || stats.length === 0) {
      return [];
    }

    return stats[0].splits || [];
  }

  /**
   * Fetch player game log for a specific season
   */
  async fetchPlayerGameLog(
    playerId: number,
    season: number,
    statType: 'hitting' | 'pitching'
  ): Promise<GameLog[]> {
    const group = statType === 'hitting' ? 'hitting' : 'pitching';
    const url = `${MLB_STATS_API_BASE}/people/${playerId}?hydrate=stats(group=[${group}],type=gameLog,season=${season})`;
    const cacheKey = `mlb:player:gamelog:${playerId}:${season}:${statType}`;

    const response = await this.fetchWithCache<{
      people: Array<{
        stats?: Array<{
          splits: Array<{
            date: string;
            opponent: { id: number; name: string; link: string };
            isHome: boolean;
            isWin: boolean;
            stat: SeasonStats | PitchingStats;
          }>;
        }>;
      }>;
    }>(url, cacheKey, CACHE_TTLS.gameLog);

    if (!response.people || response.people.length === 0) {
      return [];
    }

    const stats = response.people[0].stats;
    if (!stats || stats.length === 0) {
      return [];
    }

    return stats[0].splits || [];
  }

  // ==========================================================================
  // Team Methods
  // ==========================================================================

  /**
   * Fetch team information
   */
  async fetchTeamInfo(teamId: number): Promise<TeamInfo> {
    const url = `${MLB_STATS_API_BASE}/teams/${teamId}`;
    const cacheKey = `mlb:team:info:${teamId}`;

    const response = await this.fetchWithCache<{ teams: TeamInfo[] }>(
      url,
      cacheKey,
      CACHE_TTLS.teamInfo
    );

    if (!response.teams || response.teams.length === 0) {
      throw new Error(`Team ${teamId} not found`);
    }

    return response.teams[0];
  }

  /**
   * Fetch active roster for a team
   */
  async fetchActiveRoster(teamId: number, season: number): Promise<RosterEntry[]> {
    const url = `${MLB_STATS_API_BASE}/teams/${teamId}/roster?rosterType=active&season=${season}`;
    const cacheKey = `mlb:team:roster:${teamId}:${season}`;

    const response = await this.fetchWithCache<{ roster: RosterEntry[] }>(
      url,
      cacheKey,
      CACHE_TTLS.roster
    );

    return response.roster || [];
  }

  /**
   * Fetch full season roster for a team
   */
  async fetchFullSeasonRoster(teamId: number, season: number): Promise<RosterEntry[]> {
    const url = `${MLB_STATS_API_BASE}/teams/${teamId}/roster?rosterType=fullSeason&season=${season}`;
    const cacheKey = `mlb:team:fullroster:${teamId}:${season}`;

    const response = await this.fetchWithCache<{ roster: RosterEntry[] }>(
      url,
      cacheKey,
      CACHE_TTLS.roster
    );

    return response.roster || [];
  }

  /**
   * Fetch standings data for a season and league
   */
  async fetchStandingsData(
    season: number,
    leagueIds: string = '103,104' // AL=103, NL=104
  ): Promise<StandingsRecord[]> {
    const url = `${MLB_STATS_API_BASE}/standings?leagueId=${leagueIds}&season=${season}&standingsTypes=regularSeason`;
    const cacheKey = `mlb:standings:${season}:${leagueIds}`;

    const response = await this.fetchWithCache<{
      records: Array<{
        teamRecords: StandingsRecord[];
      }>;
    }>(url, cacheKey, CACHE_TTLS.standings);

    if (!response.records || response.records.length === 0) {
      return [];
    }

    // Flatten all team records from all divisions
    return response.records.flatMap(division => division.teamRecords || []);
  }

  // ==========================================================================
  // Asset URL Methods
  // ==========================================================================

  /**
   * Return the URL for a team's logo
   */
  fetchTeamLogoUrl(teamId: number): string {
    return `${MLB_STATIC_BASE}/team-logos/team-cap-on-light/${teamId}.svg`;
  }

  /**
   * Return the URL for a team's spot logo (smaller)
   */
  fetchTeamSpotUrl(teamId: number, size: number = 72): string {
    return `${MLB_STATIC_BASE}/team-logos/${teamId}/${size}.png`;
  }

  /**
   * Return the URL for a player's hero image
   */
  fetchPlayerHeroImageUrl(playerId: number): string {
    return `${MLB_IMG_BASE}/mlb-photos/image/upload/d_people:generic:action:hero:current.jpg/q_auto:good,w_3000/v1/people/${playerId}/action/hero/current`;
  }

  /**
   * Return the URL for a player's headshot
   */
  fetchPlayerHeadshotUrl(playerId: number, size: number = 300): string {
    return `${MLB_IMG_BASE}/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${size},q_auto:best/v1/people/${playerId}/headshot/67/current`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate advanced batting stats from basic stats
 */
export function calculateAdvancedBattingStats(stats: SeasonStats): {
  iso: string;
  babip: string;
  bbPct: string;
  kPct: string;
} {
  const iso = (parseFloat(stats.slg) - parseFloat(stats.avg)).toFixed(3);

  // BABIP = (H - HR) / (AB - K - HR + SF)
  const babip = stats.atBats > 0
    ? ((stats.hits - stats.homeRuns) /
       (stats.atBats - stats.strikeOuts - stats.homeRuns + (stats.sacFlies || 0))).toFixed(3)
    : '.000';

  // BB% = BB / PA
  const bbPct = stats.plateAppearances > 0
    ? ((stats.baseOnBalls / stats.plateAppearances) * 100).toFixed(1)
    : '0.0';

  // K% = K / PA
  const kPct = stats.plateAppearances > 0
    ? ((stats.strikeOuts / stats.plateAppearances) * 100).toFixed(1)
    : '0.0';

  return { iso, babip, bbPct, kPct };
}

/**
 * Calculate advanced pitching stats from basic stats
 */
export function calculateAdvancedPitchingStats(stats: PitchingStats): {
  kPer9: string;
  bbPer9: string;
  kPerBb: string;
  hPer9: string;
  hrPer9: string;
  kPct: string;
  bbPct: string;
} {
  const ip = parseFloat(stats.inningsPitched);

  const kPer9 = ip > 0 ? ((stats.strikeOuts / ip) * 9).toFixed(2) : '0.00';
  const bbPer9 = ip > 0 ? ((stats.baseOnBalls / ip) * 9).toFixed(2) : '0.00';
  const kPerBb = stats.baseOnBalls > 0
    ? (stats.strikeOuts / stats.baseOnBalls).toFixed(2)
    : stats.strikeOuts.toFixed(2);
  const hPer9 = ip > 0 ? ((stats.hits / ip) * 9).toFixed(2) : '0.00';
  const hrPer9 = ip > 0 ? ((stats.homeRuns / ip) * 9).toFixed(2) : '0.00';

  const kPct = stats.battersFaced > 0
    ? ((stats.strikeOuts / stats.battersFaced) * 100).toFixed(1)
    : '0.0';

  const bbPct = stats.battersFaced > 0
    ? ((stats.baseOnBalls / stats.battersFaced) * 100).toFixed(1)
    : '0.0';

  return { kPer9, bbPer9, kPerBb, hPer9, hrPer9, kPct, bbPct };
}

/**
 * Format innings pitched for display
 */
export function formatInningsPitched(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return `${ip}.0`;
}

/**
 * Parse innings pitched to decimal (e.g., "6.1" -> 6.333)
 */
export function parseInningsPitched(ip: string): number {
  const parts = ip.split('.');
  if (parts.length === 2) {
    const innings = parseInt(parts[0], 10) || 0;
    const thirds = parseInt(parts[1], 10) || 0;
    return innings + (thirds / 3);
  }
  return parseFloat(ip) || 0;
}
