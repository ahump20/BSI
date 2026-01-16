/**
 * Sports Data API Type Definitions
 *
 * Centralized types for external sports data APIs:
 * - SportsDataIO (NFL, MLB, NBA, NCAA Basketball)
 * - CollegeFootballData API (NCAA Football)
 * - TheOddsAPI (Betting odds)
 *
 * Extracted from real-sports-data-integration.ts
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface RealSportsConfig {
  sportsDataIOKey: string;
  collegeFBDataKey: string;
  theOddsAPIKey: string;
}

// ============================================================================
// DOMAIN MODEL TYPES (BSI Standard Format)
// ============================================================================

export interface LiveGame {
  id: string;
  sport: 'football' | 'baseball' | 'basketball';
  homeTeam: {
    id: string;
    name: string;
    score: number;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
    logo?: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
  quarter?: string;
  timeRemaining?: string;
  venue?: string;
  date: string;
  // College football specific fields
  homeWinProb?: number;
  awayWinProb?: number;
  excitement?: number;
  possession?: 'home' | 'away';
  situation?: {
    down?: number;
    distance?: number;
    yardLine?: number;
    yardsToGoal?: number;
  };
}

export interface CFBGame {
  id: number;
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason';
  startDate: string;
  homeTeam: string;
  homeConference?: string;
  homeScore?: number;
  awayTeam: string;
  awayConference?: string;
  awayScore?: number;
  venue?: string;
  venueId?: number;
  homeId: number;
  awayId: number;
  completed: boolean;
  neutralSite?: boolean;
  conferenceGame?: boolean;
  attendance?: number;
  highlights?: string;
  notes?: string;
}

export interface CFBTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  altName?: string;
  conference: string;
  division: string;
  classification: string;
  color: string;
  altColor: string;
  logos: string[];
  location: {
    venueId: number;
    name: string;
    city: string;
    state: string;
    zip: string;
    countryCode: string;
    timezone: string;
    latitude: number;
    longitude: number;
    elevation: number;
    capacity: number;
    yearConstructed: number;
    grass: boolean;
    dome: boolean;
  };
}

export interface CFBTeamStats {
  team: string;
  conference?: string;
  season: number;
  games: number;
  stats: {
    category: string;
    stat: number;
  }[];
}

export interface CFBPlayByPlay {
  id: string;
  gameId: number;
  driveId: number;
  playNumber: number;
  period: number;
  clock: {
    minutes: number;
    seconds: number;
  };
  offense: string;
  offenseConference?: string;
  defense: string;
  defenseConference?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  yardsToGoal?: number;
  yardsGained?: number;
  playType: string;
  playText: string;
  ppa?: number;
  scoring: boolean;
  homeScore: number;
  awayScore: number;
  wallclock?: string;
}

export interface CFBPlayerStats {
  season: number;
  team: string;
  conference?: string;
  player: string;
  playerId: number;
  category: string;
  statType: string;
  stat: number;
}

export interface TeamRanking {
  rank: number;
  team: string;
  school: string;
  city: string;
  state: string;
  region: string;
  classification: string;
  record: string;
  wins: number;
  losses: number;
  winPct: number;
  rating: number;
  trend: number;
  lastGame?: {
    opponent: string;
    result: string;
    score: string;
    date: string;
  };
}

// ============================================================================
// EXTERNAL API RESPONSE TYPES
// ============================================================================

/**
 * CollegeFootballData API Response Types
 */
export interface CFBRankingsResponse {
  season: number;
  seasonType: string;
  week: number;
  polls: CFBPoll[];
}

export interface CFBPoll {
  poll: string;
  ranks: CFBRank[];
}

export interface CFBRank {
  rank: number;
  school: string;
  conference?: string;
  firstPlaceVotes?: number;
  points?: number;
  wins?: number;
  losses?: number;
}

/**
 * SportsDataIO MLB API Response Types
 */
export interface SportsDataMLBGame {
  GameID: number;
  Season: number;
  SeasonType: number;
  Status: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayTeamRuns?: number;
  HomeTeamRuns?: number;
  Inning?: number;
  InningHalf?: string;
  Stadium?: string;
  Updated?: string;
}

/**
 * SportsDataIO NFL API Response Types
 */
export interface SportsDataNFLGame {
  ScoreID: number;
  Season: number;
  SeasonType: number;
  Week: number;
  Status: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: number;
  TimeRemaining?: string;
  Stadium?: string;
  Updated?: string;
}

/**
 * SportsDataIO NBA API Response Types
 */
export interface SportsDataNBAGame {
  GameID: number;
  Season: number;
  SeasonType: number;
  Status: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Quarter?: string;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
  Stadium?: string;
  Updated?: string;
}

/**
 * Cache Entry Type
 */
export interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}
