/**
 * Blazecraft Replay Upload API
 *
 * POST /api/blazecraft/upload - Upload new replay
 */

interface Env {
  BLAZECRAFT_DB: D1Database;
  BLAZECRAFT_REPLAYS: R2Bucket;
  BLAZECRAFT_CACHE: KVNamespace;
  BLAZECRAFT_ANALYTICS: AnalyticsEngineDataset;
}

// Simple validation - full Zod validation happens client-side
interface ReplayMetadata {
  matchId: string;
  timestamp: string;
  map: {
    name?: string;
    width: number;
    height: number;
  };
  agents: Array<{
    id: string;
    name: string;
    team: string;
    type: string;
  }>;
  duration: number;
}

interface UploadRequest {
  replay: {
    version: string;
    metadata: ReplayMetadata;
    ticks: unknown[];
  };
  title?: string;
  tags?: string[];
  isPublic?: boolean;
}

// ─────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // Parse request body
    const body = await request.json() as UploadRequest;

    // Basic validation
    if (!body.replay?.metadata?.matchId) {
      return new Response(
        JSON.stringify({ error: 'Invalid replay: missing matchId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.replay?.ticks?.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid replay: no ticks' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { replay, title, tags, isPublic = true } = body;
    const { metadata } = replay;

    // Generate unique ID
    const id = generateId();
    const fileKey = `replays/${id}.json`;

    // Upload to R2
    const replayJson = JSON.stringify(replay);
    const fileSize = new TextEncoder().encode(replayJson).length;

    await env.BLAZECRAFT_REPLAYS.put(fileKey, replayJson, {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        matchId: metadata.matchId,
        map: metadata.map.name ?? 'unknown',
        duration: String(metadata.duration),
      },
    });

    // Insert metadata into D1
    const now = new Date().toISOString();

    await env.BLAZECRAFT_DB.prepare(`
      INSERT INTO replays (id, title, map, agents, duration, uploaded_at, file_key, file_size, metadata, tags, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      title ?? null,
      metadata.map.name ?? 'unknown',
      JSON.stringify(metadata.agents),
      metadata.duration,
      now,
      fileKey,
      fileSize,
      JSON.stringify({
        matchId: metadata.matchId,
        timestamp: metadata.timestamp,
        gameVersion: (replay as { gameVersion?: string }).gameVersion,
      }),
      tags ? JSON.stringify(tags) : null,
      isPublic ? 1 : 0
    ).run();

    // Log analytics event
    env.BLAZECRAFT_ANALYTICS?.writeDataPoint({
      blobs: ['replay_upload', metadata.map.name ?? 'unknown'],
      doubles: [metadata.duration, fileSize],
      indexes: [id],
    });

    return new Response(JSON.stringify({
      success: true,
      id,
      fileSize,
      url: `/api/blazecraft/replay?id=${id}`,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error uploading replay:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload replay',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateId(): string {
  // Simple ID: timestamp + random suffix
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `bc_${timestamp}_${random}`;
}
