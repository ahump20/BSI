/**
 * FanGraphs API Adapter
 *
 * Provides advanced sabermetrics not available in MLB Stats API
 * Includes wOBA, wRC+, WAR, FIP, and other advanced metrics
 *
 * API Documentation: https://www.fangraphs.com/api/leaders/major-league/data
 */

const FANGRAPHS_API_BASE = 'https://www.fangraphs.com/api/leaders/major-league/data';
const FANGRAPHS_PROJECTIONS_BASE = 'https://www.fangraphs.com/api/projections';

// ============================================================================
// Type Definitions
// ============================================================================

export interface FanGraphsBattingStats {
  // Player identification
  playerid: number;
  playername: string;
  teamid: number;
  teamname: string;

  // Basic stats
  G: number;           // Games
  PA: number;          // Plate Appearances
  AB: number;          // At Bats
  H: number;           // Hits
  '1B': number;        // Singles
  '2B': number;        // Doubles
  '3B': number;        // Triples
  HR: number;          // Home Runs
  R: number;           // Runs
  RBI: number;         // Runs Batted In
  BB: number;          // Walks
  IBB: number;         // Intentional Walks
  SO: number;          // Strikeouts
  HBP: number;         // Hit By Pitch
  SF: number;          // Sacrifice Flies
  SH: number;          // Sacrifice Hits
  GDP: number;         // Grounded Into Double Play
  SB: number;          // Stolen Bases
  CS: number;          // Caught Stealing
  AVG: number;         // Batting Average

  // Advanced rate stats
  'BB%': number;       // Walk Percentage
  'K%': number;        // Strikeout Percentage
  'BB/K': number;      // Walk to Strikeout Ratio
  OBP: number;         // On-Base Percentage
  SLG: number;         // Slugging Percentage
  OPS: number;         // On-Base Plus Slugging
  ISO: number;         // Isolated Power
  BABIP: number;       // Batting Average on Balls In Play

  // Advanced metrics - the real value of FanGraphs
  'wOBA': number;      // Weighted On-Base Average
  'wRC+': number;      // Weighted Runs Created Plus (100 = league average)
  BsR: number;         // Base Running Runs
  Off: number;         // Offensive Runs Above Average
  Def: number;         // Defensive Runs Above Average
  WAR: number;         // Wins Above Replacement

  // Plate discipline
  'O-Swing%': number;  // Outside Swing %
  'Z-Swing%': number;  // Inside Zone Swing %
  'Swing%': number;    // Overall Swing %
  'O-Contact%': number; // Outside Contact %
  'Z-Contact%': number; // Inside Zone Contact %
  'Contact%': number;  // Overall Contact %
  'Zone%': number;     // Zone %
  'F-Strike%': number; // First Pitch Strike %
  'SwStr%': number;    // Swinging Strike %

  // Batted ball data
  'LD%': number;       // Line Drive %
  'GB%': number;       // Ground Ball %
  'FB%': number;       // Fly Ball %
  'IFFB%': number;     // Infield Fly Ball %
  'HR/FB': number;     // Home Run per Fly Ball
  'IFH%': number;      // Infield Hit %
  'BUH%': number;      // Bunt Hit %
  'Pull%': number;     // Pull %
  'Cent%': number;     // Center %
  'Oppo%': number;     // Opposite Field %
  'Soft%': number;     // Soft Contact %
  'Med%': number;      // Medium Contact %
  'Hard%': number;     // Hard Contact %

  // Position
  Pos: string;         // Position
  Age: number;         // Age
}

export interface FanGraphsPitchingStats {
  // Player identification
  playerid: number;
  playername: string;
  teamid: number;
  teamname: string;

  // Basic stats
  W: number;           // Wins
  L: number;           // Losses
  SV: number;          // Saves
  G: number;           // Games
  GS: number;          // Games Started
  IP: number;          // Innings Pitched
  TBF: number;         // Total Batters Faced
  H: number;           // Hits
  R: number;           // Runs
  ER: number;          // Earned Runs
  HR: number;          // Home Runs
  BB: number;          // Walks
  IBB: number;         // Intentional Walks
  HBP: number;         // Hit Batsmen
  WP: number;          // Wild Pitches
  BK: number;          // Balks
  SO: number;          // Strikeouts

  // Traditional metrics
  ERA: number;         // Earned Run Average
  WHIP: number;        // Walks + Hits per Inning Pitched
  'K/9': number;       // Strikeouts per 9 innings
  'BB/9': number;      // Walks per 9 innings
  'K/BB': number;      // Strikeout to Walk Ratio
  'H/9': number;       // Hits per 9 innings
  'HR/9': number;      // Home Runs per 9 innings
  AVG: number;         // Batting Average Against

  // Advanced metrics - FanGraphs specialties
  'FIP': number;       // Fielding Independent Pitching
  'xFIP': number;      // Expected FIP
  'SIERA': number;     // Skill-Interactive ERA
  'K%': number;        // Strikeout Percentage
  'BB%': number;       // Walk Percentage
  'K-BB%': number;     // K% minus BB%
  'BABIP': number;     // Batting Average on Balls in Play
  'LOB%': number;      // Left On Base Percentage
  'GB%': number;       // Ground Ball Percentage
  'HR/FB': number;     // Home Run per Fly Ball
  'E-F': number;       // ERA minus FIP
  'FIP-': number;      // FIP scaled (100 = league average)
  'xFIP-': number;     // xFIP scaled (100 = league average)
  WAR: number;         // Wins Above Replacement

  // Pitch types and velocity
  'FA%': number;       // Fastball %
  'FT%': number;       // Two-seam Fastball %
  'FC%': number;       // Cutter %
  'FS%': number;       // Splitter %
  'FO%': number;       // Forkball %
  'SI%': number;       // Sinker %
  'SL%': number;       // Slider %
  'CU%': number;       // Curveball %
  'CH%': number;       // Changeup %
  'KN%': number;       // Knuckleball %
  'vFA': number;       // Fastball Velocity (mph)
  'vFC': number;       // Cutter Velocity
  'vFS': number;       // Splitter Velocity
  'vSI': number;       // Sinker Velocity
  'vSL': number;       // Slider Velocity
  'vCU': number;       // Curveball Velocity
  'vCH': number;       // Changeup Velocity

  // Batted ball data
  'LD%': number;       // Line Drive %
  'FB%': number;       // Fly Ball %
  'IFFB%': number;     // Infield Fly Ball %
  'IFH%': number;      // Infield Hit %
  'Pull%': number;     // Pull %
  'Cent%': number;     // Center %
  'Oppo%': number;     // Opposite Field %
  'Soft%': number;     // Soft Contact %
  'Med%': number;      // Medium Contact %
  'Hard%': number;     // Hard Contact %

  // Plate discipline
  'O-Swing%': number;  // Outside Swing %
  'Z-Swing%': number;  // Inside Zone Swing %
  'Swing%': number;    // Overall Swing %
  'O-Contact%': number; // Outside Contact %
  'Z-Contact%': number; // Inside Zone Contact %
  'Contact%': number;  // Overall Contact %
  'Zone%': number;     // Zone %
  'F-Strike%': number; // First Pitch Strike %
  'SwStr%': number;    // Swinging Strike %

  // Position
  Age: number;         // Age
}

export interface FanGraphsLeaderboardOptions {
  pos?: 'all' | 'c' | '1b' | '2b' | '3b' | 'ss' | 'lf' | 'cf' | 'rf' | 'of' | 'dh';
  stats?: 'bat' | 'pit';
  lg?: 'all' | 'al' | 'nl';
  qual?: 'y' | 'n' | number; // Qualified players only, or min PA/IP
  type?: 'c' | '8' | '23' | '34' | '307' | '313'; // Different stat categories
  season?: number;
  month?: 0 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // 0 = full season
  season1?: number; // For multi-season queries
  ind?: 0 | 1; // Individual seasons in multi-season queries
  team?: string; // Team abbreviation
  rost?: 0 | 1; // Roster status
  age?: string; // Age range (e.g., "20,30")
  filter?: string; // Custom filters
  players?: string; // Comma-separated player IDs
  sortcol?: string; // Column to sort by
  sortdir?: 'asc' | 'desc';
  startdate?: string; // YYYY-MM-DD
  enddate?: string; // YYYY-MM-DD
  pageitems?: number; // Results per page (max 1000)
  pagenum?: number; // Page number
}

export interface FanGraphsLeaderboardResponse<T> {
  data: T[];
  totalResults: number;
  page: number;
  pageItems: number;
}

export interface PlayerProjection {
  playerid: number;
  playername: string;
  teamid: number;
  teamname: string;

  // Projected stats
  PA?: number;
  AB?: number;
  H?: number;
  HR?: number;
  R?: number;
  RBI?: number;
  SB?: number;
  AVG?: number;
  OBP?: number;
  SLG?: number;
  wOBA?: number;
  'wRC+'?: number;
  WAR?: number;

  // Pitching projections
  IP?: number;
  W?: number;
  SV?: number;
  SO?: number;
  ERA?: number;
  WHIP?: number;
  FIP?: number;

  // Projection system metadata
  system: 'steamer' | 'zips' | 'thebat' | 'atc' | 'depthcharts';
  season: number;
}

// ============================================================================
// Cache Configuration
// ============================================================================

interface CacheConfig {
  leaderboards: number;    // 1 hour - leaderboards change frequently
  playerStats: number;     // 6 hours - individual player stats
  projections: number;     // 24 hours - projections updated daily
  advancedStats: number;   // 6 hours - advanced metrics
}

const CACHE_TTLS: CacheConfig = {
  leaderboards: 3600,      // 1 hour
  playerStats: 21600,      // 6 hours
  projections: 86400,      // 24 hours
  advancedStats: 21600,    // 6 hours
};

// ============================================================================
// FanGraphs Adapter Class
// ============================================================================

export class FanGraphsAdapter {
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
    timeout = 10000
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
            'Referer': 'https://blazesportsintel.com/',
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
  // Leaderboard Methods
  // ==========================================================================

  /**
   * Fetch batting leaderboards with advanced sabermetrics
   * https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=bat&lg=all&qual=y&type=8
   */
  async fetchBattingLeaderboard(
    options: FanGraphsLeaderboardOptions = {}
  ): Promise<FanGraphsLeaderboardResponse<FanGraphsBattingStats>> {
    const defaultOptions: FanGraphsLeaderboardOptions = {
      pos: 'all',
      stats: 'bat',
      lg: 'all',
      qual: 'y',
      type: '8', // Standard batting with advanced stats
      season: new Date().getFullYear(),
      month: 0,
      pageitems: 50,
      pagenum: 1,
      sortcol: 'WAR',
      sortdir: 'desc',
    };

    const params = { ...defaultOptions, ...options };
    const queryString = this.buildQueryString(params);
    const url = `${FANGRAPHS_API_BASE}?${queryString}`;
    const cacheKey = `fangraphs:batting:leaderboard:${queryString}`;

    const response = await this.fetchWithCache<FanGraphsBattingStats[]>(
      url,
      cacheKey,
      CACHE_TTLS.leaderboards
    );

    return {
      data: response,
      totalResults: response.length,
      page: params.pagenum || 1,
      pageItems: params.pageitems || 50,
    };
  }

  /**
   * Fetch pitching leaderboards with advanced metrics (FIP, xFIP, SIERA, etc.)
   * https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&qual=y&type=8
   */
  async fetchPitchingLeaderboard(
    options: FanGraphsLeaderboardOptions = {}
  ): Promise<FanGraphsLeaderboardResponse<FanGraphsPitchingStats>> {
    const defaultOptions: FanGraphsLeaderboardOptions = {
      pos: 'all',
      stats: 'pit',
      lg: 'all',
      qual: 'y',
      type: '8', // Standard pitching with advanced stats
      season: new Date().getFullYear(),
      month: 0,
      pageitems: 50,
      pagenum: 1,
      sortcol: 'WAR',
      sortdir: 'desc',
    };

    const params = { ...defaultOptions, ...options };
    const queryString = this.buildQueryString(params);
    const url = `${FANGRAPHS_API_BASE}?${queryString}`;
    const cacheKey = `fangraphs:pitching:leaderboard:${queryString}`;

    const response = await this.fetchWithCache<FanGraphsPitchingStats[]>(
      url,
      cacheKey,
      CACHE_TTLS.leaderboards
    );

    return {
      data: response,
      totalResults: response.length,
      page: params.pagenum || 1,
      pageItems: params.pageitems || 50,
    };
  }

  /**
   * Fetch advanced batting stats for a specific player
   * Includes wOBA, wRC+, BsR, and WAR
   */
  async fetchPlayerBattingStats(
    playerId: number,
    season?: number
  ): Promise<FanGraphsBattingStats | null> {
    const currentSeason = season || new Date().getFullYear();

    const response = await this.fetchBattingLeaderboard({
      players: playerId.toString(),
      season: currentSeason,
      type: '8',
      pageitems: 1,
    });

    return response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Fetch advanced pitching stats for a specific player
   * Includes FIP, xFIP, SIERA, and WAR
   */
  async fetchPlayerPitchingStats(
    playerId: number,
    season?: number
  ): Promise<FanGraphsPitchingStats | null> {
    const currentSeason = season || new Date().getFullYear();

    const response = await this.fetchPitchingLeaderboard({
      players: playerId.toString(),
      season: currentSeason,
      type: '8',
      pageitems: 1,
    });

    return response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Fetch player projections (Steamer, ZiPS, THE BAT, ATC, Depth Charts)
   */
  async fetchPlayerProjections(
    playerId: number,
    system: 'steamer' | 'zips' | 'thebat' | 'atc' | 'depthcharts' = 'steamer'
  ): Promise<PlayerProjection | null> {
    const season = new Date().getFullYear();
    const url = `${FANGRAPHS_PROJECTIONS_BASE}?type=${system}&playerid=${playerId}&season=${season}`;
    const cacheKey = `fangraphs:projections:${system}:${playerId}:${season}`;

    try {
      const projection = await this.fetchWithCache<PlayerProjection>(
        url,
        cacheKey,
        CACHE_TTLS.projections
      );

      return projection;
    } catch (error) {
      console.warn(`Failed to fetch projections for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch plate discipline metrics for a player
   * Includes O-Swing%, Z-Swing%, Contact%, SwStr%, etc.
   */
  async fetchPlateDiscipline(
    playerId: number,
    season?: number,
    stats: 'bat' | 'pit' = 'bat'
  ): Promise<Partial<FanGraphsBattingStats | FanGraphsPitchingStats> | null> {
    const currentSeason = season || new Date().getFullYear();
    const type = '5'; // Plate discipline stats

    const queryString = this.buildQueryString({
      players: playerId.toString(),
      season: currentSeason,
      stats,
      type,
      pageitems: 1,
    });

    const url = `${FANGRAPHS_API_BASE}?${queryString}`;
    const cacheKey = `fangraphs:discipline:${stats}:${playerId}:${currentSeason}`;

    try {
      const response = await this.fetchWithCache<any[]>(
        url,
        cacheKey,
        CACHE_TTLS.advancedStats
      );

      return response.length > 0 ? response[0] : null;
    } catch (error) {
      console.warn(`Failed to fetch plate discipline for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch batted ball data for a player
   * Includes LD%, GB%, FB%, HR/FB, Pull%, etc.
   */
  async fetchBattedBallData(
    playerId: number,
    season?: number,
    stats: 'bat' | 'pit' = 'bat'
  ): Promise<Partial<FanGraphsBattingStats | FanGraphsPitchingStats> | null> {
    const currentSeason = season || new Date().getFullYear();
    const type = '2'; // Batted ball stats

    const queryString = this.buildQueryString({
      players: playerId.toString(),
      season: currentSeason,
      stats,
      type,
      pageitems: 1,
    });

    const url = `${FANGRAPHS_API_BASE}?${queryString}`;
    const cacheKey = `fangraphs:battedball:${stats}:${playerId}:${currentSeason}`;

    try {
      const response = await this.fetchWithCache<any[]>(
        url,
        cacheKey,
        CACHE_TTLS.advancedStats
      );

      return response.length > 0 ? response[0] : null;
    } catch (error) {
      console.warn(`Failed to fetch batted ball data for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive player profile combining multiple stat types
   */
  async fetchPlayerProfile(
    playerId: number,
    season?: number,
    stats: 'bat' | 'pit' = 'bat'
  ): Promise<{
    standard: FanGraphsBattingStats | FanGraphsPitchingStats | null;
    discipline: Partial<FanGraphsBattingStats | FanGraphsPitchingStats> | null;
    battedBall: Partial<FanGraphsBattingStats | FanGraphsPitchingStats> | null;
    projections: PlayerProjection | null;
  }> {
    const currentSeason = season || new Date().getFullYear();

    // Fetch all data in parallel
    const [standard, discipline, battedBall, projections] = await Promise.all([
      stats === 'bat'
        ? this.fetchPlayerBattingStats(playerId, currentSeason)
        : this.fetchPlayerPitchingStats(playerId, currentSeason),
      this.fetchPlateDiscipline(playerId, currentSeason, stats),
      this.fetchBattedBallData(playerId, currentSeason, stats),
      this.fetchPlayerProjections(playerId, 'steamer'),
    ]);

    return {
      standard,
      discipline,
      battedBall,
      projections,
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert MLB player ID to FanGraphs player ID
 * Note: This requires a mapping service or database lookup
 * FanGraphs uses different player IDs than MLB
 */
export function mlbToFanGraphsId(mlbId: number): number | null {
  // This would need to be implemented with an actual ID mapping service
  // For now, returning null to indicate conversion needed
  // In production, this would query a conversion table in D1 or KV
  console.warn(`MLB to FanGraphs ID conversion not implemented for ${mlbId}`);
  return null;
}

/**
 * Calculate park-adjusted wRC+
 * wRC+ of 100 is league average, >100 is above average
 */
export function calculateParkAdjustedWRC(
  wRC: number,
  parkFactor: number = 100
): number {
  return Math.round((wRC / parkFactor) * 100);
}

/**
 * Calculate FIP (Fielding Independent Pitching)
 * FIP = ((13*HR + 3*BB - 2*K) / IP) + FIP_constant
 * FIP constant changes by year, typically around 3.10
 */
export function calculateFIP(
  hr: number,
  bb: number,
  k: number,
  ip: number,
  fipConstant: number = 3.10
): number {
  if (ip === 0) return 0;
  return ((13 * hr + 3 * bb - 2 * k) / ip) + fipConstant;
}

/**
 * Calculate xFIP (Expected FIP)
 * Same as FIP but uses league-average HR/FB rate instead of actual
 */
export function calculateXFIP(
  fb: number,
  bb: number,
  k: number,
  ip: number,
  leagueHRperFB: number = 0.105,
  fipConstant: number = 3.10
): number {
  if (ip === 0) return 0;
  const expectedHR = fb * leagueHRperFB;
  return ((13 * expectedHR + 3 * bb - 2 * k) / ip) + fipConstant;
}

/**
 * Determine player quality tier based on wRC+
 */
export function getWRCPlusTier(wrcPlus: number): string {
  if (wrcPlus >= 160) return 'Elite (MVP caliber)';
  if (wrcPlus >= 140) return 'Excellent (All-Star)';
  if (wrcPlus >= 115) return 'Above Average (Starter)';
  if (wrcPlus >= 90) return 'Average';
  if (wrcPlus >= 80) return 'Below Average';
  return 'Poor';
}

/**
 * Determine pitcher quality tier based on FIP-
 * FIP- of 100 is league average, lower is better
 */
export function getFIPMinusTier(fipMinus: number): string {
  if (fipMinus <= 70) return 'Elite (Cy Young caliber)';
  if (fipMinus <= 85) return 'Excellent (All-Star)';
  if (fipMinus <= 95) return 'Above Average';
  if (fipMinus <= 105) return 'Average';
  if (fipMinus <= 115) return 'Below Average';
  return 'Poor';
}

/**
 * Format WAR value with proper context
 */
export function formatWAR(war: number): string {
  const rounded = war.toFixed(1);

  if (war >= 8.0) return `${rounded} (MVP)`;
  if (war >= 5.0) return `${rounded} (All-Star)`;
  if (war >= 2.0) return `${rounded} (Starter)`;
  if (war >= 0.0) return `${rounded} (Replacement)`;
  return `${rounded} (Below Replacement)`;
}
