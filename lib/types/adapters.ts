/**
 * Unified Sport Adapter Types
 *
 * Shared type definitions for the sport adapter layer that normalizes
 * data from multiple APIs (ESPN, MLB StatsAPI, SportsDataIO) into
 * consistent shapes for UI components.
 */

// ---------------------------------------------------------------------------
// Core enums and constants
// ---------------------------------------------------------------------------

export type UnifiedSportKey =
  | 'mlb'
  | 'cbb'
  | 'nfl'
  | 'ncaaf'
  | 'nba'
  | 'ncaab'
  | 'wcbb'
  | 'wnba';

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
  sports: UnifiedSportKey[];
  requiresStatus?: Array<'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED'>;
}

export const GAME_DETAIL_TABS: GameDetailTabConfig[] = [
  { id: 'gamecast', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab', 'wcbb', 'wnba'] },
  { id: 'recap', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab', 'wcbb', 'wnba'], requiresStatus: ['FINAL'] },
  { id: 'boxscore', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab', 'wcbb', 'wnba'], requiresStatus: ['LIVE', 'FINAL'] },
  { id: 'playbyplay', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab', 'wcbb', 'wnba'], requiresStatus: ['LIVE', 'FINAL'] },
  { id: 'pitchtracker', sports: ['mlb', 'cbb'], requiresStatus: ['LIVE', 'FINAL'] },
  { id: 'teamstats', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab', 'wcbb', 'wnba'], requiresStatus: ['LIVE', 'FINAL'] },
  { id: 'videos', sports: ['mlb', 'cbb', 'nfl', 'ncaaf', 'nba', 'ncaab', 'wcbb', 'wnba'] },
];

// ---------------------------------------------------------------------------
// Unified game types
// ---------------------------------------------------------------------------

export interface TeamRecord {
  overall: string;
  conference?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  color?: string;
  record?: TeamRecord;
  rank?: number;
}

export interface UnifiedGame {
  id: string;
  sport: UnifiedSportKey;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED';
  scheduledAt: string;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  awayScore?: number;
  homeScore?: number;
  awayRanking?: number;
  homeRanking?: number;
  venue?: string;
  broadcast?: string;
  sportData?: BaseballGameData | FootballGameData | BasketballGameData;
}

// ---------------------------------------------------------------------------
// Sport-specific game data
// ---------------------------------------------------------------------------

export interface BaseballGameData {
  inning: number;
  isTopInning: boolean;
  inningHalf?: 'TOP' | 'BOTTOM';
  outs?: number;
  balls?: number;
  strikes?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  linescore?: { away?: number; home?: number }[];
}

export interface FootballGameData {
  quarter: number;
  timeRemaining: string;
  down?: number;
  distance?: number;
  yardLine?: string;
  possession?: string;
  redZone?: boolean;
}

export interface BasketballGameData {
  period: number;
  timeRemaining: string;
  bonus?: boolean;
  possession?: string;
}

// ---------------------------------------------------------------------------
// Box score types
// ---------------------------------------------------------------------------

export interface PlayerInfo {
  displayName: string;
  shortName?: string;
  id?: string;
}

export interface PlayerBoxStats {
  playerId: string;
  player: PlayerInfo;
  name: string;
  position?: string;
  starter?: boolean;
  stats: Record<string, string | number>;
  decision?: string;
}

export interface TeamBoxStats {
  team: TeamInfo;
  players: PlayerBoxStats[];
  stats?: Record<string, string | number>;
  totals?: Record<string, string | number>;
}

export interface LeaderEntry {
  player: string;
  value: string;
}

export interface LeaderCategory {
  category: string;
  leaders: LeaderEntry[];
}

export interface UnifiedBoxScore {
  game: UnifiedGame;
  awayStats: TeamBoxStats;
  homeStats: TeamBoxStats;
  leaders?: {
    away: LeaderCategory[];
    home: LeaderCategory[];
  };
}

// ---------------------------------------------------------------------------
// Play-by-play types
// ---------------------------------------------------------------------------

export type PlayFilter = 'all' | 'scoring' | 'key';

export interface PlayTeam {
  id?: string;
  name?: string;
  abbreviation: string;
}

export interface PlayPlayer {
  name: string;
  role: string;
}

export interface NormalizedPlay {
  playId: string;
  period: number;
  gameTime: string;
  description: string;
  team?: PlayTeam;
  isScoring: boolean;
  isKeyPlay: boolean;
  scoreAfter: { away: number; home: number };
  players: PlayPlayer[];
  videoUrl?: string;
  winProbDelta?: number;
}

// ---------------------------------------------------------------------------
// Video types
// ---------------------------------------------------------------------------

export type VideoSource = 'ESPN' | 'YOUTUBE' | 'CLOUDFLARE_STREAM' | 'MLB' | 'FALLBACK';

export interface VideoHighlight {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  source: VideoSource;
  duration: number;
  featured?: boolean;
}

// ---------------------------------------------------------------------------
// Headline types
// ---------------------------------------------------------------------------

export type HeadlineSource =
  | 'ESPN'
  | 'ATHLETIC'
  | 'MLB'
  | 'NFL'
  | 'NCAA'
  | 'BSI'
  | 'AP'
  | 'CUSTOM'
  | 'MLB_COM'
  | 'BASEBALL_AMERICA'
  | 'D1BASEBALL'
  | 'PERFECT_GAME'
  | 'BLEACHER_REPORT';

export type HeadlineCategory =
  | 'BREAKING'
  | 'INJURY'
  | 'TRADE'
  | 'SCORE'
  | 'PREVIEW'
  | 'RECAP'
  | 'ANALYSIS'
  | 'GENERAL';

export interface Headline {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  imageUrl?: string;
  source: HeadlineSource;
  category: HeadlineCategory;
  sport?: UnifiedSportKey;
  publishedAt: string;
  author?: string;
}

// ---------------------------------------------------------------------------
// Game recap
// ---------------------------------------------------------------------------

export interface GameRecapMVP {
  player: string;
  team: string;
  statLine: string;
  headshotUrl?: string;
}

export interface GameRecap {
  headline: string;
  summary: string;
  body?: string;
  source?: string;
  sourceUrl?: string;
  mvp?: GameRecapMVP;
  keyPlays: NormalizedPlay[];
}
