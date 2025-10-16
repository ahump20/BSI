// College Baseball Scores API - Cloudflare Pages Function
// Real-time game scores with live updates

import { ok, err, cache } from '../_utils.js';

/**
 * College Baseball Scores endpoint
 * GET /api/college-baseball/scores?date=2025-05-24&conference=SEC&status=live
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const conference = url.searchParams.get('conference');
  const status = url.searchParams.get('status'); // 'live', 'final', 'scheduled'

  try {
    const cacheKey = `college-baseball:scores:${date}:${conference || 'all'}:${status || 'all'}`;

    // Shorter cache for live games (30 seconds), longer for completed (5 minutes)
    const cacheDuration = status === 'live' ? 30 : 300;

    const scores = await cache(env, cacheKey, async () => {
      return await fetchCollegeBaseballScores(env, { date, conference, status });
    }, cacheDuration);

    return ok({
      date,
      conference: conference || 'All Conferences',
      status: status || 'all',
      count: scores.length,
      games: scores,
      meta: {
        dataSource: 'NCAA.com (via ncaa-api)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        refreshInterval: status === 'live' ? 30 : 300
      }
    });
  } catch (error) {
    return err(error);
  }
}

/**
 * Fetch college baseball scores from database and NCAA API
 */
async function fetchCollegeBaseballScores(env, filters = {}) {
  const { date, conference, status } = filters;

  let query = `
    SELECT
      g.id,
      g.ncaa_game_id as ncaaGameId,
      g.game_date as gameDate,
      g.game_time as gameTime,
      g.status,
      g.inning,
      g.inning_half as inningHalf,
      g.venue,
      g.attendance,
      g.conference_game as conferenceGame,

      home_team.id as homeTeamId,
      home_team.name as homeTeamName,
      home_team.conference as homeTeamConference,
      home_team.mascot as homeTeamMascot,
      g.home_score as homeScore,

      away_team.id as awayTeamId,
      away_team.name as awayTeamName,
      away_team.conference as awayTeamConference,
      away_team.mascot as awayTeamMascot,
      g.away_score as awayScore

    FROM college_baseball_games g
    INNER JOIN college_baseball_teams home_team ON g.home_team_id = home_team.id
    INNER JOIN college_baseball_teams away_team ON g.away_team_id = away_team.id
    WHERE DATE(g.game_date) = DATE(?)
  `;

  const params = [date];

  if (conference) {
    query += ` AND (home_team.conference = ? OR away_team.conference = ?)`;
    params.push(conference, conference);
  }

  if (status) {
    query += ` AND g.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY
    CASE g.status
      WHEN 'live' THEN 1
      WHEN 'scheduled' THEN 2
      WHEN 'final' THEN 3
      ELSE 4
    END,
    g.game_time ASC NULLS LAST,
    g.id ASC
  `;

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // If no games in database, try fetching from NCAA API
  if (results.length === 0) {
    return await fetchFromNCAAAPI(env, date, conference);
  }

  return results.map(game => ({
    id: game.id,
    ncaaGameId: game.ncaaGameId,
    gameDate: game.gameDate,
    gameTime: game.gameTime,
    homeTeam: {
      id: game.homeTeamId,
      name: game.homeTeamName,
      conference: game.homeTeamConference,
      mascot: game.homeTeamMascot,
      score: game.homeScore || 0,
      winner: game.status === 'final' && game.homeScore > game.awayScore
    },
    awayTeam: {
      id: game.awayTeamId,
      name: game.awayTeamName,
      conference: game.awayTeamConference,
      mascot: game.awayTeamMascot,
      score: game.awayScore || 0,
      winner: game.status === 'final' && game.awayScore > game.homeScore
    },
    status: game.status,
    inning: game.inning,
    inningHalf: game.inningHalf,
    venue: game.venue,
    attendance: game.attendance,
    conferenceGame: Boolean(game.conferenceGame)
  }));
}

/**
 * Fetch games from NCAA API as fallback
 * Using henrygd/ncaa-api endpoint: /scoreboard/baseball/d1/:year/:month/:day
 */
async function fetchFromNCAAAPI(env, date, conference = null) {
  try {
    const [year, month, day] = date.split('-');
    const ncaaApiUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=${year}${month}${day}`;

    const headers = {
      'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
      'Accept': 'application/json'
    };

    const response = await fetch(ncaaApiUrl, { headers, timeout: 10000 });

    if (!response.ok) {
      console.warn(`NCAA API returned ${response.status} for date ${date}`);
      return [];
    }

    const data = await response.json();

    // Parse ESPN API response structure
    const games = (data.events || []).map(event => {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');

      return {
        id: parseInt(event.id),
        ncaaGameId: parseInt(event.id),
        gameDate: event.date,
        gameTime: new Date(event.date).toLocaleTimeString('en-US', {
          timeZone: 'America/Chicago',
          hour: '2-digit',
          minute: '2-digit'
        }),
        homeTeam: {
          id: parseInt(homeTeam?.id),
          name: homeTeam?.team?.displayName,
          conference: homeTeam?.team?.conferenceId,
          mascot: homeTeam?.team?.name,
          score: parseInt(homeTeam?.score) || 0,
          winner: homeTeam?.winner
        },
        awayTeam: {
          id: parseInt(awayTeam?.id),
          name: awayTeam?.team?.displayName,
          conference: awayTeam?.team?.conferenceId,
          mascot: awayTeam?.team?.name,
          score: parseInt(awayTeam?.score) || 0,
          winner: awayTeam?.winner
        },
        status: competition?.status?.type?.state === 'in' ? 'live' :
                competition?.status?.type?.completed ? 'final' : 'scheduled',
        inning: competition?.status?.period,
        inningHalf: competition?.status?.type?.detail?.includes('Top') ? 'top' :
                    competition?.status?.type?.detail?.includes('Bottom') ? 'bottom' : null,
        venue: competition?.venue?.fullName,
        attendance: competition?.attendance,
        conferenceGame: homeTeam?.team?.conferenceId === awayTeam?.team?.conferenceId
      };
    });

    // Filter by conference if specified
    if (conference) {
      return games.filter(game =>
        game.homeTeam.conference === conference ||
        game.awayTeam.conference === conference
      );
    }

    return games;
  } catch (error) {
    console.error('NCAA API fetch error:', error);
    return [];
  }
}
