/**
 * ESPN API Type Definitions
 *
 * Centralized types for ESPN API integration across all sports.
 * Extracted from espn-unified-adapter.ts to eliminate duplication.
 *
 * Base URLs:
 * - site.api.espn.com/apis/site/v2/sports/ - General site data
 * - sports.core.api.espn.com/v2/ - Core sports data
 * - site.web.api.espn.com/apis/ - Web-specific APIs
 *
 * @see https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ESPNSportKey =
  | 'ncaaf'
  | 'ncaab'
  | 'wcbb'
  | 'nfl'
  | 'nba'
  | 'wnba'
  | 'mlb'
  | 'cbb'
  | 'nhl';

export type ESPNGameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' | 'DELAYED';

export type ESPNFeedPrecision = 'EVENT' | 'PLAY';

// ============================================================================
// GAME TYPES
// ============================================================================

export interface ESPNGame {
  id: string;
  scheduledAt: string;
  status: ESPNGameStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamAbbrev: string;
  awayTeamAbbrev: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  homeRanking?: number;
  awayRanking?: number;
  venue?: string;
  venueCity?: string;
  broadcast?: string;
  conference?: string;
  isConferenceGame?: boolean;
  providerName: 'ESPN';
  feedPrecision: ESPNFeedPrecision;
  // Sport-specific fields
  sportData?:
    | ESPNFootballGameData
    | ESPNBasketballGameData
    | ESPNBaseballGameData
    | ESPNHockeyGameData;
}

// ============================================================================
// SPORT-SPECIFIC GAME DATA
// ============================================================================

export interface ESPNFootballGameData {
  sport: 'football';
  quarter?: number;
  timeRemaining?: string;
  possession?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  redZone?: boolean;
  homeTimeouts?: number;
  awayTimeouts?: number;
}

export interface ESPNBasketballGameData {
  sport: 'basketball';
  period?: number;
  timeRemaining?: string;
  homeFouls?: number;
  awayFouls?: number;
  possession?: string;
}

export interface ESPNBaseballGameData {
  sport: 'baseball';
  inning?: number;
  inningHalf?: 'TOP' | 'BOTTOM';
  outs?: number;
  balls?: number;
  strikes?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
}

export interface ESPNHockeyGameData {
  sport: 'hockey';
  period?: number;
  timeRemaining?: string;
  homePowerPlay?: boolean;
  awayPowerPlay?: boolean;
  homeSOG?: number; // Shots on goal
  awaySOG?: number;
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export interface ESPNTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  shortDisplayName: string;
  nickname?: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  conference?: string;
  division?: string;
  record?: string;
  ranking?: number;
}

// ============================================================================
// RANKING TYPES
// ============================================================================

export type ESPNRankingTrend = 'up' | 'down' | 'same' | 'new';

export interface ESPNRanking {
  rank: number;
  team: string;
  teamId: string;
  conference: string;
  record: string;
  points?: number;
  firstPlaceVotes?: number;
  previousRank?: number;
  trend: ESPNRankingTrend;
}

export interface ESPNRankingPoll {
  poll: string;
  week: number;
  season: number;
  rankings: ESPNRanking[];
  lastUpdated: string;
}

// ============================================================================
// GAME SUMMARY TYPES (will be properly typed later)
// ============================================================================

export interface ESPNGameSummary {
  game: ESPNGame;
  boxscore?: unknown; // TODO: Type this properly
  leaders?: unknown; // TODO: Type this properly
  drives?: unknown; // TODO: Type this properly
  plays?: unknown[]; // TODO: Type this properly
  winProbability?: number[];
}

// ============================================================================
// OPTIONS TYPES
// ============================================================================

export interface ESPNScoreboardOptions {
  date?: string; // YYYYMMDD format
  week?: number;
  conference?: string;
  seasonType?: number; // 1=pre, 2=regular, 3=post, 4=off
  limit?: number;
}

// ============================================================================
// SPORT CONFIGURATION
// ============================================================================

export interface ESPNSportConfig {
  sport: string;
  league: string;
  groups?: number; // For conference filtering
  hasWeeks?: boolean;
  hasRankings?: boolean;
}

export const ESPN_SPORT_CONFIG: Record<ESPNSportKey, ESPNSportConfig> = {
  ncaaf: {
    sport: 'football',
    league: 'college-football',
    groups: 80,
    hasWeeks: true,
    hasRankings: true,
  },
  ncaab: {
    sport: 'basketball',
    league: 'mens-college-basketball',
    hasRankings: true,
  },
  wcbb: {
    sport: 'basketball',
    league: 'womens-college-basketball',
    hasRankings: true,
  },
  nfl: {
    sport: 'football',
    league: 'nfl',
    hasWeeks: true,
  },
  nba: {
    sport: 'basketball',
    league: 'nba',
  },
  wnba: {
    sport: 'basketball',
    league: 'wnba',
  },
  mlb: {
    sport: 'baseball',
    league: 'mlb',
  },
  cbb: {
    sport: 'baseball',
    league: 'college-baseball',
  },
  nhl: {
    sport: 'hockey',
    league: 'nhl',
  },
};

// ============================================================================
// CONFERENCE CONFIGURATION
// ============================================================================

export const ESPN_CFB_CONFERENCES: Record<string, number> = {
  SEC: 8,
  'Big Ten': 5,
  'Big 12': 4,
  ACC: 1,
  'Pac-12': 9,
  American: 151,
  'Mountain West': 17,
  'Sun Belt': 37,
  MAC: 15,
  'Conference USA': 12,
};
