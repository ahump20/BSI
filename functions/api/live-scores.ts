/**
 * Pages Function — /api/live-scores
 *
 * Minimal fallback payload for dashboards when Worker routing is unavailable.
 */

import { ok, preflight } from './_utils';

export const onRequestGet: PagesFunction = async () => {
  const fetchedAt = new Date().toISOString();

  return ok({
    mlb: [],
    nfl: [],
    nba: [],
    ncaa: [],
    meta: {
      source: 'pages-fallback',
      fetched_at: fetchedAt,
      timezone: 'America/Chicago',
      notice: 'Live scores temporarily unavailable',
    },
  });
};

export const onRequestOptions: PagesFunction = async () => preflight();
