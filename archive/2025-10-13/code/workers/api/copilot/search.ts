/**
 * Blaze Sports Intel - Semantic Search API Endpoint
 *
 * Natural language search powered by Workers AI embeddings and Vectorize.
 *
 * Process:
 * 1. User submits natural language query (e.g., "close NFL games this week")
 * 2. Generate 768-dimensional embedding using @cf/baai/bge-base-en-v1.5
 * 3. Search Vectorize index for similar game descriptions
 * 4. Return top-K relevant games with relevance scores (cosine similarity)
 *
 * Features:
 * - Sport filtering (limit search to specific sport)
 * - Configurable top-K results (default: 10, max: 50)
 * - Relevance score threshold (filter low-confidence matches)
 * - Rich game details from D1 database
 *
 * Performance targets:
 * - Embedding generation: <200ms
 * - Vectorize search: <100ms
 * - D1 game lookup: <50ms per game
 * - Total response: <2000ms
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VECTOR_INDEX: VectorizeIndex;
  AI: any;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface SearchRequest {
  query: string;
  sport?: string;
  topK?: number;
  minRelevance?: number;
}

interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

interface GameResult {
  id: number;
  sport: string;
  game_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stadium_name: string | null;
  relevanceScore: number;
  matchReason?: string;
}

interface SearchResponse {
  query: string;
  sport: string | null;
  resultsCount: number;
  results: GameResult[];
  embeddingGenerated: boolean;
  vectorSearchCompleted: boolean;
  timestamp: string;
  performance: {
    embeddingTime: string;
    vectorSearchTime: string;
    databaseLookupTime: string;
    totalTime: string;
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const startTime = Date.now();

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body (POST) or query params (GET)
    let searchRequest: SearchRequest;

    if (request.method === 'POST') {
      searchRequest = await request.json() as SearchRequest;
    } else {
      // GET request - parse query parameters
      const url = new URL(request.url);
      searchRequest = {
        query: url.searchParams.get('query') || url.searchParams.get('q') || '',
        sport: url.searchParams.get('sport') || undefined,
        topK: url.searchParams.get('topK') ? parseInt(url.searchParams.get('topK')!) : undefined,
        minRelevance: url.searchParams.get('minRelevance') ? parseFloat(url.searchParams.get('minRelevance')!) : undefined,
      };
    }

    // Validate query
    if (!searchRequest.query || searchRequest.query.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing query parameter',
        message: 'Please provide a search query via "query" parameter (GET) or request body (POST)',
        example: {
          GET: '/api/copilot/search?query=close+games+this+week',
          POST: { query: 'close games this week', sport: 'NFL', topK: 10 }
        }
      }, null, 2), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // Set defaults
    const query = searchRequest.query.trim();
    const sport = searchRequest.sport?.toUpperCase();
    const topK = Math.min(searchRequest.topK || 10, 50); // Max 50 results
    const minRelevance = searchRequest.minRelevance || 0.5; // Default 50% relevance threshold

    console.log(`Semantic search query: "${query}" (sport: ${sport || 'all'}, topK: ${topK})`);

    // Check cache (3-minute TTL for search results)
    const cacheKey = `search:${query.toLowerCase().replace(/[^a-z0-9]/g, '-')}:${sport || 'all'}:${topK}`;
    const cached = await env.CACHE.get(cacheKey, 'json');

    if (cached) {
      console.log(`Cache hit for search: "${query}"`);

      // Track cache hit
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['copilot_search', 'cache_hit'],
          doubles: [1],
          indexes: [sport || 'all']
        });
      }

      return new Response(JSON.stringify({
        ...cached,
        cached: true,
        cacheAge: Math.floor((Date.now() - new Date(cached.timestamp).getTime()) / 1000) + 's'
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Search-Query': query,
          ...corsHeaders,
        }
      });
    }

    // Step 1: Generate embedding for query using Workers AI
    const embeddingStart = Date.now();
    let queryEmbedding: number[];
    let embeddingGenerated = false;

    try {
      const embedResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: query
      });

      queryEmbedding = embedResponse.data?.[0];

      if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
        throw new Error('Invalid embedding format from Workers AI');
      }

      embeddingGenerated = true;
      const embeddingTime = Date.now() - embeddingStart;
      console.log(`Embedding generated in ${embeddingTime}ms (768 dimensions)`);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return new Response(JSON.stringify({
        error: 'Embedding generation failed',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // Step 2: Search Vectorize index
    const vectorSearchStart = Date.now();
    let vectorMatches: VectorizeMatch[] = [];
    let vectorSearchCompleted = false;

    try {
      const vectorizeOptions: any = {
        topK: topK * 2, // Get extra matches to filter by relevance threshold
        returnMetadata: 'all',
      };

      // Add sport filter if specified
      if (sport) {
        vectorizeOptions.filter = { sport: sport };
      }

      const searchResults = await env.VECTOR_INDEX.query(queryEmbedding, vectorizeOptions);

      vectorMatches = searchResults.matches || [];
      vectorSearchCompleted = true;

      const vectorSearchTime = Date.now() - vectorSearchStart;
      console.log(`Vectorize search completed in ${vectorSearchTime}ms (${vectorMatches.length} matches)`);
    } catch (error) {
      console.error('Vectorize search failed:', error);
      return new Response(JSON.stringify({
        error: 'Vector search failed',
        message: error instanceof Error ? error.message : String(error),
        note: 'This may indicate that embeddings have not been generated yet. Run the embedding generation script first.',
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    // Filter by minimum relevance score
    const relevantMatches = vectorMatches.filter(match => match.score >= minRelevance);

    console.log(`Filtered to ${relevantMatches.length} matches above ${minRelevance} relevance threshold`);

    // Step 3: Fetch game details from D1 database
    const dbLookupStart = Date.now();
    const results: GameResult[] = [];

    if (relevantMatches.length > 0) {
      // Extract game IDs from vector matches
      const gameIds = relevantMatches.map(match => {
        // Vector ID format: "game-{game_id}"
        return parseInt(match.id.replace('game-', ''));
      });

      // Build SQL query to fetch games
      const placeholders = gameIds.map(() => '?').join(',');
      const query = `
        SELECT *
        FROM games
        WHERE id IN (${placeholders})
        ORDER BY game_date DESC
      `;

      const { results: games } = await env.DB.prepare(query).bind(...gameIds).all();

      // Map games with relevance scores
      for (const game of games) {
        const gameRecord = game as any;
        const matchId = `game-${gameRecord.id}`;
        const match = relevantMatches.find(m => m.id === matchId);

        if (match) {
          results.push({
            id: gameRecord.id,
            sport: gameRecord.sport,
            game_date: gameRecord.game_date,
            home_team_name: gameRecord.home_team_name,
            away_team_name: gameRecord.away_team_name,
            home_score: gameRecord.home_score,
            away_score: gameRecord.away_score,
            status: gameRecord.status,
            stadium_name: gameRecord.stadium_name,
            relevanceScore: Math.round(match.score * 1000) / 1000, // Round to 3 decimals
            matchReason: match.metadata?.description || undefined
          });
        }
      }
    }

    const dbLookupTime = Date.now() - dbLookupStart;
    const totalTime = Date.now() - startTime;

    console.log(`Database lookup completed in ${dbLookupTime}ms (${results.length} games enriched)`);

    // Build response
    const response: SearchResponse = {
      query,
      sport: sport || null,
      resultsCount: results.length,
      results: results.slice(0, topK), // Limit to requested topK
      embeddingGenerated,
      vectorSearchCompleted,
      timestamp: new Date().toISOString(),
      performance: {
        embeddingTime: `${Date.now() - embeddingStart}ms`,
        vectorSearchTime: `${Date.now() - vectorSearchStart}ms`,
        databaseLookupTime: `${dbLookupTime}ms`,
        totalTime: `${totalTime}ms`
      }
    };

    // Store in cache (3-minute TTL)
    await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 180 });

    // Track analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['copilot_search', 'success', sport || 'all'],
        doubles: [
          totalTime,                         // Index 0: Total time
          results.length,                    // Index 1: Results count
          Date.now() - embeddingStart,       // Index 2: Embedding time
          Date.now() - vectorSearchStart,    // Index 3: Vector search time
          dbLookupTime                       // Index 4: DB lookup time
        ],
        indexes: [query.substring(0, 50)]  // First 50 chars for grouping
      });
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Search-Query': query,
        'X-Results-Count': results.length.toString(),
        'X-Total-Time': `${totalTime}ms`,
        ...corsHeaders,
      }
    });

  } catch (error) {
    console.error('Semantic search error:', error);

    // Track error in analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['copilot_search', 'error', error instanceof Error ? error.name : 'unknown'],
        doubles: [1, Date.now() - startTime],
        indexes: [error instanceof Error ? error.message.substring(0, 50) : 'unknown']
      });
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      }
    });
  }
};
