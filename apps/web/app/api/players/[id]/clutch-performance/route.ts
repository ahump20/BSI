/**
 * GET /api/players/:id/clutch-performance
 *
 * Returns clutch performance data for a specific player,
 * including all games with clutch situations and wearables context.
 *
 * Query Parameters:
 * - season: string (e.g., "2024-25") - defaults to current season
 * - min_actions: number - minimum actions to include (default: 1)
 * - include_wearables_only: boolean - only return games with wearables data
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const playerId = params.id;
  const searchParams = request.nextUrl.searchParams;

  const season = searchParams.get('season') || getCurrentSeason();
  const minActions = parseInt(searchParams.get('min_actions') || '1', 10);
  const includeWearablesOnly = searchParams.get('include_wearables_only') === 'true';

  try {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    // Get clutch performance scores with game details
    const query = `
      SELECT
        cps.score_id,
        cps.game_id,
        cps.situation_id,
        g.game_date,
        g.home_team_id,
        g.away_team_id,
        ht.name AS home_team_name,
        at.name AS away_team_name,
        cs.clutch_intensity,
        cs.period,
        cs.game_clock_start,
        cs.score_margin,
        cps.actions_total,
        cps.actions_successful,
        cps.success_rate,
        cps.points_scored,
        cps.assists,
        cps.turnovers,
        cps.rebounds,
        cps.expected_points,
        cps.points_over_expected,
        cps.clutch_score,
        cps.clutch_percentile,
        cps.hrv_rmssd_pregame,
        cps.hrv_baseline_deviation,
        cps.recovery_score_pregame,
        cps.sleep_performance_pregame,
        cps.day_strain_pregame,
        cps.has_wearables_data,
        cps.wearables_quality_score,
        cps.calculated_at
      FROM clutch_performance_scores cps
      JOIN games g ON cps.game_id = g.game_id
      JOIN clutch_situations cs ON cps.situation_id = cs.situation_id
      LEFT JOIN teams ht ON g.home_team_id = ht.team_id
      LEFT JOIN teams at ON g.away_team_id = at.team_id
      WHERE cps.player_id = $1
        AND g.season = $2
        AND cps.actions_total >= $3
        ${includeWearablesOnly ? 'AND cps.has_wearables_data = TRUE' : ''}
      ORDER BY g.game_date DESC, cs.clutch_intensity DESC
    `;

    const result = await db.query(query, [playerId, season, minActions]);

    // Calculate aggregates
    const games = result.rows;
    const totalGames = games.length;
    const avgClutchScore = games.length > 0
      ? games.reduce((sum, g) => sum + (g.clutch_score || 0), 0) / games.length
      : 0;
    const avgPOE = games.length > 0
      ? games.reduce((sum, g) => sum + (g.points_over_expected || 0), 0) / games.length
      : 0;
    const gamesWithWearables = games.filter(g => g.has_wearables_data).length;

    // Get player info
    const playerResult = await db.query(`
      SELECT player_id, full_name, team_id, position
      FROM players
      WHERE player_id = $1
    `, [playerId]);

    const player = playerResult.rows[0] || null;

    await db.end();

    return NextResponse.json({
      player,
      season,
      summary: {
        total_games: totalGames,
        games_with_wearables: gamesWithWearables,
        avg_clutch_score: parseFloat(avgClutchScore.toFixed(2)),
        avg_points_over_expected: parseFloat(avgPOE.toFixed(2)),
      },
      games,
    });
  } catch (error) {
    console.error('[API] Error fetching clutch performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clutch performance data' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get current NBA season
 */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // NBA season runs October (month 9) to June (month 5)
  if (month >= 9) {
    // October-December: current year to next year
    return `${year}-${(year + 1).toString().slice(2)}`;
  } else {
    // January-September: previous year to current year
    return `${year - 1}-${year.toString().slice(2)}`;
  }
}
