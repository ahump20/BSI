/**
 * Sportradar MLB v8 API — Type Definitions
 *
 * Response types for the Sportradar MLB API (v8) and BSI-normalized
 * types for the ABS Challenge Tracker.
 *
 * Auth: x-api-key header
 * Base: https://api.sportradar.com/mlb/trial/v8/en
 */

// ---------------------------------------------------------------------------
// Sportradar Raw Response Types
// ---------------------------------------------------------------------------

export interface SportradarGame {
  id: string;
  status: 'scheduled' | 'inprogress' | 'complete' | 'closed' | 'wdelay' | 'fdelay' | 'postponed' | 'canceled' | 'unnecessary';
  coverage: string;
  scheduled: string;
  home_team: string;
  away_team: string;
  home: SportradarTeamRef;
  away: SportradarTeamRef;
  venue?: SportradarVenue;
  broadcast?: SportradarBroadcast;
  game_number?: number;
  double_header?: boolean;
}

export interface SportradarTeamRef {
  id: string;
  name: string;
  market: string;
  abbr: string;
  runs?: number;
  hits?: number;
  errors?: number;
  win?: number;
  loss?: number;
}

export interface SportradarVenue {
  id: string;
  name: string;
  market?: string;
  capacity?: number;
  surface?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface SportradarBroadcast {
  network?: string;
}

export interface SportradarDailySchedule {
  date: string;
  games: SportradarGame[];
}

// ---------------------------------------------------------------------------
// Play-by-Play Types
// ---------------------------------------------------------------------------

export interface SportradarPBPResponse {
  game: SportradarGame;
  innings: SportradarInning[];
}

export interface SportradarInning {
  number: number;
  sequence: number;
  halfs: SportradarHalf[];
}

export interface SportradarHalf {
  half: 'T' | 'B';
  events: SportradarEvent[];
}

export interface SportradarEvent {
  id: string;
  type: string;
  at_bat?: SportradarAtBat;
  wall_clock?: SportradarWallClock;
}

export interface SportradarWallClock {
  value: string;
}

export interface SportradarAtBat {
  id: string;
  hitter_id: string;
  pitcher_id: string;
  events: SportradarPitchEvent[];
  description?: string;
}

export interface SportradarPitchEvent {
  id: string;
  sequence?: number;
  outcome_id: string;
  outcome_desc: string;
  type?: string;
  status?: string;
  count?: {
    balls: number;
    strikes: number;
    outs: number;
    pitch_count: number;
  };
  flags?: SportradarPitchFlags;
  pitcher?: { id: string; full_name?: string };
  hitter?: { id: string; full_name?: string };
  mlb_pitch_data?: SportradarMLBPitchData;
}

export interface SportradarPitchFlags {
  is_ab_over?: boolean;
  is_hit?: boolean;
  is_on_base?: boolean;
  is_double_play?: boolean;
  is_triple_play?: boolean;
  is_bunt?: boolean;
  is_wild_pitch?: boolean;
  is_passed_ball?: boolean;
}

export interface SportradarMLBPitchData {
  speed?: number;
  type?: string;
  type_desc?: string;
  zone?: number;
  x?: number;
  y?: number;
  ax?: number;
  ay?: number;
  az?: number;
  break_angle?: number;
  break_length?: number;
  break_y?: number;
  spin_rate?: number;
  spin_direction?: number;
}

// ---------------------------------------------------------------------------
// Pitch Metrics (per-game summary endpoint)
// ---------------------------------------------------------------------------

export interface SportradarPitchMetrics {
  game: SportradarGame;
  pitches: SportradarPitchDetail[];
}

export interface SportradarPitchDetail {
  id: string;
  at_bat_id: string;
  pitcher_id: string;
  batter_id: string;
  speed?: number;
  type?: string;
  type_desc?: string;
  zone?: number;
  outcome_id: string;
  outcome_desc: string;
  spin_rate?: number;
  break_angle?: number;
  x?: number;
  y?: number;
}

// ---------------------------------------------------------------------------
// Game Summary
// ---------------------------------------------------------------------------

export interface SportradarGameSummary {
  game: SportradarGame;
  home: SportradarTeamSummary;
  away: SportradarTeamSummary;
}

export interface SportradarTeamSummary {
  id: string;
  name: string;
  market: string;
  abbr: string;
  runs: number;
  hits: number;
  errors: number;
  lineup?: SportradarLineupEntry[];
  pitching?: SportradarPitchingSummary[];
}

export interface SportradarLineupEntry {
  player_id: string;
  full_name: string;
  jersey_number: string;
  position: string;
  batting_order: number;
}

export interface SportradarPitchingSummary {
  player_id: string;
  full_name: string;
  win?: boolean;
  loss?: boolean;
  save?: boolean;
  ip?: number;
  runs?: number;
  earned_runs?: number;
  strikeouts?: number;
  walks?: number;
  pitches_thrown?: number;
}

// ---------------------------------------------------------------------------
// Changes / Delta Detection
// ---------------------------------------------------------------------------

export interface SportradarChangesResponse {
  league: { id: string; name: string };
  changes: SportradarChange[];
}

export interface SportradarChange {
  game_id: string;
  updated: string;
  endpoints: string[];
}

// ---------------------------------------------------------------------------
// BSI Normalized Types — ABS Challenge Data
// ---------------------------------------------------------------------------

export interface BSIABSChallenge {
  gameId: string;
  atBatId: string;
  pitchNumber: number;
  inning: number;
  half: 'T' | 'B';
  challengeTeam: string;
  challengeRole: 'catcher' | 'hitter' | 'pitcher';
  challengeResult: 'overturned' | 'confirmed';
  pitcherId: string;
  batterId: string;
  wallClock: string;
}

export interface BSIABSGameLog {
  gameId: string;
  date: string;
  away: string;
  home: string;
  totalChallenges: number;
  overturned: number;
  avgChallengeTime: number;
}

export interface BSIABSRoleStats {
  role: 'catcher' | 'hitter' | 'pitcher';
  challenges: number;
  overturned: number;
  successRate: number;
}

export interface BSIABSUmpireAccuracy {
  label: string;
  accuracy: number;
  totalCalls: number;
  source: string;
}

export interface BSIABSResponse {
  challengesByRole: BSIABSRoleStats[];
  recentGames: BSIABSGameLog[];
  umpireAccuracy: BSIABSUmpireAccuracy[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
  };
}

// ---------------------------------------------------------------------------
// Client Config
// ---------------------------------------------------------------------------

export type SportradarAccessLevel = 'trial' | 'production';

export interface SportradarClientConfig {
  apiKey: string;
  accessLevel: SportradarAccessLevel;
}
