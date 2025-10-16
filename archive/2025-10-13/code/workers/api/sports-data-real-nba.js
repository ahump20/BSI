/**
 * NBA Data API Function for Cloudflare Pages
 * Fetches real data from ESPN API with query string support
 */

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get('teamId') || '29'; // Grizzlies default

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
      message: error.message
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}

async function fetchRealNBA(teamId) {
  const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  try {
    const teamResponse = await fetch(`${baseUrl}/teams/${teamId}`, { headers });
    if (!teamResponse.ok) {
      throw new Error(`ESPN NBA API returned ${teamResponse.status}`);
    }
    const teamData = await teamResponse.json();

    const standingsResponse = await fetch(`${baseUrl}/standings`, { headers });
    if (!standingsResponse.ok) {
      throw new Error(`ESPN NBA standings API returned ${standingsResponse.status}`);
    }
    const standingsData = await standingsResponse.json();

    const scoreboardResponse = await fetch(`${baseUrl}/scoreboard`, { headers });
    if (!scoreboardResponse.ok) {
      throw new Error(`ESPN NBA scoreboard API returned ${scoreboardResponse.status}`);
    }
    const scoreboardData = await scoreboardResponse.json();

    // Extract team statistics
    const teamRecord = teamData.team?.record?.items?.[0] || {};
    const wins = parseInt(teamRecord.summary?.split('-')?.[0] || '0');
    const losses = parseInt(teamRecord.summary?.split('-')?.[1] || '0');

    // Calculate simple efficiency rating
    let offensiveRating = 110.0; // Default NBA average
    let defensiveRating = 110.0;

    if (teamRecord.stats) {
      const ppg = teamRecord.stats.find(s => s.name === 'avgPointsFor')?.value || 110;
      const oppPpg = teamRecord.stats.find(s => s.name === 'avgPointsAgainst')?.value || 110;

      offensiveRating = parseFloat(ppg);
      defensiveRating = parseFloat(oppPpg);
    }

    return {
      success: true,
      teamId: teamId,
      team: teamData.team || {},
      standings: standingsData.standings || [],
      scoreboard: scoreboardData.events || [],
      analytics: {
        record: `${wins}-${losses}`,
        winPercentage: losses > 0 ? (wins / (wins + losses)).toFixed(3) : '0.000',
        efficiency: {
          offensiveRating: offensiveRating.toFixed(1),
          defensiveRating: defensiveRating.toFixed(1),
          netRating: (offensiveRating - defensiveRating).toFixed(1)
        },
        dataSource: 'ESPN NBA API (Real-time)',
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`NBA API Error: ${error.message}`);
  }
}