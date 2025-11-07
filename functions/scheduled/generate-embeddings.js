/**
 * 🔥 Blaze Sports Intel - Scheduled Embedding Generation
 *
 * This Cloudflare Pages Function generates embeddings for all game descriptions
 * using Workers AI and stores them in Vectorize for semantic search.
 *
 * Trigger: Manual via /scheduled/generate-embeddings or Cron (future)
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Security: Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed. Use POST.', { status: 405 });
  }

  // Temporarily disabled for initial embedding generation
  // const authToken = request.headers.get('X-Auth-Token');
  // if (authToken !== env.EMBEDDING_SECRET) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {

    // Step 1: Query all games with descriptions from D1
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
        season,
        week
      FROM games
      WHERE description IS NOT NULL
      ORDER BY game_date DESC
    `).all();

    const games = gamesQuery.results || [];

    if (games.length === 0) {
      return Response.json({
        success: true,
        message: 'No games to process',
        processed: 0
      });
    }

    // Step 2: Generate embeddings and insert into Vectorize
    const results = {
      total: games.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Process in batches of 10 for better performance
    const BATCH_SIZE = 10;
    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const batch = games.slice(i, i + BATCH_SIZE);

      // Process batch in parallel
      await Promise.allSettled(
        batch.map(async (game) => {
          try {
            // Generate embedding using Workers AI
            const embeddingResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
              text: game.description
            });

            // Extract the embedding vector
            const embedding = embeddingResult.data[0];

            if (!embedding || embedding.length !== 768) {
              throw new Error(`Invalid embedding dimension: ${embedding?.length || 0}`);
            }

            // Create unique vector ID
            const vectorId = `${game.sport}-${game.game_id}`;

            // Prepare metadata
            const metadata = {
              game_db_id: game.id,
              game_id: game.game_id,
              sport: game.sport,
              home_team: game.home_team_name,
              away_team: game.away_team_name,
              home_score: game.home_score || 0,
              away_score: game.away_score || 0,
              game_date: game.game_date,
              season: game.season,
              week: game.week || 0,
              description: game.description.substring(0, 500)
            };

            // Insert into Vectorize
            await env.VECTOR_INDEX.upsert([
              {
                id: vectorId,
                values: embedding,
                metadata
              }
            ]);

            results.success++;

          } catch (error) {
            results.failed++;
            results.errors.push({
              game_id: game.game_id,
              sport: game.sport,
              error: error.message
            });
            console.error(`❌ Failed for ${game.sport}-${game.game_id}:`, error.message);
          }
        })
      );

      // Log progress
    }

    // Return summary
    return Response.json({
      success: true,
      message: 'Embedding generation complete',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
