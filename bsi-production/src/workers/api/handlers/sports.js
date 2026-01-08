/**
 * BSI Sports API Handlers
 * MLB, NFL, NBA, CFB, and Odds endpoints
 */

import { SPORTSDATAIO_BASE, COLLEGEFOOTBALL_BASE, THEODDS_BASE } from '../constants.js';
import { fetchSportsData, fetchCFBData, getTodayDate, formatGameDate } from '../utils/helpers.js';

/**
 * Handle MLB API requests
 */
export async function handleMLBRequest(path, url, env, corsHeaders) {
  const apiKey = env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'MLB API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const today = getTodayDate();

  // Route to specific MLB endpoints
  if (path === '/api/mlb/scores' || path === '/api/mlb/scores/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/GamesByDate/${today}`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 60);
  }

  if (path === '/api/mlb/standings' || path === '/api/mlb/standings/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/Standings/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 3600);
  }

  if (path === '/api/mlb/teams' || path === '/api/mlb/teams/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/Teams`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 86400);
  }

  if (path.startsWith('/api/mlb/player/')) {
    const playerId = path.split('/').pop();
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/stats/json/Player/${playerId}`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 300);
  }

  if (path.startsWith('/api/mlb/team/')) {
    const teamId = path.split('/').pop();
    if (path.includes('/roster')) {
      const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/Players/${teamId}`;
      return fetchSportsData(apiUrl, apiKey, corsHeaders, 3600);
    }
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/scores/json/TeamSeasonStats/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 3600);
  }

  if (path === '/api/mlb/leaders/batting' || path === '/api/mlb/leaders/batting/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/stats/json/PlayerSeasonStats/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 600);
  }

  if (path === '/api/mlb/leaders/pitching' || path === '/api/mlb/leaders/pitching/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/mlb/stats/json/PlayerSeasonStats/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 600);
  }

  return new Response(JSON.stringify({ error: 'MLB endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Handle NFL API requests
 */
export async function handleNFLRequest(path, url, env, corsHeaders) {
  const apiKey = env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'NFL API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (path === '/api/nfl/scores' || path === '/api/nfl/scores/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nfl/scores/json/ScoresByWeek/2025REG/1`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 60);
  }

  if (path === '/api/nfl/standings' || path === '/api/nfl/standings/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nfl/scores/json/Standings/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 3600);
  }

  if (path === '/api/nfl/teams' || path === '/api/nfl/teams/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nfl/scores/json/Teams`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 86400);
  }

  if (path === '/api/nfl/leaders' || path === '/api/nfl/leaders/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nfl/stats/json/PlayerSeasonStats/2025REG`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 600);
  }

  return new Response(JSON.stringify({ error: 'NFL endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Handle NBA API requests
 */
export async function handleNBARequest(path, url, env, corsHeaders) {
  const apiKey = env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'NBA API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const today = getTodayDate();

  if (path === '/api/nba/scores' || path === '/api/nba/scores/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/scores/json/GamesByDate/${today}`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 60);
  }

  if (path === '/api/nba/standings' || path === '/api/nba/standings/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/scores/json/Standings/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 3600);
  }

  if (path === '/api/nba/teams' || path === '/api/nba/teams/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/scores/json/Teams`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 86400);
  }

  if (path === '/api/nba/leaders' || path === '/api/nba/leaders/') {
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/stats/json/PlayerSeasonStats/2025`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 600);
  }

  if (path.startsWith('/api/nba/player/')) {
    const playerId = path.split('/').pop();
    const apiUrl = `${SPORTSDATAIO_BASE}/nba/stats/json/Player/${playerId}`;
    return fetchSportsData(apiUrl, apiKey, corsHeaders, 300);
  }

  return new Response(JSON.stringify({ error: 'NBA endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Handle College Football API requests
 */
export async function handleCFBRequest(path, url, env, corsHeaders) {
  const apiKey = env.COLLEGEFOOTBALLDATA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CFB API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (path === '/api/cfb/scores' || path === '/api/cfb/scores/') {
    const apiUrl = `${COLLEGEFOOTBALL_BASE}/games?year=2025&week=1&seasonType=regular`;
    return fetchCFBData(apiUrl, apiKey, corsHeaders, 300);
  }

  if (path === '/api/cfb/rankings' || path === '/api/cfb/rankings/') {
    const apiUrl = `${COLLEGEFOOTBALL_BASE}/rankings?year=2025&week=1`;
    return fetchCFBData(apiUrl, apiKey, corsHeaders, 3600);
  }

  if (path === '/api/cfb/teams' || path === '/api/cfb/teams/') {
    const apiUrl = `${COLLEGEFOOTBALL_BASE}/teams`;
    return fetchCFBData(apiUrl, apiKey, corsHeaders, 86400);
  }

  return new Response(JSON.stringify({ error: 'CFB endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Handle Odds API requests
 */
export async function handleOddsRequest(path, url, env, corsHeaders) {
  const apiKey = env.THEODDSAPI_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Odds API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const sport = url.searchParams.get('sport') || 'americanfootball_nfl';
  const markets = url.searchParams.get('markets') || 'h2h,spreads,totals';
  const regions = url.searchParams.get('regions') || 'us';

  const apiUrl = `${THEODDS_BASE}/sports/${sport}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}`;

  try {
    const response = await fetch(apiUrl, {
      cf: { cacheTtl: 120, cacheEverything: true },
    });

    if (!response.ok) {
      throw new Error(`Odds API returned ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Odds fetch error:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch odds' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle NCAA Football scores (formatted)
 */
export async function handleNCAAFootballScores(env, corsHeaders) {
  const apiKey = env.COLLEGEFOOTBALLDATA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CFB API not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const apiUrl = `${COLLEGEFOOTBALL_BASE}/games?year=2025&week=1&seasonType=regular`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!response.ok) {
      throw new Error(`CFB API returned ${response.status}`);
    }

    const games = await response.json();

    // Format games for display
    const formattedGames = games.map((game) => ({
      id: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeScore: game.home_points || 0,
      awayScore: game.away_points || 0,
      status: game.completed ? 'Final' : 'Scheduled',
      startTime: formatGameDate(game.start_date),
      venue: game.venue,
      conference: game.conference_game ? 'Conference' : 'Non-Conference',
    }));

    return new Response(JSON.stringify({ games: formattedGames }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('NCAA Football scores error:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch NCAA scores' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
