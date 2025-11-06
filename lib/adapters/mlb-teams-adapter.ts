/**
 * MLB Teams Adapter
 *
 * Provides comprehensive team data from MLB Stats API including:
 * - Team information and branding
 * - Complete 40-man roster
 * - Team statistics (batting, pitching, fielding)
 * - Schedule with game results
 * - Standings and playoff odds
 *
 * Data Sources:
 * - Primary: MLB Stats API (statsapi.mlb.com)
 * - Cache Strategy: Multi-tier based on data volatility
 */

import type { KVNamespace } from '@cloudflare/workers-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MLBTeam {
  id: number;
  name: string;
  teamName: string;
  locationName: string;
  abbreviation: string;
  teamCode: string;
  fileCode: string;
  shortName: string;
  franchiseName: string;
  clubName: string;

  // Branding
  league: {
    id: number;
    name: string;
  };
  division: {
    id: number;
    name: string;
  };

  // Venue
  venue: {
    id: number;
    name: string;
    location: {
      city: string;
      state: string;
      stateAbbrev: string;
    };
    timeZone: {
      id: string;
      offset: number;
      tz: string;
    };
  };

  // Season info
  season: number;

  // Active status
  active: boolean;

  // Social media & website
  officialSiteUrl?: string;

  // Record
  record?: {
    wins: number;
    losses: number;
    winningPercentage: string;
    gamesBack: string;
    wildCardGamesBack?: string;
    leagueGamesBack?: string;
    divisionGamesBack?: string;
    divisionLeader: boolean;
    wildCardLeader?: boolean;
    clinched?: boolean;
    eliminationNumber?: string;
    wildCardEliminationNumber?: string;
  };
}

export interface MLBPlayer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;

  // Position
  primaryPosition: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };

  // Bats/Throws
  batSide: {
    code: string;
    description: string;
  };
  pitchHand?: {
    code: string;
    description: string;
  };

  // Status
  status: {
    code: string;
    description: string;
  };

  // Jersey info
  jerseyNumber?: string;

  // Parent org
  parentTeamId?: number;
}

export interface MLBRoster {
  teamId: number;
  rosterType: string; // '40Man', 'active', 'fullSeason', etc.
  season: number;

  // Roster breakdown
  roster: MLBPlayer[];

  // Position groupings
  pitchers: MLBPlayer[];
  catchers: MLBPlayer[];
  infielders: MLBPlayer[];
  outfielders: MLBPlayer[];
  designatedHitters: MLBPlayer[];
}

export interface MLBTeamStats {
  teamId: number;
  season: number;

  // Batting stats
  batting: {
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
    numberOfPitches: number;
    plateAppearances: number;
    totalBases: number;
    rbi: number;
    leftOnBase: number;
    sacBunts: number;
    sacFlies: number;
    babip: string;
    groundOutsToAirouts: string;
    catchersInterference: number;
    atBatsPerHomeRun: string;
  };

  // Pitching stats
  pitching: {
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
    avg: string;
    atBats: number;
    obp: string;
    slg: string;
    ops: string;
    caughtStealing: number;
    stolenBases: number;
    stolenBasePercentage: string;
    groundIntoDoublePlay: number;
    numberOfPitches: number;
    era: string;
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
    gamesFinished: number;
    runsScoredPer9: string;
    homeRunsPer9: string;
    inheritedRunners: number;
    inheritedRunnersScored: number;
    catchersInterference: number;
    sacBunts: number;
    sacFlies: number;
  };

  // Fielding stats
  fielding: {
    gamesPlayed: number;
    gamesStarted: number;
    caughtStealing: number;
    stolenBases: number;
    stolenBasePercentage: string;
    assists: number;
    putOuts: number;
    errors: number;
    chances: number;
    fielding: string; // Fielding percentage
    passedBall: number;
    pickoffs: number;
  };
}

export interface MLBGame {
  gamePk: number;
  gameDate: string;
  gameType: string; // 'R' (regular), 'F' (wild card), 'D' (division), etc.
  season: string;

  // Teams
  teams: {
    away: {
      team: {
        id: number;
        name: string;
      };
      leagueRecord: {
        wins: number;
        losses: number;
        pct: string;
      };
      score?: number;
      isWinner?: boolean;
    };
    home: {
      team: {
        id: number;
        name: string;
      };
      leagueRecord: {
        wins: number;
        losses: number;
        pct: string;
      };
      score?: number;
      isWinner?: boolean;
    };
  };

  // Status
  status: {
    abstractGameState: string; // 'Final', 'Live', 'Preview'
    codedGameState: string;
    detailedState: string;
    statusCode: string;
    startTimeTBD: boolean;
  };

  // Venue
  venue: {
    id: number;
    name: string;
  };

  // Broadcast
  broadcasts?: Array<{
    id: number;
    name: string;
    type: string;
    language: string;
    isNational: boolean;
  }>;

  // Game info
  gameNumber: number;
  doubleHeader: string; // 'N', 'Y', 'S'
  dayNight: string; // 'day', 'night'
  scheduledInnings: number;
  reverseHomeAwayStatus: boolean;
  inningBreakLength?: number;
  gamesInSeries: number;
  seriesGameNumber: number;
  seriesDescription: string;
  recordSource: string;
  ifNecessary: string; // 'N', 'Y'

  // Decisions (if game complete)
  decisions?: {
    winner?: {
      id: number;
      fullName: string;
    };
    loser?: {
      id: number;
      fullName: string;
    };
    save?: {
      id: number;
      fullName: string;
    };
  };
}

export interface MLBSchedule {
  teamId: number;
  season: number;
  totalGames: number;

  // Games grouped by month
  games: MLBGame[];

  // Record summary
  record: {
    wins: number;
    losses: number;
    winPct: string;
    homeRecord: string;
    awayRecord: string;
    lastTenRecord: string;
    streak: string;
  };
}

export interface MLBStandings {
  season: number;
  standingsType: string; // 'regularSeason', 'wildCard', etc.

  // League standings
  league: {
    id: number;
    name: string;
  };

  division: {
    id: number;
    name: string;
  };

  // Team records
  teamRecords: Array<{
    team: {
      id: number;
      name: string;
    };
    standingsType: string;
    leagueRank: string;
    divisionRank: string;
    wildCardRank?: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winningPercentage: string;
    divisionGamesBack: string;
    leagueGamesBack: string;
    wildCardGamesBack?: string;
    eliminationNumber: string;
    wildCardEliminationNumber?: string;
    divisionLeader: boolean;
    divisionChamp: boolean;
    wildCardLeader?: boolean;
    clinched: boolean;

    // Split records
    records: {
      splitRecords: Array<{
        type: string;
        wins: number;
        losses: number;
        pct: string;
      }>;
      divisionRecords: Array<{
        division: { id: number; name: string };
        wins: number;
        losses: number;
        pct: string;
      }>;
      overallRecords: Array<{
        type: string;
        wins: number;
        losses: number;
        pct: string;
      }>;
      leagueRecords: Array<{
        league: { id: number; name: string };
        wins: number;
        losses: number;
        pct: string;
      }>;
    };

    // Streaks
    streak: {
      streakType: string;
      streakNumber: number;
      streakCode: string;
    };

    // Run differential
    runsAllowed: number;
    runsScored: number;
  }>;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheConfig {
  teamInfo: number;
  roster: number;
  teamStats: number;
  schedule: number;
  standings: number;
  liveGames: number;
}

const CACHE_TTLS: CacheConfig = {
  teamInfo: 86400,     // 24 hours (rarely changes)
  roster: 3600,        // 1 hour (transactions happen)
  teamStats: 1800,     // 30 minutes (updated frequently during season)
  schedule: 3600,      // 1 hour
  standings: 1800,     // 30 minutes
  liveGames: 30,       // 30 seconds (live data)
};

// ============================================================================
// MLB TEAMS ADAPTER CLASS
// ============================================================================

export class MLBTeamsAdapter {
  private kv?: KVNamespace;
  private readonly baseUrl = 'https://statsapi.mlb.com/api/v1';

  constructor(kv?: KVNamespace) {
    this.kv = kv;
  }

  /**
   * Fetch team information
   */
  async fetchTeamInfo(teamId: number, season?: number): Promise<MLBTeam> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams/${teamId}?season=${year}`;
    const cacheKey = `mlb:team:info:${teamId}:${year}`;

    const data = await this.fetchWithCache<{ teams: MLBTeam[] }>(
      url,
      cacheKey,
      CACHE_TTLS.teamInfo
    );

    if (!data.teams || data.teams.length === 0) {
      throw new Error(`Team ${teamId} not found`);
    }

    return data.teams[0];
  }

  /**
   * Fetch team roster (40-man, active, etc.)
   */
  async fetchRoster(
    teamId: number,
    season?: number,
    rosterType: string = '40Man'
  ): Promise<MLBRoster> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams/${teamId}/roster/${rosterType}?season=${year}`;
    const cacheKey = `mlb:team:roster:${teamId}:${rosterType}:${year}`;

    const data = await this.fetchWithCache<{ roster: MLBPlayer[] }>(
      url,
      cacheKey,
      CACHE_TTLS.roster
    );

    // Group players by position
    const roster: MLBPlayer[] = data.roster || [];
    const pitchers = roster.filter(p => p.primaryPosition.code === '1');
    const catchers = roster.filter(p => p.primaryPosition.code === '2');
    const infielders = roster.filter(p =>
      ['3', '4', '5', '6'].includes(p.primaryPosition.code)
    );
    const outfielders = roster.filter(p =>
      ['7', '8', '9'].includes(p.primaryPosition.code)
    );
    const designatedHitters = roster.filter(p => p.primaryPosition.code === 'D');

    return {
      teamId,
      rosterType,
      season: year,
      roster,
      pitchers,
      catchers,
      infielders,
      outfielders,
      designatedHitters,
    };
  }

  /**
   * Fetch team statistics
   */
  async fetchTeamStats(teamId: number, season?: number): Promise<MLBTeamStats> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams/${teamId}/stats?season=${year}&group=hitting,pitching,fielding`;
    const cacheKey = `mlb:team:stats:${teamId}:${year}`;

    const data = await this.fetchWithCache<{ stats: any[] }>(
      url,
      cacheKey,
      CACHE_TTLS.teamStats
    );

    // Extract stats by group
    const hittingStats = data.stats?.find(s => s.group?.displayName === 'hitting');
    const pitchingStats = data.stats?.find(s => s.group?.displayName === 'pitching');
    const fieldingStats = data.stats?.find(s => s.group?.displayName === 'fielding');

    return {
      teamId,
      season: year,
      batting: hittingStats?.splits?.[0]?.stat || {},
      pitching: pitchingStats?.splits?.[0]?.stat || {},
      fielding: fieldingStats?.splits?.[0]?.stat || {},
    };
  }

  /**
   * Fetch team schedule
   */
  async fetchSchedule(
    teamId: number,
    season?: number,
    startDate?: string,
    endDate?: string
  ): Promise<MLBSchedule> {
    const year = season || new Date().getFullYear();

    let url = `${this.baseUrl}/schedule?sportId=1&teamId=${teamId}&season=${year}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const cacheKey = `mlb:team:schedule:${teamId}:${year}:${startDate || 'full'}`;

    const data = await this.fetchWithCache<{ dates: any[] }>(
      url,
      cacheKey,
      CACHE_TTLS.schedule
    );

    // Flatten games from all dates
    const games: MLBGame[] = [];
    data.dates?.forEach(date => {
      date.games?.forEach((game: any) => {
        games.push(game);
      });
    });

    // Calculate record
    let wins = 0;
    let losses = 0;
    let homeWins = 0;
    let homeLosses = 0;
    let awayWins = 0;
    let awayLosses = 0;

    const completedGames = games.filter(g =>
      g.status.abstractGameState === 'Final'
    );

    completedGames.forEach(game => {
      const isHome = game.teams.home.team.id === teamId;
      const isWinner = isHome
        ? game.teams.home.isWinner
        : game.teams.away.isWinner;

      if (isWinner) {
        wins++;
        if (isHome) homeWins++;
        else awayWins++;
      } else {
        losses++;
        if (isHome) homeLosses++;
        else awayLosses++;
      }
    });

    const winPct = wins + losses > 0
      ? (wins / (wins + losses)).toFixed(3)
      : '.000';

    // Last 10 games
    const lastTen = completedGames.slice(-10);
    const lastTenWins = lastTen.filter(g => {
      const isHome = g.teams.home.team.id === teamId;
      return isHome ? g.teams.home.isWinner : g.teams.away.isWinner;
    }).length;
    const lastTenLosses = lastTen.length - lastTenWins;

    // Streak calculation
    let streakType = 'W';
    let streakCount = 0;
    for (let i = completedGames.length - 1; i >= 0; i--) {
      const game = completedGames[i];
      const isHome = game.teams.home.team.id === teamId;
      const isWinner = isHome ? game.teams.home.isWinner : game.teams.away.isWinner;

      const currentType = isWinner ? 'W' : 'L';
      if (streakCount === 0) {
        streakType = currentType;
        streakCount = 1;
      } else if (currentType === streakType) {
        streakCount++;
      } else {
        break;
      }
    }

    return {
      teamId,
      season: year,
      totalGames: games.length,
      games,
      record: {
        wins,
        losses,
        winPct,
        homeRecord: `${homeWins}-${homeLosses}`,
        awayRecord: `${awayWins}-${awayLosses}`,
        lastTenRecord: `${lastTenWins}-${lastTenLosses}`,
        streak: `${streakType}${streakCount}`,
      },
    };
  }

  /**
   * Fetch division standings
   */
  async fetchStandings(
    teamId: number,
    season?: number
  ): Promise<MLBStandings> {
    const year = season || new Date().getFullYear();

    // First get team info to determine division
    const teamInfo = await this.fetchTeamInfo(teamId, year);
    const divisionId = teamInfo.division.id;

    const url = `${this.baseUrl}/standings?leagueId=${teamInfo.league.id}&season=${year}&standingsTypes=regularSeason`;
    const cacheKey = `mlb:standings:${teamInfo.league.id}:${year}`;

    const data = await this.fetchWithCache<{ records: any[] }>(
      url,
      cacheKey,
      CACHE_TTLS.standings
    );

    // Find division standings
    const divisionStandings = data.records?.find(
      r => r.division.id === divisionId
    );

    if (!divisionStandings) {
      throw new Error(`Standings not found for division ${divisionId}`);
    }

    return {
      season: year,
      standingsType: 'regularSeason',
      league: divisionStandings.league,
      division: divisionStandings.division,
      teamRecords: divisionStandings.teamRecords || [],
    };
  }

  /**
   * Fetch live/recent games for team
   */
  async fetchLiveGames(teamId: number): Promise<MLBGame[]> {
    const today = new Date().toISOString().split('T')[0];
    const url = `${this.baseUrl}/schedule?sportId=1&teamId=${teamId}&date=${today}`;
    const cacheKey = `mlb:team:live:${teamId}:${today}`;

    const data = await this.fetchWithCache<{ dates: any[] }>(
      url,
      cacheKey,
      CACHE_TTLS.liveGames
    );

    const games: MLBGame[] = [];
    data.dates?.forEach(date => {
      date.games?.forEach((game: any) => {
        games.push(game);
      });
    });

    return games;
  }

  /**
   * Get all teams for a season
   */
  async fetchAllTeams(season?: number): Promise<MLBTeam[]> {
    const year = season || new Date().getFullYear();
    const url = `${this.baseUrl}/teams?sportId=1&season=${year}`;
    const cacheKey = `mlb:teams:all:${year}`;

    const data = await this.fetchWithCache<{ teams: MLBTeam[] }>(
      url,
      cacheKey,
      CACHE_TTLS.teamInfo
    );

    return data.teams || [];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    // Try cache first
    if (this.kv) {
      try {
        const cached = await this.kv.get(cacheKey, 'json');
        if (cached) {
          return cached as T;
        }
      } catch (error) {
        console.warn('KV cache read failed:', error);
      }
    }

    // Fetch from API with retry logic
    const data = await this.fetchWithRetry<T>(url);

    // Store in cache
    if (this.kv) {
      try {
        await this.kv.put(cacheKey, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn('KV cache write failed:', error);
      }
    }

    return data;
  }

  private async fetchWithRetry<T>(
    url: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0 (blazesportsintel.com)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Exponential backoff
        if (i < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${maxRetries} attempts: ${lastError?.message}`
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format team record as W-L
 */
export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

/**
 * Format winning percentage
 */
export function formatWinPct(wins: number, losses: number): string {
  if (wins + losses === 0) return '.000';
  return (wins / (wins + losses)).toFixed(3);
}

/**
 * Calculate games back
 */
export function calculateGamesBack(
  teamWins: number,
  teamLosses: number,
  leaderWins: number,
  leaderLosses: number
): string {
  const gb = ((leaderWins - leaderLosses) - (teamWins - teamLosses)) / 2;
  return gb === 0 ? '-' : gb.toFixed(1);
}

/**
 * Get position group name
 */
export function getPositionGroup(positionCode: string): string {
  if (positionCode === '1') return 'Pitcher';
  if (positionCode === '2') return 'Catcher';
  if (['3', '4', '5', '6'].includes(positionCode)) return 'Infielder';
  if (['7', '8', '9'].includes(positionCode)) return 'Outfielder';
  if (positionCode === 'D') return 'Designated Hitter';
  return 'Unknown';
}

/**
 * Get position name from code
 */
export function getPositionName(code: string): string {
  const positions: Record<string, string> = {
    '1': 'Pitcher',
    '2': 'Catcher',
    '3': 'First Base',
    '4': 'Second Base',
    '5': 'Third Base',
    '6': 'Shortstop',
    '7': 'Left Field',
    '8': 'Center Field',
    '9': 'Right Field',
    'D': 'Designated Hitter',
    'Y': 'Two-Way Player',
    'O': 'Outfield',
    'H': 'Pinch Hitter',
    'R': 'Pinch Runner',
  };

  return positions[code] || code;
}

/**
 * Parse height string to inches
 */
export function parseHeight(height: string): number {
  const match = height.match(/(\d+)'(\d+)"/);
  if (!match) return 0;

  const feet = parseInt(match[1], 10);
  const inches = parseInt(match[2], 10);

  return (feet * 12) + inches;
}

/**
 * Format height in feet and inches
 */
export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}
