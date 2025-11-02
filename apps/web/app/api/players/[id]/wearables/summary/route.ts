/**
 * GET /api/players/:id/wearables/summary
 *
 * Returns daily wearables summaries for a date range.
 *
 * Query Parameters:
 * - start: YYYY-MM-DD (default: 30 days ago)
 * - end: YYYY-MM-DD (default: today)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const playerId = params.id;
  const searchParams = request.nextUrl.searchParams;

  const endDate = searchParams.get('end') || new Date().toISOString().split('T')[0];
  const startDate = searchParams.get('start') ||
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  try {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    const result = await db.query(`
      SELECT
        summary_date,
        hrv_rmssd_avg,
        hrv_rmssd_min,
        hrv_rmssd_max,
        hrv_baseline_deviation,
        resting_hr_avg,
        hr_variability_index,
        day_strain,
        recovery_score,
        sleep_performance_score,
        total_sleep_minutes,
        rem_sleep_minutes,
        deep_sleep_minutes,
        sleep_efficiency,
        respiratory_rate_avg,
        data_completeness
      FROM wearables_daily_summary
      WHERE player_id = $1
        AND summary_date BETWEEN $2::date AND $3::date
      ORDER BY summary_date DESC
    `, [playerId, startDate, endDate]);

    await db.end();

    return NextResponse.json({
      player_id: playerId,
      start_date: startDate,
      end_date: endDate,
      summaries: result.rows,
    });
  } catch (error) {
    console.error('[API] Error fetching wearables summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wearables summary' },
      { status: 500 }
    );
  }
}
