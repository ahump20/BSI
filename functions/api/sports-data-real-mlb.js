/**
 * MLB Data API Function for Cloudflare Pages
 * Fetches real data from MLB Stats API with query string support
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get('teamId') || '138'; // Cardinals default

  // Dynamic year detection - defaults to current MLB season
  // Allows historical queries with explicit ?season=2024 parameter
  const currentYear = new Date().getFullYear();
  const season = url.searchParams.get('season') || currentYear.toString();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const data = await fetchRealMLB(teamId);
    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch MLB data',
        message: error.message,
      }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
}

async function fetchRealMLB(teamId) {
  const baseUrl = 'https://statsapi.mlb.com/api/v1';

  try {
    // Fetch real team data
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`);
    const teamData = await teamResponse.json();

    // Fetch real standings (dynamic season)
    const standingsResponse = await fetch(`${baseUrl}/standings?leagueId=104&season=${season}`);
    const standingsData = await standingsResponse.json();

    // Fetch real roster
    const rosterResponse = await fetch(`${baseUrl}/teams/${teamId}/roster`);
    const rosterData = await rosterResponse.json();

    // Fetch hitting and pitching stats for Pythagorean calculation (dynamic season)
    const hittingResponse = await fetch(
      `${baseUrl}/teams/${teamId}/stats?stats=season&group=hitting&season=${season}`
    );
    const hittingData = await hittingResponse.json();

    const pitchingResponse = await fetch(
      `${baseUrl}/teams/${teamId}/stats?stats=season&group=pitching&season=${season}`
    );
    const pitchingData = await pitchingResponse.json();

    // Extract runs scored and allowed from real data - NO FALLBACKS!
    let runsScored, runsAllowed;

    if (hittingData.stats?.[0]?.splits?.[0]?.stat?.runs) {
      runsScored = hittingData.stats[0].splits[0].stat.runs;
    }

    if (pitchingData.stats?.[0]?.splits?.[0]?.stat?.runs) {
      runsAllowed = pitchingData.stats[0].splits[0].stat.runs;
    }

    // NO FALLBACKS - if we don't have real data, we fail
    if (!runsScored || !runsAllowed) {
      throw new Error('Unable to fetch runs data from MLB Stats API - no fallbacks allowed');
    }

    // REAL Pythagorean calculation using Bill James formula
    const exponent = 1.83; // Bill James exponent for MLB
    const pythagoreanWins = Math.round(
      162 *
        (Math.pow(runsScored, exponent) /
          (Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent)))
    );

    // Truth labeling: distinguish current season from historical queries
    const isCurrent = season === currentYear.toString();
    const dataSourceLabel = isCurrent
      ? `MLB Stats API (${season} Season - Live)`
      : `MLB Stats API (Historical: ${season} Season)`;

    return {
      success: true,
      teamId,
      team: teamData.teams?.[0] || {},
      standings: standingsData.records?.[0]?.teamRecords || [],
      roster: rosterData.roster || [],
      analytics: {
        pythagorean: {
          expectedWins: pythagoreanWins,
          winPercentage: (pythagoreanWins / 162).toFixed(3),
          runsScored,
          runsAllowed,
          formula: 'Bill James Pythagorean Expectation (Exponent: 1.83)',
        },
        dataSource: dataSourceLabel,
        lastUpdated: new Date().toISOString(),
      },
      meta: {
        season: parseInt(season),
        seasonStatus: isCurrent ? 'active' : 'completed',
        isCurrent,
        warning: isCurrent
          ? null
          : 'This is historical data. For current season, omit the season parameter.',
      },
    };
  } catch (error) {
    throw new Error(`MLB API Error: ${error.message}`);
  }
}
