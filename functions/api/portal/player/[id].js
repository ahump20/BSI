// Transfer Portal Player Detail API - Cloudflare Pages Function
// Fetches individual player profile with stats, bio, and timeline

import { ok, err, cache, preflight, rateLimit, rateLimitError } from '../../_utils.js';

/**
 * Transfer Portal Player Detail endpoint
 * GET /api/portal/player/:id
 */
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const playerId = params.id;

  if (!playerId) {
    return err(new Error('Player ID is required'), 400);
  }

  // Rate limiting: 200 requests per minute per IP
  const limit = await rateLimit(env, request, 200, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const cacheKey = `portal:player:${playerId}`;

    const player = await cache(
      env,
      cacheKey,
      async () => {
        return await fetchPlayerDetail(env, playerId);
      },
      120 // 2 minute cache for player details
    );

    if (!player) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Player not found',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return ok({
      success: true,
      player,
      meta: {
        dataSource: 'BSI Transfer Portal Database',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (error) {
    console.error('Player detail error:', error);
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
 * Fetch player detail from D1 database
 */
async function fetchPlayerDetail(env, playerId) {
  const db = env.BSI_PORTAL_DB;
  if (!db) {
    // Return sample data if no D1 binding (development mode)
    return getSamplePlayerData(playerId);
  }

  // Fetch player from database
  const player = await db
    .prepare('SELECT * FROM portal_entries WHERE id = ?')
    .bind(playerId)
    .first();

  if (!player) {
    return null;
  }

  // Fetch player stats if available
  let stats = null;
  try {
    stats = await db
      .prepare('SELECT * FROM player_stats WHERE player_id = ? ORDER BY season DESC LIMIT 1')
      .bind(playerId)
      .first();
  } catch {
    // Stats table may not exist yet
  }

  // Fetch player timeline if available
  let timeline = [];
  try {
    const { results } = await db
      .prepare('SELECT * FROM player_timeline WHERE player_id = ? ORDER BY event_date DESC')
      .bind(playerId)
      .all();
    timeline = results || [];
  } catch {
    // Timeline table may not exist yet
  }

  // Transform to response format
  return {
    id: player.id,
    player_name: player.player_name,
    school_from: player.school_from,
    school_to: player.school_to,
    position: player.position,
    conference: player.conference,
    class_year: player.class_year,
    status: player.status,
    portal_date: player.portal_date,
    engagement_score: player.engagement_score || 0,
    source: player.source,
    verified: Boolean(player.verified),
    stats: stats
      ? {
          avg: stats.batting_avg,
          hr: stats.home_runs,
          rbi: stats.rbi,
          era: stats.era,
          wins: stats.wins,
          losses: stats.losses,
          strikeouts: stats.strikeouts,
          ip: stats.innings_pitched,
          games: stats.games_played,
          obp: stats.obp,
          slg: stats.slg,
          sb: stats.stolen_bases,
        }
      : null,
    bio: {
      height: player.height,
      weight: player.weight,
      hometown: player.hometown,
      high_school: player.high_school,
      bats: player.bats,
      throws: player.throws,
    },
    timeline: timeline.map((t) => ({
      date: t.event_date,
      event: t.event_type,
      description: t.description,
    })),
  };
}

/**
 * Sample player data for development/fallback
 * Comprehensive profiles for realistic testing
 */
function getSamplePlayerData(playerId) {
  const samplePlayers = {
    // Baseball players
    'tp-2025-001': {
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
      stats: {
        era: 2.87,
        wins: 8,
        losses: 2,
        strikeouts: 94,
        ip: 78.2,
        games: 15,
      },
      bio: {
        height: '6\'3"',
        weight: '205 lbs',
        hometown: 'Houston, TX',
        high_school: 'St. Thomas',
        throws: 'Right',
      },
      timeline: [
        {
          date: '2025-06-02',
          event: 'Entered Portal',
          description: 'Declared for transfer portal after strong junior season',
        },
        {
          date: '2025-05-28',
          event: 'Season Ended',
          description: 'Texas A&M eliminated in Super Regional',
        },
        { date: '2025-05-15', event: 'Award', description: 'Named Second Team All-SEC' },
      ],
    },
    'tp-2025-002': {
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
      stats: {
        avg: 0.312,
        hr: 14,
        rbi: 52,
        obp: 0.401,
        slg: 0.567,
        sb: 12,
        games: 58,
      },
      bio: {
        height: '6\'1"',
        weight: '185 lbs',
        hometown: 'Miami, FL',
        high_school: 'Columbus',
        bats: 'Right',
        throws: 'Right',
      },
      timeline: [
        { date: '2025-06-10', event: 'Committed', description: 'Announced commitment to LSU' },
        {
          date: '2025-06-02',
          event: 'Entered Portal',
          description: 'Declared for transfer portal',
        },
        { date: '2025-05-20', event: 'Award', description: 'First Team All-SEC' },
      ],
    },
    'tp-2025-003': {
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
      stats: {
        avg: 0.289,
        hr: 8,
        rbi: 38,
        obp: 0.365,
        slg: 0.485,
        sb: 15,
        games: 52,
      },
      bio: {
        height: '5\'11"',
        weight: '180 lbs',
        hometown: 'Portland, OR',
        high_school: 'Jesuit',
        bats: 'Left',
        throws: 'Right',
      },
      timeline: [
        {
          date: '2025-06-03',
          event: 'Entered Portal',
          description: 'Seeking starting opportunity',
        },
      ],
    },
    'tp-2025-004': {
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
      stats: {
        era: 3.24,
        wins: 6,
        losses: 3,
        strikeouts: 78,
        ip: 69.1,
        games: 14,
      },
      bio: {
        height: '6\'2"',
        weight: '195 lbs',
        hometown: 'Coral Gables, FL',
        high_school: 'Belen Jesuit',
        throws: 'Left',
      },
      timeline: [
        { date: '2025-06-15', event: 'Committed', description: 'Committed to Texas Longhorns' },
        { date: '2025-06-02', event: 'Entered Portal', description: 'Entered transfer portal' },
      ],
    },
    'tp-2025-010': {
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
      stats: {
        era: 2.65,
        wins: 9,
        losses: 2,
        strikeouts: 101,
        ip: 85.0,
        games: 16,
      },
      bio: {
        height: '6\'4"',
        weight: '215 lbs',
        hometown: 'Nashville, TN',
        high_school: 'Montgomery Bell Academy',
        throws: 'Right',
      },
      timeline: [
        {
          date: '2025-06-04',
          event: 'Entered Portal',
          description: 'High-profile pitcher enters portal',
        },
        {
          date: '2025-05-18',
          event: 'Award',
          description: 'First Team All-SEC, Pitcher of the Year finalist',
        },
      ],
    },

    // College Football players (for CFB portal)
    'cfb-2025-001': {
      id: 'cfb-2025-001',
      player_name: 'Jaylen Carter',
      school_from: 'Georgia',
      school_to: null,
      position: 'QB',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-12-09',
      engagement_score: 98,
      source: 'official',
      verified: true,
      stars: 4,
      stats: {
        passingYards: 2847,
        passingTDs: 24,
        interceptions: 6,
        completionPct: 67.2,
        rushingYards: 312,
        rushingTDs: 4,
        games: 12,
      },
      bio: {
        height: '6\'3"',
        weight: '215 lbs',
        hometown: 'Atlanta, GA',
        high_school: 'Westlake',
      },
      timeline: [
        {
          date: '2025-12-09',
          event: 'Entered Portal',
          description: 'Star QB enters portal seeking starting role',
        },
        {
          date: '2025-12-01',
          event: 'Season Ended',
          description: 'Georgia finishes regular season',
        },
      ],
    },
    'cfb-2025-002': {
      id: 'cfb-2025-002',
      player_name: 'Marcus Williams',
      school_from: 'Ohio State',
      school_to: 'Texas',
      position: 'WR',
      conference: 'Big Ten',
      class_year: 'Sr',
      status: 'committed',
      portal_date: '2025-12-09',
      engagement_score: 94,
      source: 'd1football',
      verified: true,
      stars: 5,
      stats: {
        receptions: 68,
        receivingYards: 1124,
        receivingTDs: 11,
        yardsPerCatch: 16.5,
        games: 13,
      },
      bio: {
        height: '6\'2"',
        weight: '195 lbs',
        hometown: 'Columbus, OH',
        high_school: 'Bishop Hartley',
      },
      timeline: [
        { date: '2025-12-15', event: 'Committed', description: 'Commits to Texas Longhorns' },
        { date: '2025-12-09', event: 'Entered Portal', description: 'Five-star WR enters portal' },
      ],
    },

    // Fallback for sample-player-1 used in PlayerDetailClient mock
    'sample-player-1': {
      id: 'sample-player-1',
      player_name: 'Jake Wilson',
      school_from: 'Texas A&M',
      school_to: null,
      position: 'RHP',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-02',
      engagement_score: 95,
      verified: true,
      stats: {
        era: 2.87,
        wins: 8,
        losses: 2,
        strikeouts: 94,
        ip: 78.2,
        games: 15,
      },
      bio: {
        height: '6\'3"',
        weight: '205 lbs',
        hometown: 'Houston, TX',
        high_school: 'St. Thomas',
        throws: 'Right',
      },
      timeline: [
        {
          date: '2025-06-02',
          event: 'Entered Portal',
          description: 'Declared for transfer portal',
        },
      ],
    },
  };

  return samplePlayers[playerId] || null;
}
