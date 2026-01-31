/**
 * Transfer Portal Core Types
 *
 * Unified type system for College Baseball and CFB transfer portal tracking.
 * This is the canonical type definition—all portal components reference this.
 */

export type PortalSport = 'baseball' | 'football';

export type PortalStatus = 'in_portal' | 'committed' | 'withdrawn' | 'signed';

export type PortalWindow = 'spring' | 'summer' | 'winter' | 'fall';

export interface BaseballStats {
  avg?: number;
  hr?: number;
  rbi?: number;
  sb?: number;
  era?: number;
  wins?: number;
  losses?: number;
  strikeouts?: number;
  innings?: number;
  whip?: number;
}

export interface FootballStats {
  pass_yards?: number;
  pass_td?: number;
  rush_yards?: number;
  rush_td?: number;
  rec_yards?: number;
  rec_td?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;
}

export interface PortalEntry {
  id: string;
  player_name: string;
  school_from: string;
  school_to: string | null;
  position: string;
  conference: string;
  class_year: 'Fr' | 'So' | 'Jr' | 'Sr' | 'Gr';
  status: PortalStatus;
  portal_date: string; // ISO date
  commitment_date?: string; // ISO date when committed
  sport: PortalSport;

  // Engagement & Ranking
  engagement_score?: number; // 0-100 social media activity
  stars?: number; // 1-5 for CFB recruiting rating
  overall_rank?: number; // National rank for CFB

  // Stats
  baseball_stats?: BaseballStats;
  football_stats?: FootballStats;

  // Media
  headshot_url?: string;
  highlight_url?: string;

  // Data quality flags — every record surfaces its trustworthiness
  is_partial: boolean;
  needs_review: boolean;
  source_confidence: number; // 0.0-1.0

  // Source attribution — spec: every record has source_url or source_id
  source_url?: string;
  source_id?: string;

  // Metadata
  verified: boolean;
  source: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface PortalFilters {
  sport: PortalSport;
  position?: string;
  conference?: string;
  status?: PortalStatus;
  search?: string;
  window?: PortalWindow;
  minStars?: number;
  verified?: boolean;
}

export interface PortalStats {
  total: number;
  in_portal: number;
  committed: number;
  withdrawn: number;
  signed: number;
  by_conference: Record<string, number>;
  by_position: Record<string, number>;
  trending_up: PortalEntry[];
  recent_commits: PortalEntry[];
}

export interface PortalChangeEvent {
  id: string;
  portal_entry_id: string;
  change_type: 'entered' | 'committed' | 'withdrawn' | 'signed' | 'updated';
  description: string;
  event_timestamp: string;
  player_name?: string;
  sport?: PortalSport;
}

export interface PortalApiResponse {
  data: PortalEntry[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
    last_updated: string;
    source: string;
  };
}

export interface PortalFreshnessResponse {
  last_updated: string;
  update_count_24h: number;
  recent_changes: PortalChangeEvent[];
  status: 'live' | 'delayed' | 'stale';
}

// Portal Window Dates (2025-2026)
export const PORTAL_WINDOWS = {
  baseball: {
    spring_2025: { start: '2025-05-01', end: '2025-05-15', name: 'Spring Window' },
    summer_2025: { start: '2025-06-02', end: '2025-08-01', name: 'Main Window' },
    winter_2025: { start: '2025-12-09', end: '2026-01-15', name: 'Winter Window' },
  },
  football: {
    winter_2025: { start: '2025-12-09', end: '2026-01-15', name: 'Winter Window' },
    spring_2026: { start: '2026-04-16', end: '2026-04-30', name: 'Spring Window' },
  },
} as const;

// Position mappings for filtering
export const BASEBALL_POSITIONS = [
  { value: 'P', label: 'Pitchers', group: 'Pitcher' },
  { value: 'LHP', label: 'Left-Handed Pitchers', group: 'Pitcher' },
  { value: 'RHP', label: 'Right-Handed Pitchers', group: 'Pitcher' },
  { value: 'C', label: 'Catchers', group: 'Position' },
  { value: '1B', label: 'First Base', group: 'Infield' },
  { value: '2B', label: 'Second Base', group: 'Infield' },
  { value: 'SS', label: 'Shortstop', group: 'Infield' },
  { value: '3B', label: 'Third Base', group: 'Infield' },
  { value: 'OF', label: 'Outfield', group: 'Outfield' },
  { value: 'DH', label: 'Designated Hitter', group: 'Utility' },
  { value: 'UTL', label: 'Utility', group: 'Utility' },
] as const;

export const FOOTBALL_POSITIONS = [
  { value: 'QB', label: 'Quarterback', group: 'Offense' },
  { value: 'RB', label: 'Running Back', group: 'Offense' },
  { value: 'WR', label: 'Wide Receiver', group: 'Offense' },
  { value: 'TE', label: 'Tight End', group: 'Offense' },
  { value: 'OL', label: 'Offensive Line', group: 'Offense' },
  { value: 'DL', label: 'Defensive Line', group: 'Defense' },
  { value: 'EDGE', label: 'Edge Rusher', group: 'Defense' },
  { value: 'LB', label: 'Linebacker', group: 'Defense' },
  { value: 'CB', label: 'Cornerback', group: 'Defense' },
  { value: 'S', label: 'Safety', group: 'Defense' },
  { value: 'K', label: 'Kicker', group: 'Special' },
  { value: 'P', label: 'Punter', group: 'Special' },
] as const;

export const D1_CONFERENCES = [
  { value: 'SEC', label: 'SEC' },
  { value: 'Big Ten', label: 'Big Ten' },
  { value: 'Big 12', label: 'Big 12' },
  { value: 'ACC', label: 'ACC' },
  { value: 'Pac-12', label: 'Pac-12' },
  { value: 'AAC', label: 'American Athletic' },
  { value: 'MWC', label: 'Mountain West' },
  { value: 'Sun Belt', label: 'Sun Belt' },
  { value: 'MAC', label: 'MAC' },
  { value: 'C-USA', label: 'Conference USA' },
  { value: 'Big East', label: 'Big East' },
  { value: 'WCC', label: 'WCC' },
  { value: 'A-10', label: 'Atlantic 10' },
  { value: 'Ivy', label: 'Ivy League' },
] as const;
