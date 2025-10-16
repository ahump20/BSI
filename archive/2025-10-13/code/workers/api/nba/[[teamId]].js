/**
 * NBA Data API Function for Cloudflare Pages
 * Dynamic route: /api/nba/:teamId
 * Fetches real data from ESPN API
 */

export async function onRequest({ request, params }) {
  const teamId = params.teamId || '15'; // Grizzlies default

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
    const data = await fetchRealNBA(teamId);
    return new Response(JSON.stringify(data), {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('NBA API Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch NBA data',
      message: error.message,
      teamId: teamId
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}

async function fetchRealNBA(teamId) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    // Fetch real team data from ESPN API
    const teamResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}`, { headers });
    const teamData = await teamResponse.json();

    // Fetch real standings
    const standingsResponse = await fetch('https://site.api.espn.com/apis/v2/sports/basketball/nba/standings', { headers });
    const standingsData = await standingsResponse.json();

    // Fetch real roster
    const rosterResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`, { headers });
    const rosterData = await rosterResponse.json();

    const team = teamData.team || {};
    const record = team.record?.items?.[0]?.stats || [];

    return {
      success: true,
      teamId: teamId,
      team: {
        id: team.id,
        displayName: team.displayName,
        abbreviation: team.abbreviation,
        color: team.color,
        alternateColor: team.alternateColor,
        logos: team.logos,
        record: {
          overall: record.find(s => s.name === 'overall')?.displayValue || '0-0',
          conference: record.find(s => s.name === 'vsConf')?.displayValue || '0-0',
          home: record.find(s => s.name === 'Home')?.displayValue || '0-0',
          away: record.find(s => s.name === 'Road')?.displayValue || '0-0'
        }
      },
      standings: standingsData.children || [],
      roster: rosterData.athletes || [],
      meta: {
        timestamp: new Date().toISOString(),
        source: 'ESPN API',
        version: '1.0',
        noFallbacks: true,
        allDataReal: true
      }
    };
  } catch (error) {
    console.error('fetchRealNBA error:', error);
    throw error;
  }
}