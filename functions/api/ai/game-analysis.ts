/**
 * Pages Function — /api/ai/game-analysis
 *
 * Proxies game analysis prompts to Claude (Anthropic) or Gemini (Google).
 * Requires ANTHROPIC_API_KEY and/or GEMINI_API_KEY in Cloudflare Pages env.
 */

interface Env {
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

interface AnalysisRequest {
  model: 'claude' | 'gemini';
  prompt: string;
  gameContext: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'http://localhost:3000',
]);

const SYSTEM_PROMPT = `You are a college baseball analyst for Blaze Sports Intel (BSI). You provide deep, evidence-based analysis of college baseball games with the rigor of a professional scout and the clarity of a great sportswriter. Use specific statistics, player names, and game context in every response. Be direct and opinionated — BSI doesn't do fence-sitting. Format responses in clear paragraphs with bold section headers where appropriate.`;

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

async function callClaude(prompt: string, gameContext: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Game Context:\n${gameContext}\n\nAnalysis Request:\n${prompt}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { content: Array<{ text: string }> };
  return data.content[0]?.text ?? 'No response generated.';
}

async function callGemini(prompt: string, gameContext: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [
              { text: `Game Context:\n${gameContext}\n\nAnalysis Request:\n${prompt}` },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = getCorsHeaders(context.request);

  try {
    const body = (await context.request.json()) as AnalysisRequest;

    if (!body.prompt || !body.gameContext || !body.model) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, prompt, gameContext' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let analysis: string;

    if (body.model === 'claude') {
      const key = context.env.ANTHROPIC_API_KEY;
      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Claude API not configured — set ANTHROPIC_API_KEY in Cloudflare Pages settings' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      analysis = await callClaude(body.prompt, body.gameContext, key);
    } else if (body.model === 'gemini') {
      const key = context.env.GEMINI_API_KEY;
      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Gemini API not configured — set GEMINI_API_KEY in Cloudflare Pages settings' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      analysis = await callGemini(body.prompt, body.gameContext, key);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid model — use "claude" or "gemini"' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        analysis,
        model: body.model,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis request failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, {
    headers: {
      ...getCorsHeaders(context.request),
      'Access-Control-Max-Age': '86400',
    },
  });
};
