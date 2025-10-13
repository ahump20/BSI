/**
 * Blaze Sports Intel - RAG Insights API Endpoint
 *
 * Question answering system using Retrieval-Augmented Generation (RAG).
 *
 * Process:
 * 1. User asks a question (e.g., "What are the closest games this season?")
 * 2. Generate embedding for question
 * 3. Search Vectorize for relevant games (semantic search)
 * 4. Extract context from top matching games
 * 5. Pass context + question to LLM (@cf/meta/llama-3.1-8b-instruct)
 * 6. Generate coaching insights with source citations
 *
 * Features:
 * - Natural language question answering
 * - Context-aware insights using real game data
 * - Source citation with game details
 * - Confidence scoring
 * - Sport-specific filtering
 * - Professional coaching tone
 *
 * Performance targets:
 * - Embedding generation: <200ms
 * - Vectorize search: <100ms
 * - Context extraction: <50ms
 * - LLM generation: <1500ms
 * - Total response: <2000ms
 */

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VECTOR_INDEX: VectorizeIndex;
  AI: any;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface InsightRequest {
  question: string;
  sport?: string;
  maxContext?: number;
  tone?: 'coaching' | 'analyst' | 'casual';
}

interface GameContext {
  id: number;
  sport: string;
  game_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stadium_name: string | null;
  season: number;
  week: number | null;
  relevanceScore: number;
}

interface InsightResponse {
  question: string;
  insight: string;
  sources: GameContext[];
  confidence: number;
  sport: string | null;
  tone: string;
  timestamp: string;
  performance: {
    embeddingTime: string;
    vectorSearchTime: string;
    contextExtractionTime: string;
    llmGenerationTime: string;
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
    // Parse request
    let insightRequest: InsightRequest;

    if (request.method === 'POST') {
      insightRequest = await request.json() as InsightRequest;
    } else {
      const url = new URL(request.url);
      insightRequest = {
        question: url.searchParams.get('question') || url.searchParams.get('q') || '',
        sport: url.searchParams.get('sport') || undefined,
        maxContext: url.searchParams.get('maxContext') ? parseInt(url.searchParams.get('maxContext')!) : undefined,
        tone: (url.searchParams.get('tone') as any) || undefined,
      };
    }

    // Validate question
    if (!insightRequest.question || insightRequest.question.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing question parameter',
        message: 'Please provide a question via "question" parameter (GET) or request body (POST)',
        examples: [
          'What are the closest games this season?',
          'Which teams had the biggest wins?',
          'Tell me about the Kansas City Chiefs performance'
        ]
      }, null, 2), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }

    const question = insightRequest.question.trim();
    const sport = insightRequest.sport?.toUpperCase();
    const maxContext = insightRequest.maxContext || 5; // Top 5 games for context
    const tone = insightRequest.tone || 'coaching';

    console.log(`RAG Insight query: "${question}" (sport: ${sport || 'all'}, tone: ${tone})`);

    // Check cache for this query (5-minute TTL)
    const cacheKey = `insight:${question.toLowerCase().replace(/[^a-z0-9]/g, '-')}:${sport || 'all'}:${tone}`;
    const cached = await env.CACHE.get(cacheKey, 'json');

    if (cached) {
      console.log(`Cache hit for query: "${question}"`);

      // Track cache hit in analytics
      if (env.ANALYTICS) {
        env.ANALYTICS.writeDataPoint({
          blobs: ['copilot_insight', 'cache_hit'],
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
          'X-Question': question,
          ...corsHeaders,
        }
      });
    }

    // Step 1: Generate embedding for question
    const embeddingStart = Date.now();
    let questionEmbedding: number[];

    try {
      const embedResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: question
      });

      questionEmbedding = embedResponse.data?.[0];

      if (!Array.isArray(questionEmbedding) || questionEmbedding.length !== 768) {
        throw new Error('Invalid embedding format');
      }
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return new Response(JSON.stringify({
        error: 'Embedding generation failed',
        message: error instanceof Error ? error.message : String(error)
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const embeddingTime = Date.now() - embeddingStart;

    // Step 2: Search Vectorize for relevant games
    const vectorSearchStart = Date.now();
    let vectorMatches: any[] = [];

    try {
      const vectorizeOptions: any = {
        topK: maxContext * 2, // Get extra to filter by relevance
        returnMetadata: 'all',
      };

      if (sport) {
        vectorizeOptions.filter = { sport: sport };
      }

      const searchResults = await env.VECTOR_INDEX.query(questionEmbedding, vectorizeOptions);
      vectorMatches = searchResults.matches || [];
    } catch (error) {
      console.error('Vectorize search failed:', error);
      return new Response(JSON.stringify({
        error: 'Vector search failed',
        message: error instanceof Error ? error.message : String(error),
        note: 'Ensure embeddings have been generated via /api/copilot/admin/generate-embeddings'
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const vectorSearchTime = Date.now() - vectorSearchStart;

    // Filter by minimum relevance (0.5 threshold)
    const relevantMatches = vectorMatches.filter(match => match.score >= 0.5);

    // Step 3: Extract context from top games
    const contextExtractionStart = Date.now();
    const gameContexts: GameContext[] = [];

    if (relevantMatches.length > 0) {
      const gameIds = relevantMatches
        .slice(0, maxContext)
        .map(match => parseInt(match.id.replace('game-', '')));

      const placeholders = gameIds.map(() => '?').join(',');
      const query = `
        SELECT *
        FROM games
        WHERE id IN (${placeholders})
        ORDER BY game_date DESC
      `;

      const { results: games } = await env.DB.prepare(query).bind(...gameIds).all();

      for (const game of games) {
        const gameRecord = game as any;
        const matchId = `game-${gameRecord.id}`;
        const match = relevantMatches.find(m => m.id === matchId);

        if (match) {
          gameContexts.push({
            id: gameRecord.id,
            sport: gameRecord.sport,
            game_date: gameRecord.game_date,
            home_team_name: gameRecord.home_team_name,
            away_team_name: gameRecord.away_team_name,
            home_score: gameRecord.home_score,
            away_score: gameRecord.away_score,
            status: gameRecord.status,
            stadium_name: gameRecord.stadium_name,
            season: gameRecord.season,
            week: gameRecord.week,
            relevanceScore: Math.round(match.score * 1000) / 1000
          });
        }
      }
    }

    const contextExtractionTime = Date.now() - contextExtractionStart;

    if (gameContexts.length === 0) {
      return new Response(JSON.stringify({
        error: 'No relevant games found',
        message: 'Could not find games relevant to your question. Try rephrasing or adding more context.',
        question,
        suggestion: 'Try asking about specific teams, scores, or game outcomes'
      }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Step 4: Build context for LLM
    const contextText = gameContexts.map((game, idx) => {
      const margin = game.home_score !== null && game.away_score !== null
        ? Math.abs(game.home_score - game.away_score)
        : null;

      return `
Game ${idx + 1}:
- Sport: ${game.sport}
- Date: ${new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
- Matchup: ${game.away_team_name} at ${game.home_team_name}
- Score: ${game.away_score}-${game.home_score}
- Margin: ${margin} points
- Status: ${game.status}
- Venue: ${game.stadium_name || 'N/A'}
- Season: ${game.season}${game.week ? `, Week ${game.week}` : ''}
- Relevance: ${(game.relevanceScore * 100).toFixed(1)}%
      `.trim();
    }).join('\n\n');

    // Step 5: Generate insight using LLM
    const llmGenerationStart = Date.now();
    let insight = '';
    let confidence = 0.0;

    try {
      // Build system prompt based on tone
      let systemPrompt = '';
      if (tone === 'coaching') {
        systemPrompt = 'You are a professional sports analyst providing insights to coaches. Be direct, actionable, and focus on strategic implications. Use concise language and cite specific games.';
      } else if (tone === 'analyst') {
        systemPrompt = 'You are a professional sports analyst. Provide detailed statistical analysis and tactical insights. Be thorough and analytical.';
      } else {
        systemPrompt = 'You are a friendly sports analyst. Provide engaging insights in conversational language while maintaining accuracy.';
      }

      const userPrompt = `Based on the following game data, answer this question: "${question}"

Game Data:
${contextText}

Instructions:
- Provide a clear, direct answer
- Cite specific games by teams (e.g., "Chiefs 28-24 Vikings")
- Focus on key insights and patterns
- Keep response under 200 words
- End with a brief strategic takeaway

Answer:`;

      const llmResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      insight = llmResponse.response || 'Unable to generate insight. Please try again.';

      // Calculate confidence based on:
      // - Number of relevant games found
      // - Average relevance score
      // - Whether LLM generated a response
      const avgRelevance = gameContexts.reduce((sum, game) => sum + game.relevanceScore, 0) / gameContexts.length;
      const contextQuality = Math.min(gameContexts.length / maxContext, 1.0);
      confidence = (avgRelevance * 0.7 + contextQuality * 0.3);

    } catch (error) {
      console.error('LLM generation failed:', error);
      return new Response(JSON.stringify({
        error: 'LLM generation failed',
        message: error instanceof Error ? error.message : String(error),
        question,
        sources: gameContexts
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const llmGenerationTime = Date.now() - llmGenerationStart;
    const totalTime = Date.now() - startTime;

    // Build response
    const response: InsightResponse = {
      question,
      insight,
      sources: gameContexts,
      confidence: Math.round(confidence * 1000) / 1000,
      sport: sport || null,
      tone,
      timestamp: new Date().toISOString(),
      performance: {
        embeddingTime: `${embeddingTime}ms`,
        vectorSearchTime: `${vectorSearchTime}ms`,
        contextExtractionTime: `${contextExtractionTime}ms`,
        llmGenerationTime: `${llmGenerationTime}ms`,
        totalTime: `${totalTime}ms`
      }
    };

    console.log(`RAG insight generated in ${totalTime}ms (confidence: ${confidence.toFixed(3)})`);

    // Store in cache (5-minute TTL)
    await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });

    // Track analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['copilot_insight', 'success', sport || 'all', tone],
        doubles: [
          totalTime,           // Index 0: Total time
          confidence,          // Index 1: Confidence score
          gameContexts.length, // Index 2: Number of sources
          embeddingTime,       // Index 3: Embedding generation time
          vectorSearchTime,    // Index 4: Vector search time
          llmGenerationTime    // Index 5: LLM generation time
        ],
        indexes: [question.substring(0, 50)] // First 50 chars of question for grouping
      });
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Question': question,
        'X-Sources-Count': gameContexts.length.toString(),
        'X-Confidence': confidence.toFixed(3),
        'X-Total-Time': `${totalTime}ms`,
        ...corsHeaders,
      }
    });

  } catch (error) {
    console.error('RAG insight error:', error);

    // Track error in analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ['copilot_insight', 'error', error instanceof Error ? error.name : 'unknown'],
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
