/**
 * BSI Fanbase Sentiment API
 * Serves fanbase profiles, sentiment history, and comparisons.
 *
 * Routes:
 * GET  /api/v1/fanbase                     - List all fanbases
 * GET  /api/v1/fanbase/{school-slug}       - Full profile + recent sentiment
 * GET  /api/v1/fanbase/{school}/history    - Sentiment timeline
 * GET  /api/v1/fanbase/conference/{conf}   - All teams in conference
 * GET  /api/v1/fanbase/compare?teams=a,b   - Side-by-side comparison
 * GET  /api/v1/fanbase/trending            - Biggest sentiment shifts this week
 * POST /api/v1/fanbase/{school}/snapshot   - Add new sentiment snapshot (admin)
 */

import type { APIResponse } from '../../../../lib/api-contract';
import {
  createSuccessResponse,
  createInvalidResponse,
  createUnavailableResponse,
} from '../../../../lib/api-contract';
import type {
  FanbaseProfile,
  FanbaseProfileRow,
  SentimentSnapshot,
  SentimentSnapshotRow,
  FanbaseComparison,
  TrendingFanbase,
  SentimentSnapshotInput,
  Conference,
} from '../../../../lib/fanbase/types';
import {
  rowToFanbaseProfile,
  rowToSentimentSnapshot,
  calculateSentimentTrend,
  calculateSentimentDelta,
} from '../../../../lib/fanbase/types';

/** Environment bindings */
interface Env {
  FANBASE_DB: D1Database;
  BSI_FANBASE_CACHE: KVNamespace;
  ADMIN_API_KEY?: string;
}

/** Cloudflare D1 types */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
}

/** Context from Cloudflare Pages Functions */
interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

const CACHE_TTL = 300; // 5 minutes
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Valid conferences */
const VALID_CONFERENCES: Conference[] = [
  'SEC',
  'Big Ten',
  'Big 12',
  'ACC',
  'Pac-12',
  'Independent',
];

/**
 * Parse route path into segments
 */
function parseRoute(url: URL): string[] {
  return url.pathname.split('/').filter(Boolean).slice(3); // Remove api/v1/fanbase
}

/**
 * Create JSON response with proper headers
 */
function jsonResponse<T>(data: APIResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

/**
 * GET handler for fanbase endpoints
 */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const route = parseRoute(url);

  // /api/v1/fanbase - List all fanbases
  if (route.length === 0) {
    return handleListFanbases(context);
  }

  const first = route[0];

  // /api/v1/fanbase/trending
  if (first === 'trending') {
    return handleTrending(context);
  }

  // /api/v1/fanbase/compare?teams=a,b
  if (first === 'compare') {
    const teams = url.searchParams.get('teams');
    return handleCompare(context, teams);
  }

  // /api/v1/fanbase/conference/{conf}
  if (first === 'conference' && route.length >= 2) {
    return handleConference(context, route[1]);
  }

  // /api/v1/fanbase/{school}/history
  if (route.length === 2 && route[1] === 'history') {
    const season = url.searchParams.get('season');
    return handleHistory(context, route[0], season ? parseInt(season, 10) : undefined);
  }

  // /api/v1/fanbase/{school-slug}
  if (route.length === 1) {
    return handleGetProfile(context, route[0]);
  }

  return jsonResponse(createInvalidResponse('INVALID_ROUTE', 'Unknown route'), 400);
}

/**
 * POST handler for admin operations
 */
export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const route = parseRoute(url);

  // Verify admin auth
  const authHeader = context.request.headers.get('Authorization');
  const expectedKey = context.env.ADMIN_API_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return jsonResponse(createInvalidResponse('UNAUTHORIZED', 'Invalid or missing API key'), 401);
  }

  // /api/v1/fanbase/{school}/snapshot
  if (route.length === 2 && route[1] === 'snapshot') {
    return handleAddSnapshot(context, route[0]);
  }

  // /api/v1/fanbase (create profile)
  if (route.length === 0) {
    return handleCreateProfile(context);
  }

  return jsonResponse(createInvalidResponse('INVALID_ROUTE', 'Unknown POST route'), 400);
}

/**
 * List all fanbase profiles
 */
async function handleListFanbases(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const conference = url.searchParams.get('conference');
  const sortBy = url.searchParams.get('sortBy') || 'name';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  // Check cache
  const cacheKey = `fanbase:list:${conference || 'all'}:${sortBy}:${limit}`;
  const cached = await context.env.BSI_FANBASE_CACHE.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse(
      createSuccessResponse(cached as FanbaseProfile[], 'live', {
        hit: true,
        ttlSeconds: CACHE_TTL,
        eligible: true,
      })
    );
  }

  // Build query
  let query = 'SELECT * FROM fanbase_profiles';
  const params: unknown[] = [];

  if (conference) {
    query += ' WHERE conference = ?';
    params.push(conference);
  }

  // Sort
  const sortColumn = sortBy === 'sentiment' ? 'sentiment_overall' : 'short_name';
  const sortOrder = sortBy === 'sentiment' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ?`;
  params.push(limit);

  const stmt = context.env.FANBASE_DB.prepare(query);
  const result = await stmt.bind(...params).all<FanbaseProfileRow>();

  if (!result.success) {
    return jsonResponse(createUnavailableResponse('DB_ERROR', 'Failed to fetch fanbases'), 503);
  }

  const profiles = result.results.map(rowToFanbaseProfile);

  // Cache result
  await context.env.BSI_FANBASE_CACHE.put(cacheKey, JSON.stringify(profiles), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(
    createSuccessResponse(profiles, 'live', { hit: false, ttlSeconds: CACHE_TTL, eligible: true })
  );
}

/**
 * Get single fanbase profile with recent snapshots
 */
async function handleGetProfile(context: EventContext<Env>, slug: string): Promise<Response> {
  // Check cache
  const cacheKey = `fanbase:profile:${slug}`;
  const cached = await context.env.BSI_FANBASE_CACHE.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse(
      createSuccessResponse(cached, 'live', { hit: true, ttlSeconds: CACHE_TTL, eligible: true })
    );
  }

  // Fetch profile
  const profileStmt = context.env.FANBASE_DB.prepare('SELECT * FROM fanbase_profiles WHERE id = ?');
  const profileRow = await profileStmt.bind(slug).first<FanbaseProfileRow>();

  if (!profileRow) {
    return jsonResponse(createInvalidResponse('NOT_FOUND', `Fanbase not found: ${slug}`), 404);
  }

  const profile = rowToFanbaseProfile(profileRow);

  // Fetch recent snapshots (last 5)
  const snapshotStmt = context.env.FANBASE_DB.prepare(
    'SELECT * FROM sentiment_snapshots WHERE fanbase_id = ? ORDER BY season DESC, week DESC LIMIT 5'
  );
  const snapshotResult = await snapshotStmt.bind(slug).all<SentimentSnapshotRow>();
  const snapshots = snapshotResult.results.map(rowToSentimentSnapshot);

  const response = {
    profile,
    recentSnapshots: snapshots,
    sentimentTrend: calculateSentimentTrend(snapshots),
    weekOverWeekChange:
      snapshots.length >= 2 ? calculateSentimentDelta(snapshots[1], snapshots[0]) : null,
  };

  // Cache result
  await context.env.BSI_FANBASE_CACHE.put(cacheKey, JSON.stringify(response), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(
    createSuccessResponse(response, 'live', { hit: false, ttlSeconds: CACHE_TTL, eligible: true })
  );
}

/**
 * Get sentiment history for a fanbase
 */
async function handleHistory(
  context: EventContext<Env>,
  slug: string,
  season?: number
): Promise<Response> {
  const currentSeason = season || new Date().getFullYear();
  const cacheKey = `fanbase:history:${slug}:${currentSeason}`;

  // Check cache
  const cached = await context.env.BSI_FANBASE_CACHE.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse(
      createSuccessResponse(cached as SentimentSnapshot[], 'live', {
        hit: true,
        ttlSeconds: CACHE_TTL,
        eligible: true,
      })
    );
  }

  // Verify fanbase exists
  const profileStmt = context.env.FANBASE_DB.prepare(
    'SELECT id FROM fanbase_profiles WHERE id = ?'
  );
  const profileExists = await profileStmt.bind(slug).first();

  if (!profileExists) {
    return jsonResponse(createInvalidResponse('NOT_FOUND', `Fanbase not found: ${slug}`), 404);
  }

  // Fetch snapshots for season
  const snapshotStmt = context.env.FANBASE_DB.prepare(
    'SELECT * FROM sentiment_snapshots WHERE fanbase_id = ? AND season = ? ORDER BY week ASC'
  );
  const result = await snapshotStmt.bind(slug, currentSeason).all<SentimentSnapshotRow>();
  const snapshots = result.results.map(rowToSentimentSnapshot);

  // Cache result
  await context.env.BSI_FANBASE_CACHE.put(cacheKey, JSON.stringify(snapshots), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(
    createSuccessResponse(snapshots, 'live', { hit: false, ttlSeconds: CACHE_TTL, eligible: true })
  );
}

/**
 * Get all fanbases in a conference
 */
async function handleConference(context: EventContext<Env>, conf: string): Promise<Response> {
  const normalizedConf =
    conf.toUpperCase() === 'SEC' ? 'SEC' : conf.toLowerCase().replace(/\s+/g, '-');

  // Validate conference
  if (
    !VALID_CONFERENCES.some(
      (c) => c.toLowerCase().replace(/\s+/g, '-') === normalizedConf.toLowerCase()
    )
  ) {
    return jsonResponse(
      createInvalidResponse(
        'INVALID_CONFERENCE',
        `Unknown conference: ${conf}. Valid: ${VALID_CONFERENCES.join(', ')}`
      ),
      400
    );
  }

  const cacheKey = `fanbase:conference:${normalizedConf}`;
  const cached = await context.env.BSI_FANBASE_CACHE.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse(
      createSuccessResponse(cached as FanbaseProfile[], 'live', {
        hit: true,
        ttlSeconds: CACHE_TTL,
        eligible: true,
      })
    );
  }

  const stmt = context.env.FANBASE_DB.prepare(
    'SELECT * FROM fanbase_profiles WHERE conference = ? ORDER BY short_name ASC'
  );
  const result = await stmt
    .bind(normalizedConf === 'sec' ? 'SEC' : normalizedConf)
    .all<FanbaseProfileRow>();
  const profiles = result.results.map(rowToFanbaseProfile);

  // Cache result
  await context.env.BSI_FANBASE_CACHE.put(cacheKey, JSON.stringify(profiles), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(
    createSuccessResponse(profiles, 'live', { hit: false, ttlSeconds: CACHE_TTL, eligible: true })
  );
}

/**
 * Compare two fanbases
 */
async function handleCompare(context: EventContext<Env>, teams: string | null): Promise<Response> {
  if (!teams) {
    return jsonResponse(
      createInvalidResponse('MISSING_PARAM', 'teams parameter required (comma-separated slugs)'),
      400
    );
  }

  const slugs = teams
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length !== 2) {
    return jsonResponse(
      createInvalidResponse('INVALID_PARAM', 'Exactly 2 team slugs required'),
      400
    );
  }

  const cacheKey = `fanbase:compare:${slugs.sort().join(':')}`;
  const cached = await context.env.BSI_FANBASE_CACHE.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse(
      createSuccessResponse(cached as FanbaseComparison, 'live', {
        hit: true,
        ttlSeconds: CACHE_TTL,
        eligible: true,
      })
    );
  }

  // Fetch both profiles
  const profiles: (FanbaseProfile | null)[] = [];

  for (const slug of slugs) {
    const stmt = context.env.FANBASE_DB.prepare('SELECT * FROM fanbase_profiles WHERE id = ?');
    const row = await stmt.bind(slug).first<FanbaseProfileRow>();
    profiles.push(row ? rowToFanbaseProfile(row) : null);
  }

  if (!profiles[0] || !profiles[1]) {
    const missing = slugs.filter((_, i) => !profiles[i]).join(', ');
    return jsonResponse(
      createInvalidResponse('NOT_FOUND', `Fanbase(s) not found: ${missing}`),
      404
    );
  }

  // Check for rivalry
  const rivalryStmt = context.env.FANBASE_DB.prepare(
    'SELECT * FROM fanbase_rivalries WHERE (team_a_id = ? AND team_b_id = ?) OR (team_a_id = ? AND team_b_id = ?)'
  );
  const rivalry = await rivalryStmt.bind(slugs[0], slugs[1], slugs[1], slugs[0]).first();

  // Determine advantage
  const sentimentAdvantage =
    profiles[0].sentiment.overall > profiles[1].sentiment.overall
      ? profiles[0].id
      : profiles[0].sentiment.overall < profiles[1].sentiment.overall
        ? profiles[1].id
        : null;

  const engagementAdvantage =
    profiles[0].engagement.socialMediaActivity + profiles[0].engagement.gameAttendance >
    profiles[1].engagement.socialMediaActivity + profiles[1].engagement.gameAttendance
      ? profiles[0].id
      : profiles[1].id;

  const comparison: FanbaseComparison = {
    teamA: profiles[0],
    teamB: profiles[1],
    rivalry: rivalry
      ? {
          id: (rivalry as { id: string }).id,
          teamA: slugs[0],
          teamB: slugs[1],
          name: (rivalry as { name: string }).name,
          intensity: (rivalry as { intensity: number }).intensity,
          historicalRecord:
            (rivalry as { historical_record: string | null }).historical_record ?? undefined,
          lastMeeting: (rivalry as { last_meeting: string | null }).last_meeting ?? undefined,
          trophyName: (rivalry as { trophy_name: string | null }).trophy_name ?? undefined,
        }
      : undefined,
    sentimentComparison: {
      teamA: profiles[0].sentiment,
      teamB: profiles[1].sentiment,
      advantageTeam: sentimentAdvantage,
    },
    engagementComparison: {
      teamA: profiles[0].engagement,
      teamB: profiles[1].engagement,
      advantageTeam: engagementAdvantage,
    },
    timestamp: new Date().toISOString(),
  };

  // Cache result
  await context.env.BSI_FANBASE_CACHE.put(cacheKey, JSON.stringify(comparison), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(
    createSuccessResponse(comparison, 'live', { hit: false, ttlSeconds: CACHE_TTL, eligible: true })
  );
}

/**
 * Get trending fanbases (biggest sentiment changes)
 */
async function handleTrending(context: EventContext<Env>): Promise<Response> {
  const cacheKey = 'fanbase:trending';
  const cached = await context.env.BSI_FANBASE_CACHE.get(cacheKey, 'json');
  if (cached) {
    return jsonResponse(
      createSuccessResponse(cached as TrendingFanbase[], 'live', {
        hit: true,
        ttlSeconds: CACHE_TTL,
        eligible: true,
      })
    );
  }

  // Use the view for trending
  const stmt = context.env.FANBASE_DB.prepare(`SELECT * FROM v_trending_fanbases LIMIT 10`);
  const result = await stmt.all<{
    fanbase_id: string;
    short_name: string;
    mascot: string;
    season: number;
    current_week: number;
    current_sentiment: number;
    previous_sentiment: number;
    delta: number;
    trend: string;
    abs_delta: number;
  }>();

  if (!result.success || result.results.length === 0) {
    // Return empty if no trending data yet
    return jsonResponse(
      createSuccessResponse([], 'live', { hit: false, ttlSeconds: 60, eligible: true })
    );
  }

  // Fetch full profiles for trending fanbases
  const trending: TrendingFanbase[] = [];

  for (let i = 0; i < result.results.length; i++) {
    const row = result.results[i];
    const profileStmt = context.env.FANBASE_DB.prepare(
      'SELECT * FROM fanbase_profiles WHERE id = ?'
    );
    const profileRow = await profileStmt.bind(row.fanbase_id).first<FanbaseProfileRow>();

    if (profileRow) {
      trending.push({
        fanbase: rowToFanbaseProfile(profileRow),
        delta: {
          fanbaseId: row.fanbase_id,
          fromWeek: row.current_week - 1,
          toWeek: row.current_week,
          season: row.season,
          overallChange: row.delta,
          optimismChange: 0, // Would need more data
          coachConfidenceChange: 0,
          playoffHopeChange: 0,
          trend: row.trend as 'rising' | 'stable' | 'falling',
          significantEvents: [],
        },
        rank: i + 1,
        direction: row.delta > 0 ? 'up' : 'down',
      });
    }
  }

  // Cache for 5 minutes
  await context.env.BSI_FANBASE_CACHE.put(cacheKey, JSON.stringify(trending), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(
    createSuccessResponse(trending, 'live', { hit: false, ttlSeconds: CACHE_TTL, eligible: true })
  );
}

/**
 * Add new sentiment snapshot (admin only)
 */
async function handleAddSnapshot(context: EventContext<Env>, slug: string): Promise<Response> {
  // Verify fanbase exists
  const profileStmt = context.env.FANBASE_DB.prepare(
    'SELECT id FROM fanbase_profiles WHERE id = ?'
  );
  const profileExists = await profileStmt.bind(slug).first();

  if (!profileExists) {
    return jsonResponse(createInvalidResponse('NOT_FOUND', `Fanbase not found: ${slug}`), 404);
  }

  // Parse request body
  let input: SentimentSnapshotInput;
  try {
    input = (await context.request.json()) as SentimentSnapshotInput;
  } catch {
    return jsonResponse(createInvalidResponse('INVALID_BODY', 'Invalid JSON body'), 400);
  }

  // Validate input
  if (!input.week || !input.season || !input.sentiment) {
    return jsonResponse(
      createInvalidResponse('MISSING_FIELDS', 'Required: week, season, sentiment'),
      400
    );
  }

  // Generate ID
  const id = `${slug}-${input.season}-w${input.week}`;
  const timestamp = new Date().toISOString();

  // Insert snapshot
  const insertStmt = context.env.FANBASE_DB.prepare(`
    INSERT OR REPLACE INTO sentiment_snapshots (
      id, fanbase_id, week, season, timestamp,
      sentiment_overall, sentiment_optimism, sentiment_coach_confidence, sentiment_playoff_hope,
      context_json, themes_json,
      data_source, confidence, sample_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await insertStmt
    .bind(
      id,
      slug,
      input.week,
      input.season,
      timestamp,
      input.sentiment.overall,
      input.sentiment.optimism,
      input.sentiment.coachConfidence,
      input.sentiment.playoffHope,
      JSON.stringify(input.context || {}),
      JSON.stringify(input.themes || []),
      input.dataSource || 'manual',
      input.confidence || 0.5,
      input.sampleSize || 0
    )
    .run();

  if (!result.success) {
    return jsonResponse(createUnavailableResponse('DB_ERROR', 'Failed to insert snapshot'), 503);
  }

  // Invalidate caches
  await Promise.all([
    context.env.BSI_FANBASE_CACHE.delete(`fanbase:profile:${slug}`),
    context.env.BSI_FANBASE_CACHE.delete(`fanbase:history:${slug}:${input.season}`),
    context.env.BSI_FANBASE_CACHE.delete('fanbase:trending'),
  ]);

  return jsonResponse(
    createSuccessResponse({ id, timestamp }, 'live', {
      hit: false,
      ttlSeconds: 0,
      eligible: false,
    }),
    201
  );
}

/**
 * Create new fanbase profile (admin only)
 */
async function handleCreateProfile(context: EventContext<Env>): Promise<Response> {
  let input: FanbaseProfile;
  try {
    input = (await context.request.json()) as FanbaseProfile;
  } catch {
    return jsonResponse(createInvalidResponse('INVALID_BODY', 'Invalid JSON body'), 400);
  }

  // Validate required fields
  if (!input.id || !input.school || !input.mascot || !input.conference) {
    return jsonResponse(
      createInvalidResponse('MISSING_FIELDS', 'Required: id, school, mascot, conference'),
      400
    );
  }

  const timestamp = new Date().toISOString();

  const insertStmt = context.env.FANBASE_DB.prepare(`
    INSERT OR REPLACE INTO fanbase_profiles (
      id, school, short_name, mascot, conference, primary_color, secondary_color, logo_url,
      sentiment_overall, sentiment_optimism, sentiment_loyalty, sentiment_volatility,
      engagement_social, engagement_attendance, engagement_travel, engagement_merch,
      demo_primary_age, demo_alumni_pct,
      personality_json, demo_geo_json,
      data_source, confidence, sample_size,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await insertStmt
    .bind(
      input.id,
      input.school,
      input.shortName || input.school.replace(/University of |University$/g, '').trim(),
      input.mascot,
      input.conference,
      input.primaryColor || '#000000',
      input.secondaryColor || '#FFFFFF',
      input.logo || null,
      input.sentiment?.overall || 0,
      input.sentiment?.optimism || 0.5,
      input.sentiment?.loyalty || 0.5,
      input.sentiment?.volatility || 0.5,
      input.engagement?.socialMediaActivity || 0.5,
      input.engagement?.gameAttendance || 0.5,
      input.engagement?.travelSupport || 0.5,
      input.engagement?.merchandisePurchasing || 0.5,
      input.demographics?.primaryAge || '25-45',
      input.demographics?.alumniPercentage || 0.3,
      JSON.stringify(
        input.personality || { traits: [], rivalries: [], traditions: [], quirks: [] }
      ),
      JSON.stringify(input.demographics?.geographicSpread || []),
      input.meta?.dataSource || 'manual',
      input.meta?.confidence || 0.5,
      input.meta?.sampleSize || 0,
      timestamp,
      timestamp
    )
    .run();

  if (!result.success) {
    return jsonResponse(createUnavailableResponse('DB_ERROR', 'Failed to create profile'), 503);
  }

  // Invalidate list cache
  await context.env.BSI_FANBASE_CACHE.delete('fanbase:list:all:name:50');

  return jsonResponse(
    createSuccessResponse({ id: input.id, created: timestamp }, 'live', {
      hit: false,
      ttlSeconds: 0,
      eligible: false,
    }),
    201
  );
}

export default {
  onRequestGet,
  onRequestPost,
};
