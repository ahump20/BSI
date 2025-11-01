/**
 * GET /api/analytics/clutch/leaderboard
 *
 * Returns top clutch performers with wearables correlation.
 *
 * Query Parameters:
 * - season: string (default: current season)
 * - min_games: number (default: 10)
 * - limit: number (default: 50)
 * - sort_by: "clutch_score" | "poe" | "consistency" (default: "clutch_score")
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const season = searchParams.get('season') || getCurrentSeason();
  const minGames = parseInt(searchParams.get('min_games') || '10', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const sortBy = searchParams.get('sort_by') || 'clutch_score';

  // Validate sort_by
  const allowedSorts = ['clutch_score', 'poe', 'consistency'];
  const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'clutch_score';

  const sortMapping: Record<string, string> = {
    clutch_score: 'avg_clutch_score',
    poe: 'avg_points_over_expected',
    consistency: 'clutch_score_consistency',
  };

  try {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    // Use the clutch_leaderboard view
    const result = await db.query(`
      SELECT
        player_id,
        full_name,
        team_id,
        team_name,
        total_clutch_games,
        games_with_wearables,
        avg_clutch_score,
        avg_points_over_expected,
        avg_success_rate,
        avg_hrv_deviation,
        avg_recovery_score,
        clutch_score_consistency
      FROM clutch_leaderboard
      WHERE total_clutch_games >= $1
      ORDER BY ${sortMapping[sortColumn]} DESC NULLS LAST
      LIMIT $2
    `, [minGames, limit]);

    await db.end();

    return NextResponse.json({
      season,
      min_games: minGames,
      sort_by: sortBy,
      leaderboard: result.rows,
    });
  } catch (error) {
    console.error('[API] Error fetching clutch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clutch leaderboard' },
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
  const month = now.getMonth();

  if (month >= 9) {
    return `${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(2)}`;
  }
}
