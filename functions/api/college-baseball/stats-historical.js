/**
 * College Baseball Historical Stats API
 * Queries D1 database for historical team and player statistics
 *
 * Endpoints:
 *   GET /api/college-baseball/stats-historical?team={teamId}&season={year}
 *   GET /api/college-baseball/stats-historical?player={playerId}&season={year}
 *   GET /api/college-baseball/stats-historical?conference={abbr}&season={year}
 *
 * Examples:
 *   /api/college-baseball/stats-historical?team=251&season=2025
 *   /api/college-baseball/stats-historical?player=4567890
 *   /api/college-baseball/stats-historical?conference=SEC&season=2025
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Check if D1 database is available
  if (!env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Historical database not configured',
      message: 'D1 database is not available. Run scripts/deploy-d1-schema.sh to set up the database.'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse query parameters
    const teamId = url.searchParams.get('team');
    const playerId = url.searchParams.get('player');
    const conference = url.searchParams.get('conference');
    const season = url.searchParams.get('season') || new Date().getFullYear();

    // Route to appropriate handler
    if (teamId) {
      return await handleTeamStats(env.DB, teamId, season, corsHeaders);
    } else if (playerId) {
      return await handlePlayerStats(env.DB, playerId, season, corsHeaders);
    } else if (conference) {
      return await handleConferenceStats(env.DB, conference, season, corsHeaders);
    } else {
      return await handleOverviewStats(env.DB, season, corsHeaders);
    }

  } catch (error) {
    console.error('[Historical Stats API] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch historical stats',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get team statistics for a specific season
 */
async function handleTeamStats(db, teamId, season, corsHeaders) {
  // Get team info
  const team = await db.prepare(`
    SELECT
      t.team_id,
      t.espn_id,
      t.name,
      t.school,
      t.abbreviation,
      t.mascot,
      c.name AS conference_name,
      c.abbreviation AS conference_abbr,
      t.stadium_name,
      t.city,
      t.state
    FROM teams t
    LEFT JOIN conferences c ON t.conference_id = c.conference_id
    WHERE t.espn_id = ?
  `).bind(teamId).first();

  if (!team) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Team not found',
      message: `No team found with ID: ${teamId}`
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get season stats
  const seasonStats = await db.prepare(`
    SELECT
      s.year AS season,
      tss.wins,
      tss.losses,
      tss.games_played,
      ROUND(CAST(tss.wins AS REAL) / NULLIF(tss.games_played, 0), 3) AS win_percentage,
      tss.conference_wins,
      tss.conference_losses,
      tss.home_wins,
      tss.home_losses,
      tss.away_wins,
      tss.away_losses,
      tss.runs_scored,
      tss.runs_allowed,
      tss.batting_average,
      tss.on_base_percentage,
      tss.slugging_percentage,
      tss.team_era,
      tss.rpi,
      tss.strength_of_schedule,
      tss.pythagorean_wins
    FROM team_season_stats tss
    JOIN seasons s ON tss.season_id = s.season_id
    WHERE tss.team_id = ?
      AND s.year = ?
  `).bind(team.team_id, season).first();

  // Get recent games
  const recentGames = await db.prepare(`
    SELECT
      g.game_id,
      g.espn_id,
      g.game_date,
      g.game_time,
      CASE WHEN g.home_team_id = ? THEN at.name ELSE ht.name END AS opponent,
      CASE WHEN g.home_team_id = ? THEN 'home' ELSE 'away' END AS home_away,
      CASE WHEN g.home_team_id = ? THEN g.home_score ELSE g.away_score END AS team_score,
      CASE WHEN g.home_team_id = ? THEN g.away_score ELSE g.home_score END AS opponent_score,
      CASE
        WHEN g.winning_team_id = ? THEN 'W'
        WHEN g.winning_team_id IS NOT NULL THEN 'L'
        ELSE '-'
      END AS result,
      g.venue_name,
      g.is_conference_game
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.team_id
    JOIN teams at ON g.away_team_id = at.team_id
    JOIN seasons s ON g.season_id = s.season_id
    WHERE (g.home_team_id = ? OR g.away_team_id = ?)
      AND s.year = ?
      AND g.status = 'final'
    ORDER BY g.game_date DESC
    LIMIT 10
  `).bind(
    team.team_id, team.team_id, team.team_id, team.team_id, team.team_id,
    team.team_id, team.team_id, season
  ).all();

  return new Response(JSON.stringify({
    success: true,
    team,
    seasonStats: seasonStats || null,
    recentGames: recentGames.results || [],
    season: parseInt(season),
    dataSource: 'D1 Historical Database',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Get player statistics across seasons
 */
async function handlePlayerStats(db, playerId, season, corsHeaders) {
  // Get player info
  const player = await db.prepare(`
    SELECT
      p.player_id,
      p.espn_id,
      p.first_name,
      p.last_name,
      p.full_name,
      p.position,
      p.bats,
      p.throws,
      p.height,
      p.weight,
      p.home_town,
      p.home_state,
      p.draft_year,
      p.draft_round,
      p.draft_pick,
      p.draft_team
    FROM players p
    WHERE p.espn_id = ?
  `).bind(playerId).first();

  if (!player) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Player not found',
      message: `No player found with ID: ${playerId}`
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get season-by-season stats
  const careerStats = await db.prepare(`
    SELECT
      s.year AS season,
      t.name AS team_name,
      t.abbreviation AS team_abbr,
      tr.class_year,
      pss.games_played,
      pss.at_bats,
      pss.runs,
      pss.hits,
      pss.doubles,
      pss.triples,
      pss.home_runs,
      pss.rbi,
      pss.walks,
      pss.strikeouts,
      pss.stolen_bases,
      pss.batting_average,
      pss.on_base_percentage,
      pss.slugging_percentage,
      pss.games_pitched,
      pss.wins,
      pss.losses,
      pss.saves,
      pss.innings_pitched,
      pss.strikeouts_recorded,
      pss.era,
      pss.whip
    FROM player_season_stats pss
    JOIN seasons s ON pss.season_id = s.season_id
    JOIN teams t ON pss.team_id = t.team_id
    LEFT JOIN team_rosters tr ON tr.player_id = pss.player_id
      AND tr.team_id = pss.team_id
      AND tr.season_id = pss.season_id
    WHERE pss.player_id = ?
    ORDER BY s.year DESC
  `).bind(player.player_id).all();

  // Calculate career totals
  const careerTotals = {
    games_played: 0,
    at_bats: 0,
    hits: 0,
    home_runs: 0,
    rbi: 0,
    stolen_bases: 0,
    games_pitched: 0,
    wins: 0,
    saves: 0
  };

  (careerStats.results || []).forEach(season => {
    careerTotals.games_played += season.games_played || 0;
    careerTotals.at_bats += season.at_bats || 0;
    careerTotals.hits += season.hits || 0;
    careerTotals.home_runs += season.home_runs || 0;
    careerTotals.rbi += season.rbi || 0;
    careerTotals.stolen_bases += season.stolen_bases || 0;
    careerTotals.games_pitched += season.games_pitched || 0;
    careerTotals.wins += season.wins || 0;
    careerTotals.saves += season.saves || 0;
  });

  // Calculate career batting average
  if (careerTotals.at_bats > 0) {
    careerTotals.batting_average = (careerTotals.hits / careerTotals.at_bats).toFixed(3);
  }

  return new Response(JSON.stringify({
    success: true,
    player,
    careerStats: careerStats.results || [],
    careerTotals,
    dataSource: 'D1 Historical Database',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Get conference standings and stats
 */
async function handleConferenceStats(db, conferenceAbbr, season, corsHeaders) {
  const standings = await db.prepare(`
    SELECT
      t.name AS team,
      t.abbreviation AS team_abbr,
      tss.wins,
      tss.losses,
      tss.conference_wins,
      tss.conference_losses,
      ROUND(CAST(tss.wins AS REAL) / NULLIF(tss.games_played, 0), 3) AS win_pct,
      ROUND(CAST(tss.conference_wins AS REAL) / NULLIF(tss.conference_wins + tss.conference_losses, 0), 3) AS conf_win_pct,
      tss.runs_scored,
      tss.runs_allowed,
      tss.batting_average,
      tss.team_era,
      tss.rpi,
      tss.strength_of_schedule
    FROM team_season_stats tss
    JOIN teams t ON tss.team_id = t.team_id
    JOIN conferences c ON t.conference_id = c.conference_id
    JOIN seasons s ON tss.season_id = s.season_id
    WHERE c.abbreviation = ?
      AND s.year = ?
    ORDER BY tss.conference_wins DESC, tss.wins DESC
  `).bind(conferenceAbbr, season).all();

  return new Response(JSON.stringify({
    success: true,
    conference: conferenceAbbr,
    season: parseInt(season),
    standings: standings.results || [],
    count: standings.results?.length || 0,
    dataSource: 'D1 Historical Database',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Get overview statistics (top teams, leaders)
 */
async function handleOverviewStats(db, season, corsHeaders) {
  // Top teams by wins
  const topTeams = await db.prepare(`
    SELECT
      t.name AS team,
      c.abbreviation AS conference,
      tss.wins,
      tss.losses,
      ROUND(CAST(tss.wins AS REAL) / NULLIF(tss.games_played, 0), 3) AS win_pct,
      tss.rpi
    FROM team_season_stats tss
    JOIN teams t ON tss.team_id = t.team_id
    LEFT JOIN conferences c ON t.conference_id = c.conference_id
    JOIN seasons s ON tss.season_id = s.season_id
    WHERE s.year = ?
    ORDER BY tss.wins DESC, tss.rpi DESC
    LIMIT 25
  `).bind(season).all();

  // Batting leaders
  const battingLeaders = await db.prepare(`
    SELECT
      p.full_name AS player,
      t.abbreviation AS team,
      pss.batting_average,
      pss.home_runs,
      pss.rbi,
      pss.hits
    FROM player_season_stats pss
    JOIN players p ON pss.player_id = p.player_id
    JOIN teams t ON pss.team_id = t.team_id
    JOIN seasons s ON pss.season_id = s.season_id
    WHERE s.year = ?
      AND pss.at_bats >= 100
    ORDER BY pss.batting_average DESC
    LIMIT 10
  `).bind(season).all();

  return new Response(JSON.stringify({
    success: true,
    season: parseInt(season),
    topTeams: topTeams.results || [],
    battingLeaders: battingLeaders.results || [],
    dataSource: 'D1 Historical Database',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
