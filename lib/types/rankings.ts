/**
 * Shared types for the college baseball rankings API response.
 * Used by standings, CWS, regionals, tournament bubble, and intel pages.
 */

export interface RankingsTeam {
  rank?: number;
  name?: string;
  team?: string;
  conference?: string;
  record?: string;
  wins?: number;
  losses?: number;
}

export interface RankingsResponse {
  rankings: RankingsTeam[];
  meta?: { source: string; fetched_at: string };
}
