/**
 * Shared college baseball constants used across satellite workers.
 * Consumed by: bsi-cbb-ingest, bsi-college-baseball-daily, bsi-portal-sync
 *
 * No Env dependency — safe to import from any worker.
 */

export const ESPN_BASE = 'https://site.api.espn.com';
export const SPORT_PATH = 'baseball/college-baseball';
export const HIGHLIGHTLY_HOST = 'mlb-college-baseball-api.p.rapidapi.com';
export const HIGHLIGHTLY_BASE = `https://${HIGHLIGHTLY_HOST}`;
export const FETCH_TIMEOUT_MS = 12_000;
export const CONFERENCES = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'] as const;
