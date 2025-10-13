// College Baseball Teams API - Cloudflare Pages Function
// Provides comprehensive team data for NCAA D1 Baseball

import { ok, err, cache, withRetry, fetchWithTimeout } from '../_utils.js';

/**
 * College Baseball Teams endpoint
 * GET /api/college-baseball/teams?conference=SEC&division=D1
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const conference = url.searchParams.get('conference');
  const division = url.searchParams.get('division') || 'D1';
  const search = url.searchParams.get('search');

  try {
    const cacheKey = `college-baseball:teams:${conference || 'all'}:${division}`;

    const teams = await cache(env, cacheKey, async () => {
      return await fetchCollegeBaseballTeams(env, { conference, division, search });
    }, 3600); // 1 hour cache

    return ok({
      league: 'College Baseball',
      division,
      conference: conference || 'All Conferences',
      count: teams.length,
      teams,
      meta: {
        dataSource: 'NCAA.com + D1Baseball.com',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago'
      }
    });
  } catch (error) {
    return err(error);
  }
}

/**
 * Fetch college baseball teams from database
 */
async function fetchCollegeBaseballTeams(env, filters = {}) {
  const { conference, division, search } = filters;

  let query = `
    SELECT
      t.id,
      t.ncaa_id as ncaaId,
      t.name,
      t.conference,
      t.division,
      t.mascot,
      t.colors,
      t.stadium,
      t.location,
      t.city,
      t.state,
      t.website,
      t.twitter,
      t.logo_url as logoUrl,
      tr.wins,
      tr.losses,
      tr.conference_wins as conferenceWins,
      tr.conference_losses as conferenceLosses,
      tr.rpi,
      tr.streak
    FROM college_baseball_teams t
    LEFT JOIN college_baseball_team_records tr
      ON t.id = tr.team_id AND tr.season = 2025
    WHERE 1=1
  `;

  const params = [];

  if (conference) {
    query += ` AND t.conference = ?`;
    params.push(conference);
  }

  if (division) {
    query += ` AND t.division = ?`;
    params.push(division);
  }

  if (search) {
    query += ` AND (t.name LIKE ? OR t.mascot LIKE ? OR t.city LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY tr.wins DESC NULLS LAST, t.name ASC`;

  const { results } = await env.DB.prepare(query).bind(...params).all();

  return results.map(team => ({
    id: team.id,
    ncaaId: team.ncaaId,
    name: team.name,
    conference: team.conference,
    division: team.division,
    mascot: team.mascot,
    colors: team.colors,
    stadium: team.stadium,
    location: `${team.city}, ${team.state}`,
    website: team.website,
    twitter: team.twitter,
    logoUrl: team.logoUrl || generateTeamLogoUrl(team.name),
    record: team.wins !== null ? {
      wins: team.wins || 0,
      losses: team.losses || 0,
      conferenceWins: team.conferenceWins || 0,
      conferenceLosses: team.conferenceLosses || 0,
      displayRecord: `${team.wins || 0}-${team.losses || 0}`,
      conferenceRecord: `${team.conferenceWins || 0}-${team.conferenceLosses || 0}`,
      rpi: team.rpi,
      streak: team.streak
    } : null
  }));
}

/**
 * Generate placeholder logo URL for teams without logos
 */
function generateTeamLogoUrl(teamName) {
  const baseUrl = 'https://placehold.co/200x200/BF5700/white?text=';
  const initials = teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  return `${baseUrl}${encodeURIComponent(initials)}`;
}

/**
 * Individual team details endpoint
 * GET /api/college-baseball/teams/:teamId
 */
export async function onRequest({ request, env, params }) {
  if (request.method === 'GET' && params.teamId) {
    try {
      const teamId = parseInt(params.teamId);

      const cacheKey = `college-baseball:team:${teamId}`;

      const teamData = await cache(env, cacheKey, async () => {
        return await fetchTeamDetails(env, teamId);
      }, 1800); // 30 minute cache

      return ok(teamData);
    } catch (error) {
      return err(error);
    }
  }
}

/**
 * Fetch comprehensive team details including roster and schedule
 */
async function fetchTeamDetails(env, teamId) {
  // Get team basic info
  const teamQuery = `
    SELECT
      t.*,
      tr.wins,
      tr.losses,
      tr.conference_wins as conferenceWins,
      tr.conference_losses as conferenceLosses,
      tr.home_wins as homeWins,
      tr.home_losses as homeLosses,
      tr.away_wins as awayWins,
      tr.away_losses as awayLosses,
      tr.rpi,
      tr.strength_of_schedule as sos,
      tr.conference_standing as conferenceStanding,
      tr.streak
    FROM college_baseball_teams t
    LEFT JOIN college_baseball_team_records tr
      ON t.id = tr.team_id AND tr.season = 2025
    WHERE t.id = ?
  `;

  const team = await env.DB.prepare(teamQuery).bind(teamId).first();

  if (!team) {
    throw new Error('Team not found');
  }

  // Get roster
  const rosterQuery = `
    SELECT
      id,
      name,
      jersey,
      position,
      year,
      height,
      weight,
      bats,
      throws,
      hometown,
      high_school as highSchool
    FROM college_baseball_players
    WHERE team_id = ?
    ORDER BY
      CASE position
        WHEN 'P' THEN 1
        WHEN 'C' THEN 2
        WHEN '1B' THEN 3
        WHEN '2B' THEN 4
        WHEN '3B' THEN 5
        WHEN 'SS' THEN 6
        WHEN 'OF' THEN 7
        ELSE 8
      END,
      jersey ASC
  `;

  const { results: roster } = await env.DB.prepare(rosterQuery).bind(teamId).all();

  // Get upcoming schedule
  const scheduleQuery = `
    SELECT
      g.id,
      g.game_date as gameDate,
      g.game_time as gameTime,
      g.home_team_id = ? as isHome,
      CASE
        WHEN g.home_team_id = ? THEN away_team.name
        ELSE home_team.name
      END as opponent,
      g.home_score as homeScore,
      g.away_score as awayScore,
      g.status,
      g.venue,
      g.conference_game as conferenceGame
    FROM college_baseball_games g
    LEFT JOIN college_baseball_teams home_team ON g.home_team_id = home_team.id
    LEFT JOIN college_baseball_teams away_team ON g.away_team_id = away_team.id
    WHERE (g.home_team_id = ? OR g.away_team_id = ?)
      AND g.game_date >= date('now', '-30 days')
    ORDER BY g.game_date ASC
    LIMIT 50
  `;

  const { results: schedule } = await env.DB.prepare(scheduleQuery)
    .bind(teamId, teamId, teamId, teamId)
    .all();

  return {
    team: {
      id: team.id,
      ncaaId: team.ncaa_id,
      name: team.name,
      conference: team.conference,
      division: team.division,
      mascot: team.mascot,
      colors: team.colors,
      stadium: team.stadium,
      location: `${team.city}, ${team.state}`,
      website: team.website,
      twitter: team.twitter,
      logoUrl: team.logo_url || generateTeamLogoUrl(team.name),
      record: {
        overall: `${team.wins || 0}-${team.losses || 0}`,
        conference: `${team.conferenceWins || 0}-${team.conferenceLosses || 0}`,
        home: `${team.homeWins || 0}-${team.homeLosses || 0}`,
        away: `${team.awayWins || 0}-${team.awayLosses || 0}`,
        rpi: team.rpi,
        sos: team.sos,
        conferenceStanding: team.conferenceStanding,
        streak: team.streak
      }
    },
    roster,
    schedule,
    meta: {
      dataSource: 'NCAA.com',
      lastUpdated: new Date().toISOString(),
      season: 2025
    }
  };
}
