/**
 * Shared Adapter Types
 *
 * Consolidated type definitions for all data adapters.
 * Provides a unified interface across ESPN, NCAA, SportsDataIO, and other providers.
 *
 * This module centralizes types to ensure consistency and reduce duplication
 * across the adapter layer.
 */

// ============================================================================
// SPORT IDENTIFIERS
// ============================================================================

/**
 * Unified sport keys used across all adapters
 */
export type UnifiedSportKey =
  | 'ncaaf' // College Football
  | 'ncaab' // College Basketball (Men's)
  | 'wcbb' // Women's College Basketball
  | 'nfl' // NFL
  | 'nba' // NBA
  | 'wnba' // WNBA
  | 'mlb' // MLB
  | 'cbb' // College Baseball
  | 'nhl'; // NHL

/**
 * College-specific sports
 */
export type CollegeSportKey = 'ncaaf' | 'ncaab' | 'wcbb' | 'cbb';

/**
 * Professional sports
 */
export type ProSportKey = 'nfl' | 'nba' | 'wnba' | 'mlb' | 'nhl';

/**
 * NCAA division types
 */
export type NCAADivision = 'd1' | 'd2' | 'd3' | 'fbs' | 'fcs';

// ============================================================================
// GAME STATUS
// ============================================================================

/**
 * Unified game status
 */
export type UnifiedGameStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINAL'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'DELAYED';

/**
 * Map provider-specific statuses to unified status
 */
export function normalizeGameStatus(status: string): UnifiedGameStatus {
  const normalized = status.toLowerCase();

  if (normalized.includes('final') || normalized === 'f') return 'FINAL';
  if (
    normalized.includes('live') ||
    normalized.includes('progress') ||
    normalized.includes('in_progress')
  )
    return 'LIVE';
  if (normalized.includes('postponed')) return 'POSTPONED';
  if (normalized.includes('cancel')) return 'CANCELLED';
  if (normalized.includes('delay')) return 'DELAYED';

  return 'SCHEDULED';
}

// ============================================================================
// UNIFIED TEAM TYPE
// ============================================================================

export interface UnifiedTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  shortName?: string;
  nickname?: string;
  location?: string;
  conference?: string;
  division?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  record?: TeamRecord;
  ranking?: number;
}

export interface TeamRecord {
  overall: string; // "45-12"
  conference?: string; // "18-6"
  wins: number;
  losses: number;
  ties?: number;
  winPct?: number;
}

// ============================================================================
// UNIFIED GAME TYPE
// ============================================================================

export interface UnifiedGame {
  // Identifiers
  id: string;
  sport: UnifiedSportKey;

  // Timing
  scheduledAt: string; // ISO 8601
  status: UnifiedGameStatus;

  // Teams
  homeTeam: UnifiedTeam;
  awayTeam: UnifiedTeam;

  // Scores
  homeScore: number | null;
  awayScore: number | null;

  // Rankings (for college sports)
  homeRanking?: number;
  awayRanking?: number;

  // Venue
  venue?: string;
  venueCity?: string;
  venueState?: string;
  neutralSite?: boolean;

  // Broadcast
  broadcast?: string;
  broadcastNetwork?: string;

  // Game context
  conference?: string;
  isConferenceGame?: boolean;
  week?: number;
  postseason?: boolean;
  seasonType?: 'preseason' | 'regular' | 'postseason';

  // Provider metadata
  provider: string;
  providerGameId?: string;
  fetchedAt: string;

  // Sport-specific data
  sportData?: BaseballGameData | FootballGameData | BasketballGameData | HockeyGameData;
}

// ============================================================================
// SPORT-SPECIFIC GAME DATA
// ============================================================================

export interface BaseballGameData {
  sport: 'baseball';
  inning?: number;
  inningHalf?: 'TOP' | 'BOTTOM';
  outs?: number;
  balls?: number;
  strikes?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  linescore?: InningScore[];
}

export interface InningScore {
  inning: number;
  home: number;
  away: number;
}

export interface FootballGameData {
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

export interface BasketballGameData {
  sport: 'basketball';
  period?: number;
  timeRemaining?: string;
  homeFouls?: number;
  awayFouls?: number;
  possession?: string;
  bonus?: boolean;
}

export interface HockeyGameData {
  sport: 'hockey';
  period?: number;
  timeRemaining?: string;
  homePowerPlay?: boolean;
  awayPowerPlay?: boolean;
  homeSOG?: number;
  awaySOG?: number;
}

// ============================================================================
// UNIFIED PLAYER TYPE
// ============================================================================

export interface UnifiedPlayer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  jersey?: string;
  position?: PlayerPosition;
  height?: string;
  weight?: number;
  age?: number;
  dateOfBirth?: string;
  birthplace?: {
    city?: string;
    state?: string;
    country?: string;
  };
  experience?: {
    years: number;
    displayValue: string;
  };
  team?: UnifiedTeam;
  headshot?: string;
  active: boolean;
}

export interface PlayerPosition {
  id?: string;
  name: string;
  abbreviation: string;
  displayName?: string;
}

// ============================================================================
// UNIFIED STANDINGS TYPE
// ============================================================================

export interface UnifiedStandings {
  sport: UnifiedSportKey;
  season: number;
  conference: string;
  division?: string;
  teams: StandingsTeam[];
  lastUpdated: string;
}

export interface StandingsTeam extends UnifiedTeam {
  rank: number;
  conferenceRank?: number;
  overallRecord: string;
  conferenceRecord: string;
  streak?: string;
  lastTen?: string;
  homeRecord?: string;
  awayRecord?: string;
  pointsFor?: number;
  pointsAgainst?: number;
  pointDifferential?: number;
  winPct: number;
  gamesBack?: number;
}

// ============================================================================
// UNIFIED RANKINGS TYPE
// ============================================================================

export interface UnifiedRankingPoll {
  poll: string;
  sport: UnifiedSportKey;
  week: number;
  season: number;
  rankings: RankedTeam[];
  lastUpdated: string;
}

export interface RankedTeam {
  rank: number;
  team: UnifiedTeam;
  record: string;
  previousRank?: number;
  trend: 'up' | 'down' | 'same' | 'new';
  points?: number;
  firstPlaceVotes?: number;
}

// ============================================================================
// BOX SCORE TYPES
// ============================================================================

export interface UnifiedBoxScore {
  gameId: string;
  sport: UnifiedSportKey;
  game: UnifiedGame;
  homeStats: TeamBoxStats;
  awayStats: TeamBoxStats;
  scoring: ScoringSummary[];
  leaders?: GameLeaders;
}

export interface TeamBoxStats {
  team: UnifiedTeam;
  score: number;
  stats: Record<string, string | number>;
  players: PlayerBoxStats[];
}

export interface PlayerBoxStats {
  player: UnifiedPlayer;
  stats: Record<string, string | number>;
  starter?: boolean;
}

export interface ScoringSummary {
  period: string | number;
  home: number;
  away: number;
  description?: string;
}

export interface GameLeaders {
  home: LeaderCategory[];
  away: LeaderCategory[];
}

export interface LeaderCategory {
  category: string;
  leaders: Array<{
    player: string;
    value: string;
    position?: string;
  }>;
}

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

export interface ProviderConfig {
  name: string;
  priority: number;
  sports: UnifiedSportKey[];
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  dailyLimit?: number;
  requiresApiKey?: boolean;
}

export interface ProviderHealth {
  name: string;
  isHealthy: boolean;
  failures: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  circuitOpen: boolean;
  requestsToday: number;
  dailyLimit: number;
}

// ============================================================================
// ADAPTER RESPONSE TYPES
// ============================================================================

export interface AdapterResponse<T> {
  data: T;
  provider: string;
  fetchedAt: string;
  cached: boolean;
  cacheKey?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// FETCH OPTIONS
// ============================================================================

export interface FetchOptions {
  date?: string; // YYYYMMDD format
  week?: number;
  season?: number;
  conference?: string;
  teamId?: string;
  division?: NCAADivision;
  preferredProvider?: string;
  forceRefresh?: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isCollegeSport(sport: UnifiedSportKey): sport is CollegeSportKey {
  return ['ncaaf', 'ncaab', 'wcbb', 'cbb'].includes(sport);
}

export function isProSport(sport: UnifiedSportKey): sport is ProSportKey {
  return ['nfl', 'nba', 'wnba', 'mlb', 'nhl'].includes(sport);
}

export function isBaseballGame(
  game: UnifiedGame
): game is UnifiedGame & { sportData: BaseballGameData } {
  return game.sport === 'cbb' || game.sport === 'mlb';
}

export function isFootballGame(
  game: UnifiedGame
): game is UnifiedGame & { sportData: FootballGameData } {
  return game.sport === 'ncaaf' || game.sport === 'nfl';
}

export function isBasketballGame(
  game: UnifiedGame
): game is UnifiedGame & { sportData: BasketballGameData } {
  return ['ncaab', 'wcbb', 'nba', 'wnba'].includes(game.sport);
}

export function isHockeyGame(
  game: UnifiedGame
): game is UnifiedGame & { sportData: HockeyGameData } {
  return game.sport === 'nhl';
}

// ============================================================================
// SPORT METADATA
// ============================================================================

// ============================================================================
// PLAY-BY-PLAY TYPES
// ============================================================================

export type PlayFilter = 'all' | 'scoring' | 'key';

export interface NormalizedPlay {
  playId: string;
  gameId: string;
  period: number | string;
  gameTime: string; // "3:45" or "Top 6th"
  description: string;
  team?: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  scoreAfter: { home: number; away: number };
  isScoring: boolean;
  isKeyPlay: boolean; // High leverage, turnover, big gain
  leverageIndex?: number;
  winProbDelta?: number;
  videoUrl?: string; // If highlight clip available
  players: PlayPlayer[];
  statData?: BaseballPlayData | FootballPlayData | BasketballPlayData;
}

export interface PlayPlayer {
  playerId: string;
  name: string;
  role: string; // "batter", "pitcher", "passer", "receiver", etc.
}

export interface BaseballPlayData {
  pitchType?: string;
  pitchSpeed?: number;
  exitVelocity?: number;
  launchAngle?: number;
  hitDistance?: number;
  sprintSpeed?: number;
  catchProbability?: number;
}

export interface FootballPlayData {
  yardsGained?: number;
  epa?: number; // Expected Points Added
  isFirstDown?: boolean;
  isTurnover?: boolean;
  playType?: 'pass' | 'rush' | 'punt' | 'kickoff' | 'field_goal';
}

export interface BasketballPlayData {
  shotType?: string;
  shotDistance?: number;
  isFastBreak?: boolean;
  assistedBy?: string;
}

export interface PlayByPlaySection {
  label: string; // "1st Quarter", "Top 5th", etc.
  period: number | string;
  plays: NormalizedPlay[];
  isExpanded: boolean;
}

// ============================================================================
// VIDEO HIGHLIGHT TYPES
// ============================================================================

export type VideoSource = 'ESPN' | 'YOUTUBE' | 'CLOUDFLARE_STREAM' | 'MLB' | 'FALLBACK';

export interface VideoHighlight {
  id: string;
  gameId?: string; // Links to specific game
  title: string;
  description?: string;
  duration: number; // Seconds
  thumbnailUrl: string;
  videoUrl: string; // Embed URL or stream ID
  source: VideoSource;
  sport: UnifiedSportKey;
  publishedAt: string;
  playType?:
    | 'HOME_RUN'
    | 'TD_PASS'
    | 'TD_RUN'
    | 'STRIKEOUT'
    | 'CATCH'
    | 'DUNK'
    | 'THREE_POINTER'
    | 'SACK'
    | 'INTERCEPTION'
    | 'GENERAL';
  teams?: {
    home: { name: string; abbreviation: string };
    away: { name: string; abbreviation: string };
  };
  featured?: boolean;
}

export interface VideoFetchResult {
  videos: VideoHighlight[];
  source: VideoSource;
  fetchedAt: string;
  fallbackUsed: boolean;
}

// ============================================================================
// HEADLINE TYPES
// ============================================================================

export type HeadlineSource =
  | 'ESPN'
  | 'MLB_COM'
  | 'BASEBALL_AMERICA'
  | 'D1BASEBALL'
  | 'PERFECT_GAME'
  | 'BLEACHER_REPORT'
  | 'AP';

export type HeadlineCategory =
  | 'BREAKING'
  | 'INJURY'
  | 'TRADE'
  | 'SCORE'
  | 'ANALYSIS'
  | 'PREVIEW'
  | 'RECAP'
  | 'GENERAL';

export interface Headline {
  id: string;
  title: string;
  description?: string;
  source: HeadlineSource;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  sport: UnifiedSportKey | 'ALL';
  category: HeadlineCategory;
  breaking?: boolean;
  teams?: string[]; // Team abbreviations mentioned
}

export interface HeadlinesFeedResult {
  headlines: Headline[];
  fetchedAt: string;
  sources: HeadlineSource[];
  nextRefresh: string; // ISO timestamp
}

// ============================================================================
// SPORT-SPECIFIC PLAYER BOX STATS
// ============================================================================

export interface BaseballBattingStats {
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: string;
  doubles?: number;
  triples?: number;
  hr?: number;
  sb?: number;
  cs?: number;
  hbp?: number;
  sac?: number;
  lob?: number;
}

export interface BaseballPitchingStats {
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  era: string;
  pitches?: number;
  strikes?: number;
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS';
  hr?: number;
  hbp?: number;
  wp?: number;
  bk?: number;
}

export interface FootballPassingStats {
  comp: number;
  att: number;
  yds: number;
  td: number;
  int: number;
  qbr?: number;
  sacks?: number;
  sackYards?: number;
  long?: number;
}

export interface FootballRushingStats {
  car: number;
  yds: number;
  avg: string;
  td: number;
  long: number;
  fumbles?: number;
}

export interface FootballReceivingStats {
  rec: number;
  yds: number;
  avg: string;
  td: number;
  long: number;
  targets?: number;
}

export interface FootballDefenseStats {
  tackles: number;
  soloTackles?: number;
  sacks: number;
  tacklesForLoss?: number;
  int: number;
  passDefended?: number;
  ff: number; // Forced fumbles
  fr?: number; // Fumble recoveries
  qbHits?: number;
}

export interface BasketballPlayerStats {
  minutes: string;
  pts: number;
  reb: number;
  oreb?: number;
  dreb?: number;
  ast: number;
  stl: number;
  blk: number;
  to?: number;
  fg: string; // "5-10"
  fgPct?: string;
  threeP: string; // "2-4"
  threePct?: string;
  ft: string; // "3-3"
  ftPct?: string;
  plusMinus: number;
  fouls: number;
}

export interface DetailedPlayerBoxStats extends PlayerBoxStats {
  batting?: BaseballBattingStats;
  pitching?: BaseballPitchingStats;
  passing?: FootballPassingStats;
  rushing?: FootballRushingStats;
  receiving?: FootballReceivingStats;
  defense?: FootballDefenseStats;
  basketball?: BasketballPlayerStats;
  battingOrder?: number;
  position: string;
  headshotUrl?: string;
}

// ============================================================================
// GAME DETAIL TAB TYPES
// ============================================================================

export type GameDetailTab =
  | 'gamecast'
  | 'recap'
  | 'boxscore'
  | 'playbyplay'
  | 'pitchtracker'
  | 'teamstats'
  | 'videos';

export interface GameDetailTabConfig {
  id: GameDetailTab;
  label: string;
  sports: UnifiedSportKey[];
  requiresStatus?: UnifiedGameStatus[];
}

export const GAME_DETAIL_TABS: GameDetailTabConfig[] = [
  { id: 'gamecast', label: 'Gamecast', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab'] },
  {
    id: 'recap',
    label: 'Recap',
    sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab'],
    requiresStatus: ['FINAL'],
  },
  {
    id: 'boxscore',
    label: 'Box Score',
    sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab'],
    requiresStatus: ['LIVE', 'FINAL'],
  },
  {
    id: 'playbyplay',
    label: 'Play-by-Play',
    sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab'],
    requiresStatus: ['LIVE', 'FINAL'],
  },
  {
    id: 'pitchtracker',
    label: 'Pitches',
    sports: ['mlb'],
    requiresStatus: ['LIVE', 'FINAL'],
  },
  { id: 'teamstats', label: 'Team Stats', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab'] },
  {
    id: 'videos',
    label: 'Videos',
    sports: ['mlb', 'nfl', 'nba'],
    requiresStatus: ['LIVE', 'FINAL'],
  },
];

// ============================================================================
// GAME RECAP TYPE
// ============================================================================

export interface GameRecap {
  gameId: string;
  headline: string;
  summary: string;
  keyPlays: NormalizedPlay[];
  mvp?: {
    player: string;
    team: string;
    statLine: string;
    headshotUrl?: string;
  };
  source: string;
  sourceUrl?: string;
  generatedAt: string;
}

// ============================================================================
// SPORT METADATA
// ============================================================================

export const SPORT_METADATA: Record<
  UnifiedSportKey,
  {
    name: string;
    shortName: string;
    category: 'college' | 'pro';
    hasRankings: boolean;
    hasWeeks: boolean;
    defaultDivision?: NCAADivision;
  }
> = {
  ncaaf: {
    name: 'College Football',
    shortName: 'CFB',
    category: 'college',
    hasRankings: true,
    hasWeeks: true,
    defaultDivision: 'fbs',
  },
  ncaab: {
    name: "Men's College Basketball",
    shortName: 'NCAAM',
    category: 'college',
    hasRankings: true,
    hasWeeks: false,
    defaultDivision: 'd1',
  },
  wcbb: {
    name: "Women's College Basketball",
    shortName: 'NCAAW',
    category: 'college',
    hasRankings: true,
    hasWeeks: false,
    defaultDivision: 'd1',
  },
  cbb: {
    name: 'College Baseball',
    shortName: 'CBB',
    category: 'college',
    hasRankings: true,
    hasWeeks: false,
    defaultDivision: 'd1',
  },
  nfl: {
    name: 'NFL',
    shortName: 'NFL',
    category: 'pro',
    hasRankings: false,
    hasWeeks: true,
  },
  nba: {
    name: 'NBA',
    shortName: 'NBA',
    category: 'pro',
    hasRankings: false,
    hasWeeks: false,
  },
  wnba: {
    name: 'WNBA',
    shortName: 'WNBA',
    category: 'pro',
    hasRankings: false,
    hasWeeks: false,
  },
  mlb: {
    name: 'MLB',
    shortName: 'MLB',
    category: 'pro',
    hasRankings: false,
    hasWeeks: false,
  },
  nhl: {
    name: 'NHL',
    shortName: 'NHL',
    category: 'pro',
    hasRankings: false,
    hasWeeks: false,
  },
};
