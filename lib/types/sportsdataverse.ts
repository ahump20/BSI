/**
 * SportsDataverse Unified Types
 * Consistent interfaces across all sports
 */

export type Sport = 'nfl' | 'nba' | 'mlb' | 'cfb' | 'cbb' | 'soccer';

export interface SportsDataverseConfig {
  sport: Sport;
  endpoint: string;
  cacheKey: string;
  ttl: number;
}

export interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  color?: string;
}

export interface UnifiedGameData {
  gameId: string;
  sport: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: 'scheduled' | 'in_progress' | 'final';
  score: { home: number; away: number };
  startTime: string;
  venue: string;
  broadcast?: string;
}

export interface UnifiedStandingsData {
  sport: string;
  conference?: string;
  division?: string;
  teams: StandingEntry[];
  lastUpdated: string;
}

export interface StandingEntry {
  team: TeamInfo;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack?: number;
  streak?: string;
  homeRecord?: string;
  awayRecord?: string;
}

export interface UnifiedPlayerData {
  playerId: string;
  sport: string;
  name: string;
  team: TeamInfo;
  position: string;
  jerseyNumber?: number;
  stats: Record<string, number | string>;
}

export interface UnifiedSeasonData {
  sport: string;
  season: number;
  type: 'regular' | 'playoffs' | 'preseason';
  startDate: string;
  endDate: string;
}
