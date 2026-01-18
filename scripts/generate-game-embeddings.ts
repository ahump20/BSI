/**
 * Blaze Sports Intel - Game Embeddings Generator
 *
 * Generates embeddings for all games in D1 database and stores them in Vectorize.
 *
 * This script:
 * 1. Fetches all games from D1 database
 * 2. Generates descriptive text for each game
 * 3. Creates 768-dimensional embeddings using Workers AI (@cf/baai/bge-base-en-v1.5)
 * 4. Stores embeddings in Vectorize index with metadata
 *
 * Run with: wrangler pages dev --local and call via HTTP, or integrate into Pages Function
 *
 * Usage:
 * POST /api/copilot/admin/generate-embeddings
 *
 * Response includes:
 * - Total games processed
 * - Successful embeddings
 * - Failed embeddings
 * - Total time taken
 */

interface Env {
  DB: D1Database;
  VECTOR_INDEX: VectorizeIndex;
  AI: any;
}

interface GameRecord {
  id: number;
  sport: string;
  game_date: string;
  home_team_name: string;
  home_team_key: string;
  away_team_name: string;
  away_team_key: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stadium_name: string | null;
  season: number;
  week: number | null;
}

/**
 * Generate descriptive text for a game
 * This text will be embedded and used for semantic search
 */
function generateGameDescription(game: GameRecord): string {
  const parts: string[] = [];

  // Sport and season
  parts.push(`${game.sport} ${game.season}`);

  // Week (for NFL/CFB)
  if (game.week) {
    parts.push(`Week ${game.week}`);
  }

  // Teams
  parts.push(`${game.away_team_name} at ${game.home_team_name}`);

  // Score (if game is final)
  if (game.status === 'Final' && game.home_score !== null && game.away_score !== null) {
    const winner = game.home_score > game.away_score ? game.home_team_name : game.away_team_name;
    const loser = game.home_score > game.away_score ? game.away_team_name : game.home_team_name;
    const winScore = Math.max(game.home_score, game.away_score);
    const loseScore = Math.min(game.home_score, game.away_score);

    parts.push(
      `Final score ${game.home_team_key} ${game.home_score} ${game.away_team_key} ${game.away_score}`
    );
    parts.push(`${winner} defeats ${loser} ${winScore}-${loseScore}`);

    // Describe game closeness
    const margin = Math.abs(game.home_score - game.away_score);
    if (margin <= 3) {
      parts.push('close game');
      parts.push('nail-biter');
      parts.push('tight contest');
    } else if (margin <= 7) {
      parts.push('competitive game');
    } else if (margin >= 21) {
      parts.push('blowout');
      parts.push('decisive victory');
    }
  } else {
    parts.push(`Status: ${game.status}`);
  }

  // Stadium
  if (game.stadium_name) {
    parts.push(`at ${game.stadium_name}`);
  }

  // Date
  const gameDate = new Date(game.game_date);
  parts.push(
    gameDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  return parts.join('. ');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const startTime = Date.now();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Starting game embeddings generation...');

    // Fetch all games from D1
    const fetchStart = Date.now();
    const { results: games } = await env.DB.prepare(
      'SELECT * FROM games ORDER BY game_date DESC'
    ).all();
    const fetchTime = Date.now() - fetchStart;

    console.log(`Fetched ${games.length} games from D1 in ${fetchTime}ms`);

    const successful: string[] = [];
    const failed: Array<{ game_id: number; error: string }> = [];

    // Process each game
    for (const gameData of games) {
      const game = gameData as GameRecord;

      try {
        // Generate description
        const description = generateGameDescription(game);

        console.log(`Processing game ${game.id}: ${description.substring(0, 100)}...`);

        // Generate embedding
        const embedStart = Date.now();
        const embedResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
          text: description,
        });

        const embedding = embedResponse.data?.[0];

        if (!Array.isArray(embedding) || embedding.length !== 768) {
          throw new Error('Invalid embedding format');
        }

        const embedTime = Date.now() - embedStart;

        // Store in Vectorize
        const vectorId = `game-${game.id}`;

        await env.VECTOR_INDEX.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              game_id: game.id,
              sport: game.sport,
              season: game.season,
              week: game.week,
              home_team: game.home_team_name,
              away_team: game.away_team_name,
              status: game.status,
              description: description.substring(0, 500), // Truncate for metadata size limits
              game_date: game.game_date,
            },
          },
        ]);

        successful.push(vectorId);
        console.log(`✓ Game ${game.id} embedded and stored in ${embedTime}ms`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`✗ Failed to process game ${game.id}:`, error);
        failed.push({
          game_id: game.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const totalTime = Date.now() - startTime;

    const response = {
      success: true,
      summary: {
        totalGames: games.length,
        successfulEmbeddings: successful.length,
        failedEmbeddings: failed.length,
        successRate: `${Math.round((successful.length / games.length) * 100)}%`,
      },
      successful,
      failed,
      performance: {
        databaseFetchTime: `${fetchTime}ms`,
        totalProcessingTime: `${totalTime}ms`,
        averageTimePerGame: `${Math.round(totalTime / games.length)}ms`,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Embedding generation error:', error);

    return new Response(
      JSON.stringify(
        {
          success: false,
          error: 'Embedding generation failed',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};
