/**
 * BSI User Watchlist API
 * Persists user watchlist to D1 for cross-device sync.
 *
 * GET /api/user/watchlist - Fetch user's watchlist
 * PUT /api/user/watchlist - Sync entire watchlist
 */

type WatchlistSport = 'college_baseball' | 'mlb' | 'nfl' | 'cfb' | 'cbb';

interface Env {
  DB?: D1Database;
  BSI_CACHE?: KVNamespace;
}

interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

interface WatchlistTeam {
  id: string;
  name: string;
  abbreviation?: string;
  conference?: string;
  sport: WatchlistSport;
  logo?: string;
  record?: string;
  ranking?: number;
}

interface WatchlistRow {
  id: number;
  user_id: string;
  team_id: string;
  team_name: string;
  team_abbreviation: string | null;
  conference: string | null;
  sport: WatchlistSport;
  logo_url: string | null;
  team_record: string | null;
  team_ranking: number | null;
  added_at: string;
}

function getUserId(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const url = new URL(request.url);
  return url.searchParams.get('userId');
}

function rowToTeam(row: WatchlistRow): WatchlistTeam {
  return {
    id: row.team_id,
    name: row.team_name,
    abbreviation: row.team_abbreviation || undefined,
    conference: row.conference || undefined,
    sport: row.sport,
    logo: row.logo_url || undefined,
    record: row.team_record || undefined,
    ranking: row.team_ranking || undefined,
  };
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const userId = getUserId(context.request);

  if (!userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!context.env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: 'Database not available' },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await context.env.DB.prepare(
      `SELECT * FROM user_watchlists WHERE user_id = ? ORDER BY added_at DESC`
    )
      .bind(userId)
      .all<WatchlistRow>();

    const teams = result.results?.map(rowToTeam) || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId,
          teams,
          lastUpdated: teams.length > 0 ? result.results?.[0]?.added_at : null,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_ERROR', message },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPut(context: EventContext<Env>): Promise<Response> {
  const userId = getUserId(context.request);

  if (!userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!context.env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: 'Database not available' },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { teams: WatchlistTeam[] };
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_JSON', message: 'Invalid request body' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!Array.isArray(body.teams)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INVALID_DATA', message: 'teams must be an array' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await context.env.DB.prepare(`DELETE FROM user_watchlists WHERE user_id = ?`)
      .bind(userId)
      .run();

    if (body.teams.length > 0) {
      const insertStmt = context.env.DB.prepare(`
        INSERT INTO user_watchlists
        (user_id, team_id, team_name, team_abbreviation, conference, sport, logo_url, team_record, team_ranking)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const batch = body.teams.map((team) =>
        insertStmt.bind(
          userId,
          team.id,
          team.name,
          team.abbreviation || null,
          team.conference || null,
          team.sport,
          team.logo || null,
          team.record || null,
          team.ranking || null
        )
      );

      await context.env.DB.batch(batch);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userId,
          teamsCount: body.teams.length,
          syncedAt: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'DB_ERROR', message },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export default { onRequestGet, onRequestPut };
