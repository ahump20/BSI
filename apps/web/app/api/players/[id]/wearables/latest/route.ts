/**
 * GET /api/players/:id/wearables/latest
 *
 * Returns the most recent wearables readings for a player (last 24 hours).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const playerId = params.id;

  try {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();

    // Get latest readings (last 24 hours)
    const readingsResult = await db.query(`
      SELECT
        reading_id,
        reading_timestamp,
        metric_type,
        metric_value,
        metric_unit,
        quality_score,
        activity_state
      FROM wearables_readings
      WHERE player_id = $1
        AND reading_timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY reading_timestamp DESC
      LIMIT 100
    `, [playerId]);

    // Get latest daily summary
    const summaryResult = await db.query(`
      SELECT
        summary_date,
        hrv_rmssd_avg,
        hrv_baseline_deviation,
        resting_hr_avg,
        day_strain,
        recovery_score,
        sleep_performance_score,
        total_sleep_minutes,
        data_completeness
      FROM wearables_daily_summary
      WHERE player_id = $1
      ORDER BY summary_date DESC
      LIMIT 1
    `, [playerId]);

    // Get device info
    const deviceResult = await db.query(`
      SELECT
        device_id,
        device_type,
        last_sync_at,
        sync_status
      FROM wearables_devices
      WHERE player_id = $1
        AND is_active = TRUE
        AND consent_granted = TRUE
      ORDER BY last_sync_at DESC
      LIMIT 1
    `, [playerId]);

    await db.end();

    return NextResponse.json({
      player_id: playerId,
      device: deviceResult.rows[0] || null,
      latest_summary: summaryResult.rows[0] || null,
      recent_readings: readingsResult.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error fetching wearables data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wearables data' },
      { status: 500 }
    );
  }
}
