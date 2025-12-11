/**
 * College Baseball Player Detail API
 * Returns comprehensive player data from D1 database
 *
 * GET /api/college-baseball/players/:playerId
 *
 * Data includes:
 * - Bio (name, team, position, year, height, weight, bats/throws)
 * - Stats (batting or pitching depending on position)
 * - Headshot URL
 * - Team info
 */

import { corsHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const playerId = params.playerId;

  if (!playerId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Player ID required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Query D1 database for player
    if (!env.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database unavailable',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const player = await env.DB.prepare(
      `
      SELECT
        p.*,
        t.name as team_name,
        t.abbreviation as team_abbr,
        t.conference as team_conference,
        t.logo_url as team_logo
      FROM college_baseball_players p
      LEFT JOIN college_baseball_teams t ON p.team_id = t.id
      WHERE p.id = ?1
    `
    )
      .bind(playerId)
      .first();

    if (!player) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Player not found',
          playerId,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse JSON fields if stored as strings
    let bats = player.bats;
    let throws = player.throws;
    let stats = player.stats;

    if (typeof bats === 'string') {
      try {
        bats = JSON.parse(bats);
      } catch (e) {
        bats = { displayValue: bats };
      }
    }

    if (typeof throws === 'string') {
      try {
        throws = JSON.parse(throws);
      } catch (e) {
        throws = { displayValue: throws };
      }
    }

    if (typeof stats === 'string') {
      try {
        stats = JSON.parse(stats);
      } catch (e) {
        stats = {};
      }
    }

    // Build response object
    const response = {
      success: true,
      player: {
        id: player.id,
        name: player.name,
        jerseyNumber: player.jersey_number,
        position: player.position,
        year: player.class_year,
        bio: {
          height: player.height,
          weight: player.weight,
          bats: player.bats,
          throws: player.throws,
          hometown: player.hometown,
          highSchool: player.high_school,
          isTransfer: player.is_transfer === 1,
          transferFrom: player.transfer_from,
        },
        team: {
          name: player.team_name,
          slug: player.team_id,
          abbreviation: player.team_abbr,
          conference: player.team_conference,
          logo: player.team_logo,
        },
        stats: {
          batting:
            player.games > 0 || player.at_bats > 0
              ? {
                  games: player.games,
                  atBats: player.at_bats,
                  runs: player.runs,
                  hits: player.hits,
                  doubles: player.doubles,
                  triples: player.triples,
                  homeRuns: player.home_runs,
                  rbi: player.rbi,
                  walks: player.walks,
                  strikeouts: player.strikeouts,
                  stolenBases: player.stolen_bases,
                  average: player.batting_avg,
                  obp: player.on_base_pct,
                  slg: player.slugging_pct,
                }
              : null,
          pitching:
            player.innings_pitched > 0
              ? {
                  wins: player.wins,
                  losses: player.losses,
                  era: player.era,
                  gamesStarted: player.games_started,
                  saves: player.saves,
                  inningsPitched: player.innings_pitched,
                  hitsAllowed: player.hits_allowed,
                  earnedRuns: player.earned_runs,
                  walks: player.walks_allowed,
                  strikeouts: player.strikeouts_pitched,
                  whip: player.whip,
                }
              : null,
        },
        draftInfo:
          player.is_draft_eligible === 1
            ? {
                isDraftEligible: true,
                mlbPipelineRank: player.mlb_pipeline_rank,
                projection: player.draft_projection,
              }
            : null,
      },
      meta: {
        fetchedAt: new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timezone: 'America/Chicago',
        source: 'BSI D1 Database',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour cache for player data
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch player',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Convert height in inches to formatted string
 */
function formatHeight(inches) {
  if (!inches) return null;
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}
