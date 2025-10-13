/**
 * NCAA College Football Rankings/Standings API
 * Returns rankings and conference standings
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

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

    // Fetch both rankings and standings
    const [rankingsResponse, standingsResponse] = await Promise.all([
      fetch(`${baseUrl}/rankings`, { headers }),
      fetch(`${baseUrl}/standings`, { headers })
    ]);

    if (!rankingsResponse.ok) {
      throw new Error(`ESPN rankings API returned ${rankingsResponse.status}`);
    }
    if (!standingsResponse.ok) {
      throw new Error(`ESPN standings API returned ${standingsResponse.status}`);
    }

    const rankingsData = await rankingsResponse.json();
    const standingsData = await standingsResponse.json();

    // Format the response
    const result = {
      rankings: rankingsData.rankings || [],
      conferences: standingsData.children || [],
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('NCAA Standings Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch NCAA standings',
      message: error.message
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}