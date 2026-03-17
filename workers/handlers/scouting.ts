/**
 * Scouting Report Generation — LLM-Powered Player Intelligence
 *
 * Routes:
 *   GET /api/college-baseball/players/:playerId/scouting-report
 *
 * Gathers player stats from ESPN, Savant sabermetrics, HAV-F composite,
 * and game log history, then feeds them to Claude for a narrative scouting
 * report with actionable insights.
 *
 * Caches generated reports in KV (TTL: 6 hours) to avoid redundant API calls.
 * Pro-tier only — free-tier users see a preview teaser.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut } from '../shared/helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoutingReportResponse {
  report: ScoutingReport;
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
    model: string;
    cached: boolean;
  };
}

interface ScoutingReport {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  generatedAt: string;
  summary: string;
  grades: ScoutingGrades;
  strengths: string[];
  weaknesses: string[];
  projection: string;
  comparables: string[];
  keyStats: Record<string, string | number>;
  fullNarrative: string;
}

interface ScoutingGrades {
  overall: number;
  hit: number | null;
  power: number | null;
  speed: number | null;
  discipline: number | null;
  stuff: number | null;
  command: number | null;
  durability: number | null;
}

interface ClaudeMessageResponse {
  content?: Array<{ type?: string; text?: string }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const REPORT_CACHE_TTL = 21600; // 6 hours
const REPORT_HTTP_CACHE = 1800; // 30 min browser cache

const SCOUTING_SYSTEM_PROMPT = `You are a veteran college baseball scout writing for Blaze Sports Intel. You produce structured scouting reports grounded in statistics and trend data. Your audience is analytically sophisticated — they understand sabermetrics, percentile rankings, and scout-grade scales.

Write with authority. No filler. No hedging. Cite specific numbers from the data provided. Use 20-80 scouting scale for grades (50 = average D1 player). Frame observations through both traditional scouting language and modern analytics.

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence executive summary of the player's profile — who they are as a ballplayer, in plain scouting language",
  "grades": {
    "overall": <20-80 grade>,
    "hit": <20-80 or null if pitcher>,
    "power": <20-80 or null if pitcher>,
    "speed": <20-80 or null if pitcher>,
    "discipline": <20-80 or null if pitcher>,
    "stuff": <20-80 or null if hitter>,
    "command": <20-80 or null if hitter>,
    "durability": <20-80 or null if hitter>
  },
  "strengths": ["3-5 specific strengths, each citing a stat or trend"],
  "weaknesses": ["2-4 specific weaknesses with evidence"],
  "projection": "2-3 sentences on where this player is headed — draft stock, development trajectory, or role ceiling",
  "comparables": ["1-3 MLB or notable college players with similar profiles — explain WHY, not just names"],
  "keyStats": {"stat_label": "value", ...} (5-8 most telling stats from the data),
  "fullNarrative": "4-6 paragraph deep scouting report. Open with the tool — what makes this player distinct. Then the hit tool or stuff (position-dependent). Then plate discipline or command. Then projection and risk factors. Close with the bottom line — what kind of player this is at the next level. Write it like you're filing a report that a GM will read."
}

Be specific. Reference actual numbers. If data is limited, say so explicitly rather than inventing assessments. Adjust analysis based on position — hitters get hit/power/speed/discipline grades, pitchers get stuff/command/durability.`;

// ---------------------------------------------------------------------------
// Tier resolution (reused pattern from savant.ts)
// ---------------------------------------------------------------------------

async function resolveTier(headers: Headers, url: URL, env: Env): Promise<string> {
  const keyValue = headers.get('X-BSI-Key') ?? url.searchParams.get('key') ?? '';
  if (!keyValue || !env.BSI_KEYS) return 'free';
  try {
    const raw = await env.BSI_KEYS.get(`key:${keyValue}`);
    if (!raw) return 'free';
    const data = JSON.parse(raw) as { tier?: string; expires?: number };
    if (data.expires && data.expires < Date.now()) return 'free';
    return data.tier || 'free';
  } catch {
    return 'free';
  }
}

// ---------------------------------------------------------------------------
// Data aggregation — gather stats from all available sources
// ---------------------------------------------------------------------------

interface AggregatedPlayerData {
  playerName: string;
  team: string;
  position: string;
  espnStats: Record<string, unknown> | null;
  savantStats: Record<string, unknown> | null;
  havfData: Record<string, unknown> | null;
  gameLog: unknown[] | null;
}

async function aggregatePlayerData(
  playerId: string,
  env: Env,
): Promise<AggregatedPlayerData> {
  const baseUrl = env.ENVIRONMENT === 'production'
    ? 'https://blazesportsintel.com'
    : 'http://localhost:8787';

  // Fire all data fetches in parallel
  const [espnRes, savantRes, havfRes, gameLogRes] = await Promise.allSettled([
    fetch(`${baseUrl}/api/college-baseball/players/${playerId}`, {
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${baseUrl}/api/savant/player/${playerId}`, {
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${baseUrl}/api/analytics/havf/player/${playerId}`, {
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${baseUrl}/api/college-baseball/players/${playerId}/game-log`, {
      signal: AbortSignal.timeout(8000),
    }),
  ]);

  const parseJson = async (result: PromiseSettledResult<Response>): Promise<Record<string, unknown> | null> => {
    if (result.status === 'rejected') return null;
    if (!result.value.ok) return null;
    try {
      return (await result.value.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const espnData = await parseJson(espnRes);
  const savantData = await parseJson(savantRes);
  const havfData = await parseJson(havfRes);
  const gameLogData = await parseJson(gameLogRes);

  // Extract player identity from the first source that has it
  const espnPlayer = (espnData?.player ?? null) as Record<string, unknown> | null;
  const team = (espnPlayer?.team as Record<string, unknown>)?.name as string ?? 'Unknown';
  const position = (espnPlayer?.position as string) ?? 'Unknown';
  const playerName = (espnPlayer?.name as string) ??
    playerId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    playerName,
    team,
    position,
    espnStats: espnData,
    savantStats: savantData,
    havfData,
    gameLog: gameLogData ? ((gameLogData as Record<string, unknown>).games as unknown[] ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------

function buildUserPrompt(data: AggregatedPlayerData): string {
  const sections: string[] = [
    `Player: ${data.playerName}`,
    `Team: ${data.team}`,
    `Position: ${data.position}`,
  ];

  if (data.espnStats) {
    sections.push(`\n--- ESPN Statistics ---\n${JSON.stringify(data.espnStats, null, 2)}`);
  }

  if (data.savantStats) {
    sections.push(`\n--- BSI Savant Advanced Analytics ---\n${JSON.stringify(data.savantStats, null, 2)}`);
  }

  if (data.havfData) {
    sections.push(`\n--- HAV-F Composite Score ---\n${JSON.stringify(data.havfData, null, 2)}`);
  }

  if (data.gameLog && data.gameLog.length > 0) {
    // Send last 15 games to keep token count reasonable
    const recentGames = data.gameLog.slice(-15);
    sections.push(`\n--- Recent Game Log (last ${recentGames.length} games) ---\n${JSON.stringify(recentGames, null, 2)}`);
  }

  if (!data.espnStats && !data.savantStats && !data.havfData) {
    sections.push('\nNote: Limited data available. Produce a report based on what is available and flag data gaps explicitly.');
  }

  return sections.join('\n');
}

async function generateReport(
  data: AggregatedPlayerData,
  apiKey: string,
): Promise<ScoutingReport> {
  const userPrompt = buildUserPrompt(data);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SCOUTING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const responseData = (await res.json()) as ClaudeMessageResponse;
  const textBlock = responseData.content?.find((b) => b.type === 'text' && b.text?.trim());
  if (!textBlock?.text) {
    throw new Error('Claude returned no text content');
  }

  // Extract JSON from the response — Claude sometimes wraps in markdown code blocks
  let jsonText = textBlock.text.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText) as Omit<ScoutingReport, 'playerId' | 'playerName' | 'team' | 'position' | 'generatedAt'>;

  return {
    playerId: data.playerName.toLowerCase().replace(/\s+/g, '-'),
    playerName: data.playerName,
    team: data.team,
    position: data.position,
    generatedAt: new Date().toISOString(),
    summary: parsed.summary ?? '',
    grades: parsed.grades ?? { overall: 50, hit: null, power: null, speed: null, discipline: null, stuff: null, command: null, durability: null },
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    projection: parsed.projection ?? '',
    comparables: parsed.comparables ?? [],
    keyStats: parsed.keyStats ?? {},
    fullNarrative: parsed.fullNarrative ?? '',
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleScoutingReport(
  playerId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  // Tier check — Pro only
  const url = new URL(request.url);
  const tier = await resolveTier(request.headers, url, env);

  if (tier === 'free') {
    return json({
      preview: true,
      message: 'AI-powered scouting reports are available for BSI Pro subscribers.',
      teaser: {
        sections: ['Executive Summary', 'Scout Grades (20-80)', 'Strengths & Weaknesses', 'Projection & Comparables', 'Full Narrative Report'],
        cta: 'Upgrade to Pro for complete scouting intelligence.',
      },
      meta: {
        source: 'BSI Scouting Intelligence',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago' as const,
      },
    }, 200);
  }

  // Check KV cache
  const cacheKey = `scouting-report:${playerId}`;
  const cached = await kvGet<ScoutingReportResponse>(env.KV, cacheKey);
  if (cached) {
    cached.meta.cached = true;
    return cachedJson(cached, 200, REPORT_HTTP_CACHE, { 'X-Cache': 'HIT' });
  }

  // Validate API key availability
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'Scouting intelligence is temporarily unavailable.' }, 503);
  }

  try {
    // Aggregate all available player data
    const playerData = await aggregatePlayerData(playerId, env);

    // Generate the report via Claude
    const report = await generateReport(playerData, env.ANTHROPIC_API_KEY);

    const response: ScoutingReportResponse = {
      report,
      meta: {
        source: 'BSI Scouting Intelligence',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
        model: CLAUDE_MODEL,
        cached: false,
      },
    };

    // Cache the report
    await kvPut(env.KV, cacheKey, response, REPORT_CACHE_TTL);

    return cachedJson(response, 200, REPORT_HTTP_CACHE, { 'X-Cache': 'MISS' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scouting report generation failed';
    console.error(`[scouting] Error generating report for ${playerId}:`, message);
    return json({ error: 'Unable to generate scouting report. Please try again.' }, 500);
  }
}
