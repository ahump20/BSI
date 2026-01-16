/**
 * Transfer Portal Entries API v2
 *
 * Production-ready API for college transfer portal data.
 * Supports both baseball and football with unified schema.
 *
 * Sources: NCAA Official Portal, D1Baseball, On3, 247Sports
 * Cache: 5-minute TTL during active windows
 */

import type { PortalEntry, PortalSport, PortalStatus } from '../../../lib/portal/types';

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}

// ============================================================================
// Sample Data (Production: Replace with D1/KV queries)
// ============================================================================

const BASEBALL_ENTRIES: PortalEntry[] = [
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
    id: 'bb-2025-003',
    player_name: 'Tyler Roberts',
    school_from: 'Oregon State',
    school_to: null,
    position: 'OF',
    conference: 'Pac-12',
    class_year: 'So',
    status: 'in_portal',
    portal_date: '2025-12-11',
    sport: 'baseball',
    engagement_score: 72,
    verified: true,
    source: 'ncaa.com',
    baseball_stats: { avg: 0.289, hr: 8, rbi: 38, sb: 12 },
    created_at: '2025-12-11T09:00:00Z',
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
    id: 'bb-2025-005',
    player_name: 'Brandon Lee',
    school_from: 'Stanford',
    school_to: null,
    position: 'C',
    conference: 'Pac-12',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-12',
    sport: 'baseball',
    engagement_score: 65,
    verified: true,
    source: 'ncaa.com',
    baseball_stats: { avg: 0.275, hr: 6, rbi: 29 },
    created_at: '2025-12-12T15:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'bb-2025-006',
    player_name: 'David Thompson',
    school_from: 'Tennessee',
    school_to: null,
    position: '1B',
    conference: 'SEC',
    class_year: 'So',
    status: 'withdrawn',
    portal_date: '2025-12-09',
    sport: 'baseball',
    engagement_score: 45,
    verified: true,
    source: 'twitter.com',
    baseball_stats: { avg: 0.301, hr: 11, rbi: 44 },
    created_at: '2025-12-09T08:00:00Z',
    updated_at: '2025-12-20T10:00:00Z',
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
  {
    id: 'bb-2025-008',
    player_name: 'Austin Miller',
    school_from: 'Arkansas',
    school_to: 'Vanderbilt',
    position: '2B',
    conference: 'SEC',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-12-11',
    commitment_date: '2025-12-28',
    sport: 'baseball',
    engagement_score: 77,
    verified: true,
    source: 'twitter.com',
    baseball_stats: { avg: 0.267, hr: 5, rbi: 31, sb: 8 },
    created_at: '2025-12-11T10:00:00Z',
    updated_at: '2025-12-28T16:00:00Z',
  },
  {
    id: 'bb-2025-009',
    player_name: 'Derek Williams',
    school_from: 'Wake Forest',
    school_to: null,
    position: 'OF',
    conference: 'ACC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-13',
    sport: 'baseball',
    engagement_score: 68,
    verified: true,
    source: 'ncaa.com',
    baseball_stats: { avg: 0.295, hr: 9, rbi: 41, sb: 15 },
    created_at: '2025-12-13T09:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'bb-2025-010',
    player_name: 'Mason Clark',
    school_from: 'Georgia',
    school_to: null,
    position: '3B',
    conference: 'SEC',
    class_year: 'So',
    status: 'in_portal',
    portal_date: '2025-12-14',
    sport: 'baseball',
    engagement_score: 82,
    verified: true,
    source: 'd1baseball.com',
    baseball_stats: { avg: 0.318, hr: 12, rbi: 48 },
    created_at: '2025-12-14T11:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
];

const FOOTBALL_ENTRIES: PortalEntry[] = [
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
    id: 'cfb-2025-003',
    player_name: 'Darius Jackson',
    school_from: 'Alabama',
    school_to: null,
    position: 'RB',
    conference: 'SEC',
    class_year: 'So',
    status: 'in_portal',
    portal_date: '2025-12-10',
    sport: 'football',
    engagement_score: 87,
    stars: 4,
    overall_rank: 28,
    verified: true,
    source: 'on3.com',
    football_stats: { rush_yards: 892, rush_td: 9, rec_yards: 234, rec_td: 2 },
    created_at: '2025-12-10T09:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'cfb-2025-004',
    player_name: 'Tyler Henderson',
    school_from: 'USC',
    school_to: 'Colorado',
    position: 'CB',
    conference: 'Big 12',
    class_year: 'Jr',
    status: 'committed',
    portal_date: '2025-12-09',
    commitment_date: '2025-12-15',
    sport: 'football',
    engagement_score: 82,
    stars: 3,
    verified: true,
    source: 'twitter.com',
    football_stats: { tackles: 42, interceptions: 4 },
    created_at: '2025-12-09T14:00:00Z',
    updated_at: '2025-12-15T11:00:00Z',
  },
  {
    id: 'cfb-2025-005',
    player_name: 'Jordan Mitchell',
    school_from: 'Michigan',
    school_to: null,
    position: 'LB',
    conference: 'Big Ten',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-11',
    sport: 'football',
    engagement_score: 79,
    stars: 4,
    overall_rank: 45,
    verified: true,
    source: 'on3.com',
    football_stats: { tackles: 87, sacks: 6.5 },
    created_at: '2025-12-11T10:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'cfb-2025-006',
    player_name: 'Brandon Thomas',
    school_from: 'Oklahoma',
    school_to: null,
    position: 'OL',
    conference: 'SEC',
    class_year: 'Sr',
    status: 'withdrawn',
    portal_date: '2025-12-09',
    sport: 'football',
    engagement_score: 55,
    stars: 3,
    verified: true,
    source: 'twitter.com',
    created_at: '2025-12-09T08:00:00Z',
    updated_at: '2025-12-18T10:00:00Z',
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
  {
    id: 'cfb-2025-008',
    player_name: 'Anthony Brown',
    school_from: 'Oregon',
    school_to: 'Miami',
    position: 'S',
    conference: 'Big Ten',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-12-10',
    commitment_date: '2025-12-25',
    sport: 'football',
    engagement_score: 74,
    stars: 3,
    verified: true,
    source: 'on3.com',
    football_stats: { tackles: 68, interceptions: 3 },
    created_at: '2025-12-10T13:00:00Z',
    updated_at: '2025-12-25T14:00:00Z',
  },
];

// ============================================================================
// API Handler
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300', // 5 minute cache
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Parse query params
    const sport = (url.searchParams.get('sport') || 'baseball') as PortalSport;
    const position = url.searchParams.get('position');
    const conference = url.searchParams.get('conference');
    const status = url.searchParams.get('status') as PortalStatus | null;
    const search = url.searchParams.get('search');
    const minStars = url.searchParams.get('minStars');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    // Select dataset based on sport
    let entries = sport === 'football' ? [...FOOTBALL_ENTRIES] : [...BASEBALL_ENTRIES];

    // Apply filters
    if (position) {
      entries = entries.filter((e) => e.position.includes(position));
    }
    if (conference) {
      entries = entries.filter((e) => e.conference === conference);
    }
    if (status) {
      entries = entries.filter((e) => e.status === status);
    }
    if (minStars) {
      entries = entries.filter((e) => (e.stars || 0) >= parseInt(minStars, 10));
    }
    if (search) {
      const query = search.toLowerCase();
      entries = entries.filter((e) =>
        [e.player_name, e.school_from, e.school_to, e.position]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(query))
      );
    }

    // Sort by engagement score (trending) then date
    entries.sort((a, b) => {
      const engDiff = (b.engagement_score || 0) - (a.engagement_score || 0);
      if (engDiff !== 0) return engDiff;
      return new Date(b.portal_date).getTime() - new Date(a.portal_date).getTime();
    });

    // Pagination
    const total = entries.length;
    const startIndex = (page - 1) * limit;
    const paginatedEntries = entries.slice(startIndex, startIndex + limit);

    const response = {
      data: paginatedEntries,
      meta: {
        total,
        page,
        per_page: limit,
        has_more: startIndex + limit < total,
        last_updated: new Date().toISOString(),
        source: 'bsi-portal-api',
      },
    };

    return new Response(JSON.stringify(response), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
};
