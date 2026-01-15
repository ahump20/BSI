/**
 * NFL Play-by-Play Types
 * nflfastR-style play-by-play data with advanced analytics
 */

export type PlayType = 'pass' | 'rush' | 'punt' | 'kickoff' | 'field_goal' | 'extra_point';

export interface NFLPlay {
  playId: string;
  gameId: string;
  quarter: number;
  time: string;
  down: number;
  distance: number;
  yardLine: number;
  playType: PlayType;
  description: string;
  yardsGained: number;
  epa: number; // Expected Points Added
  wpa: number; // Win Probability Added
  cpoe: number; // Completion Percentage Over Expected (for passes)
  successRate: boolean;
  isFirstDown: boolean;
  isTouchdown: boolean;
  isTurnover: boolean;
  passerId?: string;
  receiverId?: string;
  rusherId?: string;
}

export interface PlayByPlayResponse {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  plays: NFLPlay[];
  summary: GameSummary;
}

export interface GameSummary {
  totalPlays: number;
  totalYards: number;
  averageEPA: number;
  averageWPA: number;
  passingPlays: number;
  rushingPlays: number;
  touchdowns: number;
  turnovers: number;
  thirdDownConversions: { made: number; attempts: number };
  fourthDownConversions: { made: number; attempts: number };
}

export interface EPAMetrics {
  overall: number;
  passing: number;
  rushing: number;
  byQuarter: Record<number, number>;
}

export interface WPAMetrics {
  overall: number;
  byPlayer: Record<string, number>;
  criticalPlays: NFLPlay[];
}
