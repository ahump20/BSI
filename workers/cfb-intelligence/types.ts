/**
 * Type definitions for College Football Intelligence Engine
 */

export interface Env {
  DB: D1Database;
  CFB_CACHE: KVNamespace;
  GAME_DATA: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
}

export interface Team {
  id: string;
  name: string;
  conference: string;
  division: 'FBS' | 'FCS' | 'D2' | 'D3';
  recruiting_rank?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_time: string;
  status: 'scheduled' | 'live' | 'final';
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string;
  created_at?: string;
  updated_at?: string;
}

export interface GameAnalytics {
  id?: number;
  game_id: string;
  timestamp: string;
  home_epa: number;
  away_epa: number;
  home_success_rate: number;
  away_success_rate: number;
  home_win_probability: number;
  upset_probability: number;
}

export interface LiveGameResponse {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team: string;
  away_team: string;
  home_division: string;
  away_division: string;
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string;
  home_epa: number;
  away_epa: number;
  home_success_rate: number;
  away_success_rate: number;
  home_win_probability: number;
  upset_probability: number;
}

export interface UpsetAlert {
  id: string;
  home_team: string;
  away_team: string;
  home_division: string;
  away_division: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'live' | 'final';
  scheduled_time: string;
  upset_probability: number;
  home_win_probability: number;
  underdog: 'home_underdog' | 'away_underdog';
}

export interface TeamAnalytics {
  id: string;
  name: string;
  conference: string;
  division: string;
  recruiting_rank?: number;
  games_played: number;
  wins: number;
  avg_epa: number;
  avg_success_rate: number;
}

export interface TeamGameHistory {
  id: string;
  scheduled_time: string;
  opponent: string;
  location: 'home' | 'away';
  home_score: number;
  away_score: number;
  team_epa: number;
  team_success_rate: number;
}

export interface TeamAnalyticsResponse {
  team: TeamAnalytics;
  recent_games: TeamGameHistory[];
}

export interface RecruitingImpactAnalysis {
  name: string;
  conference: string;
  division: string;
  recruiting_rank: number;
  games_played: number;
  avg_epa: number;
  avg_success_rate: number;
}

export interface RecruitingImpactResponse {
  teams: RecruitingImpactAnalysis[];
  correlation: {
    recruiting_to_epa: number;
    interpretation: string;
  };
}

export interface IngestionLog {
  timestamp: string;
  status: 'completed' | 'failed';
  games_processed: number;
  error?: string;
}
