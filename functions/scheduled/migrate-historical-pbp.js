/**
 * Blaze Sports Intel - Historical PBP Migration ETL Worker
 *
 * Long-running Worker that fetches and parses play-by-play data
 * for all historical games, storing results in R2.
 *
 * Runs weekly to backfill missing PBP data
 * Cron Trigger: 0 2 * * 0 (2 AM CST every Sunday)
 *
 * Process:
 * 1. Find games without PBP data
 * 2. Fetch raw PBP from providers
 * 3. Parse using sport-specific parsers
 * 4. Store in R2 with D1 references
 */

import { parsePlayByPlay } from '../../lib/historical/pbp-parser.js';
import { storePBPData } from '../../lib/historical/pbp-storage.js';

/**
 * Scheduled cron handler - runs weekly
 */
export async function scheduled(event, env, ctx) {
  const startTime = Date.now();
  const results = {
    mlb: { processed: 0, errors: 0 },
    nfl: { processed: 0, errors: 0 },
    nba: { processed: 0, errors: 0 },
    ncaa_football: { processed: 0, errors: 0 }
  };

  console.log('🔄 Starting historical PBP migration...');

  try {
    // Process each sport in sequence (parallel would exceed rate limits)
    await migrateMLBPlayByPlay(env, results);
    await migrateNFLPlayByPlay(env, results);
    await migrateNBAPlayByPlay(env, results);
    await migrateNCAAFootballPlayByPlay(env, results);

    const duration = Date.now() - startTime;
    const totalProcessed = Object.values(results).reduce((sum, r) => sum + r.processed, 0);

    console.log(`✅ PBP migration complete in ${duration}ms - Processed ${totalProcessed} games`, results);

    // Track in Analytics Engine
    await env.ANALYTICS?.writeDataPoint({
      blobs: ['pbp_migration_complete'],
      doubles: [totalProcessed, duration],
      indexes: ['weekly_migration']
    });

  } catch (error) {
    console.error('❌ PBP migration failed:', error);

    await env.ANALYTICS?.writeDataPoint({
      blobs: ['pbp_migration_error'],
      doubles: [1],
      indexes: [error.message]
    });
  }
}

/**
 * Migrate MLB play-by-play data
 */
async function migrateMLBPlayByPlay(env, results) {
  console.log('📊 Migrating MLB PBP data...');

  try {
    // Find games without PBP data
    const gamesWithoutPBP = await env.DB.prepare(`
      SELECT g.game_id, g.season
      FROM historical_games g
      LEFT JOIN pbp_storage_refs p ON g.game_id = p.game_id
      WHERE g.sport = 'MLB'
        AND p.game_id IS NULL
        AND g.status = 'final'
      ORDER BY g.game_date DESC
      LIMIT 100
    `).all();

    console.log(`Found ${gamesWithoutPBP.results.length} MLB games without PBP`);

    for (const game of gamesWithoutPBP.results) {
      try {
        // Extract MLB game PK from game_id
        const gamePk = game.game_id.replace('mlb_', '');

        // Fetch PBP data from MLB Stats API
        const pbpUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
        const response = await fetch(pbpUrl, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn(`MLB API error for game ${gamePk}: ${response.status}`);
          results.mlb.errors++;
          continue;
        }

        const rawData = await response.json();

        // Parse PBP data
        const pbpData = parsePlayByPlay(game.game_id, 'MLB', rawData);

        // Store in R2
        await storePBPData(env, game.game_id, 'MLB', game.season, pbpData);

        results.mlb.processed++;

        // Rate limit: 2 requests per second
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing MLB game ${game.game_id}:`, error);
        results.mlb.errors++;
      }
    }

  } catch (error) {
    console.error('MLB PBP migration failed:', error);
    throw error;
  }
}

/**
 * Migrate NFL play-by-play data
 */
async function migrateNFLPlayByPlay(env, results) {
  const API_KEY = env.SPORTSDATAIO_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ SPORTSDATAIO_API_KEY not configured, skipping NFL PBP migration');
    return;
  }

  console.log('🏈 Migrating NFL PBP data...');

  try {
    const gamesWithoutPBP = await env.DB.prepare(`
      SELECT g.game_id, g.season, g.week
      FROM historical_games g
      LEFT JOIN pbp_storage_refs p ON g.game_id = p.game_id
      WHERE g.sport = 'NFL'
        AND p.game_id IS NULL
        AND g.status = 'final'
      ORDER BY g.game_date DESC
      LIMIT 50
    `).all();

    console.log(`Found ${gamesWithoutPBP.results.length} NFL games without PBP`);

    for (const game of gamesWithoutPBP.results) {
      try {
        const gameKey = game.game_id.replace('nfl_', '');

        // Fetch PBP from SportsDataIO
        const pbpUrl = `https://api.sportsdata.io/v3/nfl/stats/json/PlayByPlay/${game.season}/${game.week}/${gameKey}?key=${API_KEY}`;
        const response = await fetch(pbpUrl);

        if (!response.ok) {
          console.warn(`NFL API error for game ${gameKey}: ${response.status}`);
          results.nfl.errors++;
          continue;
        }

        const rawData = await response.json();

        // Parse PBP data
        const pbpData = parsePlayByPlay(game.game_id, 'NFL', rawData);

        // Store in R2
        await storePBPData(env, game.game_id, 'NFL', game.season, pbpData);

        results.nfl.processed++;

        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing NFL game ${game.game_id}:`, error);
        results.nfl.errors++;
      }
    }

  } catch (error) {
    console.error('NFL PBP migration failed:', error);
    throw error;
  }
}

/**
 * Migrate NBA play-by-play data
 */
async function migrateNBAPlayByPlay(env, results) {
  const API_KEY = env.SPORTSDATAIO_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ SPORTSDATAIO_API_KEY not configured, skipping NBA PBP migration');
    return;
  }

  console.log('🏀 Migrating NBA PBP data...');

  try {
    const gamesWithoutPBP = await env.DB.prepare(`
      SELECT g.game_id, g.season, g.game_date
      FROM historical_games g
      LEFT JOIN pbp_storage_refs p ON g.game_id = p.game_id
      WHERE g.sport = 'NBA'
        AND p.game_id IS NULL
        AND g.status = 'final'
      ORDER BY g.game_date DESC
      LIMIT 50
    `).all();

    console.log(`Found ${gamesWithoutPBP.results.length} NBA games without PBP`);

    for (const game of gamesWithoutPBP.results) {
      try {
        const gameId = game.game_id.replace('nba_', '');

        // Fetch PBP from SportsDataIO
        const pbpUrl = `https://api.sportsdata.io/v3/nba/stats/json/PlayByPlay/${gameId}?key=${API_KEY}`;
        const response = await fetch(pbpUrl);

        if (!response.ok) {
          console.warn(`NBA API error for game ${gameId}: ${response.status}`);
          results.nba.errors++;
          continue;
        }

        const rawData = await response.json();

        // Parse PBP data
        const pbpData = parsePlayByPlay(game.game_id, 'NBA', rawData);

        // Store in R2
        await storePBPData(env, game.game_id, 'NBA', game.season, pbpData);

        results.nba.processed++;

        // Rate limit: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing NBA game ${game.game_id}:`, error);
        results.nba.errors++;
      }
    }

  } catch (error) {
    console.error('NBA PBP migration failed:', error);
    throw error;
  }
}

/**
 * Migrate NCAA Football play-by-play data
 */
async function migrateNCAAFootballPlayByPlay(env, results) {
  console.log('🏈 Migrating NCAA Football PBP data...');

  try {
    const gamesWithoutPBP = await env.DB.prepare(`
      SELECT g.game_id, g.season
      FROM historical_games g
      LEFT JOIN pbp_storage_refs p ON g.game_id = p.game_id
      WHERE g.sport = 'NCAA_FOOTBALL'
        AND p.game_id IS NULL
        AND g.status = 'final'
      ORDER BY g.game_date DESC
      LIMIT 50
    `).all();

    console.log(`Found ${gamesWithoutPBP.results.length} NCAA Football games without PBP`);

    for (const game of gamesWithoutPBP.results) {
      try {
        const gameId = game.game_id.replace('ncaaf_', '');

        // Fetch PBP from ESPN API
        const pbpUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${gameId}`;
        const response = await fetch(pbpUrl, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn(`NCAA API error for game ${gameId}: ${response.status}`);
          results.ncaa_football.errors++;
          continue;
        }

        const rawData = await response.json();

        // Parse PBP data
        const pbpData = parsePlayByPlay(game.game_id, 'NCAA_FOOTBALL', rawData);

        // Store in R2
        await storePBPData(env, game.game_id, 'NCAA_FOOTBALL', game.season, pbpData);

        results.ncaa_football.processed++;

        // Rate limit: 2 requests per second
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing NCAA game ${game.game_id}:`, error);
        results.ncaa_football.errors++;
      }
    }

  } catch (error) {
    console.error('NCAA Football PBP migration failed:', error);
    throw error;
  }
}
