/**
 * Static mapping of MLB teams to Spring Training leagues.
 * Cactus League (Arizona) and Grapefruit League (Florida).
 * PIT trains in Bradenton (FL) — Grapefruit.
 */

export const CACTUS_TEAMS = new Set([
  'ARI', 'COL', 'CHC', 'CIN', 'CLE', 'KC', 'LAD', 'MIL',
  'OAK', 'SD', 'SF', 'SEA', 'TEX', 'LAA',
]);

export const GRAPEFRUIT_TEAMS = new Set([
  'ATL', 'BAL', 'BOS', 'DET', 'HOU', 'MIA', 'MIN', 'NYM',
  'NYY', 'PHI', 'PIT', 'STL', 'TB', 'TOR', 'WSH',
]);

export type STLeague = 'Cactus' | 'Grapefruit';

export function getSTLeague(abbr: string): STLeague | null {
  const upper = abbr.toUpperCase();
  if (CACTUS_TEAMS.has(upper)) return 'Cactus';
  if (GRAPEFRUIT_TEAMS.has(upper)) return 'Grapefruit';
  return null;
}
