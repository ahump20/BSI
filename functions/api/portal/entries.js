// Transfer Portal Entries API - Cloudflare Pages Function
// Fetches portal entries from D1 with filtering and pagination

import { ok, err, cache, preflight, rateLimit, rateLimitError } from '../_utils.js';

/**
 * Transfer Portal Entries endpoint
 * GET /api/portal/entries?status=in_portal&conference=SEC&position=P&limit=50
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Rate limiting: 200 requests per minute per IP
  const limit = await rateLimit(env, request, 200, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  // Parse query params
  const status = url.searchParams.get('status'); // in_portal, committed, withdrawn
  const conference = url.searchParams.get('conference');
  const position = url.searchParams.get('position');
  const school = url.searchParams.get('school');
  const search = url.searchParams.get('search');
  const pageLimit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    // Build cache key
    const cacheKey = `portal:entries:${status || 'all'}:${conference || 'all'}:${position || 'all'}:${pageLimit}:${offset}`;

    const result = await cache(
      env,
      cacheKey,
      async () => {
        return await fetchPortalEntries(env, {
          status,
          conference,
          position,
          school,
          search,
          limit: pageLimit,
          offset,
        });
      },
      60 // 1 minute cache for portal data (fresher than standings)
    );

    return ok({
      success: true,
      data: result.entries,
      meta: {
        total: result.total,
        limit: pageLimit,
        offset,
        hasMore: result.total > offset + pageLimit,
        dataSource: 'BSI Transfer Portal Database',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (error) {
    console.error('Portal entries error:', error);
    return err(error);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export function onRequestOptions() {
  return preflight();
}

/**
 * Fetch portal entries from D1 database
 */
async function fetchPortalEntries(env, filters) {
  // Get D1 binding
  const db = env.BSI_PORTAL_DB;
  if (!db) {
    // Return sample data if no D1 binding (development mode)
    return getSamplePortalData(filters);
  }

  // Build query with filters
  let query = 'SELECT * FROM portal_entries WHERE 1=1';
  const params = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.conference) {
    query += ' AND conference = ?';
    params.push(filters.conference);
  }

  if (filters.position) {
    // Position can be partial match (P matches RHP, LHP)
    query += ' AND position LIKE ?';
    params.push(`%${filters.position}%`);
  }

  if (filters.school) {
    query += ' AND (school_from LIKE ? OR school_to LIKE ?)';
    params.push(`%${filters.school}%`, `%${filters.school}%`);
  }

  if (filters.search) {
    query += ' AND player_name LIKE ?';
    params.push(`%${filters.search}%`);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await db
    .prepare(countQuery)
    .bind(...params)
    .first();
  const total = countResult?.count || 0;

  // Add ordering and pagination
  query += ' ORDER BY engagement_score DESC, portal_date DESC LIMIT ? OFFSET ?';
  params.push(filters.limit, filters.offset);

  // Execute query
  const { results } = await db
    .prepare(query)
    .bind(...params)
    .all();

  // Transform entries
  const entries = (results || []).map((entry) => ({
    id: entry.id,
    player_name: entry.player_name,
    school_from: entry.school_from,
    school_to: entry.school_to,
    position: entry.position,
    conference: entry.conference,
    class_year: entry.class_year,
    status: entry.status,
    portal_date: entry.portal_date,
    engagement_score: entry.engagement_score || 0,
    source: entry.source,
    verified: Boolean(entry.verified),
  }));

  return { entries, total };
}

/**
 * Sample data for development/fallback
 * This data represents realistic transfer portal activity
 */
function getSamplePortalData(filters) {
  const allEntries = [
    {
      id: 'tp-2025-001',
      player_name: 'Jake Wilson',
      school_from: 'Texas A&M',
      school_to: null,
      position: 'RHP',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-02',
      engagement_score: 95,
      source: 'twitter',
      verified: true,
      stats: { era: 2.87, wins: 8, losses: 2, strikeouts: 94 },
    },
    {
      id: 'tp-2025-002',
      player_name: 'Marcus Johnson',
      school_from: 'Florida',
      school_to: 'LSU',
      position: 'SS',
      conference: 'SEC',
      class_year: 'Sr',
      status: 'committed',
      portal_date: '2025-06-02',
      engagement_score: 88,
      source: 'd1baseball',
      verified: true,
      stats: { avg: 0.312, hr: 14, rbi: 52 },
    },
    {
      id: 'tp-2025-003',
      player_name: 'Tyler Roberts',
      school_from: 'Oregon State',
      school_to: null,
      position: 'OF',
      conference: 'Pac-12',
      class_year: 'So',
      status: 'in_portal',
      portal_date: '2025-06-03',
      engagement_score: 72,
      source: 'twitter',
      verified: true,
      stats: { avg: 0.289, hr: 8, rbi: 38 },
    },
    {
      id: 'tp-2025-004',
      player_name: 'Chris Martinez',
      school_from: 'Miami',
      school_to: 'Texas',
      position: 'LHP',
      conference: 'ACC',
      class_year: 'Jr',
      status: 'committed',
      portal_date: '2025-06-02',
      engagement_score: 91,
      source: 'official',
      verified: true,
      stats: { era: 3.24, wins: 6, losses: 3, strikeouts: 78 },
    },
    {
      id: 'tp-2025-005',
      player_name: 'Brandon Lee',
      school_from: 'Stanford',
      school_to: null,
      position: 'C',
      conference: 'Pac-12',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-04',
      engagement_score: 65,
      source: 'twitter',
      verified: true,
      stats: { avg: 0.275, hr: 6, rbi: 29 },
    },
    {
      id: 'tp-2025-006',
      player_name: 'David Thompson',
      school_from: 'Tennessee',
      school_to: null,
      position: '1B',
      conference: 'SEC',
      class_year: 'So',
      status: 'withdrawn',
      portal_date: '2025-06-02',
      engagement_score: 45,
      source: 'official',
      verified: true,
      stats: { avg: 0.301, hr: 11, rbi: 44 },
    },
    {
      id: 'tp-2025-007',
      player_name: 'Ryan Garcia',
      school_from: 'Texas Tech',
      school_to: null,
      position: 'RHP',
      conference: 'Big 12',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-05',
      engagement_score: 78,
      source: 'twitter',
      verified: true,
      stats: { era: 3.56, wins: 7, losses: 4, strikeouts: 82 },
    },
    {
      id: 'tp-2025-008',
      player_name: 'Josh Williams',
      school_from: 'Arkansas',
      school_to: 'Ole Miss',
      position: '2B',
      conference: 'SEC',
      class_year: 'Sr',
      status: 'committed',
      portal_date: '2025-06-03',
      engagement_score: 82,
      source: 'd1baseball',
      verified: true,
      stats: { avg: 0.267, hr: 5, rbi: 31 },
    },
    {
      id: 'tp-2025-009',
      player_name: 'Michael Chen',
      school_from: 'UCLA',
      school_to: null,
      position: 'OF',
      conference: 'Pac-12',
      class_year: 'Fr',
      status: 'in_portal',
      portal_date: '2025-06-06',
      engagement_score: 55,
      source: 'twitter',
      verified: false,
      stats: { avg: 0.245, hr: 2, rbi: 15 },
    },
    {
      id: 'tp-2025-010',
      player_name: 'Kevin Brown',
      school_from: 'Vanderbilt',
      school_to: null,
      position: 'RHP',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-04',
      engagement_score: 89,
      source: 'official',
      verified: true,
      stats: { era: 2.65, wins: 9, losses: 2, strikeouts: 101 },
    },
    {
      id: 'tp-2025-011',
      player_name: 'Derek Adams',
      school_from: 'NC State',
      school_to: 'Florida State',
      position: 'SS',
      conference: 'ACC',
      class_year: 'So',
      status: 'committed',
      portal_date: '2025-06-02',
      engagement_score: 76,
      source: 'twitter',
      verified: true,
      stats: { avg: 0.295, hr: 9, rbi: 41 },
    },
    {
      id: 'tp-2025-012',
      player_name: 'Austin Taylor',
      school_from: 'South Carolina',
      school_to: null,
      position: 'C',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-05',
      engagement_score: 68,
      source: 'd1baseball',
      verified: true,
      stats: { avg: 0.281, hr: 8, rbi: 35 },
    },
  ];

  // Apply filters
  let filtered = [...allEntries];

  if (filters.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  if (filters.conference) {
    filtered = filtered.filter((e) => e.conference === filters.conference);
  }

  if (filters.position) {
    filtered = filtered.filter((e) => e.position.includes(filters.position));
  }

  if (filters.school) {
    const school = filters.school.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.school_from.toLowerCase().includes(school) ||
        (e.school_to && e.school_to.toLowerCase().includes(school))
    );
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter((e) => e.player_name.toLowerCase().includes(search));
  }

  // Sort by engagement score
  filtered.sort((a, b) => b.engagement_score - a.engagement_score);

  // Paginate
  const total = filtered.length;
  const paginated = filtered.slice(filters.offset, filters.offset + filters.limit);

  return { entries: paginated, total };
}
