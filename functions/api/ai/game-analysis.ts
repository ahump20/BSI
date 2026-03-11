/**
 * Pages Function — /api/ai/game-analysis
 *
 * Proxies game analysis prompts to Claude API or Gemini API.
 * Returns AI-generated analysis of college baseball games.
 */

interface Env {
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

interface AnalysisPayload {
  model: 'claude' | 'gemini';
  prompt: string;
  gameContext: string;
}

interface ClaudeMessageResponse {
  content?: Array<{ type?: string; text?: string }>;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const ALLOWED_ORIGINS = new Set([
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://blazesportsintel.pages.dev',
  'http://localhost:3000',
]);

// --- In-memory rate limiter (5 requests/IP/minute) ---
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const _rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

const SYSTEM_PROMPT = `You are a college baseball analyst for Blaze Sports Intel. You provide detailed, insightful analysis grounded in the game data provided. Your tone is knowledgeable, direct, and analytical — like a veteran scout writing for a savvy audience. Cite specific stats from the game context. No filler, no generic commentary.`;

const CLAUDE_MODEL = 'claude-sonnet-4-6';

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export async function parseJsonResponse<T>(res: Response, provider: string): Promise<T> {
  const raw = await res.text();

  if (!raw.trim()) {
    throw new Error(`${provider} API returned an empty response body`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`${provider} API returned invalid JSON`);
  }
}

export function extractClaudeText(data: ClaudeMessageResponse): string {
  const textBlock = data.content?.find((block) => block.type === 'text' && block.text?.trim());
  if (!textBlock?.text) {
    throw new Error('Claude API returned no text blocks');
  }
  return textBlock.text;
}

export function extractGeminiText(data: GeminiGenerateContentResponse): string {
  const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text?.trim())?.text;
  if (!text) {
    throw new Error('Gemini API returned no text parts');
  }
  return text;
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
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Game Context:\n${gameContext}\n\nAnalysis Request: ${prompt}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const data = await parseJsonResponse<ClaudeMessageResponse>(res, 'Claude');
  return extractClaudeText(data);
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
            parts: [{ text: `Game Context:\n${gameContext}\n\nAnalysis Request: ${prompt}` }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }

  const data = await parseJsonResponse<GeminiGenerateContentResponse>(res, 'Gemini');
  return extractGeminiText(data);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = getCorsHeaders(context.request);

  // Rate limit by IP
  const ip = context.request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const payload = (await context.request.json()) as AnalysisPayload;

    if (!payload.prompt || !payload.gameContext) {
      return new Response(JSON.stringify({ error: 'Prompt and game context are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const model = payload.model === 'gemini' ? 'gemini' : 'claude';

    if (model === 'claude') {
      const apiKey = context.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Claude API not configured — set ANTHROPIC_API_KEY in Cloudflare Pages settings' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      const analysis = await callClaude(payload.prompt, payload.gameContext, apiKey);
      return new Response(
        JSON.stringify({ analysis, model: 'claude', timestamp: new Date().toISOString() }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API not configured — set GEMINI_API_KEY in Cloudflare Pages settings' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const analysis = await callGemini(payload.prompt, payload.gameContext, apiKey);
    return new Response(
      JSON.stringify({ analysis, model: 'gemini', timestamp: new Date().toISOString() }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
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
