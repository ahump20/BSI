/**
 * 🔥 Blaze Sports Intel - Enhanced Multi-Provider RAG Insights
 *
 * Leverages Gemini 2.5 Pro/Flash, GPT-5, and Claude 4.5 for superior accuracy
 * with intelligent routing based on query type and complexity.
 *
 * Provider Selection Strategy:
 * - Gemini 2.5 Pro: Complex statistical analysis, multi-game comparisons
 * - Gemini 2.5 Flash: Real-time game updates, quick facts
 * - GPT-5: Natural language understanding, conversational queries
 * - Claude 4.5: Deep reasoning, strategic insights
 */

const PROVIDER_CONFIG = {
  gemini_pro: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent',
    strengths: ['statistical_analysis', 'multi_game_comparison', 'complex_reasoning'],
    maxTokens: 8000,
    temperature: 0.3
  },
  gemini_flash: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent',
    strengths: ['real_time_updates', 'quick_facts', 'simple_queries'],
    maxTokens: 2000,
    temperature: 0.2
  },
  gpt5: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-5-preview',
    strengths: ['natural_language', 'conversational', 'context_awareness'],
    maxTokens: 4000,
    temperature: 0.4
  },
  claude_sonnet_45: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-5-20250929',
    strengths: ['deep_reasoning', 'strategic_insights', 'nuanced_analysis'],
    maxTokens: 6000,
    temperature: 0.5
  }
};

/**
 * Intelligent query router - selects optimal AI provider
 */
function selectProvider(query, context) {
  const queryLower = query.toLowerCase();

  // Real-time/quick facts → Gemini Flash
  if (queryLower.match(/\b(score|current|live|now|today)\b/)) {
    return 'gemini_flash';
  }

  // Statistical analysis → Gemini Pro
  if (queryLower.match(/\b(stats|statistics|average|percentage|compare|analysis)\b/)) {
    return 'gemini_pro';
  }

  // Strategy/reasoning → Claude 4.5
  if (queryLower.match(/\b(why|strategy|should|recommend|best|optimal)\b/)) {
    return 'claude_sonnet_45';
  }

  // Conversational/general → GPT-5
  return 'gpt5';
}

/**
 * Call Gemini API (Pro or Flash)
 */
async function callGemini(query, context, env, isFlash = false) {
  const apiKey = env.GOOGLE_GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY_2 || env.GOOGLE_GEMINI_API_KEY_3;
  const config = isFlash ? PROVIDER_CONFIG.gemini_flash : PROVIDER_CONFIG.gemini_pro;

  const systemPrompt = `You are an expert sports analyst for Blaze Sports Intelligence.
Analyze the provided game data and answer the user's question with precision and insight.

Context from semantic search:
${context.map(c => `- ${c.description} (Relevance: ${c.similarity.toFixed(2)})`).join('\n')}

Guidelines:
- Use exact statistics from the context
- Cite specific games when making claims
- Provide actionable insights for coaches/analysts
- Focus on patterns and trends
- Keep responses concise but comprehensive`;

  const response = await fetch(`${config.endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser Question: ${query}`
        }]
      }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        topP: 0.95,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response',
    provider: isFlash ? 'gemini_flash' : 'gemini_pro',
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0
    }
  };
}

/**
 * Call OpenAI GPT-5 API
 */
async function callGPT5(query, context, env) {
  const config = PROVIDER_CONFIG.gpt5;

  const systemPrompt = `You are an expert sports analyst for Blaze Sports Intelligence specializing in conversational insights and natural language understanding.

Relevant game context from our database:
${context.map(c => `- ${c.description} (Match: ${(c.similarity * 100).toFixed(0)}%)`).join('\n')}

Provide clear, conversational insights while maintaining analytical rigor.`;

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: 0.95,
      frequency_penalty: 0.2,
      presence_penalty: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || 'No response',
    provider: 'gpt5',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0
    }
  };
}

/**
 * Call Anthropic Claude 4.5 API
 */
async function callClaude45(query, context, env) {
  const config = PROVIDER_CONFIG.claude_sonnet_45;

  const systemPrompt = `You are an elite sports strategist and analyst for Blaze Sports Intelligence. Your specialty is deep reasoning and strategic insights that go beyond surface-level statistics.

Game context with semantic relevance scores:
${context.map(c => `- ${c.description} (Relevance: ${(c.similarity * 100).toFixed(1)}%)`).join('\n')}

Provide nuanced, strategic insights that help coaches and analysts make better decisions.`;

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: query
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.content?.[0]?.text || 'No response',
    provider: 'claude_sonnet_45',
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0
    }
  };
}

/**
 * Main handler - Enhanced multi-provider RAG
 */
export async function onRequest(context) {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { query, sport, provider: requestedProvider } = await request.json();

    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const startTime = Date.now();

    // Step 1: Semantic search for relevant games
    const embeddingResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query
    });
    const queryEmbedding = embeddingResult.data[0];

    // Query Vectorize with optional sport filter
    const vectorFilter = sport ? { sport } : undefined;
    const vectorResults = await env.VECTOR_INDEX.query(queryEmbedding, {
      topK: 5,
      returnMetadata: 'all',
      filter: vectorFilter
    });

    if (!vectorResults.matches || vectorResults.matches.length === 0) {
      return Response.json({
        success: true,
        query,
        insight: 'No relevant games found for your query. Try broadening your search.',
        provider: 'none',
        sources: [],
        searchTime: Date.now() - startTime
      });
    }

    // Extract context from vector matches
    const context = vectorResults.matches.map(match => ({
      description: match.metadata.description,
      sport: match.metadata.sport,
      teams: `${match.metadata.home_team} vs ${match.metadata.away_team}`,
      score: `${match.metadata.home_score}-${match.metadata.away_score}`,
      date: match.metadata.game_date,
      similarity: match.score
    }));

    // Step 2: Select AI provider (or use requested)
    const provider = requestedProvider || selectProvider(query, context);

    // Step 3: Call selected AI provider
    let result;
    try {
      switch (provider) {
        case 'gemini_pro':
          result = await callGemini(query, context, env, false);
          break;
        case 'gemini_flash':
          result = await callGemini(query, context, env, true);
          break;
        case 'gpt5':
          result = await callGPT5(query, context, env);
          break;
        case 'claude_sonnet_45':
          result = await callClaude45(query, context, env);
          break;
        default:
          // Fallback to Workers AI (original)
          const workersResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: 'You are a sports analyst.' },
              { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${query}` }
            ],
            max_tokens: 500
          });
          result = {
            text: workersResult.response || 'No insight available',
            provider: 'workers_ai_fallback',
            usage: { promptTokens: 0, completionTokens: 0 }
          };
      }
    } catch (aiError) {
      console.error(`Provider ${provider} failed:`, aiError);
      // Fallback to Workers AI on error
      const fallbackResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a sports analyst.' },
          { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${query}` }
        ],
        max_tokens: 500
      });
      result = {
        text: fallbackResult.response || 'Analysis temporarily unavailable',
        provider: 'workers_ai_fallback',
        usage: { promptTokens: 0, completionTokens: 0 }
      };
    }

    const totalTime = Date.now() - startTime;

    return Response.json({
      success: true,
      query,
      insight: result.text,
      provider: result.provider,
      sources: context,
      confidence: vectorResults.matches[0].score,
      performance: {
        totalTime: `${totalTime}ms`,
        searchTime: `${totalTime - 1000}ms`, // approximate
        aiGenerationTime: `~1000ms`,
        tokenUsage: result.usage
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'X-Provider': result.provider,
        'X-Search-Time': totalTime.toString()
      }
    });

  } catch (error) {
    console.error('Enhanced insights error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}
