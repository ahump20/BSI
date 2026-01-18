/**
 * NFL League-wide Standings API
 * Returns standings for all NFL teams from ESPN API
 *
 * Response Contract: Uses BSI standard APIResponse format
 * - status: 'ok' | 'invalid' | 'unavailable'
 * - data: payload or null
 * - source: 'live'
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

// NFL has 32 teams across 8 divisions
const MIN_DIVISIONS_REQUIRED = 6;

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.espn.com/',
    Origin: 'https://www.espn.com',
  };

  try {
    // Fetch full NFL standings from ESPN
    const standingsUrl = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';
    const response = await fetch(standingsUrl, { headers });

    if (!response.ok) {
      throw new Error(`ESPN NFL standings API returned ${response.status}`);
    }

    const data = await response.json();
    const lastUpdated = new Date().toISOString();

    // Transform ESPN data to our format
    const standings = [];
    let totalDivisions = 0;

    for (const conference of data.children || []) {
      for (const division of conference.children || []) {
        totalDivisions++;
        const teams = (division.standings?.entries || []).map((entry) => {
          const team = entry.team;
          const stats = entry.stats || [];

          return {
            teamId: team?.id,
            name: team?.displayName,
            abbreviation: team?.abbreviation,
            logo: team?.logos?.[0]?.href,
            wins: stats.find((s) => s.name === 'wins')?.value || 0,
            losses: stats.find((s) => s.name === 'losses')?.value || 0,
            ties: stats.find((s) => s.name === 'ties')?.value || 0,
            winPercentage: stats.find((s) => s.name === 'winPercent')?.displayValue || '.000',
            divisionRank: stats.find((s) => s.name === 'playoffSeed')?.value || 0,
            pointsFor: stats.find((s) => s.name === 'pointsFor')?.value || 0,
            pointsAgainst: stats.find((s) => s.name === 'pointsAgainst')?.value || 0,
            streak: stats.find((s) => s.name === 'streak')?.displayValue || '',
          };
        });

        standings.push({
          conference: conference.name,
          division: division.name,
          teams,
        });
      }
    }

    // Semantic validation: Check minimum density
    if (totalDivisions < MIN_DIVISIONS_REQUIRED) {
      return new Response(
        JSON.stringify({
          data: null,
          status: 'invalid',
          source: 'live',
          lastUpdated,
          reason: `Insufficient standings data: found ${totalDivisions} divisions, expected at least ${MIN_DIVISIONS_REQUIRED}`,
          meta: {
            cache: { hit: false, ttlSeconds: 0 },
            planTier: 'highlightly_pro',
            quota: { remaining: 0, resetAt: '' },
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-BSI-Status': 'invalid',
            'X-BSI-Source': 'live',
          },
        }
      );
    }

    const standingsData = {
      season: data.season?.year || new Date().getFullYear(),
      lastUpdated,
      standings,
      dataSource: 'ESPN NFL API',
    };

    // Standard APIResponse format
    return new Response(
      JSON.stringify({
        data: standingsData,
        status: 'ok',
        source: 'live',
        lastUpdated,
        reason: '',
        meta: {
          cache: { hit: false, ttlSeconds: 0 },
          planTier: 'highlightly_pro',
          quota: { remaining: 0, resetAt: '' },
        },
        // Legacy fields for backwards compatibility
        ...standingsData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-BSI-Status': 'ok',
          'X-BSI-Source': 'live',
        },
      }
    );
  } catch (error) {
    // Standard APIResponse error format
    return new Response(
      JSON.stringify({
        data: null,
        status: 'unavailable',
        source: 'live',
        lastUpdated: new Date().toISOString(),
        reason: error.message || 'Failed to fetch NFL standings',
        meta: {
          cache: { hit: false, ttlSeconds: 0 },
          planTier: 'highlightly_pro',
          quota: { remaining: 0, resetAt: '' },
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-BSI-Status': 'unavailable',
          'X-BSI-Source': 'live',
        },
      }
    );
  }
}
