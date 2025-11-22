/**
 * Live Games Aggregator API - Cloudflare Pages Function
 * Aggregates live game data across NFL, NBA, MLB
 * Phase 3: Real-Time Data Integration
 *
 * Endpoint: /api/live-games
 * Returns: Array of live games with scores, win probability, and metadata
 */

import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 200 requests per minute per IP (higher for dashboard)
  const limit = await rateLimit(env, request, 200, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const liveGames = await fetchAllLiveGames();

    return new Response(JSON.stringify({
      success: true,
      count: liveGames.length,
      games: liveGames,
      meta: {
        dataSource: 'ESPN Live APIs (NFL, NBA, MLB)',
        lastUpdated: new Date().toISOString(),
        truthLabel: 'LIVE DATA - ESPN VERIFIED',
        refreshInterval: 30 // seconds
      }
    }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=30, s-maxage=30' // 30-second cache
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch live games',
      message: error.message,
      truthLabel: 'ERROR STATE - NO FABRICATED DATA',
      games: [] // Return empty array instead of fake data
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
}

/**
 * Fetch live games from all sports in parallel
 */
async function fetchAllLiveGames() {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.espn.com/',
    'Origin': 'https://www.espn.com'
  };

  // Fetch all sports scoreboards in parallel
  const [nflGames, nbaGames, mlbGames] = await Promise.allSettled([
    fetchNFLScoreboard(headers),
    fetchNBAScoreboard(headers),
    fetchMLBScoreboard(headers)
  ]);

  const allGames = [];

  // Process NFL results
  if (nflGames.status === 'fulfilled' && nflGames.value) {
    allGames.push(...nflGames.value);
  }

  // Process NBA results
  if (nbaGames.status === 'fulfilled' && nbaGames.value) {
    allGames.push(...nbaGames.value);
  }

  // Process MLB results
  if (mlbGames.status === 'fulfilled' && mlbGames.value) {
    allGames.push(...mlbGames.value);
  }

  // Filter only games that are currently live (in progress)
  const liveOnly = allGames.filter(game => game.status.type === 'in_progress');

  // Sort by sport priority: MLB → NFL → NBA (per user preference)
  const sportPriority = { 'MLB': 1, 'NFL': 2, 'NBA': 3 };
  liveOnly.sort((a, b) => sportPriority[a.league] - sportPriority[b.league]);

  return liveOnly;
}

/**
 * Fetch NFL scoreboard from ESPN API
 */
async function fetchNFLScoreboard(headers) {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { headers }
    );

    if (!response.ok) {
      throw new Error(`NFL API returned ${response.status}`);
    }

    const data = await response.json();
    return parseESPNGames(data, 'NFL');
  } catch (error) {
    console.error('NFL scoreboard fetch failed:', error);
    return [];
  }
}

/**
 * Fetch NBA scoreboard from ESPN API
 */
async function fetchNBAScoreboard(headers) {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
      { headers }
    );

    if (!response.ok) {
      throw new Error(`NBA API returned ${response.status}`);
    }

    const data = await response.json();
    return parseESPNGames(data, 'NBA');
  } catch (error) {
    console.error('NBA scoreboard fetch failed:', error);
    return [];
  }
}

/**
 * Fetch MLB scoreboard from ESPN API
 */
async function fetchMLBScoreboard(headers) {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
      { headers }
    );

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`);
    }

    const data = await response.json();
    return parseESPNGames(data, 'MLB');
  } catch (error) {
    console.error('MLB scoreboard fetch failed:', error);
    return [];
  }
}

/**
 * Parse ESPN scoreboard response into unified format
 */
function parseESPNGames(espnData, league) {
  if (!espnData.events || !Array.isArray(espnData.events)) {
    return [];
  }

  return espnData.events.map(event => {
    const competition = event.competitions?.[0];
    if (!competition) return null;

    const competitors = competition.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home');
    const awayTeam = competitors.find(c => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return null;

    // Determine game status
    const status = event.status?.type?.name || 'unknown';
    let statusType = 'scheduled';
    if (status.includes('STATUS_IN_PROGRESS') || status === 'STATUS_HALFTIME') {
      statusType = 'in_progress';
    } else if (status === 'STATUS_FINAL') {
      statusType = 'final';
    }

    // Calculate win probability (if available from ESPN)
    let winProbability = null;
    if (competition.situation?.lastPlay?.probability) {
      const leadingTeam = parseInt(homeTeam.score) > parseInt(awayTeam.score) ? 'home' : 'away';
      winProbability = {
        team: leadingTeam === 'home' ? homeTeam.team.abbreviation : awayTeam.team.abbreviation,
        percentage: Math.round(competition.situation.lastPlay.probability.homeWinPercentage * 100)
      };
    } else {
      // Fallback: Calculate basic win probability from score differential
      const homScore = parseInt(homeTeam.score) || 0;
      const awayScore = parseInt(awayTeam.score) || 0;
      const scoreDiff = homScore - awayScore;

      if (statusType === 'in_progress' && (homScore > 0 || awayScore > 0)) {
        // Simplified win probability based on score lead and time remaining
        const period = event.status?.period || 1;
        const totalPeriods = league === 'MLB' ? 9 : (league === 'NFL' ? 4 : 4);
        const gameProgress = period / totalPeriods;

        let baseProb = 50 + (scoreDiff * 5); // 5% per point differential
        baseProb = baseProb + (gameProgress * 10 * Math.sign(scoreDiff)); // Time factor
        baseProb = Math.max(5, Math.min(95, baseProb)); // Clamp between 5-95%

        const leadingTeam = homScore > awayScore ? 'home' : 'away';
        winProbability = {
          team: leadingTeam === 'home' ? homeTeam.team.abbreviation : awayTeam.team.abbreviation,
          percentage: Math.round(leadingTeam === 'home' ? baseProb : (100 - baseProb))
        };
      }
    }

    return {
      id: event.id,
      league,
      status: {
        type: statusType,
        detail: event.status?.type?.detail || '',
        period: event.status?.period || 1,
        clock: event.status?.displayClock || '',
        shortDetail: event.status?.type?.shortDetail || ''
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.team.displayName || awayTeam.team.name,
        abbreviation: awayTeam.team.abbreviation,
        logo: awayTeam.team.logo || '',
        score: parseInt(awayTeam.score) || 0,
        record: awayTeam.records?.[0]?.summary || '',
        conference: awayTeam.team.conferenceId || ''
      },
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.team.displayName || homeTeam.team.name,
        abbreviation: homeTeam.team.abbreviation,
        logo: homeTeam.team.logo || '',
        score: parseInt(homeTeam.score) || 0,
        record: homeTeam.records?.[0]?.summary || '',
        conference: homeTeam.team.conferenceId || ''
      },
      winProbability,
      broadcast: competition.broadcasts?.[0]?.names?.[0] || '',
      venue: competition.venue?.fullName || '',
      gameTime: event.date
    };
  }).filter(game => game !== null); // Remove any failed parses
}
