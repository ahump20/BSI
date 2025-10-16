/**
 * Type definitions for College Baseball data structures
 */

export interface Game {
  id: string;
  date: string;
  time: string;
  status: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  venue: string;
  conference?: string;
  tv?: string;
  weather?: Weather;
  preview?: string; // NLG-generated preview
  recap?: string; // NLG-generated recap
}

export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  conference: string;
  division: string;
  logo?: string;
  record: Record;
  ranking?: number;
  rpi?: number;
}

export interface Record {
  wins: number;
  losses: number;
  conferenceWins?: number;
  conferenceLosses?: number;
}

export interface Weather {
  temperature: number;
  conditions: string;
  windSpeed: number;
  windDirection: string;
}

export interface BoxScore {
  gameId: string;
  status: GameStatus;
  inning: number;
  inningHalf: 'top' | 'bottom' | 'end';
  homeTeam: TeamBoxScore;
  awayTeam: TeamBoxScore;
  lastUpdate: string;
}

export interface TeamBoxScore {
  team: Team;
  score: number;
  hits: number;
  errors: number;
  lineScore: number[]; // Runs per inning
  batting: BattingStats[];
  pitching: PitchingStats[];
}

export interface BattingStats {
  playerId: string;
  playerName: string;
  position: string;
  battingOrder: number;
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  avg: number;
}

export interface PitchingStats {
  playerId: string;
  playerName: string;
  innings: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  pitches: number;
  era: number;
  decision?: 'W' | 'L' | 'S' | 'H';
}

export interface Standing {
  team: Team;
  overallRecord: Record;
  conferenceRecord: Record;
  streakType: 'W' | 'L';
  streakCount: number;
  last10: string;
  rpi: number;
  sos: number; // Strength of schedule
}

export interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  team: Team;
  year: string;
  hometown: string;
  stats: PlayerStats;
  careerStats?: PlayerStats[];
}

export interface PlayerStats {
  season: string;
  batting?: BattingSeasonStats;
  pitching?: PitchingSeasonStats;
}

export interface BattingSeasonStats {
  games: number;
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
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface PitchingSeasonStats {
  games: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  saves: number;
  innings: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  era: number;
  whip: number;
}

export interface Conference {
  id: string;
  name: string;
  standings: Standing[];
}

export interface PushNotificationPreferences {
  enabled: boolean;
  gameStart: boolean;
  inningEnd: boolean;
  finalScore: boolean;
  favoriteTeams: string[];
  favoritePlayers: string[];
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expires: number;
  source: string;
}
