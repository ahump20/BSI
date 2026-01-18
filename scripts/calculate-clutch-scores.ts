/**
 * Calculate Clutch Performance Scores Script
 *
 * Processes all games with clutch situations and calculates
 * clutch performance scores for all players.
 *
 * Usage:
 *   tsx scripts/calculate-clutch-scores.ts
 *   tsx scripts/calculate-clutch-scores.ts --game-id=0022400123
 *   tsx scripts/calculate-clutch-scores.ts --season=2024-25
 */

import { Client } from 'pg';
import { createClutchPerformanceCalculator } from '../api/services/clutch-performance-calculator';

async function main() {
  const args = process.argv.slice(2);
  const gameIdArg = args.find((a) => a.startsWith('--game-id='));
  const seasonArg = args.find((a) => a.startsWith('--season='));

  const gameId = gameIdArg ? gameIdArg.split('=')[1] : null;
  const season = seasonArg ? seasonArg.split('=')[1] : '2024-25';

  console.log('[Clutch Score Calculator] Starting...');
  console.log(`  Game ID: ${gameId || 'all'}`);
  console.log(`  Season: ${season}`);

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const calculator = createClutchPerformanceCalculator(db);

  try {
    let results;

    if (gameId) {
      // Calculate for specific game
      console.log(`[Clutch Score Calculator] Calculating for game ${gameId}...`);
      results = await calculator.calculateScoresForGame(gameId);
      console.log(`[Clutch Score Calculator] Calculated ${results.length} scores`);
    } else {
      // Calculate for all games in season
      const gamesResult = await db.query(
        `
        SELECT DISTINCT game_id
        FROM clutch_situations cs
        JOIN games g ON cs.game_id = g.game_id
        WHERE g.season = $1
        ORDER BY game_id
      `,
        [season]
      );

      const gameIds: string[] = gamesResult.rows.map((r) => r.game_id);
      console.log(`[Clutch Score Calculator] Found ${gameIds.length} games in ${season}`);

      results = await calculator.calculateScoresForGames(gameIds);
      console.log(`[Clutch Score Calculator] Results:`);
      console.log(`  Processed: ${results.processed}`);
      console.log(`  Failed: ${results.failed}`);

      if (results.errors.length > 0) {
        console.log(`  Errors:`);
        results.errors.forEach((err) => {
          console.log(`    - ${err.game_id}: ${err.error}`);
        });
      }
    }

    console.log('[Clutch Score Calculator] Complete!');
  } finally {
    await db.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[Clutch Score Calculator] Error:', error);
    process.exit(1);
  });
