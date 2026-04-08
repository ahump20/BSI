/**
 * Shared types for analytics chart components.
 * These match the shapes returned by the BSI Savant API endpoints.
 */

export interface BatterStats {
  player_id: string;
  player_name: string;
  team: string;
  team_slug?: string;
  position: string;
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  woba: number;
  wrc_plus: number;
  ops_plus: number;
  iso: number;
  babip: number;
  k_pct: number;
  bb_pct: number;
}

export interface PitcherStats {
  player_id: string;
  player_name: string;
  team: string;
  team_slug?: string;
  position: string;
  ip: number;
  era: number;
  whip: number;
  fip: number;
  era_minus: number;
  k_9: number;
  bb_9: number;
  hr_9: number;
  k_bb: number;
  lob_pct: number;
}

export type EnrichedBatter = BatterStats & { conference: string };
export type EnrichedPitcher = PitcherStats & { conference: string };
