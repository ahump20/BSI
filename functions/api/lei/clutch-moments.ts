/**
 * Blaze Sports Intel - Leverage Equivalency Index (LEI) API
 * Retrieve clutch moments ranked by leverage index
 *
 * GET /api/lei/clutch-moments - Get clutch moments with filters
 */

interface ClutchMoment {
  id: string;
  gameId: string;
  sport: string;
  eventType: string;
  timestamp: string;
  gameTimestamp: string | null;
  leverageIndex: number;
  winProbDelta: number | null;
  significanceScore: number;
  teams: string | null;
  players: string | null;
  highlightType: string | null;
  date: string | null;
}

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);

    // Parse query parameters
    const sport = url.searchParams.get('sport') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '50');
    const offset = parseInt(url.searchParams.get('offset') ?? '0');
    const minLeverage = parseFloat(url.searchParams.get('minLeverage') ?? '0');

    // Build query conditions
    const conditions: string[] = ['le.leverage_index IS NOT NULL'];
    const params: any[] = [];

    if (sport) {
      conditions.push('le.sport = ?');
      params.push(sport);
    }

    if (minLeverage > 0) {
      conditions.push('le.leverage_index >= ?');
      params.push(minLeverage);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM live_events le
      LEFT JOIN highlights h ON h.game_id = le.game_id
      ${whereClause}
    `;
    const countResult = await context.env.DB.prepare(countQuery)
      .bind(...params)
      .first<{ count: number }>();
    const total = countResult?.count ?? 0;

    // Get clutch moments ordered by leverage index
    const query = `
      SELECT
        le.id,
        le.game_id as gameId,
        le.sport,
        le.event_type as eventType,
        le.timestamp,
        le.game_timestamp as gameTimestamp,
        le.leverage_index as leverageIndex,
        le.win_prob_delta as winProbDelta,
        le.significance_score as significanceScore,
        h.teams,
        h.players,
        h.highlight_type as highlightType,
        h.date
      FROM live_events le
      LEFT JOIN highlights h ON h.game_id = le.game_id
      ${whereClause}
      ORDER BY le.leverage_index DESC, le.significance_score DESC
      LIMIT ? OFFSET ?
    `;

    const result = await context.env.DB.prepare(query)
      .bind(...params, limit, offset)
      .all<ClutchMoment>();

    const clutchMoments = result.results ?? [];

    const response = {
      moments: clutchMoments.map((moment) => ({
        ...moment,
        teams: moment.teams ? JSON.parse(moment.teams) : null,
        players: moment.players ? JSON.parse(moment.players) : null,
      })),
      total,
      hasMore: offset + limit < total,
      filters: {
        sport,
        minLeverage,
        limit,
        offset,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minute cache
      },
    });
  } catch (error) {
    console.error('Error fetching clutch moments:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
