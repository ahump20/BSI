/**
 * Shared college baseball constants used across satellite workers.
 * Consumed by: bsi-cbb-ingest, bsi-college-baseball-daily, bsi-cbb-analytics
 *
 * No Env dependency — safe to import from any worker.
 */

export const ESPN_BASE = 'https://site.api.espn.com';
export const SPORT_PATH = 'baseball/college-baseball';
export const HIGHLIGHTLY_HOST = 'mlb-college-baseball-api.p.rapidapi.com';
export const HIGHLIGHTLY_BASE = `https://${HIGHLIGHTLY_HOST}`;
export const FETCH_TIMEOUT_MS = 12_000;
export const CONFERENCES = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'] as const;

// ---------------------------------------------------------------------------
// Sabermetric qualification thresholds — shared between bsi-cbb-analytics
// (cron) and the on-demand savant.ts handler so they stay in sync.
// ---------------------------------------------------------------------------

/** Minimum at-bats to include a batter in league context / leaderboards. */
export const MIN_AB_BATTING = 20;

/**
 * Minimum innings-pitched (in thirds) for league context pitching aggregates.
 * 45 thirds = 15 IP. Used for global qualification (cron + league-context query).
 * Note: team-level savant queries intentionally use a lower threshold (24 thirds =
 * 8 IP) to surface all active arms on a team's staff — that's not an error.
 */
export const MIN_IP_THIRDS_PITCHING = 45;

/** Minimum plate appearances to appear on public leaderboards. Guards thin-sample extremes. */
export const MIN_PA_LEADERBOARD = 50;

/**
 * D1 historical extra-base hit ratio: triples ≈ 12% of (2B+3B) hit count.
 * n3 = 0.12 / (1 + 0.12) * xb ≈ xb * 0.107, where xb = total extra bases from non-HR hits.
 * College triples rate is ~2–3× MLB due to larger venues and faster runners.
 * Source: NCAA D1 team stats aggregates 2022–2025 regular seasons.
 *
 * Used by bsi-cbb-analytics (cron) and savant.ts (on-demand) to derive 2B/3B
 * when ESPN box scores omit split-hit data.
 */
export const D1_TRIPLE_RATE_OF_XB = 0.107;
