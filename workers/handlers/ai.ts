import type { Env } from '../shared/types';
import { json } from '../shared/helpers';

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

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const SYSTEM_PROMPT = `You are a college baseball analyst for Blaze Sports Intel. You provide detailed, insightful analysis grounded in the game data provided. Your tone is knowledgeable, direct, and analytical — like a veteran scout writing for a savvy audience. Cite specific stats from the game context. No filler, no generic commentary.`;
const CLAUDE_MODEL = 'claude-sonnet-4-6';

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_MAX;
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
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }

  const data = await parseJsonResponse<GeminiGenerateContentResponse>(res, 'Gemini');
  return extractGeminiText(data);
}

export async function handleGameAnalysis(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
  }

  try {
    const payload = (await request.json()) as AnalysisPayload;

    if (!payload.prompt || !payload.gameContext) {
      return json({ error: 'Prompt and game context are required' }, 400);
    }

    const model = payload.model === 'gemini' ? 'gemini' : 'claude';

    if (model === 'claude') {
      if (!env.ANTHROPIC_API_KEY) {
        return json(
          { error: 'Claude API not configured — set ANTHROPIC_API_KEY in Worker secrets' },
          503,
        );
      }

      const analysis = await callClaude(payload.prompt, payload.gameContext, env.ANTHROPIC_API_KEY);
      return json({ analysis, model: 'claude', timestamp: new Date().toISOString() });
    }

    if (!env.GEMINI_API_KEY) {
      return json(
        { error: 'Gemini API not configured — set GEMINI_API_KEY in Worker secrets' },
        503,
      );
    }

    const analysis = await callGemini(payload.prompt, payload.gameContext, env.GEMINI_API_KEY);
    return json({ analysis, model: 'gemini', timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return json({ error: message }, 500);
  }
}

const PRESS_CONFERENCE_SYSTEM_PROMPT = `You are a college baseball analyst for Blaze Sports Intel specializing in reading between the lines of coach press conferences and media availability. Extract structured intelligence from transcripts.

Context matters: SEC coaches operate in an adversarial information environment — more scouts, more media pressure, more sophisticated adversaries. What a coach does NOT say is often more valuable than what they say.

Coach evasion taxonomy — classify deflections using these types:
1. Praise-as-deflection: excessive complimenting of a player = something is in flux with that player
2. Process language: talking about process when asked about outcome = no answer is coming, situation is live
3. Competition framing: invoking "competition" around a named position = someone is being benched or the job is genuinely open
4. Future-tense pivot: answering a present question in the future tense = not ready to answer the present question

Analyze the transcript and return a JSON object with these sections:

{
  "lineupSignals": [
    { "signal": "description of what was said", "implication": "what it likely means for upcoming lineups" }
  ],
  "healthIndicators": [
    { "player": "name", "status": "description", "readBetweenLines": "what the coach is really saying" }
  ],
  "rotationPhilosophy": [
    { "observation": "what was said about pitching", "implication": "what it means for the rotation going forward" }
  ],
  "midweekRotationSignals": [
    { "signal": "what was said about rest, bullpen work, or getting innings", "implication": "who is likely starting midweek" }
  ],
  "closerAndHighLeverage": [
    { "signal": "language about late-inning roles", "implication": "hierarchy status — established closer vs committee" }
  ],
  "dhPlatoonSignals": [
    { "signal": "language about at-bats, leg freshness, lineup flexibility", "implication": "DH spot and platoon direction" }
  ],
  "portalAndRecruitingHints": [
    { "signal": "language about roster competition, young players, building around", "implication": "portal or recruiting subtext" }
  ],
  "notableOmissions": [
    "topics the coach was asked about but deflected or refused to address"
  ],
  "saidVsImplied": [
    { "quote": "what was actually said", "subtext": "what was really meant", "evasionType": "praise-as-deflection|process-language|competition-framing|future-tense-pivot|none", "confidence": "high|medium|low", "basis": "why this read — what phrase triggered it and what alternative was rejected" }
  ],
  "keyTakeaways": ["1-2 sentence summary points"],
  "confidenceLevel": "high|medium|low"
}

Be specific. Cite exact phrases from the transcript. Flag when a coach is being evasive or strategically vague. Omit empty sections rather than returning empty arrays.`;

interface PressConferencePayload {
  transcript: string;
  coach?: string;
  team?: string;
  context?: string;
}

export async function handlePressConferenceAnalysis(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429);
  }

  try {
    const payload = (await request.json()) as PressConferencePayload;

    if (!payload.transcript || payload.transcript.trim().length < 50) {
      return json({ error: 'Transcript must be at least 50 characters' }, 400);
    }

    if (payload.transcript.length > 15000) {
      return json({ error: 'Transcript too long. Maximum 15,000 characters.' }, 400);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json(
        { error: 'AI analysis not configured' },
        503,
      );
    }

    const contextParts = [
      payload.coach ? `Coach: ${payload.coach}` : '',
      payload.team ? `Team: ${payload.team}` : '',
      payload.context ? `Context: ${payload.context}` : '',
    ].filter(Boolean);

    const userMessage = [
      contextParts.length ? contextParts.join('\n') + '\n\n' : '',
      'Transcript:\n',
      payload.transcript,
    ].join('');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: PRESS_CONFERENCE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Claude API error: ${res.status} — ${err}`);
    }

    const data = await parseJsonResponse<ClaudeMessageResponse>(res, 'Claude');
    const text = extractClaudeText(data);

    // Try to parse as JSON, fall back to raw text
    let analysis: unknown;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = { rawAnalysis: text, keyTakeaways: [text.slice(0, 200)] };
    }

    return json({
      analysis,
      model: 'claude',
      timestamp: new Date().toISOString(),
      meta: {
        source: 'BSI Press Conference Intelligence',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return json({ error: message }, 500);
  }
}
