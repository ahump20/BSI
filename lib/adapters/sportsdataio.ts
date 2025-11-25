/**
 * SportsDataIO Adapter
 * Comprehensive adapter for SportsDataIO API endpoints
 * Handles MLB, NFL, NBA, NCAA Football with complete data normalization
 *
 * API Documentation: https://sportsdata.io/developers/api-documentation
 *
 * Features:
 * - Real-time scores and live game data
 * - Comprehensive standings and team statistics
 * - Player performance metrics and leaderboards
 * - Schedule and game results
 * - Injury reports and transactions
 */

import { sportsDataClient, ApiResponse } from '../api/sports-data-client';
import { DateTime } from 'luxon';

// ============================================================================
// Type Definitions - SportsDataIO Response Schemas
// ============================================================================

// MLB Types
export interface MLBTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  League: string;
  Division: string;
  Active: boolean;
  GlobalTeamID: number;
  WikipediaLogoUrl?: string;
  WikipediaWordMarkUrl?: string;
}

export interface MLBStanding {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  Percentage: number;
  DivisionWins: number;
  DivisionLosses: number;
  WildCardRank: number;
  League: string;
  Division: string;
  HomeWins: number;
  HomeLosses: number;
  AwayWins: number;
  AwayLosses: number;
  DayWins: number;
  DayLosses: number;
  NightWins: number;
  NightLosses: number;
  LastTenWins: number;
  LastTenLosses: number;
  Streak: number;
  GlobalTeamID: number;
}

export interface MLBGame {
  GameID: number;
  Season: number;
  SeasonType: number;
  Status: string;
  Day: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayTeamRuns?: number;
  HomeTeamRuns?: number;
  Inning?: number;
  InningHalf?: string;
  GameEndDateTime?: string;
  Channel?: string;
  Attendance?: number;
  Updated: string;
}

export interface MLBPlayer {
  PlayerID: number;
  Status: string;
  TeamID: number;
  Team: string;
  Jersey?: number;
  FirstName: string;
  LastName: string;
  Position: string;
  BatHand: string;
  ThrowHand: string;
  BirthCity?: string;
  BirthState?: string;
  BirthCountry?: string;
  Updated: string;
  GlobalTeamID: number;
}

// NFL Types
export interface NFLTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  Conference: string;
  Division: string;
  FullName: string;
  Active: boolean;
  WikipediaLogoUrl?: string;
  WikipediaWordMarkUrl?: string;
  GlobalTeamID: number;
}

export interface NFLStanding {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  Ties: number;
  Percentage: number;
  PointsFor: number;
  PointsAgainst: number;
  NetPoints: number;
  ConferenceWins: number;
  ConferenceLosses: number;
  ConferenceTies: number;
  DivisionWins: number;
  DivisionLosses: number;
  DivisionTies: number;
  Conference: string;
  Division: string;
  HomeWins: number;
  HomeLosses: number;
  HomeTies: number;
  AwayWins: number;
  AwayLosses: number;
  AwayTies: number;
  Streak: number;
  GlobalTeamID: number;
}

export interface NFLGame {
  GameKey: string;
  Season: number;
  SeasonType: number;
  Week: number;
  Date: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  Status: string;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: string;
  TimeRemaining?: string;
  Channel?: string;
  StadiumID?: number;
  Updated: string;
}

export interface NFLPlayer {
  PlayerID: number;
  Team: string;
  Number: number;
  FirstName: string;
  LastName: string;
  Position: string;
  Status: string;
  Height?: string;
  Weight?: number;
  BirthDate?: string;
  College?: string;
  Experience?: number;
  PhotoUrl?: string;
  Active: boolean;
  Updated: string;
}

// NBA Types
export interface NBATeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  Conference: string;
  Division: string;
  Active: boolean;
  WikipediaLogoUrl?: string;
  WikipediaWordMarkUrl?: string;
  GlobalTeamID: number;
}

export interface NBAStanding {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  Percentage: number;
  ConferenceWins: number;
  ConferenceLosses: number;
  DivisionWins: number;
  DivisionLosses: number;
  Conference: string;
  Division: string;
  HomeWins: number;
  HomeLosses: number;
  AwayWins: number;
  AwayLosses: number;
  LastTenWins: number;
  LastTenLosses: number;
  Streak: number;
  GamesBack?: number;
  PointsPerGameFor: number;
  PointsPerGameAgainst: number;
  GlobalTeamID: number;
}

export interface NBAGame {
  GameID: number;
  Season: number;
  SeasonType: number;
  Status: string;
  Day: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Quarter?: string;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
  Updated: string;
  Channel?: string;
  Attendance?: number;
}

export interface NBAPlayer {
  PlayerID: number;
  Status: string;
  TeamID: number;
  Team: string;
  Jersey?: number;
  FirstName: string;
  LastName: string;
  Position: string;
  Height?: number;
  Weight?: number;
  BirthCity?: string;
  BirthState?: string;
  BirthCountry?: string;
  BirthDate?: string;
  College?: string;
  PhotoUrl?: string;
  Experience?: number;
  GlobalTeamID: number;
}

// NCAA Football Types
export interface NCAAFTeam {
  TeamID: number;
  Key: string;
  School: string;
  Name: string;
  Conference: string;
  TeamLogoUrl?: string;
  Active: boolean;
  GlobalTeamID: number;
}

export interface NCAAFStanding {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  ConferenceWins: number;
  ConferenceLosses: number;
  Conference: string;
  Division?: string;
  Rank?: number;
  Wins: number;
  Losses: number;
  GlobalTeamID: number;
}

export interface NCAAFGame {
  GameID: number;
  Season: number;
  Week: number;
  Status: string;
  Day: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Period?: string;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
  Updated: string;
  Channel?: string;
  StadiumID?: number;
}

// ============================================================================
// SportsDataIO Adapter Class
// ============================================================================

export class SportsDataIOAdapter {
  private readonly baseUrl = 'https://api.sportsdata.io/v3';
  private readonly provider = 'sportsdataio';

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('SportsDataIO API key is required');
    }
  }

  /**
   * Build full endpoint URL with API key
   */
  private buildUrl(sport: string, endpoint: string): string {
    return `/${sport}${endpoint}?key=${this.apiKey}`;
  }

  /**
   * Get current season based on sport and date
   */
  private getCurrentSeason(sport: 'mlb' | 'nfl' | 'nba' | 'ncaafb'): number {
    const now = DateTime.now().setZone('America/Chicago');
    const year = now.year;
    const month = now.month;

    switch (sport) {
      case 'mlb':
        // MLB season runs March-October
        return month >= 3 && month <= 10 ? year : year - 1;

      case 'nfl':
        // NFL season runs September-February
        return month >= 9 ? year : year - 1;

      case 'nba':
        // NBA season runs October-June
        return month >= 10 ? year : year - 1;

      case 'ncaafb':
        // College Football runs August-January
        return month >= 8 ? year : year - 1;

      default:
        return year;
    }
  }

  // ============================================================================
  // MLB Methods
  // ============================================================================

  async getMLBTeams(): Promise<ApiResponse<MLBTeam[]>> {
    return sportsDataClient.fetch<MLBTeam[]>(
      this.provider,
      this.buildUrl('mlb/scores', '/json/teams'),
      { customTTL: 86400 } // Teams rarely change - 24 hours
    );
  }

  async getMLBStandings(season?: number): Promise<ApiResponse<MLBStanding[]>> {
    const year = season || this.getCurrentSeason('mlb');
    return sportsDataClient.fetch<MLBStanding[]>(
      this.provider,
      this.buildUrl('mlb/scores', `/json/Standings/${year}`),
      { customTTL: 300 } // 5 minutes
    );
  }

  async getMLBScores(date?: string): Promise<ApiResponse<MLBGame[]>> {
    // Format: YYYY-MMM-DD (e.g., 2025-NOV-13)
    const targetDate =
      date || DateTime.now().setZone('America/Chicago').toFormat('yyyy-MMM-dd').toUpperCase();
    return sportsDataClient.fetch<MLBGame[]>(
      this.provider,
      this.buildUrl('mlb/scores', `/json/GamesByDate/${targetDate}`),
      { customTTL: 30 } // 30 seconds for live games
    );
  }

  async getMLBTeamRoster(teamKey: string): Promise<ApiResponse<MLBPlayer[]>> {
    return sportsDataClient.fetch<MLBPlayer[]>(
      this.provider,
      this.buildUrl('mlb/scores', `/json/Players/${teamKey}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  async getMLBSchedule(season?: number): Promise<ApiResponse<MLBGame[]>> {
    const year = season || this.getCurrentSeason('mlb');
    return sportsDataClient.fetch<MLBGame[]>(
      this.provider,
      this.buildUrl('mlb/scores', `/json/Games/${year}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  // ============================================================================
  // NFL Methods
  // ============================================================================

  async getNFLTeams(): Promise<ApiResponse<NFLTeam[]>> {
    return sportsDataClient.fetch<NFLTeam[]>(
      this.provider,
      this.buildUrl('nfl/scores', '/json/Teams'),
      { customTTL: 86400 } // 24 hours
    );
  }

  async getNFLStandings(season?: number): Promise<ApiResponse<NFLStanding[]>> {
    const year = season || this.getCurrentSeason('nfl');
    return sportsDataClient.fetch<NFLStanding[]>(
      this.provider,
      this.buildUrl('nfl/scores', `/json/Standings/${year}`),
      { customTTL: 300 } // 5 minutes
    );
  }

  async getNFLScores(season?: number, week?: number): Promise<ApiResponse<NFLGame[]>> {
    const year = season || this.getCurrentSeason('nfl');
    const weekNum = week || this.getCurrentNFLWeek();
    return sportsDataClient.fetch<NFLGame[]>(
      this.provider,
      this.buildUrl('nfl/scores', `/json/ScoresByWeek/${year}/${weekNum}`),
      { customTTL: 30 } // 30 seconds for live games
    );
  }

  async getNFLTeamRoster(teamKey: string): Promise<ApiResponse<NFLPlayer[]>> {
    const season = this.getCurrentSeason('nfl');
    return sportsDataClient.fetch<NFLPlayer[]>(
      this.provider,
      this.buildUrl('nfl/scores', `/json/Players/${teamKey}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  async getNFLSchedule(season?: number): Promise<ApiResponse<NFLGame[]>> {
    const year = season || this.getCurrentSeason('nfl');
    return sportsDataClient.fetch<NFLGame[]>(
      this.provider,
      this.buildUrl('nfl/scores', `/json/Schedules/${year}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  private getCurrentNFLWeek(): number {
    // Simple estimation - Sept 1 = Week 1, add ~7 days per week
    const now = DateTime.now().setZone('America/Chicago');
    const seasonStart = DateTime.fromObject(
      { year: now.year, month: 9, day: 1 },
      { zone: 'America/Chicago' }
    );

    if (now < seasonStart) {
      return 1; // Preseason/before season
    }

    const daysSinceStart = now.diff(seasonStart, 'days').days;
    const week = Math.floor(daysSinceStart / 7) + 1;
    return Math.min(week, 18); // NFL regular season is 18 weeks
  }

  // ============================================================================
  // NBA Methods
  // ============================================================================

  async getNBATeams(): Promise<ApiResponse<NBATeam[]>> {
    return sportsDataClient.fetch<NBATeam[]>(
      this.provider,
      this.buildUrl('nba/scores', '/json/teams'),
      { customTTL: 86400 } // 24 hours
    );
  }

  async getNBAStandings(season?: string): Promise<ApiResponse<NBAStanding[]>> {
    const year = season || this.getCurrentSeason('nba').toString();
    return sportsDataClient.fetch<NBAStanding[]>(
      this.provider,
      this.buildUrl('nba/scores', `/json/Standings/${year}`),
      { customTTL: 300 } // 5 minutes
    );
  }

  async getNBAScores(date?: string): Promise<ApiResponse<NBAGame[]>> {
    // Format: YYYY-MMM-DD
    const targetDate =
      date || DateTime.now().setZone('America/Chicago').toFormat('yyyy-MMM-dd').toUpperCase();
    return sportsDataClient.fetch<NBAGame[]>(
      this.provider,
      this.buildUrl('nba/scores', `/json/GamesByDate/${targetDate}`),
      { customTTL: 30 } // 30 seconds for live games
    );
  }

  async getNBATeamRoster(teamKey: string): Promise<ApiResponse<NBAPlayer[]>> {
    return sportsDataClient.fetch<NBAPlayer[]>(
      this.provider,
      this.buildUrl('nba/scores', `/json/Players/${teamKey}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  async getNBASchedule(season?: string): Promise<ApiResponse<NBAGame[]>> {
    const year = season || this.getCurrentSeason('nba').toString();
    return sportsDataClient.fetch<NBAGame[]>(
      this.provider,
      this.buildUrl('nba/scores', `/json/Games/${year}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  // ============================================================================
  // NCAA Football Methods
  // ============================================================================

  async getNCAAFTeams(): Promise<ApiResponse<NCAAFTeam[]>> {
    return sportsDataClient.fetch<NCAAFTeam[]>(
      this.provider,
      this.buildUrl('cfb/scores', '/json/Teams'),
      { customTTL: 86400 } // 24 hours
    );
  }

  async getNCAAFStandings(season?: number): Promise<ApiResponse<NCAAFStanding[]>> {
    const year = season || this.getCurrentSeason('ncaafb');
    return sportsDataClient.fetch<NCAAFStanding[]>(
      this.provider,
      this.buildUrl('cfb/scores', `/json/Standings/${year}`),
      { customTTL: 300 } // 5 minutes
    );
  }

  async getNCAAFScores(season?: number, week?: number): Promise<ApiResponse<NCAAFGame[]>> {
    const year = season || this.getCurrentSeason('ncaafb');
    const weekNum = week || this.getCurrentNCAAFWeek();
    return sportsDataClient.fetch<NCAAFGame[]>(
      this.provider,
      this.buildUrl('cfb/scores', `/json/GamesByWeek/${year}/${weekNum}`),
      { customTTL: 30 } // 30 seconds for live games
    );
  }

  async getNCAAFSchedule(season?: number): Promise<ApiResponse<NCAAFGame[]>> {
    const year = season || this.getCurrentSeason('ncaafb');
    return sportsDataClient.fetch<NCAAFGame[]>(
      this.provider,
      this.buildUrl('cfb/scores', `/json/Games/${year}`),
      { customTTL: 3600 } // 1 hour
    );
  }

  private getCurrentNCAAFWeek(): number {
    // College football season starts late August
    const now = DateTime.now().setZone('America/Chicago');
    const seasonStart = DateTime.fromObject(
      { year: now.year, month: 8, day: 25 },
      { zone: 'America/Chicago' }
    );

    if (now < seasonStart) {
      return 1;
    }

    const daysSinceStart = now.diff(seasonStart, 'days').days;
    const week = Math.floor(daysSinceStart / 7) + 1;
    return Math.min(week, 15); // CFB regular season ~13-15 weeks
  }
}

// ============================================================================
// Singleton Export with Environment API Key
// ============================================================================

/**
 * Create adapter instance from environment variable
 * This should be called in Cloudflare Functions where env is available
 */
export function createSportsDataIOAdapter(apiKey: string): SportsDataIOAdapter {
  return new SportsDataIOAdapter(apiKey);
}

/**
 * Server-side only - uses process.env
 * For Cloudflare Functions, use createSportsDataIOAdapter(env.SPORTSDATAIO_API_KEY)
 */
export const sportsDataIO =
  typeof process !== 'undefined' && process.env?.SPORTSDATAIO_API_KEY
    ? new SportsDataIOAdapter(process.env.SPORTSDATAIO_API_KEY)
    : null;
