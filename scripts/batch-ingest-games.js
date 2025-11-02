/**
 * Blaze Sports Intel - Batch Game Ingestion Script
 * Efficiently inserts games from ESPN API into D1 database
 *
 * Usage:
 *   node scripts/batch-ingest-games.js --teams 126,85,120 --season 2024
 */

import { execSync } from 'child_process';

// Configuration
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
const WRANGLER_CMD = process.env.HOME + '/.npm-global/bin/wrangler';
const DB_NAME = 'blazesports-historical';

// API Headers
const headers = {
  'User-Agent': 'BlazeSportsIntel/1.0',
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip, deflate'
};

/**
 * Execute D1 command with proper error handling
 */
function executeD1Command(sql) {
  try {
    // Escape SQL for shell
    const escapedSQL = sql.replace(/'/g, "'\\''");
    const cmd = `${WRANGLER_CMD} d1 execute ${DB_NAME} --remote --command='${escapedSQL}'`;

    execSync(cmd, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    return true;
  } catch (error) {
    console.error('  ❌ SQL execution failed:', error.message);
    return false;
  }
}

/**
 * Fetch team schedule from ESPN
 */
async function fetchTeamSchedule(teamId, season) {
  const url = `${ESPN_API_BASE}/teams/${teamId}/schedule?season=${season}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Build game INSERT SQL
 */
function buildGameInsertSQL(game, seasonYear) {
  const competition = game.competitions?.[0];
  if (!competition) return null;

  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  if (!homeTeam || !awayTeam) return null;

  const gameDate = game.date.split('T')[0];
  const gameTime = game.date.split('T')[1]?.substring(0, 5) || null;

  return `
    INSERT OR IGNORE INTO games (
      espn_id, season_id, game_date, game_time, week_number,
      home_team_id, away_team_id, home_score, away_score,
      innings, status, venue_name, venue_city, venue_state,
      attendance, broadcast_network
    )
    SELECT
      '${game.id}',
      (SELECT season_id FROM seasons WHERE year = ${seasonYear}),
      '${gameDate}',
      ${gameTime ? `'${gameTime}'` : 'NULL'},
      ${game.week?.number || 'NULL'},
      (SELECT team_id FROM teams WHERE espn_id = '${homeTeam.id}'),
      (SELECT team_id FROM teams WHERE espn_id = '${awayTeam.id}'),
      ${homeTeam.score?.value ? parseInt(homeTeam.score.value) : 'NULL'},
      ${awayTeam.score?.value ? parseInt(awayTeam.score.value) : 'NULL'},
      ${competition.status?.period || 9},
      '${competition.status?.type?.name?.toLowerCase().replace('status_', '') || 'unknown'}',
      ${competition.venue?.fullName ? `'${competition.venue.fullName.replace(/'/g, "''")}'` : 'NULL'},
      ${competition.venue?.city ? `'${competition.venue.city.replace(/'/g, "''")}'` : 'NULL'},
      ${competition.venue?.state ? `'${competition.venue.state}'` : 'NULL'},
      ${competition.attendance || 0},
      ${competition.broadcasts?.[0]?.names?.[0] ? `'${competition.broadcasts[0].names[0].replace(/'/g, "''")}'` : 'NULL'}
    WHERE
      (SELECT team_id FROM teams WHERE espn_id = '${homeTeam.id}') IS NOT NULL
      AND (SELECT team_id FROM teams WHERE espn_id = '${awayTeam.id}') IS NOT NULL
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Process games for a team
 */
async function processTeam(teamId, season) {
  console.log(`\n📊 Processing team ${teamId} for ${season} season...`);

  try {
    const scheduleData = await fetchTeamSchedule(teamId, season);
    const games = scheduleData.events?.filter(e =>
      e.competitions?.[0]?.status?.type?.completed
    ) || [];

    console.log(`✓ Found ${games.length} completed games`);

    let inserted = 0;
    let skipped = 0;

    for (const game of games) {
      const sql = buildGameInsertSQL(game, season);
      if (!sql) {
        skipped++;
        continue;
      }

      const success = executeD1Command(sql);
      if (success) {
        inserted++;
        process.stdout.write(`\r  Progress: ${inserted}/${games.length} games inserted`);
      } else {
        skipped++;
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Team ${teamId} complete: ${inserted} inserted, ${skipped} skipped`);
    return { teamId, inserted, skipped, total: games.length };

  } catch (error) {
    console.error(`❌ Failed to process team ${teamId}:`, error.message);
    return { teamId, inserted: 0, skipped: 0, total: 0, error: error.message };
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    config[key] = value;
  }

  return config;
}

/**
 * Main entry point
 */
async function main() {
  console.log('🏈 Blaze Sports Intel - Batch Game Ingestion\n');

  const config = parseArgs();

  if (!config.teams || !config.season) {
    console.error('Usage: node scripts/batch-ingest-games.js --teams <team_ids> --season <year>');
    console.error('\nExample: node scripts/batch-ingest-games.js --teams 126,85,120 --season 2024');
    console.error('\nTeam IDs:');
    console.error('  126 - Texas Longhorns');
    console.error('  85  - LSU Tigers');
    console.error('  120 - Vanderbilt Commodores');
    process.exit(1);
  }

  const teams = config.teams.split(',').map(t => t.trim());
  const season = parseInt(config.season);

  console.log(`Processing ${teams.length} teams for ${season} season:\n`);

  const results = [];
  for (const teamId of teams) {
    const result = await processTeam(teamId, season);
    results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Batch Ingestion Summary');
  console.log('='.repeat(60));

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalGames = 0;

  for (const result of results) {
    console.log(`\nTeam ${result.teamId}:`);
    console.log(`  Inserted: ${result.inserted}`);
    console.log(`  Skipped:  ${result.skipped}`);
    console.log(`  Total:    ${result.total}`);
    if (result.error) {
      console.log(`  Error:    ${result.error}`);
    }

    totalInserted += result.inserted;
    totalSkipped += result.skipped;
    totalGames += result.total;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nGrand Total:`);
  console.log(`  ${totalInserted} games inserted`);
  console.log(`  ${totalSkipped} games skipped (duplicates or errors)`);
  console.log(`  ${totalGames} total games processed`);
  console.log('\n✅ Batch ingestion complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { processTeam, buildGameInsertSQL };
