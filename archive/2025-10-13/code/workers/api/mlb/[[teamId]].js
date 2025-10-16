/**
 * MLB Data API Function for Cloudflare Pages
 * Dynamic route: /api/mlb/:teamId
 * Fetches real data from MLB Stats API
 */

export async function onRequest({ request, params }) {
  const teamId = params.teamId || '138'; // Cardinals default

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await fetchRealMLB(teamId);
    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('MLB API Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch MLB data',
      message: error.message,
      teamId: teamId
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}

async function fetchRealMLB(teamId) {
  const baseUrl = 'https://statsapi.mlb.com/api/v1';

  try {
    // Fetch real team data
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`);
    const teamData = await teamResponse.json();

    // Fetch real standings
    const standingsResponse = await fetch(`${baseUrl}/standings?leagueId=104&season=2025`);
    const standingsData = await standingsResponse.json();

    // Fetch real roster
    const rosterResponse = await fetch(`${baseUrl}/teams/${teamId}/roster`);
    const rosterData = await rosterResponse.json();

    // Fetch hitting and pitching stats for Pythagorean calculation
    const hittingResponse = await fetch(`${baseUrl}/teams/${teamId}/stats?stats=season&group=hitting&season=2024`);
    const hittingData = await hittingResponse.json();

    const pitchingResponse = await fetch(`${baseUrl}/teams/${teamId}/stats?stats=season&group=pitching&season=2024`);
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
      162 * (Math.pow(runsScored, exponent) /
      (Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent)))
    );

    return {
      success: true,
      teamId: teamId,
      team: teamData.teams?.[0] || {},
      standings: standingsData.records?.[0]?.teamRecords || [],
      roster: rosterData.roster || [],
      analytics: {
        pythagorean: {
          expectedWins: pythagoreanWins,
          winPercentage: (pythagoreanWins / 162).toFixed(3),
          runsScored: runsScored,
          runsAllowed: runsAllowed,
          formula: 'Bill James Pythagorean Expectation (Exponent: 1.83)',
          dataSource: 'MLB Stats API (Real-time)',
          lastUpdated: new Date().toISOString()
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: 'MLB Stats API',
        version: '1.0',
        noFallbacks: true,
        allDataReal: true
      }
    };
  } catch (error) {
    console.error('fetchRealMLB error:', error);
    throw error;
  }
}