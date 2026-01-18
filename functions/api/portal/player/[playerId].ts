/**
 * Transfer Portal Player API
 *
 * Returns detailed information about a single portal entry.
 */

import type { PortalEntry } from '../../../../lib/portal/types';

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}

// Sample data store (in production, query D1)
const ALL_ENTRIES: PortalEntry[] = [
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
    id: 'bb-2025-002',
    player_name: 'Marcus Johnson',
    school_from: 'Florida',
    school_to: 'LSU',
    position: 'SS',
    conference: 'SEC',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-12-09',
    commitment_date: '2025-12-22',
    sport: 'baseball',
    engagement_score: 88,
    verified: true,
    source: 'd1baseball.com',
    baseball_stats: { avg: 0.312, hr: 14, rbi: 52, sb: 18 },
    created_at: '2025-12-09T14:00:00Z',
    updated_at: '2025-12-22T16:00:00Z',
  },
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
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params } = context;
  const playerId = params.playerId as string;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  try {
    const entry = ALL_ENTRIES.find((e) => e.id === playerId);

    if (!entry) {
      return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
    }

    return new Response(JSON.stringify({ data: entry }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
};
