/**
 * Blaze Sports Intel - AI Insights API
 * Workers AI Integration for Real-time Sports Analysis
 */

export interface Env {
  AI: any; // Cloudflare Workers AI binding
  SPORTS_CACHE?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed. Use POST.'
    }), {
      status: 405,
      headers
    });
  }

  try {
    const body = await request.json();
    const { teamData, sport } = body;

    if (!teamData || !sport) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: teamData and sport'
      }), {
        status: 400,
        headers
      });
    }

    // Create a detailed prompt for AI analysis
    const prompt = `You are a professional sports analyst for Blaze Sports Intelligence. Analyze this ${sport.toUpperCase()} team's performance data and provide a comprehensive, data-driven insight in 2-3 sentences.

Team: ${teamData.name}
Record: ${teamData.wins}-${teamData.losses}
${sport === 'nfl' || sport === 'ncaa' ? `
Points For: ${teamData.pointsFor}
Points Against: ${teamData.pointsAgainst}
Total Yards: ${teamData.totalYards}
Turnover Margin: ${(teamData.takeaways || 0) - (teamData.turnovers || 0)}
` : sport === 'mlb' ? `
Runs Scored: ${teamData.runsScored}
Runs Allowed: ${teamData.runsAllowed}
Team Batting Average: ${teamData.battingAvg}
Team ERA: ${teamData.era}
` : sport === 'nba' ? `
Points Per Game: ${teamData.pointsPerGame}
Points Allowed: ${teamData.pointsAllowed}
Field Goal %: ${teamData.fieldGoalPct}%
Rebounds Per Game: ${teamData.reboundsPerGame}
` : ''}

Provide a professional analysis focusing on:
1. Overall performance assessment
2. Key strengths or weaknesses based on the stats
3. Playoff/championship probability or outlook

Be specific with numbers and percentages. Sound authoritative and data-driven.`;

    // Check cache first
    const cacheKey = `ai:insight:${sport}:${teamData.name}:${teamData.wins}-${teamData.losses}`;

    if (env.SPORTS_CACHE) {
      const cached = await env.SPORTS_CACHE.get(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({
          insight: cached,
          cached: true,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers
        });
      }
    }

    // Call Workers AI
    const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content: 'You are a professional sports analyst providing data-driven insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const insight = aiResponse.response || 'Analysis unavailable at this time.';

    // Cache for 1 hour
    if (env.SPORTS_CACHE) {
      await env.SPORTS_CACHE.put(cacheKey, insight, {
        expirationTtl: 3600
      });
    }

    return new Response(JSON.stringify({
      insight,
      cached: false,
      timestamp: new Date().toISOString(),
      model: '@cf/meta/llama-2-7b-chat-int8'
    }), {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('AI Insights error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers
    });
  }
};