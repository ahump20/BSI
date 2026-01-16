/**
 * Transfer Portal Trending API
 *
 * Returns the hottest portal entries by engagement score.
 */

import type { PortalEntry, PortalSport } from '../../../lib/portal/types';

interface Env {
  KV: KVNamespace;
}

// Sample trending data
const TRENDING: Record<PortalSport, PortalEntry[]> = {
  baseball: [
    {
      id: 'bb-2025-001',
      player_name: 'Jake Wilson',
      school_from: 'Texas A&M',
      school_to: null,
      position: 'RHP',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-12-10',
      sport: 'baseball',
      engagement_score: 95,
      verified: true,
      source: 'd1baseball.com',
      baseball_stats: { era: 2.87, wins: 8, losses: 2, strikeouts: 94, innings: 88.2 },
      created_at: '2025-12-10T10:00:00Z',
      updated_at: '2025-01-15T08:30:00Z',
    },
    {
      id: 'bb-2025-004',
      player_name: 'Chris Martinez',
      school_from: 'Miami',
      school_to: 'Texas',
      position: 'LHP',
      conference: 'ACC',
      class_year: 'Jr',
      status: 'committed',
      portal_date: '2025-12-09',
      commitment_date: '2025-12-18',
      sport: 'baseball',
      engagement_score: 91,
      verified: true,
      source: 'twitter.com',
      baseball_stats: { era: 3.24, wins: 6, losses: 3, strikeouts: 78, innings: 72.1 },
      created_at: '2025-12-09T11:00:00Z',
      updated_at: '2025-12-18T14:00:00Z',
    },
    {
      id: 'bb-2025-007',
      player_name: 'Ryan Garcia',
      school_from: 'Texas',
      school_to: null,
      position: 'RHP',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-12-10',
      sport: 'baseball',
      engagement_score: 89,
      verified: true,
      source: 'd1baseball.com',
      baseball_stats: { era: 3.56, wins: 7, losses: 4, strikeouts: 82, innings: 78.0 },
      created_at: '2025-12-10T12:00:00Z',
      updated_at: '2025-01-15T08:30:00Z',
    },
  ],
  football: [
    {
      id: 'cfb-2025-001',
      player_name: 'Jaylen Carter',
      school_from: 'Georgia',
      school_to: null,
      position: 'QB',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-12-09',
      sport: 'football',
      engagement_score: 98,
      stars: 4,
      overall_rank: 12,
      verified: true,
      source: 'on3.com',
      football_stats: { pass_yards: 2847, pass_td: 24, rush_yards: 412, rush_td: 5 },
      created_at: '2025-12-09T10:00:00Z',
      updated_at: '2025-01-15T08:30:00Z',
    },
    {
      id: 'cfb-2025-002',
      player_name: 'Marcus Williams',
      school_from: 'Ohio State',
      school_to: 'Texas',
      position: 'WR',
      conference: 'Big Ten',
      class_year: 'Sr',
      status: 'committed',
      portal_date: '2025-12-09',
      commitment_date: '2025-12-20',
      sport: 'football',
      engagement_score: 94,
      stars: 5,
      overall_rank: 3,
      verified: true,
      source: '247sports.com',
      football_stats: { rec_yards: 1247, rec_td: 11 },
      created_at: '2025-12-09T12:00:00Z',
      updated_at: '2025-12-20T15:00:00Z',
    },
    {
      id: 'cfb-2025-007',
      player_name: 'Cameron Davis',
      school_from: 'Texas A&M',
      school_to: null,
      position: 'EDGE',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-12-12',
      sport: 'football',
      engagement_score: 91,
      stars: 4,
      overall_rank: 18,
      verified: true,
      source: '247sports.com',
      football_stats: { tackles: 52, sacks: 9.5 },
      created_at: '2025-12-12T11:00:00Z',
      updated_at: '2025-01-15T08:30:00Z',
    },
  ],
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const sport = (url.searchParams.get('sport') || 'baseball') as PortalSport;
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  const data = (TRENDING[sport] || TRENDING.baseball).slice(0, limit);

  return new Response(
    JSON.stringify({
      data,
      meta: {
        sport,
        count: data.length,
        last_updated: new Date().toISOString(),
      },
    }),
    { headers }
  );
};
