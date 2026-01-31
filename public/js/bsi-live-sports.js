/**
 * BSI Live Sports Data Worker
 * Cloudflare Worker for aggregating live sports data across multiple leagues
 * 
 * Supported Sports:
 * - College Football (FBS, FCS)
 * - College Baseball (D1)
 * - NFL
 * - MLB
 * - College Basketball (Men's, Women's)
 * 
 * Data Sources:
 * - ESPN Site API (scoreboard, boxscore, plays)
 * - NCAA API (stats, standings, rankings)
 */

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports';
const NCAA_API = 'https://ncaa-api.henrygd.me';

// Sport configuration mapping
const SPORT_CONFIG = {
  'college-football': {
    espn: `${ESPN_BASE}/football/college-football/scoreboard`,
    sport: 'football',
    league: 'college-football',
    ncaaSport: 'football',
    ncaaDivision: 'fbs',
    groups: {
      'sec': 8,
      'big-ten': 5,
      'big-12': 4,
      'acc': 1,
      'pac-12': 9,
      'fcs': 81
    }
  },
  'college-baseball': {
    espn: `${ESPN_BASE}/baseball/college-baseball/scoreboard`,
    sport: 'baseball',
    league: 'college-baseball',
    ncaaSport: 'baseball',
    ncaaDivision: 'd1'
  },
  'nfl': {
    espn: `${ESPN_BASE}/football/nfl/scoreboard`,
    sport: 'football',
    league: 'nfl'
  },
  'mlb': {
    espn: `${ESPN_BASE}/baseball/mlb/scoreboard`,
    sport: 'baseball',
    league: 'mlb'
  },
  'mens-college-basketball': {
    espn: `${ESPN_BASE}/basketball/mens-college-basketball/scoreboard`,
    sport: 'basketball',
    league: 'mens-college-basketball',
    ncaaSport: 'basketball-men',
    ncaaDivision: 'd1'
  },
  'womens-college-basketball': {
    espn: `${ESPN_BASE}/basketball/womens-college-basketball/scoreboard`,
    sport: 'basketball',
    league: 'womens-college-basketball',
    ncaaSport: 'basketball-women',
    ncaaDivision: 'd1'
  }
};

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    const path = url.pathname;
    
    try {
      // Live scoreboard endpoints
      if (path.startsWith('/api/scores/')) {
        return await handleScores(path, url, env);
      }
      
      // Boxscore endpoints
      if (path.startsWith('/api/boxscore/')) {
        return await handleBoxscore(path, url, env);
      }
      
      // Play-by-play endpoints
      if (path.startsWith('/api/plays/')) {
        return await handlePlays(path, url, env);
      }
      
      // Team endpoints
      if (path.startsWith('/api/team/')) {
        return await handleTeam(path, url, env);
      }
      
      // Rankings endpoints
      if (path.startsWith('/api/rankings/')) {
        return await handleRankings(path, url, env);
      }
      
      // Stats endpoints
      if (path.startsWith('/api/stats/')) {
        return await handleStats(path, url, env);
      }
      
      // Standings endpoints
      if (path.startsWith('/api/standings/')) {
        return await handleStandings(path, url, env);
      }
      
      // Health check
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }
      
      return jsonResponse({ error: 'Not found' }, 404);
      
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

/**
 * Handle live scores requests
 * GET /api/scores/{sport}?date=YYYYMMDD&conference=sec
 */
async function handleScores(path, url, env) {
  const sport = path.replace('/api/scores/', '').split('/')[0];
  const config = SPORT_CONFIG[sport];
  
  if (!config) {
    return jsonResponse({ error: `Unknown sport: ${sport}` }, 400);
  }
  
  // Build ESPN URL with parameters
  const espnUrl = new URL(config.espn);
  
  // Date parameter (YYYYMMDD format)
  const date = url.searchParams.get('date');
  if (date) {
    espnUrl.searchParams.set('dates', date);
  }
  
  // Conference/group filter
  const conference = url.searchParams.get('conference');
  if (conference && config.groups && config.groups[conference]) {
    espnUrl.searchParams.set('groups', config.groups[conference]);
  }
  
  // Week parameter (for football)
  const week = url.searchParams.get('week');
  if (week) {
    espnUrl.searchParams.set('week', week);
  }
  
  // Limit parameter
  const limit = url.searchParams.get('limit') || '100';
  espnUrl.searchParams.set('limit', limit);
  
  // Fetch from ESPN
  const response = await fetch(espnUrl.toString());
  const data = await response.json();
  
  // Transform to BSI format
  const games = transformScoreboard(data, sport);
  
  // Cache in KV for 30 seconds (live data)
  const cacheKey = `scores:${sport}:${date || 'today'}:${conference || 'all'}`;
  if (env.BSI_CACHE) {
    ctx.waitUntil(env.BSI_CACHE.put(cacheKey, JSON.stringify(games), { expirationTtl: 30 }));
  }
  
  return jsonResponse({
    sport,
    date: date || new Date().toISOString().split('T')[0].replace(/-/g, ''),
    conference: conference || 'all',
    count: games.length,
    games,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Handle boxscore requests
 * GET /api/boxscore/{sport}/{gameId}
 */
async function handleBoxscore(path, url, env) {
  const parts = path.replace('/api/boxscore/', '').split('/');
  const sport = parts[0];
  const gameId = parts[1];
  
  const config = SPORT_CONFIG[sport];
  if (!config) {
    return jsonResponse({ error: `Unknown sport: ${sport}` }, 400);
  }
  
  // Fetch boxscore from ESPN
  const boxscoreUrl = `https://cdn.espn.com/core/${config.league}/boxscore?xhr=1&gameId=${gameId}`;
  const response = await fetch(boxscoreUrl);
  const data = await response.json();
  
  // Transform to BSI format
  const boxscore = transformBoxscore(data, sport);
  
  return jsonResponse({
    sport,
    gameId,
    boxscore,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Handle play-by-play requests
 * GET /api/plays/{sport}/{gameId}
 */
async function handlePlays(path, url, env) {
  const parts = path.replace('/api/plays/', '').split('/');
  const sport = parts[0];
  const gameId = parts[1];
  
  const config = SPORT_CONFIG[sport];
  if (!config) {
    return jsonResponse({ error: `Unknown sport: ${sport}` }, 400);
  }
  
  // Fetch plays from ESPN
  const playsUrl = `https://cdn.espn.com/core/${config.league}/playbyplay?xhr=1&gameId=${gameId}`;
  const response = await fetch(playsUrl);
  const data = await response.json();
  
  return jsonResponse({
    sport,
    gameId,
    plays: data.gamepackageJSON?.plays || [],
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Handle team info requests
 * GET /api/team/{sport}/{teamId}
 */
async function handleTeam(path, url, env) {
  const parts = path.replace('/api/team/', '').split('/');
  const sport = parts[0];
  const teamId = parts[1];
  
  const config = SPORT_CONFIG[sport];
  if (!config) {
    return jsonResponse({ error: `Unknown sport: ${sport}` }, 400);
  }
  
  // Fetch team info
  const teamUrl = `${ESPN_BASE}/${config.sport}/${config.league}/teams/${teamId}`;
  const response = await fetch(teamUrl);
  const data = await response.json();
  
  return jsonResponse({
    sport,
    team: data.team || data,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Handle rankings requests
 * GET /api/rankings/{sport}?poll=ap
 */
async function handleRankings(path, url, env) {
  const sport = path.replace('/api/rankings/', '').split('/')[0];
  const config = SPORT_CONFIG[sport];
  
  if (!config) {
    return jsonResponse({ error: `Unknown sport: ${sport}` }, 400);
  }
  
  // Try NCAA API first for college sports
  if (config.ncaaSport) {
    const poll = url.searchParams.get('poll') || 'ap';
    const ncaaUrl = `${NCAA_API}/rankings/${config.ncaaSport}/${config.ncaaDivision}/current/${poll}`;
    
    try {
      const response = await fetch(ncaaUrl);
      if (response.ok) {
        const data = await response.json();
        return jsonResponse({
          sport,
          poll,
          rankings: data,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('NCAA API error:', e);
    }
  }
  
  // Fallback to ESPN
  const rankingsUrl = `${ESPN_BASE}/${config.sport}/${config.league}/rankings`;
  const response = await fetch(rankingsUrl);
  const data = await response.json();
  
  return jsonResponse({
    sport,
    rankings: data.rankings || [],
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Handle stats requests
 * GET /api/stats/{sport}?category=passing&year=2024
 */
async function handleStats(path, url, env) {
  const sport = path.replace('/api/stats/', '').split('/')[0];
  const config = SPORT_CONFIG[sport];
  
  if (!config || !config.ncaaSport) {
    return jsonResponse({ error: `Stats not available for: ${sport}` }, 400);
  }
  
  const category = url.searchParams.get('category') || 'scoring';
  const year = url.searchParams.get('year') || 'current';
  const type = url.searchParams.get('type') || 'team'; // team or individual
  
  // Map category to NCAA stat ID
  const statMap = {
    'scoring': 145,
    'passing': 146,
    'rushing': 147,
    'receiving': 148,
    'defense': 149,
    'batting': 750,
    'pitching': 751,
    'fielding': 752
  };
  
  const statId = statMap[category] || category;
  const ncaaUrl = `${NCAA_API}/stats/${config.ncaaSport}/${config.ncaaDivision}/${year}/${type}/${statId}`;
  
  const response = await fetch(ncaaUrl);
  const data = await response.json();
  
  return jsonResponse({
    sport,
    category,
    year,
    type,
    stats: data,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Handle standings requests
 * GET /api/standings/{sport}?conference=sec
 */
async function handleStandings(path, url, env) {
  const sport = path.replace('/api/standings/', '').split('/')[0];
  const config = SPORT_CONFIG[sport];
  
  if (!config) {
    return jsonResponse({ error: `Unknown sport: ${sport}` }, 400);
  }
  
  // Try NCAA API for college sports
  if (config.ncaaSport) {
    const ncaaUrl = `${NCAA_API}/standings/${config.ncaaSport}/${config.ncaaDivision}`;
    
    try {
      const response = await fetch(ncaaUrl);
      if (response.ok) {
        const data = await response.json();
        return jsonResponse({
          sport,
          standings: data,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('NCAA API error:', e);
    }
  }
  
  // Fallback to ESPN
  const standingsUrl = `${ESPN_BASE}/${config.sport}/${config.league}/standings`;
  const response = await fetch(standingsUrl);
  const data = await response.json();
  
  return jsonResponse({
    sport,
    standings: data.children || data.standings || [],
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Transform ESPN scoreboard to BSI format
 */
function transformScoreboard(data, sport) {
  const events = data.events || [];
  
  return events.map(event => {
    const competition = event.competitions?.[0] || {};
    const competitors = competition.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home') || competitors[0];
    const awayTeam = competitors.find(c => c.homeAway === 'away') || competitors[1];
    
    // Get game status
    const status = competition.status || event.status || {};
    const statusType = status.type || {};
    
    let gameStatus = 'scheduled';
    let statusDetail = '';
    
    if (statusType.completed) {
      gameStatus = 'final';
      statusDetail = 'Final';
    } else if (statusType.state === 'in') {
      gameStatus = 'live';
      statusDetail = status.displayClock || status.shortDetail || 'Live';
      
      // Sport-specific status
      if (sport === 'college-baseball' || sport === 'mlb') {
        const inning = status.period || 1;
        const half = status.displayClock?.includes('Top') ? 'T' : 'B';
        statusDetail = `${half}${inning}`;
      } else if (sport.includes('football')) {
        const quarter = status.period || 1;
        const clock = status.displayClock || '';
        statusDetail = `Q${quarter} ${clock}`;
      } else if (sport.includes('basketball')) {
        const half = status.period || 1;
        const clock = status.displayClock || '';
        statusDetail = `${half === 1 ? '1H' : '2H'} ${clock}`;
      }
    } else {
      statusDetail = status.shortDetail || event.date;
    }
    
    // Extract team data
    const extractTeamData = (team) => ({
      id: team?.team?.id || team?.id,
      name: team?.team?.displayName || team?.team?.name || 'TBD',
      abbreviation: team?.team?.abbreviation || '',
      logo: team?.team?.logo || '',
      color: team?.team?.color || '000000',
      record: team?.records?.[0]?.summary || '',
      score: parseInt(team?.score || 0),
      rank: team?.curatedRank?.current || null,
      winner: team?.winner || false
    });
    
    // Get venue info
    const venue = competition.venue || {};
    
    // Get broadcast info
    const broadcasts = competition.broadcasts || [];
    const broadcast = broadcasts[0]?.names?.[0] || '';
    
    // Get odds if available
    const odds = competition.odds?.[0] || {};
    
    return {
      id: event.id,
      uid: event.uid,
      name: event.name || `${awayTeam?.team?.displayName} @ ${homeTeam?.team?.displayName}`,
      shortName: event.shortName,
      date: event.date,
      status: gameStatus,
      statusDetail,
      period: status.period || 0,
      clock: status.displayClock || '',
      homeTeam: extractTeamData(homeTeam),
      awayTeam: extractTeamData(awayTeam),
      venue: {
        name: venue.fullName || venue.name || '',
        city: venue.address?.city || '',
        state: venue.address?.state || ''
      },
      broadcast,
      odds: odds.details ? {
        spread: odds.details,
        overUnder: odds.overUnder
      } : null,
      links: {
        boxscore: event.links?.find(l => l.rel?.includes('boxscore'))?.href,
        recap: event.links?.find(l => l.rel?.includes('recap'))?.href,
        gamecast: event.links?.find(l => l.rel?.includes('gamecast'))?.href
      }
    };
  });
}

/**
 * Transform ESPN boxscore to BSI format
 */
function transformBoxscore(data, sport) {
  const gamepackage = data.gamepackageJSON || data;
  const boxscore = gamepackage.boxscore || {};
  const header = gamepackage.header || {};
  
  // Get team stats
  const teams = boxscore.teams || [];
  const players = boxscore.players || [];
  
  // Format based on sport
  if (sport === 'college-baseball' || sport === 'mlb') {
    return {
      teams: teams.map(team => ({
        id: team.team?.id,
        name: team.team?.displayName,
        stats: team.statistics || [],
        batting: extractPlayerStats(players, team.team?.id, 'batting'),
        pitching: extractPlayerStats(players, team.team?.id, 'pitching')
      })),
      linescores: header.competitions?.[0]?.competitors?.map(c => ({
        team: c.team?.abbreviation,
        linescores: c.linescores?.map(l => l.value) || []
      }))
    };
  }
  
  if (sport.includes('football')) {
    return {
      teams: teams.map(team => ({
        id: team.team?.id,
        name: team.team?.displayName,
        stats: team.statistics || [],
        passing: extractPlayerStats(players, team.team?.id, 'passing'),
        rushing: extractPlayerStats(players, team.team?.id, 'rushing'),
        receiving: extractPlayerStats(players, team.team?.id, 'receiving'),
        defense: extractPlayerStats(players, team.team?.id, 'defensive')
      })),
      scoringPlays: gamepackage.scoringPlays || []
    };
  }
  
  if (sport.includes('basketball')) {
    return {
      teams: teams.map(team => ({
        id: team.team?.id,
        name: team.team?.displayName,
        stats: team.statistics || [],
        players: extractPlayerStats(players, team.team?.id, 'statistics')
      })),
      scoringPlays: gamepackage.scoringPlays || []
    };
  }
  
  return boxscore;
}

/**
 * Extract player stats by category
 */
function extractPlayerStats(players, teamId, category) {
  const teamPlayers = players.find(p => p.team?.id === teamId);
  if (!teamPlayers) return [];
  
  const stats = teamPlayers.statistics?.find(s => 
    s.name?.toLowerCase().includes(category.toLowerCase()) ||
    s.type?.toLowerCase().includes(category.toLowerCase())
  );
  
  if (!stats) return [];
  
  return stats.athletes?.map(athlete => ({
    id: athlete.athlete?.id,
    name: athlete.athlete?.displayName,
    position: athlete.athlete?.position?.abbreviation,
    stats: athlete.stats?.reduce((acc, stat, idx) => {
      if (stats.labels?.[idx]) {
        acc[stats.labels[idx]] = stat;
      }
      return acc;
    }, {})
  })) || [];
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
