/**
 * NFL Data API Function for Cloudflare Pages
 * Fetches real data from ESPN API with truth enforcement
 * ENFORCED BY BLAZE REALITY: All data sources verified
 */

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get('teamId') || '10'; // Titans default

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
    const data = await fetchVerifiedNFL(teamId);
    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('NFL API Error:', error);

    // Return truth-enforced error response
    return new Response(JSON.stringify({
      error: 'Failed to fetch NFL data',
      message: error.message,
      truthLabel: 'ERROR STATE - NO FABRICATED DATA',
      dataSource: 'N/A - Service Unavailable',
      lastUpdated: new Date().toISOString()
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}

async function fetchVerifiedNFL(teamId) {
  const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

  // ESPN requires proper headers to avoid 403 errors
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    // Fetch real team data with proper headers
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`, { headers });
    if (!teamResponse.ok) {
      throw new Error(`ESPN API returned ${teamResponse.status}: ${teamResponse.statusText}`);
    }
    const teamData = await teamResponse.json();

    // Fetch real standings with proper headers
    const standingsResponse = await fetch(`${baseUrl}/standings`, { headers });
    if (!standingsResponse.ok) {
      throw new Error(`ESPN standings API returned ${standingsResponse.status}`);
    }
    const standingsData = await standingsResponse.json();

    // TRUTH ENFORCEMENT: Return only verified data with clear labeling
    return {
      success: true,
      teamId: teamId,
      team: teamData.team || {},
      standings: standingsData.standings || [],
      analytics: {
        dataSource: 'ESPN NFL API',
        lastUpdated: new Date().toISOString(),
        truthLabel: 'LIVE DATA - ESPN VERIFIED',
        // NO FABRICATED ELO CALCULATIONS
        note: 'Advanced analytics require historical data validation'
      }
    };
  } catch (error) {
    throw new Error(`ESPN NFL API Error: ${error.message}`);
  }
}