/**
 * Blaze Sports Intel - Reconstruction API
 * Retrieve and generate 3D reconstructions
 *
 * GET /api/live-events/reconstructions - Get reconstructions with filters
 * GET /api/live-events/reconstructions/:id - Get single reconstruction
 */

import type { GetReconstructionsRequest, GetReconstructionsResponse, Reconstruction } from '../../../lib/reconstruction/types';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);

    // Check if requesting single reconstruction by ID
    const pathParts = url.pathname.split('/');
    const reconstructionId = pathParts[pathParts.length - 1];

    if (reconstructionId && reconstructionId !== 'reconstructions') {
      return getSingleReconstruction(context, reconstructionId);
    }

    // Get list with filters
    const gameId = url.searchParams.get('gameId') ?? undefined;
    const eventId = url.searchParams.get('eventId') ?? undefined;
    const sport = url.searchParams.get('sport') ?? undefined;
    const date = url.searchParams.get('date') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '50');
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    const request: GetReconstructionsRequest = {
      gameId,
      eventId,
      sport: sport as any,
      date,
      limit,
      offset,
    };

    // Build query
    const conditions: string[] = [];
    const params: any[] = [];

    if (request.gameId) {
      conditions.push('le.game_id = ?');
      params.push(request.gameId);
    }

    if (request.eventId) {
      conditions.push('r.event_id = ?');
      params.push(request.eventId);
    }

    if (request.sport) {
      conditions.push('le.sport = ?');
      params.push(request.sport);
    }

    if (request.date) {
      conditions.push('DATE(r.created_at) = ?');
      params.push(request.date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM reconstructions r
      JOIN live_events le ON r.event_id = le.id
      ${whereClause}
    `;
    const countResult = await context.env.DB.prepare(countQuery).bind(...params).first<{ count: number }>();
    const total = countResult?.count ?? 0;

    // Get reconstructions
    const query = `
      SELECT r.*, le.sport, le.event_type, le.game_timestamp, le.significance_score
      FROM reconstructions r
      JOIN live_events le ON r.event_id = le.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await context.env.DB.prepare(query)
      .bind(...params, limit, offset)
      .all<Reconstruction>();

    const reconstructions = (result.results ?? []).map((r) => ({
      ...r,
      sceneData: JSON.parse(r.sceneData as unknown as string),
      physicsParams: r.physicsParams ? JSON.parse(r.physicsParams as unknown as string) : null,
      predictionData: r.predictionData ? JSON.parse(r.predictionData as unknown as string) : null,
      actualOutcome: JSON.parse(r.actualOutcome as unknown as string),
    }));

    const response: GetReconstructionsResponse = {
      reconstructions,
      total,
      hasMore: offset + limit < total,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error fetching reconstructions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function getSingleReconstruction(context: EventContext<Env, any, Record<string, unknown>>, id: string) {
  try {
    const result = await context.env.DB.prepare(
      `SELECT r.*, le.sport, le.event_type, le.game_timestamp, le.raw_data, le.statcast_data
       FROM reconstructions r
       JOIN live_events le ON r.event_id = le.id
       WHERE r.id = ?`
    )
      .bind(id)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Reconstruction not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reconstruction = {
      ...result,
      sceneData: JSON.parse(result.sceneData as string),
      physicsParams: result.physicsParams ? JSON.parse(result.physicsParams as string) : null,
      predictionData: result.predictionData ? JSON.parse(result.predictionData as string) : null,
      actualOutcome: JSON.parse(result.actualOutcome as string),
      rawData: JSON.parse(result.raw_data as string),
      statcastData: result.statcast_data ? JSON.parse(result.statcast_data as string) : null,
    };

    // Increment view count
    await context.env.DB.prepare('UPDATE reconstructions SET view_count = view_count + 1 WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify(reconstruction), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error fetching reconstruction:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
