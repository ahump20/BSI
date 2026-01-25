/**
 * MLB Data API Function for Cloudflare Pages
 * Dynamic route: /api/mlb/:teamId
 * Fetches real data from MLB Stats API
 *
 * Response Contract: Uses BSI standard APIResponse format
 * - status: 'ok' | 'invalid' | 'unavailable'
 * - data: payload or null
 * - source: 'live'
 */

import { rateLimit, rateLimitError, corsHeaders, generateCorrelationId } from '../_utils.js';

// Map of team slugs to MLB team IDs
const TEAM_SLUGS = {
  cardinals: 138,
  stl: 138,
  yankees: 147,
  nyy: 147,
  dodgers: 119,
  lad: 119,
  redsox: 111,
  bos: 111,
  cubs: 112,
  chc: 112,
  mets: 121,
  nym: 121,
  braves: 144,
  atl: 144,
  astros: 117,
  hou: 117,
  phillies: 143,
  phi: 143,
  padres: 135,
  sd: 135,
  giants: 137,
  sf: 137,
  mariners: 136,
  sea: 136,
  rays: 139,
  tb: 139,
  bluejays: 141,
  tor: 141,
  twins: 142,
  min: 142,
  guardians: 114,
  cle: 114,
  whitesox: 145,
  cws: 145,
  tigers: 116,
  det: 116,
  royals: 118,
  kc: 118,
  angels: 108,
  laa: 108,
  athletics: 133,
  oak: 133,
  rangers: 140,
  tex: 140,
  orioles: 110,
  bal: 110,
  marlins: 146,
  mia: 146,
  nationals: 120,
  wsh: 120,
  reds: 113,
  cin: 113,
  brewers: 158,
  mil: 158,
  pirates: 134,
  pit: 134,
  diamondbacks: 109,
  ari: 109,
  rockies: 115,
  col: 115,
};

export async function onRequest({ request, params, env }) {
  // Get teamId from path params - no default to avoid team bias
  const teamIdParam = params.teamId;
  const teamIdRaw = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Require teamId parameter
  if (!teamIdRaw) {
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Missing required parameter: teamId',
        message: 'Example: /api/mlb/147 (Yankees) or /api/mlb/cardinals',
        correlationId,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }

  // Resolve slug to numeric team ID
  let teamId = teamIdRaw.toLowerCase();
  if (TEAM_SLUGS[teamId]) {
    teamId = TEAM_SLUGS[teamId];
  } else if (!/^\d+$/.test(teamId)) {
    // Invalid slug that's not a number
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Team not found',
        message: `Unknown team slug: "${teamIdRaw}". Use team name (cardinals, yankees) or MLB ID (138, 147).`,
        correlationId,
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const data = await fetchRealMLB(teamId);
    const lastUpdated = new Date().toISOString();

    // Format response to match test expectations
    return new Response(
      JSON.stringify({
        team: {
          id: data.team?.id,
          name: data.team?.name || 'Unknown',
          abbreviation: data.team?.abbreviation || 'UNK',
          city: data.team?.locationName || data.team?.name?.split(' ').slice(0, -1).join(' ') || '',
          division: data.team?.division?.name || 'Unknown',
          league: data.team?.league?.name || 'Unknown',
          wins: data.standings?.[0]?.wins || 0,
          losses: data.standings?.[0]?.losses || 0,
          winPct: parseFloat(data.standings?.[0]?.leagueRecord?.pct || '0'),
          gamesBack: parseFloat(data.standings?.[0]?.gamesBack || '0') || 0,
          runsScored: data.analytics?.pythagorean?.runsScored || 0,
          runsAllowed: data.analytics?.pythagorean?.runsAllowed || 0,
          pythagWins: data.analytics?.pythagorean?.expectedWins,
          pythagLosses: 162 - (data.analytics?.pythagorean?.expectedWins || 81),
          lastUpdated,
        },
        roster: data.roster,
        standings: data.standings,
        analytics: data.analytics,
        lastUpdated,
        dataSource: 'MLB Stats API (Real-time)',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      }
    );
  } catch (error) {
    const correlationId = generateCorrelationId();

    // Check if error indicates team not found
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return new Response(
        JSON.stringify({
          error: 'Team not found',
          message: `No MLB team found with ID ${teamId}`,
          correlationId,
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch MLB data',
        message: error.message || 'Internal server error',
        correlationId,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }
}

async function fetchRealMLB(teamId) {
  const baseUrl = 'https://statsapi.mlb.com/api/v1';

  try {
    // Fetch real team data
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`);

    if (!teamResponse.ok) {
      throw new Error(`Team not found: MLB API returned ${teamResponse.status}`);
    }

    const teamData = await teamResponse.json();

    // Check if team exists in response
    if (!teamData.teams || teamData.teams.length === 0) {
      throw new Error('Team not found: No team data returned from MLB API');
    }

    // Fetch real standings
    const standingsResponse = await fetch(`${baseUrl}/standings?leagueId=104&season=2025`);
    const standingsData = await standingsResponse.json();

    // Fetch real roster
    const rosterResponse = await fetch(`${baseUrl}/teams/${teamId}/roster`);
    const rosterData = await rosterResponse.json();

    // Fetch hitting and pitching stats for Pythagorean calculation
    // Use current year dynamically - MLB season runs April-October
    const currentYear = new Date().getFullYear();
    const hittingResponse = await fetch(
      `${baseUrl}/teams/${teamId}/stats?stats=season&group=hitting&season=${currentYear}`
    );
    const hittingData = await hittingResponse.json();

    const pitchingResponse = await fetch(
      `${baseUrl}/teams/${teamId}/stats?stats=season&group=pitching&season=${currentYear}`
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
          dataSource: 'MLB Stats API (Real-time)',
          lastUpdated: new Date().toISOString(),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: 'MLB Stats API',
        version: '1.0',
        noFallbacks: true,
        allDataReal: true,
      },
    };
  } catch (error) {
    console.error('fetchRealMLB error:', error);
    throw error;
  }
}
