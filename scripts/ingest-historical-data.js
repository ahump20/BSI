/**
 * Blaze Sports Intel - Historical Data Ingestion Script
 * Fetches data from ESPN API and stores in D1 database
 *
 * Usage:
 *   node scripts/ingest-historical-data.js --season 2025 --conference SEC
 *   node scripts/ingest-historical-data.js --team 251 --season 2025
 *   node scripts/ingest-historical-data.js --game 401234567
 */

import { parse } from 'node:path';

// Configuration
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
const WRANGLER_D1_DB = 'blazesports-historical';

// API Headers
const headers = {
  'User-Agent': 'BlazeSportsIntel/1.0',
  'Accept': 'application/json'
};

/**
 * Fetch team data from ESPN API
 */
async function fetchTeamFromESPN(espnTeamId) {
  const response = await fetch(`${ESPN_API_BASE}/teams/${espnTeamId}`, { headers });
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch games for a team and season
 */
async function fetchTeamGames(espnTeamId, season) {
  const response = await fetch(
    `${ESPN_API_BASE}/teams/${espnTeamId}/schedule?season=${season}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch box score data
 */
async function fetchBoxScore(espnGameId) {
  const response = await fetch(`${ESPN_API_BASE}/summary?event=${espnGameId}`, { headers });
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Insert or update team in D1 database
 */
function buildTeamInsertSQL(teamData) {
  const team = teamData.team;
  const conference = team.groups?.[0];

  return {
    sql: `
      INSERT INTO teams (
        espn_id, name, school, abbreviation, mascot,
        city, state, stadium_name, color, alt_color, logo_url, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(espn_id) DO UPDATE SET
        name = excluded.name,
        school = excluded.school,
        abbreviation = excluded.abbreviation,
        updated_at = CURRENT_TIMESTAMP
    `,
    params: [
      team.id,
      team.displayName,
      team.school || team.location,
      team.abbreviation,
      team.name,
      team.venue?.city,
      team.venue?.state,
      team.venue?.fullName,
      team.color,
      team.alternateColor,
      team.logos?.[0]?.href
    ]
  };
}

/**
 * Insert game into D1 database
 */
function buildGameInsertSQL(gameData, seasonId) {
  const competition = gameData.competitions?.[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  return {
    sql: `
      INSERT INTO games (
        espn_id, season_id, game_date, game_time, week_number,
        home_team_id, away_team_id, home_score, away_score,
        innings, status, venue_name, venue_city, venue_state,
        attendance, broadcast_network
      )
      SELECT
        ?, (SELECT season_id FROM seasons WHERE year = ?), ?, ?, ?,
        (SELECT team_id FROM teams WHERE espn_id = ?),
        (SELECT team_id FROM teams WHERE espn_id = ?),
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM games WHERE espn_id = ?)
    `,
    params: [
      gameData.id,
      seasonId,
      gameData.date.split('T')[0], // ISO date
      gameData.date.split('T')[1]?.substring(0, 5), // HH:MM time
      gameData.week?.number,
      homeTeam.id,
      awayTeam.id,
      homeTeam.score?.value ? parseInt(homeTeam.score.value) : null,
      awayTeam.score?.value ? parseInt(awayTeam.score.value) : null,
      competition.status?.period || 9,
      competition.status?.type?.name?.toLowerCase().replace('status_', ''),
      competition.venue?.fullName,
      competition.venue?.city,
      competition.venue?.state,
      competition.attendance,
      competition.broadcasts?.[0]?.names?.[0],
      gameData.id // for the WHERE NOT EXISTS check
    ]
  };
}

/**
 * Insert box score data
 */
function buildBoxScoreInsertSQL(boxScoreData, gameId) {
  const homeTeam = boxScoreData.boxscore?.teams?.[0];
  const awayTeam = boxScoreData.boxscore?.teams?.[1];

  if (!homeTeam || !awayTeam) {
    return null;
  }

  return {
    sql: `
      INSERT INTO box_scores (
        game_id, home_runs, home_hits, home_errors,
        away_runs, away_hits, away_errors
      )
      SELECT
        (SELECT game_id FROM games WHERE espn_id = ?),
        ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM box_scores bs
        JOIN games g ON bs.game_id = g.game_id
        WHERE g.espn_id = ?
      )
    `,
    params: [
      gameId,
      homeTeam.statistics?.find(s => s.name === 'runs')?.displayValue || 0,
      homeTeam.statistics?.find(s => s.name === 'hits')?.displayValue || 0,
      homeTeam.statistics?.find(s => s.name === 'errors')?.displayValue || 0,
      awayTeam.statistics?.find(s => s.name === 'runs')?.displayValue || 0,
      awayTeam.statistics?.find(s => s.name === 'hits')?.displayValue || 0,
      awayTeam.statistics?.find(s => s.name === 'errors')?.displayValue || 0,
      gameId
    ]
  };
}

/**
 * Generate wrangler d1 execute command
 */
function generateD1ExecuteCommand(sql, params) {
  // Escape single quotes in SQL
  const escapedSQL = sql.replace(/'/g, "''");

  // Build parameterized query string
  let parameterizedSQL = escapedSQL;
  params.forEach((param, index) => {
    const value = param === null || param === undefined ? 'NULL' :
                  typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` :
                  param;
    parameterizedSQL = parameterizedSQL.replace('?', value);
  });

  return `wrangler d1 execute ${WRANGLER_D1_DB} --remote --command="${parameterizedSQL}"`;
}

/**
 * Main ingestion function
 */
async function ingestTeamSeason(espnTeamId, season) {
  console.log(`\n🏈 Ingesting data for team ${espnTeamId}, season ${season}...\n`);

  try {
    // 1. Fetch team data
    console.log('📊 Fetching team data from ESPN...');
    const teamData = await fetchTeamFromESPN(espnTeamId);
    const teamInsert = buildTeamInsertSQL(teamData);

    console.log('✓ Team data fetched:', teamData.team.displayName);
    console.log('\nSQL Command:');
    console.log(generateD1ExecuteCommand(teamInsert.sql, teamInsert.params));

    // 2. Fetch schedule
    console.log('\n📅 Fetching schedule...');
    const scheduleData = await fetchTeamGames(espnTeamId, season);
    const games = scheduleData.events || [];

    console.log(`✓ Found ${games.length} games`);

    // 3. Process each game
    let processedGames = 0;
    for (const game of games) {
      if (game.competitions?.[0]?.status?.type?.completed) {
        const gameInsert = buildGameInsertSQL(game, season);

        console.log(`\n📋 Game ${game.id}: ${game.name}`);
        console.log(generateD1ExecuteCommand(gameInsert.sql, gameInsert.params));

        // Fetch box score if game is final
        try {
          console.log('  📊 Fetching box score...');
          const boxScore = await fetchBoxScore(game.id);
          const boxScoreInsert = buildBoxScoreInsertSQL(boxScore, game.id);

          if (boxScoreInsert) {
            console.log('  ✓ Box score fetched');
            console.log(generateD1ExecuteCommand(boxScoreInsert.sql, boxScoreInsert.params));
          }
        } catch (err) {
          console.log('  ⚠ Box score not available');
        }

        processedGames++;

        // Rate limiting - wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n✅ Ingestion complete! Processed ${processedGames} games.`);
    console.log('\n💡 To execute these commands, copy and paste them into your terminal.');
    console.log('   Or pipe this script\'s output to bash:\n');
    console.log('   node scripts/ingest-historical-data.js --team 251 --season 2025 | grep "wrangler d1" | bash\n');

  } catch (error) {
    console.error('❌ Ingestion failed:', error.message);
    process.exit(1);
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
  const config = parseArgs();

  if (!config.team || !config.season) {
    console.error('Usage: node scripts/ingest-historical-data.js --team <espn_team_id> --season <year>');
    console.error('\nExample: node scripts/ingest-historical-data.js --team 251 --season 2025');
    console.error('\nCommon team IDs:');
    console.error('  251  - Texas Longhorns');
    console.error('  238  - LSU Tigers');
    console.error('  235  - Vanderbilt Commodores');
    console.error('  2633 - Tennessee Volunteers');
    process.exit(1);
  }

  await ingestTeamSeason(config.team, config.season);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ingestTeamSeason, fetchTeamFromESPN, fetchTeamGames, fetchBoxScore };
