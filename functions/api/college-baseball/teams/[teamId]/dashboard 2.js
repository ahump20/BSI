/**
 * Team Dashboard API
 * Returns all data needed for a team's analytics dashboard
 *
 * GET /api/college-baseball/teams/{teamId}/dashboard
 *
 * Response includes:
 * - Team info (name, conference, colors, stadium)
 * - Coach info
 * - Rankings (D1Baseball, Baseball America)
 * - Program history (CWS, titles, regionals)
 * - Current roster (top players)
 * - Season record
 *
 * Data source: D1 database (bsi-historical-db)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const teamId = params.teamId;
  if (!teamId) {
    return new Response(JSON.stringify({ success: false, error: 'Team ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check cache first (KV binding)
    const cacheKey = `team-dashboard:${teamId}`;
    if (env.KV) {
      const cached = await env.KV.get(cacheKey, { type: 'json' });
      if (cached) {
        return new Response(JSON.stringify({ ...cached, fromCache: true }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }
    }

    // Query D1 for team data
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch team info
    const teamResult = await db
      .prepare(
        `
      SELECT id, espn_id, name, mascot, abbreviation, conference, city, state,
             primary_color, secondary_color, logo_url, stadium_name, stadium_capacity,
             stadium_surface, coach_name, coach_years, coach_record, updated_at
      FROM college_baseball_teams WHERE id = ?
    `
      )
      .bind(teamId)
      .first();

    if (!teamResult) {
      return new Response(JSON.stringify({ success: false, error: 'Team not found', teamId }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch rankings
    const rankingsResult = await db
      .prepare(
        `
      SELECT source, rank, previous_rank, week, season
      FROM college_baseball_rankings
      WHERE team_id = ? ORDER BY season DESC, week DESC
    `
      )
      .bind(teamId)
      .all();

    // Fetch program history
    const historyResult = await db
      .prepare(
        `
      SELECT cws_appearances, last_cws_year, national_titles, last_national_title,
             conference_titles, last_conference_title, regional_appearances
      FROM college_baseball_history WHERE team_id = ?
    `
      )
      .bind(teamId)
      .first();

    // Fetch current record
    const recordResult = await db
      .prepare(
        `
      SELECT season, overall_wins, overall_losses, conference_wins, conference_losses,
             home_wins, home_losses, away_wins, away_losses, streak_type, streak_count
      FROM college_baseball_records
      WHERE team_id = ? ORDER BY season DESC LIMIT 1
    `
      )
      .bind(teamId)
      .first();

    // Fetch top players (by position)
    const playersResult = await db
      .prepare(
        `
      SELECT id, name, jersey_number, position, class_year, height, weight, hometown,
             games, at_bats, hits, home_runs, rbi, batting_avg, wins, era, strikeouts_pitched
      FROM college_baseball_players
      WHERE team_id = ? AND position IS NOT NULL AND position != 'UN'
      ORDER BY games DESC, home_runs DESC LIMIT 10
    `
      )
      .bind(teamId)
      .all();

    // Build response
    const d1Rank = rankingsResult.results?.find((r) => r.source === 'd1baseball' && r.week === 0);
    const baRank = rankingsResult.results?.find(
      (r) => r.source === 'baseball_america' && r.week === 0
    );

    const response = {
      success: true,
      fromCache: false,
      timestamp:
        new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ' CT',
      team: {
        id: teamResult.id,
        name: teamResult.name,
        mascot: teamResult.mascot,
        abbreviation: teamResult.abbreviation,
        conference: teamResult.conference,
        location: { city: teamResult.city, state: teamResult.state },
        colors: {
          primary: teamResult.primary_color,
          secondary: teamResult.secondary_color,
        },
        logo:
          teamResult.logo_url ||
          `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamResult.espn_id}.png`,
        stadium: {
          name: teamResult.stadium_name,
          capacity: teamResult.stadium_capacity,
          surface: teamResult.stadium_surface,
        },
        coach: {
          name: teamResult.coach_name,
          years: teamResult.coach_years,
          record: teamResult.coach_record,
        },
      },
      rankings: {
        d1baseball: d1Rank ? { rank: d1Rank.rank, season: d1Rank.season } : null,
        baseballAmerica: baRank ? { rank: baRank.rank, season: baRank.season } : null,
      },
      history: historyResult
        ? {
            cwsAppearances: historyResult.cws_appearances || 0,
            lastCWS: historyResult.last_cws_year,
            nationalTitles: historyResult.national_titles || 0,
            lastNationalTitle: historyResult.last_national_title,
            conferenceTitles: historyResult.conference_titles || 0,
            regionals: historyResult.regional_appearances || 0,
          }
        : null,
      record: recordResult
        ? {
            season: recordResult.season,
            overall: `${recordResult.overall_wins}-${recordResult.overall_losses}`,
            conference: `${recordResult.conference_wins}-${recordResult.conference_losses}`,
            home: `${recordResult.home_wins}-${recordResult.home_losses}`,
            away: `${recordResult.away_wins}-${recordResult.away_losses}`,
            streak: recordResult.streak_type
              ? `${recordResult.streak_type}${recordResult.streak_count}`
              : null,
          }
        : null,
      players: (playersResult.results || []).map((p) => ({
        id: p.id,
        name: p.name,
        number: p.jersey_number,
        position: p.position,
        classYear: p.class_year,
        height: p.height,
        weight: p.weight,
        hometown: p.hometown,
        stats:
          p.position?.includes('P') || p.position === 'RHP' || p.position === 'LHP'
            ? {
                type: 'pitching',
                wins: p.wins,
                era: p.era,
                strikeouts: p.strikeouts_pitched,
              }
            : {
                type: 'batting',
                avg: p.batting_avg,
                hr: p.home_runs,
                rbi: p.rbi,
              },
      })),
    };

    // Cache the response (10 min TTL)
    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify(response), { expirationTtl: 600 });
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Team dashboard error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch team data',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
