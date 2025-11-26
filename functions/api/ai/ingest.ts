/**
 * Sports Data Ingestion for Vectorize
 * Indexes sports content for AI-powered semantic search
 *
 * POST /api/ai/ingest - Index new content
 * POST /api/ai/ingest/batch - Batch index multiple items
 */

interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  KV: KVNamespace;
  DB: D1Database;
}

interface IngestRequest {
  id: string;
  title: string;
  content: string;
  sport: 'mlb' | 'nfl' | 'nba' | 'ncaa';
  category?: string;
  team?: string;
  date?: string;
  metadata?: Record<string, unknown>;
}

interface BatchIngestRequest {
  items: IngestRequest[];
}

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Check for batch endpoint
  if (url.pathname.endsWith('/batch')) {
    return handleBatchIngest(context);
  }

  try {
    const body = (await request.json()) as IngestRequest;
    const result = await ingestSingle(env, body);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return new Response(
      JSON.stringify({
        error: 'Ingestion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

async function handleBatchIngest(context: EventContext<Env, string, unknown>): Promise<Response> {
  const { request, env } = context;

  try {
    const body = (await request.json()) as BatchIngestRequest;

    if (!body.items || !Array.isArray(body.items)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid batch format. Expected { items: [...] }',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const results = await Promise.allSettled(body.items.map((item) => ingestSingle(env, item)));

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        total: body.items.length,
        succeeded,
        failed,
        results: results.map((r, i) => ({
          id: body.items[i].id,
          status: r.status,
          ...(r.status === 'rejected' ? { error: r.reason } : {}),
        })),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Batch ingest error:', error);
    return new Response(
      JSON.stringify({
        error: 'Batch ingestion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function ingestSingle(
  env: Env,
  item: IngestRequest
): Promise<{ id: string; indexed: boolean }> {
  const { id, title, content, sport, category, team, date, metadata } = item;

  if (!id || !content || !sport) {
    throw new Error('Missing required fields: id, content, sport');
  }

  // Combine title and content for embedding
  const textToEmbed = `${title ? title + ': ' : ''}${content}`;

  // Generate embedding
  const embeddingResponse = await env.AI.run(EMBEDDING_MODEL, {
    text: textToEmbed,
  });

  const embedding = embeddingResponse.data[0];

  // Prepare metadata for Vectorize
  const vectorMetadata: Record<string, string | number | boolean> = {
    title: title || '',
    content: content.substring(0, 1000), // Truncate for storage
    sport,
    category: category || 'general',
    team: team || '',
    date: date || new Date().toISOString(),
    indexed_at: new Date().toISOString(),
  };

  // Add any additional metadata (flattened)
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        vectorMetadata[`meta_${key}`] = value;
      }
    }
  }

  // Upsert to Vectorize
  await env.VECTORIZE.upsert([
    {
      id,
      values: embedding,
      metadata: vectorMetadata,
    },
  ]);

  // Track in KV for reference
  await env.KV.put(
    `indexed:${id}`,
    JSON.stringify({
      sport,
      title,
      indexed_at: new Date().toISOString(),
    }),
    { expirationTtl: 86400 * 30 }
  ); // 30 days

  return { id, indexed: true };
}

// Utility endpoint to sync data from D1 to Vectorize
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const sport = url.searchParams.get('sport');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  try {
    // Query recent data from D1
    const query = sport
      ? `SELECT id, title, content, sport, team, created_at FROM sports_content WHERE sport = ? ORDER BY created_at DESC LIMIT ?`
      : `SELECT id, title, content, sport, team, created_at FROM sports_content ORDER BY created_at DESC LIMIT ?`;

    const params = sport ? [sport, limit] : [limit];
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No content found to index',
          hint: 'POST content to /api/ai/ingest first',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Index each result
    const indexResults = await Promise.allSettled(
      results.map((row) =>
        ingestSingle(env, {
          id: row.id as string,
          title: row.title as string,
          content: row.content as string,
          sport: row.sport as 'mlb' | 'nfl' | 'nba' | 'ncaa',
          team: row.team as string,
          date: row.created_at as string,
        })
      )
    );

    const succeeded = indexResults.filter((r) => r.status === 'fulfilled').length;

    return new Response(
      JSON.stringify({
        message: `Indexed ${succeeded} of ${results.length} items`,
        sport: sport || 'all',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
