/**
 * Blaze Sports Intel - Production Embedding Generation
 *
 * Generates vector embeddings for all games using Workers AI
 * and stores them in Vectorize for semantic search.
 *
 * POST /api/copilot/admin/generate-embeddings
 * Body: { "batchSize": 10, "startFrom": 0 }
 */

export async function onRequest(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 50, 100); // Max 100 per request
    const startFrom = body.startFrom || 0;


    // Step 1: Query games from D1
    const gamesQuery = await env.DB.prepare(`
      SELECT
        id,
        sport,
        game_id,
        description,
        home_team_name,
        away_team_name,
        home_score,
        away_score,
        game_date,
        status
      FROM games
      WHERE description IS NOT NULL
      ORDER BY game_date DESC
      LIMIT ? OFFSET ?
    `).bind(batchSize, startFrom).all();

    if (!gamesQuery.success || !gamesQuery.results) {
      throw new Error('Failed to query games from database');
    }

    const games = gamesQuery.results;

    if (games.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No more games to process',
        processed: 0,
        totalTime: `${Date.now() - startTime}ms`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Generate embeddings and insert into Vectorize
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const game of games) {
      try {
        // Generate embedding using Workers AI
        const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: game.description
        });

        if (!embeddingResponse?.data?.[0]) {
          throw new Error('Invalid embedding response from Workers AI');
        }

        const embedding = embeddingResponse.data[0];

        // Create vector ID
        const vectorId = `${game.sport}-${game.game_id}`;

        // Insert into Vectorize
        await env.VECTOR_INDEX.upsert([{
          id: vectorId,
          values: embedding,
          metadata: {
            game_id: String(game.game_id),
            sport: game.sport,
            home_team: game.home_team_name,
            away_team: game.away_team_name,
            home_score: game.home_score || 0,
            away_score: game.away_score || 0,
            game_date: game.game_date,
            status: game.status,
            description: game.description.substring(0, 500)
          }
        }]);

        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          game_id: game.game_id,
          sport: game.sport,
          error: error.message
        });
        console.error(`❌ Failed to process game ${game.sport}-${game.game_id}:`, error.message);
      }
    }

    const totalTime = Date.now() - startTime;

    // Step 3: Return summary
    const response = {
      success: true,
      processed: games.length,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit error details
      totalTime: `${totalTime}ms`,
      avgTimePerGame: `${Math.round(totalTime / games.length)}ms`,
      nextBatch: startFrom + batchSize,
      hasMore: games.length === batchSize
    };


    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Embedding generation failed:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
