/**
 * Transfer Portal Stats API
 *
 * Returns aggregated statistics for the transfer portal.
 */

import type { PortalSport } from '../../../lib/portal/types';

interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const sport = (url.searchParams.get('sport') || 'baseball') as PortalSport;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  // Sample stats (production: compute from D1)
  const stats = {
    baseball: {
      total: 247,
      in_portal: 156,
      committed: 78,
      withdrawn: 13,
      signed: 0,
      today_entries: 12,
      today_commits: 3,
      by_conference: {
        SEC: 48,
        'Big Ten': 32,
        ACC: 28,
        'Big 12': 26,
        'Pac-12': 22,
      },
      by_position: {
        Pitcher: 98,
        Infield: 72,
        Outfield: 45,
        Catcher: 18,
        Utility: 14,
      },
      last_updated: new Date().toISOString(),
    },
    football: {
      total: 1847,
      in_portal: 1234,
      committed: 512,
      withdrawn: 101,
      signed: 0,
      today_entries: 48,
      today_commits: 22,
      by_conference: {
        SEC: 312,
        'Big Ten': 278,
        'Big 12': 234,
        ACC: 198,
        'Pac-12': 167,
      },
      by_position: {
        WR: 287,
        DB: 265,
        LB: 198,
        OL: 178,
        DL: 165,
        RB: 142,
        QB: 87,
      },
      last_updated: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(stats[sport] || stats.baseball), { headers });
};
