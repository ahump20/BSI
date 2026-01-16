/**
 * AI-Powered Sports Search API
 * Uses Cloudflare AI Search (AutoRAG) for blazesportsintel.com
 *
 * Endpoints:
 * - POST /api/ai/search - Natural language sports queries
 * - GET /api/ai/search?q=query - Simple search
 */

interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  KV: KVNamespace;
  DB: D1Database;
  SPORTS_DATA: R2Bucket;
  ANALYTICS: AnalyticsEngineDataset;
}

interface SearchRequest {
  query: string;
  sport?: 'mlb' | 'nfl' | 'nba' | 'ncaa' | 'all';
  limit?: number;
  stream?: boolean;
}

interface AutoRAGResponse {
  response: string;
  data: Array<{
    file_name: string;
    content: string;
    score: number;
  }>;
}

// AI Search (AutoRAG) configuration
const ACCOUNT_ID = 'a12cb329d84130460eed99b816e4d0d3';
const AUTORAG_NAME = 'blaze-ai-search';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as SearchRequest;
    const { query, sport = 'all', limit = 10, stream = false } = body;

    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({
          error: 'Query must be at least 3 characters',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check cache first
    const cacheKey = `autorag:${query.toLowerCase().trim()}`;
    const cached = await env.KV.get(cacheKey, 'json');

    if (cached) {
      return new Response(
        JSON.stringify({
          ...cached,
          cached: true,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Call AI Search (AutoRAG) API
    const autoragUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/autorag/rags/${AUTORAG_NAME}/ai-search`;

    const autoragResponse = await fetch(autoragUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.request.headers.get('CF-Access-Token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_num_results: limit,
        rewrite_query: true,
        stream,
      }),
    });

    if (!autoragResponse.ok) {
      // Fallback to direct Workers AI if AutoRAG fails
      return await fallbackSearch(env, query, sport);
    }

    const autoragData = (await autoragResponse.json()) as { result: AutoRAGResponse };

    const result = {
      answer: autoragData.result.response,
      sources: autoragData.result.data.map((d) => ({
        title: d.file_name,
        content: d.content.substring(0, 500),
        score: d.score,
      })),
      query,
      sport,
      timestamp: new Date().toISOString(),
      cached: false,
      engine: 'autorag',
    };

    // Cache for 5 minutes
    await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

    // Log analytics
    env.ANALYTICS?.writeDataPoint({
      blobs: [query, sport, 'autorag'],
      doubles: [result.sources.length, Date.now()],
      indexes: ['ai_search'],
    });

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('AI Search error:', error);

    // Try fallback
    try {
      const body = (await request.clone().json()) as SearchRequest;
      return await fallbackSearch(context.env, body.query, body.sport || 'all');
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Search failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
};

// Fallback to direct Workers AI + Vectorize
async function fallbackSearch(env: Env, query: string, sport: string): Promise<Response> {
  const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
  const LLM_MODEL = '@cf/meta/llama-3.1-8b-instruct';

  try {
    // Generate embedding
    const embeddingResponse = await env.AI.run(EMBEDDING_MODEL, {
      text: query,
    });
    const queryEmbedding = embeddingResponse.data[0];

    // Search Vectorize
    const vectorResults = await env.VECTORIZE.query(queryEmbedding, {
      topK: 5,
      returnMetadata: 'all',
      filter: sport !== 'all' ? { sport } : undefined,
    });

    const sources = vectorResults.matches.map((match) => ({
      title: (match.metadata?.title as string) || 'Sports Data',
      content: (match.metadata?.content as string) || '',
      score: match.score,
    }));

    const contextText = sources.map((s) => `[${s.title}]: ${s.content}`).join('\n\n');

    // Generate response
    const systemPrompt = `You are Blaze Sports Intel, an expert sports analyst covering MLB, NFL, NBA, and NCAA sports with a focus on college baseball.
Answer questions directly and concisely. Current date: ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}`;

    const llmResponse = await env.AI.run(LLM_MODEL, {
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: contextText ? `Context:\n${contextText}\n\nQuestion: ${query}` : query,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    return new Response(
      JSON.stringify({
        answer: llmResponse.response || 'Unable to generate response',
        sources,
        query,
        sport,
        timestamp: new Date().toISOString(),
        cached: false,
        engine: 'fallback',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Fallback search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q');
  const sport = (url.searchParams.get('sport') as SearchRequest['sport']) || 'all';

  if (!query) {
    return new Response(
      JSON.stringify({
        error: 'Missing query parameter "q"',
        usage: '/api/ai/search?q=your+question&sport=mlb',
        examples: [
          '/api/ai/search?q=Texas+Longhorns+baseball+schedule',
          '/api/ai/search?q=Who+founded+Blaze+Sports+Intel',
          '/api/ai/search?q=college+baseball+coverage',
        ],
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Forward to POST handler
  const body: SearchRequest = { query, sport };
  const newRequest = new Request(context.request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return onRequestPost({ ...context, request: newRequest });
};
