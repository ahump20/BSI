/**
 * Blaze Sports Intel - College Baseball AI Team Preview
 * Workers AI Integration for Team Analysis
 *
 * Generates AI-powered preseason previews for college baseball teams.
 * Uses tiered approach: SportsDataIO premium first, Workers AI fallback.
 */

export interface Env {
  AI: any; // Cloudflare Workers AI binding
  BASEBALL_CACHE?: KVNamespace;
  SPORTSDATAIO_API_KEY?: string;
}

interface TeamData {
  name: string;
  conference: string;
  ranking?: number;
  previousRanking?: number;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  battingAvg: number;
  era: number;
  keyPlayers?: string[];
  notableReturners?: number;
  freshmenImpact?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const teamId = params?.teamId as string;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers,
    });
  }

  if (!teamId) {
    return new Response(JSON.stringify({ error: 'Missing teamId parameter' }), {
      status: 400,
      headers,
    });
  }

  try {
    // Check cache first (1-hour TTL for preseason content)
    const cacheKey = `ai:college-baseball:preview:${teamId}`;

    if (env.BASEBALL_CACHE) {
      const cached = await env.BASEBALL_CACHE.get(cacheKey);
      if (cached) {
        return new Response(
          JSON.stringify({
            preview: JSON.parse(cached),
            cached: true,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers }
        );
      }
    }

    // Fetch team data from our teams API
    const baseUrl = new URL(request.url).origin;
    const teamResponse = await fetch(`${baseUrl}/api/college-baseball/teams/${teamId}`);

    if (!teamResponse.ok) {
      return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers });
    }

    const teamResult = await teamResponse.json();
    const team = teamResult.team || teamResult;

    // Build team data for AI prompt
    const teamData: TeamData = {
      name: team.name || teamId,
      conference: team.conference || 'Independent',
      ranking: team.ranking,
      previousRanking: team.previousRanking,
      wins: team.stats?.wins || 0,
      losses: team.stats?.losses || 0,
      runsScored: team.stats?.runsScored || 0,
      runsAllowed: team.stats?.runsAllowed || 0,
      battingAvg: team.stats?.battingAvg || 0,
      era: team.stats?.era || 0,
    };

    // Generate AI preview
    const preview = await generateTeamPreview(env, teamData);

    // Cache the result for 1 hour
    if (env.BASEBALL_CACHE) {
      await env.BASEBALL_CACHE.put(cacheKey, JSON.stringify(preview), {
        expirationTtl: 3600,
      });
    }

    return new Response(
      JSON.stringify({
        preview,
        cached: false,
        timestamp: new Date().toISOString(),
        model: '@cf/meta/llama-3-8b-instruct',
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error('College Baseball AI Preview error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate preview',
        message: error.message,
      }),
      { status: 500, headers }
    );
  }
};

interface PreviewResult {
  headline: string;
  analysis: string;
  keyFactors: string[];
  outlook: 'Omaha Contender' | 'Regional Host' | 'Tournament Team' | 'Bubble Watch' | 'Rebuilding';
  confidence: number;
}

async function generateTeamPreview(env: Env, team: TeamData): Promise<PreviewResult> {
  // Build context-aware prompt for college baseball preseason
  const prompt = buildPreviewPrompt(team);

  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 600,
    });

    const rawResponse = (response as { response: string }).response || '';

    // Parse AI response into structured format
    return parsePreviewResponse(rawResponse, team);
  } catch (error) {
    console.error('AI generation error:', error);
    // Return fallback preview
    return generateFallbackPreview(team);
  }
}

function buildPreviewPrompt(team: TeamData): string {
  const rankingContext = team.ranking
    ? `Currently ranked #${team.ranking} in the preseason polls${team.previousRanking ? ` (was #${team.previousRanking} last year)` : ''}.`
    : 'Not currently ranked in preseason polls.';

  const statsContext =
    team.wins > 0 || team.losses > 0
      ? `Last season: ${team.wins}-${team.losses} record. Runs scored: ${team.runsScored}, runs allowed: ${team.runsAllowed}. Team batting average: ${team.battingAvg.toFixed(3)}, team ERA: ${team.era.toFixed(2)}.`
      : 'Last season stats not available (may be preseason or new program).';

  return `You are a college baseball analyst for Blaze Sports Intelligence writing a 2026 preseason preview. Be direct, insightful, and data-driven. Texas voice—no corporate fluff.

Team: ${team.name}
Conference: ${team.conference}
${rankingContext}
${statsContext}

Write a compelling 2026 preseason preview with these exact sections:

HEADLINE: A punchy 5-10 word headline capturing the team's story
ANALYSIS: 2-3 sentences of specific, data-driven analysis about their outlook
KEY_FACTORS: Three specific factors that will determine their season (format: "1. [factor]", "2. [factor]", "3. [factor]")
OUTLOOK: One of exactly: "Omaha Contender", "Regional Host", "Tournament Team", "Bubble Watch", or "Rebuilding"
CONFIDENCE: A number 1-100 representing confidence in the outlook

Focus on what matters for 2026. Be specific, not generic. Sound like an analyst, not a press release.`;
}

function parsePreviewResponse(rawResponse: string, team: TeamData): PreviewResult {
  try {
    // Extract headline
    const headlineMatch = rawResponse.match(/HEADLINE:\s*(.+?)(?:\n|ANALYSIS)/i);
    const headline = headlineMatch?.[1]?.trim() || `${team.name}: 2026 Preview`;

    // Extract analysis
    const analysisMatch = rawResponse.match(/ANALYSIS:\s*(.+?)(?:\n\n|KEY_FACTORS)/is);
    const analysis =
      analysisMatch?.[1]?.trim() ||
      `${team.name} enters 2026 looking to build on their ${team.conference} foundation.`;

    // Extract key factors
    const factorsMatch = rawResponse.match(/KEY_FACTORS:\s*(.+?)(?:\n\n|OUTLOOK)/is);
    const factorsText = factorsMatch?.[1]?.trim() || '';
    const keyFactors = factorsText
      .split(/\n/)
      .map((f) => f.replace(/^\d+\.\s*/, '').trim())
      .filter((f) => f.length > 0)
      .slice(0, 3);

    if (keyFactors.length === 0) {
      keyFactors.push('Pitching depth will be crucial');
      keyFactors.push('Offensive consistency needed');
      keyFactors.push('Conference play will tell the story');
    }

    // Extract outlook
    const outlookMatch = rawResponse.match(/OUTLOOK:\s*(.+?)(?:\n|CONFIDENCE)/i);
    const outlookRaw = outlookMatch?.[1]?.trim() || '';
    const outlookOptions = [
      'Omaha Contender',
      'Regional Host',
      'Tournament Team',
      'Bubble Watch',
      'Rebuilding',
    ] as const;
    const outlook =
      outlookOptions.find((o) => outlookRaw.toLowerCase().includes(o.toLowerCase())) ||
      determineDefaultOutlook(team);

    // Extract confidence
    const confidenceMatch = rawResponse.match(/CONFIDENCE:\s*(\d+)/i);
    const confidence = Math.min(100, Math.max(1, parseInt(confidenceMatch?.[1] || '70', 10)));

    return { headline, analysis, keyFactors, outlook, confidence };
  } catch (error) {
    console.error('Parse error:', error);
    return generateFallbackPreview(team);
  }
}

function determineDefaultOutlook(team: TeamData): PreviewResult['outlook'] {
  if (team.ranking && team.ranking <= 8) return 'Omaha Contender';
  if (team.ranking && team.ranking <= 16) return 'Regional Host';
  if (team.ranking && team.ranking <= 25) return 'Tournament Team';
  if (team.wins > team.losses) return 'Bubble Watch';
  return 'Rebuilding';
}

function generateFallbackPreview(team: TeamData): PreviewResult {
  const outlook = determineDefaultOutlook(team);

  return {
    headline: `${team.name}: Eyes on 2026`,
    analysis: `The ${team.name} ${team.conference !== 'Independent' ? `${team.conference} ` : ''}program enters 2026 with eyes on making noise in the postseason. ${team.ranking ? `A #${team.ranking} preseason ranking sets expectations high.` : 'Building momentum will be key.'}`,
    keyFactors: [
      'Pitching rotation depth and bullpen reliability',
      'Offensive production and run support',
      'Experience returning from last season',
    ],
    outlook,
    confidence: team.ranking ? 75 : 60,
  };
}
