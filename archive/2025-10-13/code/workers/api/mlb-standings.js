/**
 * MLB League-wide Standings API
 * Returns standings for all MLB teams
 */

export async function onRequest({ request }) {
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
    const baseUrl = 'https://statsapi.mlb.com/api/v1';

    // Fetch both AL and NL standings
    const [alResponse, nlResponse] = await Promise.all([
      fetch(`${baseUrl}/standings?leagueId=103&season=2024`), // American League
      fetch(`${baseUrl}/standings?leagueId=104&season=2024`)  // National League
    ]);

    const alData = await alResponse.json();
    const nlData = await nlResponse.json();

    // Combine and format standings
    const standings = {
      americanLeague: alData.records || [],
      nationalLeague: nlData.records || [],
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(standings), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('MLB Standings Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch MLB standings',
      message: error.message
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}