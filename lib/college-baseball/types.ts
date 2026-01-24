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
  score?: number;
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

// ============================================
// Draft Prospect Types (2026 MLB Draft)
// ============================================

export interface DraftProspect {
  id: string;
  name: string;
  school: string;
  conference: string;
  position: string;
  bats: 'L' | 'R' | 'S';
  throws: 'L' | 'R';
  year: 'FR' | 'SO' | 'JR' | 'RS-FR' | 'RS-SO' | 'RS-JR' | 'RS-SR';
  draftClass: number;
  ranking: ProspectRanking;
  scouting: ProspectScouting;
  projection: ProspectProjection;
  stats?: PlayerStats;
  notes: string;
  lastUpdated: string;
}

export interface ProspectRanking {
  overall: number;
  position: number;
  conference: number;
  source: 'd1baseball' | 'baseball-america' | 'perfect-game' | 'mlb-pipeline';
  previousRank?: number;
  change?: number;
}

export interface ProspectScouting {
  // Position player grades (20-80 scale)
  hit?: number;
  power?: number;
  run?: number;
  arm?: number;
  field?: number;
  // Pitcher grades (20-80 scale)
  fastball?: number;
  slider?: number;
  curveball?: number;
  changeup?: number;
  command?: number;
  // Overall assessment
  overallGrade: number;
  ceiling:
    | 'All-Star'
    | 'Above-Average Regular'
    | 'Average Regular'
    | 'Platoon/Bench'
    | 'Organizational';
  eta: number; // Expected MLB debut year
}

export interface ProspectProjection {
  draftRound: number;
  draftPick?: number;
  slotValue?: number;
  comparables: string[];
  risk: 'Low' | 'Medium' | 'High';
  upside: 'Low' | 'Medium' | 'High' | 'Elite';
}
