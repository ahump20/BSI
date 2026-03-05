/**
 * BSI Social Intel — Claude batch classification.
 *
 * Reuses the same numbered-list batch pattern from bsi-college-baseball-daily:
 * single non-streaming POST, numbered input → numbered JSON response,
 * graceful keyword fallback if Claude is unavailable.
 *
 * Model: claude-sonnet-4-6 (speed + cost discipline).
 * Max batch: 30 posts per call.
 */

import type { RawPost, ClassifiedSignal } from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_BATCH = 30;
const CLAUDE_TIMEOUT = 45_000;

// Keywords used for fallback classification when Claude is unavailable
const SIGNAL_KEYWORDS: Record<ClassifiedSignal['signal_type'], string[]> = {
  injury_lineup: ['injur', 'day-to-day', 'dtd', 'il ', 'hurt', 'out for', 'lineup', 'scratch', 'availability'],
  transfer_portal: ['portal', 'transfer', 'commit', 'decommit', 'nil ', 'announced', 'entering'],
  recruiting: ['recruit', 'offer', 'visit', 'commitment', 'signed', 'class of', 'verbal'],
  sentiment: ['huge win', 'big loss', 'let down', 'impressive', 'terrible', 'embarrass', 'great game'],
  general: [],
};

const SYSTEM_PROMPT = `You are a college baseball intelligence analyst. Classify social media posts and extract structured data.

For each post, return a JSON object with these exact fields:
- signal_type: one of "injury_lineup" | "transfer_portal" | "recruiting" | "sentiment" | "general"
- confidence: float 0.0–1.0 (how confident you are in this classification)
- team_mentioned: slug of primary college baseball team mentioned (lowercase, hyphens), or null
- player_mentioned: full name of primary player mentioned, or null
- summary: one sentence summarizing the key information, or null if general/low-signal
- raw_entities: { teams: string[], players: string[] } — all entities mentioned

Signal type definitions:
- injury_lineup: injury reports, player availability, lineup changes
- transfer_portal: entering/exiting portal, transfer commits, decommits
- recruiting: scholarship offers, campus visits, verbal/signed commitments
- sentiment: fan or media reactions to games (requires clear positive/negative/neutral signal)
- general: college baseball news that doesn't fit above categories

Respond with a JSON array, one object per post, in the same order as the input.`;

/**
 * Classify a batch of raw posts using Claude.
 * Falls back to keyword matching if Claude is unavailable or returns an error.
 */
export async function classifyPosts(
  posts: RawPost[],
  anthropicApiKey: string | undefined,
): Promise<ClassifiedSignal[]> {
  const batch = posts.slice(0, MAX_BATCH);
  if (batch.length === 0) return [];

  // Try Claude if key available
  if (anthropicApiKey) {
    try {
      const classified = await claudeClassify(batch, anthropicApiKey);
      if (classified.length === batch.length) return classified;
    } catch (err) {
      console.warn('[classify] Claude failed, falling back to keywords:', err instanceof Error ? err.message : err);
    }
  }

  // Fallback: keyword-based classification
  return batch.map(post => keywordClassify(post));
}

async function claudeClassify(posts: RawPost[], apiKey: string): Promise<ClassifiedSignal[]> {
  const userPrompt = buildBatchPrompt(posts);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT);

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) throw new Error(`Claude API ${res.status}`);

  const data = await res.json() as { content: Array<{ text: string }> };
  const text = data.content?.[0]?.text ?? '';

  return parseBatchResponse(text, posts);
}

function buildBatchPrompt(posts: RawPost[]): string {
  const lines = posts.map((p, i) =>
    `${i + 1}. [${p.platform.toUpperCase()}] ${p.post_text.replace(/\n+/g, ' ')}`
  );
  return `Classify these ${posts.length} college baseball social media posts:\n\n${lines.join('\n\n')}\n\nReturn a JSON array with ${posts.length} objects in order.`;
}

function parseBatchResponse(text: string, posts: RawPost[]): ClassifiedSignal[] {
  // Extract JSON array from response (Claude may wrap it in markdown)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in Claude response');

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    signal_type?: string;
    confidence?: number;
    team_mentioned?: string | null;
    player_mentioned?: string | null;
    summary?: string | null;
    raw_entities?: { teams?: string[]; players?: string[] };
  }>;

  if (!Array.isArray(parsed) || parsed.length !== posts.length) {
    throw new Error(`Expected ${posts.length} results, got ${parsed.length}`);
  }

  return posts.map((post, i) => {
    const r = parsed[i];
    const signal_type = isValidSignalType(r.signal_type) ? r.signal_type : 'general';
    return {
      ...post,
      signal_type,
      confidence: typeof r.confidence === 'number' ? Math.min(1, Math.max(0, r.confidence)) : 0.5,
      team_mentioned: r.team_mentioned ?? null,
      player_mentioned: r.player_mentioned ?? null,
      summary: r.summary ?? null,
      raw_entities: {
        teams: Array.isArray(r.raw_entities?.teams) ? r.raw_entities.teams : [],
        players: Array.isArray(r.raw_entities?.players) ? r.raw_entities.players : [],
      },
    };
  });
}

function keywordClassify(post: RawPost): ClassifiedSignal {
  const lower = post.post_text.toLowerCase();

  let signal_type: ClassifiedSignal['signal_type'] = 'general';
  let confidence = 0.4;

  for (const [type, keywords] of Object.entries(SIGNAL_KEYWORDS) as [ClassifiedSignal['signal_type'], string[]][]) {
    if (type === 'general') continue;
    if (keywords.some(kw => lower.includes(kw))) {
      signal_type = type;
      confidence = 0.55;
      break;
    }
  }

  return {
    ...post,
    signal_type,
    confidence,
    team_mentioned: null,
    player_mentioned: null,
    summary: null,
    raw_entities: { teams: [], players: [] },
  };
}

function isValidSignalType(v: unknown): v is ClassifiedSignal['signal_type'] {
  return ['injury_lineup', 'transfer_portal', 'recruiting', 'sentiment', 'general'].includes(v as string);
}
