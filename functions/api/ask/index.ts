/**
 * Natural Language Stat Query API
 * POST /api/ask - Ask a sports statistics question
 *
 * Uses Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct) to parse
 * natural language queries and return structured answers from our database.
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI: Ai;
}

interface AskRequest {
  query: string;
  userId?: string;
}

interface ParsedIntent {
  entity: 'player' | 'team' | 'game' | 'stat' | 'unknown';
  stat?: string;
  sport?: string;
  league?: string;
  timeframe?: string;
  filters?: Record<string, string>;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Rate limiting: 10 queries per minute per IP
const RATE_LIMIT = 10;
const RATE_WINDOW = 60;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `ratelimit:ask:${clientIP}`;
    const currentCount = parseInt((await env.KV?.get(rateLimitKey)) || '0', 10);

    if (currentCount >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait a minute.',
          retryAfter: RATE_WINDOW,
        }),
        { status: 429, headers: CORS_HEADERS }
      );
    }

    // Increment rate limit counter
    await env.KV?.put(rateLimitKey, String(currentCount + 1), {
      expirationTtl: RATE_WINDOW,
    });

    const body: AskRequest = await request.json();

    if (!body.query || body.query.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Query must be at least 3 characters' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Sanitize input
    const sanitizedQuery = body.query.trim().slice(0, 500).replace(/[<>]/g, '');

    const startTime = Date.now();

    // Parse intent using AI
    const intent = await parseQueryIntent(env.AI, sanitizedQuery);

    // Query database based on intent
    const data = await fetchData(env.DB, intent, sanitizedQuery);

    // Generate natural language response
    const response = await generateResponse(env.AI, sanitizedQuery, data, intent);

    const latencyMs = Date.now() - startTime;

    // Log query for analytics
    await logQuery(env.DB, {
      query: sanitizedQuery,
      intent,
      response: response.answer,
      data,
      latencyMs,
      userId: body.userId,
    });

    return new Response(
      JSON.stringify({
        answer: response.answer,
        data: response.structuredData,
        sources: response.sources,
        intent,
        latencyMs,
        dataStamp: {
          timestamp: new Date().toISOString(),
          timezone: 'America/Chicago',
          source: 'BlazeSportsIntel.com',
        },
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[Ask API] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process query',
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

async function parseQueryIntent(ai: Ai, query: string): Promise<ParsedIntent> {
  try {
    const prompt = `Parse this sports statistics query and extract the intent.

Query: "${query}"

Respond with ONLY a JSON object (no markdown, no explanation) with these fields:
- entity: "player", "team", "game", "stat", or "unknown"
- stat: the statistic being asked about (e.g., "ERA", "batting_avg", "home_runs", "wins")
- sport: "baseball", "football", "basketball", or null
- league: "mlb", "ncaa", "nfl", "nba", or null
- timeframe: "season", "last_week", "career", "today", or null
- filters: any additional filters as key-value pairs

Example output:
{"entity":"player","stat":"ERA","sport":"baseball","league":"ncaa","timeframe":"last_week","filters":{"conference":"SEC"}}`;

    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 200,
    });

    // Extract JSON from response
    const text = (response as { response: string }).response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ParsedIntent;
    }

    return { entity: 'unknown' };
  } catch (error) {
    console.error('Failed to parse intent:', error);
    return { entity: 'unknown' };
  }
}

async function fetchData(
  db: D1Database,
  intent: ParsedIntent,
  query: string
): Promise<Record<string, unknown>[]> {
  // Build query based on intent
  // For now, return sample data - in production, query actual tables
  const sampleData: Record<string, unknown>[] = [];

  if (intent.entity === 'player' && intent.stat) {
    // Query players table
    const result = await db
      .prepare(
        `
      SELECT player_id, first_name, last_name, team_id, position
      FROM players
      LIMIT 5
    `
      )
      .all();

    if (result.results) {
      sampleData.push(...(result.results as Record<string, unknown>[]));
    }
  }

  if (intent.entity === 'team') {
    const result = await db
      .prepare(
        `
      SELECT team_id, name, conference, sport
      FROM teams
      WHERE sport = ?
      LIMIT 10
    `
      )
      .bind(intent.sport || 'baseball')
      .all();

    if (result.results) {
      sampleData.push(...(result.results as Record<string, unknown>[]));
    }
  }

  // If no data found, provide helpful response
  if (sampleData.length === 0) {
    return [
      {
        message: 'No specific data found for this query.',
        suggestion: 'Try asking about college baseball standings, player stats, or team rankings.',
      },
    ];
  }

  return sampleData;
}

async function generateResponse(
  ai: Ai,
  query: string,
  data: Record<string, unknown>[],
  intent: ParsedIntent
): Promise<{
  answer: string;
  structuredData: Record<string, unknown>[];
  sources: string[];
}> {
  // Generate natural language response
  const dataContext = JSON.stringify(data.slice(0, 5));

  const prompt = `You are a sports analytics assistant for Blaze Sports Intel. Answer the user's question based on the data provided.

User Question: "${query}"

Available Data: ${dataContext}

Intent: ${JSON.stringify(intent)}

Rules:
1. Be direct and concise - lead with the answer
2. If data is insufficient, say so honestly
3. Always cite your sources (BlazeSportsIntel.com, NCAA Stats, etc.)
4. Use specific numbers when available
5. Keep response under 150 words

Respond with the answer only, no preamble.`;

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 300,
    });

    const answer = (response as { response: string }).response || 'Unable to generate response.';

    return {
      answer: answer.trim(),
      structuredData: data,
      sources: ['BlazeSportsIntel.com', 'NCAA Stats', 'Baseball-Reference'],
    };
  } catch (error) {
    console.error('Failed to generate response:', error);
    return {
      answer:
        "I found some data but couldn't generate a natural language response. Please check the structured data below.",
      structuredData: data,
      sources: ['BlazeSportsIntel.com'],
    };
  }
}

async function logQuery(
  db: D1Database,
  log: {
    query: string;
    intent: ParsedIntent;
    response: string;
    data: Record<string, unknown>[];
    latencyMs: number;
    userId?: string;
  }
): Promise<void> {
  try {
    // Ensure table exists
    await db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS ai_queries (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        query_text TEXT NOT NULL,
        parsed_intent JSON,
        response_text TEXT NOT NULL,
        response_data JSON,
        model TEXT NOT NULL,
        latency_ms INTEGER,
        tokens_used INTEGER,
        sources_cited JSON,
        feedback_rating INTEGER,
        created_at TEXT NOT NULL
      )
    `
      )
      .run();

    const id = `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await db
      .prepare(
        `
      INSERT INTO ai_queries (id, user_id, query_text, parsed_intent, response_text, response_data, model, latency_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        id,
        log.userId || null,
        log.query,
        JSON.stringify(log.intent),
        log.response,
        JSON.stringify(log.data.slice(0, 5)),
        'llama-3.1-8b-instruct',
        log.latencyMs,
        new Date().toISOString()
      )
      .run();
  } catch (error) {
    console.error('Failed to log query:', error);
  }
}
