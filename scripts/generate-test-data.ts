/**
 * Test Data Generator for Clutch Performance + Wearables Integration
 *
 * Generates realistic synthetic data for testing the system without
 * requiring actual WHOOP or NBA API access.
 *
 * Usage:
 *   npm run generate-test-data
 *   tsx scripts/generate-test-data.ts
 */

import { Client } from 'pg';
import { randomUUID } from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  n_players: 10,
  n_games: 30,
  n_clutch_situations_per_game: 2,
  wearables_coverage: 0.7, // 70% of players have wearables
  database_url: process.env.DATABASE_URL || 'postgresql://localhost/blaze_sports_intel',
};

// ============================================================================
// GENERATORS
// ============================================================================

function randomNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generateTestData() {
  console.log('[Test Data Generator] Starting...');

  const db = new Client({ connectionString: CONFIG.database_url });
  await db.connect();

  try {
    // 1. Generate players
    console.log(`[Test Data Generator] Generating ${CONFIG.n_players} players...`);
    const players = await generatePlayers(db);

    // 2. Generate wearable devices for subset of players
    console.log(`[Test Data Generator] Generating wearable devices...`);
    const devicesMap = await generateWearableDevices(db, players);

    // 3. Generate games
    console.log(`[Test Data Generator] Generating ${CONFIG.n_games} games...`);
    const games = await generateGames(db);

    // 4. Generate wearables data
    console.log(`[Test Data Generator] Generating wearables data...`);
    await generateWearablesData(db, devicesMap, games);

    // 5. Generate clutch situations
    console.log(`[Test Data Generator] Generating clutch situations...`);
    const situations = await generateClutchSituations(db, games);

    // 6. Generate player actions
    console.log(`[Test Data Generator] Generating player actions...`);
    await generatePlayerActions(db, situations, players);

    console.log('[Test Data Generator] Complete!');
    console.log(`  - ${players.length} players`);
    console.log(`  - ${Object.keys(devicesMap).length} wearable devices`);
    console.log(`  - ${games.length} games`);
    console.log(`  - ${situations.length} clutch situations`);
  } finally {
    await db.end();
  }
}

async function generatePlayers(db: Client): Promise<string[]> {
  const playerIds: string[] = [];

  for (let i = 0; i < CONFIG.n_players; i++) {
    const playerId = randomUUID();
    const firstName = ['James', 'Michael', 'Kevin', 'Stephen', 'LeBron', 'Anthony', 'Chris', 'Russell', 'Kawhi', 'Giannis'][i];
    const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'][i];

    await db.query(`
      INSERT INTO players (player_id, full_name, first_name, last_name, position, sport, is_active)
      VALUES ($1, $2, $3, $4, $5, 'basketball', TRUE)
      ON CONFLICT DO NOTHING
    `, [playerId, `${firstName} ${lastName}`, firstName, lastName, ['PG', 'SG', 'SF', 'PF', 'C'][i % 5]]);

    playerIds.push(playerId);
  }

  return playerIds;
}

async function generateWearableDevices(db: Client, playerIds: string[]): Promise<Record<string, string>> {
  const devicesMap: Record<string, string> = {};
  const playersWithWearables = playerIds.slice(0, Math.floor(CONFIG.n_players * CONFIG.wearables_coverage));

  for (const playerId of playersWithWearables) {
    const deviceId = randomUUID();

    await db.query(`
      INSERT INTO wearables_devices (
        device_id, player_id, device_type, api_version,
        consent_granted, consent_granted_at, is_active, last_sync_at, sync_status
      )
      VALUES ($1, $2, 'whoop', 'v2', TRUE, NOW(), TRUE, NOW(), 'success')
    `, [deviceId, playerId]);

    devicesMap[playerId] = deviceId;
  }

  return devicesMap;
}

async function generateGames(db: Client): Promise<any[]> {
  const games: any[] = [];
  const startDate = new Date('2024-10-01');
  const endDate = new Date('2025-04-01');

  for (let i = 0; i < CONFIG.n_games; i++) {
    const gameId = `0022400${String(i).padStart(3, '0')}`;
    const gameDate = randomDate(startDate, endDate);

    await db.query(`
      INSERT INTO games (game_id, game_date, season, sport, status, home_team_score, away_team_score)
      VALUES ($1, $2, '2024-25', 'basketball', 'final', $3, $4)
      ON CONFLICT DO NOTHING
    `, [gameId, gameDate, randomInt(90, 120), randomInt(90, 120)]);

    games.push({ game_id: gameId, game_date: gameDate });
  }

  return games;
}

async function generateWearablesData(db: Client, devicesMap: Record<string, string>, games: any[]): Promise<void> {
  for (const [playerId, deviceId] of Object.entries(devicesMap)) {
    // Generate daily summaries for each game date
    for (const game of games) {
      const date = new Date(game.game_date).toISOString().split('T')[0];

      // HRV: 40-80 ms typical range
      const hrvAvg = randomNormal(60, 15);
      const hrvDeviation = randomNormal(0, 15); // % deviation from baseline

      // Recovery: 0-100
      const recoveryScore = randomNormal(70, 15);

      // Sleep: 0-100
      const sleepPerformance = randomNormal(75, 12);

      // Strain: 0-21
      const dayStrain = randomNormal(12, 4);

      await db.query(`
        INSERT INTO wearables_daily_summary (
          device_id, player_id, summary_date,
          hrv_rmssd_avg, hrv_baseline_deviation,
          resting_hr_avg, recovery_score, sleep_performance_score,
          day_strain, data_completeness, data_source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0.9, 'whoop_v2')
        ON CONFLICT (device_id, summary_date) DO NOTHING
      `, [
        deviceId,
        playerId,
        date,
        Math.max(30, Math.min(100, hrvAvg)),
        hrvDeviation,
        randomNormal(55, 8),
        Math.max(0, Math.min(100, recoveryScore)),
        Math.max(0, Math.min(100, sleepPerformance)),
        Math.max(0, Math.min(21, dayStrain)),
      ]);
    }
  }
}

async function generateClutchSituations(db: Client, games: any[]): Promise<any[]> {
  const situations: any[] = [];

  for (const game of games) {
    for (let i = 0; i < CONFIG.n_clutch_situations_per_game; i++) {
      const situationId = randomUUID();
      const period = randomInt(4, 5); // 4th quarter or OT
      const startTime = randomDate(new Date(game.game_date), new Date(game.game_date.getTime() + 3 * 3600000));
      const endTime = new Date(startTime.getTime() + randomInt(30, 180) * 1000); // 30-180 seconds

      const scoreMargin = randomInt(-5, 5);
      const clutchIntensity = 1 - (Math.abs(scoreMargin) / 5) * 0.5;

      await db.query(`
        INSERT INTO clutch_situations (
          situation_id, game_id, situation_type,
          start_timestamp, end_timestamp,
          game_clock_start, game_clock_end, period,
          score_margin, score_margin_absolute,
          home_score, away_score,
          is_clutch_time, clutch_intensity,
          playoff_game, data_source
        )
        VALUES ($1, $2, 'clutch_time', $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, FALSE, 'test_data')
      `, [
        situationId,
        game.game_id,
        startTime,
        endTime,
        `${randomInt(0, 5)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        '0:00',
        period,
        scoreMargin,
        Math.abs(scoreMargin),
        randomInt(90, 110),
        randomInt(90, 110),
        clutchIntensity,
      ]);

      situations.push({ situation_id: situationId, game_id: game.game_id });
    }
  }

  return situations;
}

async function generatePlayerActions(db: Client, situations: any[], playerIds: string[]): Promise<void> {
  for (const situation of situations) {
    // Generate 3-8 actions per situation
    const nActions = randomInt(3, 8);

    for (let i = 0; i < nActions; i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const actionType = ['field_goal_made', 'field_goal_missed', 'free_throw', 'assist', 'turnover', 'rebound'][randomInt(0, 5)];
      const isSuccessful = actionType.includes('made') || actionType === 'assist' || actionType === 'rebound';
      const pointsScored = actionType === 'field_goal_made' ? (Math.random() > 0.6 ? 3 : 2) : (actionType === 'free_throw' ? 1 : 0);

      await db.query(`
        INSERT INTO clutch_player_actions (
          situation_id, game_id, player_id,
          action_timestamp, action_type, action_subtype,
          is_successful, points_scored,
          expected_points, points_over_expected,
          data_source
        )
        VALUES ($1, $2, $3, NOW(), $4, NULL, $5, $6, $7, $8, 'test_data')
        ON CONFLICT DO NOTHING
      `, [
        situation.situation_id,
        situation.game_id,
        playerId,
        actionType,
        isSuccessful,
        pointsScored,
        pointsScored * 0.8, // Expected points slightly lower
        pointsScored - (pointsScored * 0.8),
      ]);
    }
  }
}

// ============================================================================
// RUN
// ============================================================================

generateTestData()
  .then(() => {
    console.log('[Test Data Generator] Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Test Data Generator] Error:', error);
    process.exit(1);
  });
