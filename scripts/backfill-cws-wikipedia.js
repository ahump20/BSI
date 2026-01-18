#!/usr/bin/env node

/**
 * Backfill CWS Historical Data from Wikipedia (2000-2016)
 *
 * Fetches College World Series bracket games from Wikipedia for years
 * where ESPN API doesn't have data (2000-2016).
 *
 * Data Source: Wikipedia NCAA Division I baseball tournament pages
 * Target: 100-120 additional bracket games
 *
 * Usage:
 *   node scripts/backfill-cws-wikipedia.js [--dry-run] [--year=YYYY]
 *
 * Environment Variables:
 *   CLOUDFLARE_API_TOKEN - Required for D1 database writes
 */

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const START_YEAR = 2000;
const END_YEAR = 2016;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between API requests

const VENUE_MAP = {
  '2000-2010': 'Rosenblatt Stadium',
  '2011-2019': 'TD Ameritrade Park Omaha',
  '2020-present': 'Charles Schwab Field Omaha',
};

const ATTENDANCE_DEFAULTS = {
  'Rosenblatt Stadium': 23000,
  'TD Ameritrade Park Omaha': 24000,
  'Charles Schwab Field Omaha': 24000,
};

// Team name normalization
const TEAM_NAME_MAP = {
  'Miami Hurricanes': 'Miami (Fla.)',
  'Miami (FL)': 'Miami (Fla.)',
  'Cal State Fullerton Titans': 'Cal State Fullerton',
  'LSU Tigers': 'LSU',
  'Texas Longhorns': 'Texas',
  'Fresno State Bulldogs': 'Fresno State',
  'Coastal Carolina Chanticleers': 'Coastal Carolina',
  'Oregon State Beavers': 'Oregon State',
  'South Carolina Gamecocks': 'South Carolina',
  'North Carolina Tar Heels': 'North Carolina',
  'Virginia Cavaliers': 'Virginia',
  'Vanderbilt Commodores': 'Vanderbilt',
};

// ============================================================================
// Command Line Arguments
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const specificYear = args.find((arg) => arg.startsWith('--year='))?.split('=')[1];

if (specificYear && (parseInt(specificYear) < START_YEAR || parseInt(specificYear) > END_YEAR)) {
  console.error(`❌ Year must be between ${START_YEAR} and ${END_YEAR}`);
  process.exit(1);
}

console.log(`\n${'='.repeat(60)}`);
console.log(`📚 CWS Wikipedia Backfill Script`);
console.log(`${'='.repeat(60)}`);
console.log(`📅 Year Range: ${specificYear || `${START_YEAR}-${END_YEAR}`}`);
console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no database writes)' : 'LIVE (will write to D1)'}`);
console.log(`${'='.repeat(60)}\n`);

// ============================================================================
// Wikipedia API Functions
// ============================================================================

/**
 * Fetch Wikipedia page HTML via MediaWiki API
 */
async function fetchWikipediaPage(year) {
  const pageName = `${year}_NCAA_Division_I_baseball_tournament`;
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&format=json&prop=text`;

  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'BlazeSportsIntel/1.0 (https://blazesportsintel.com; austin@blazesportsintel.com)',
        Accept: 'application/json',
      },
    };

    https
      .get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              console.error(`   ⚠️  Wikipedia API error: ${json.error.info}`);
              resolve(null);
              return;
            }

            if (!json.parse || !json.parse.text || !json.parse.text['*']) {
              console.error(`   ⚠️  No HTML content in response`);
              resolve(null);
              return;
            }

            resolve(json.parse.text['*']);
          } catch (error) {
            console.error(`   ⚠️  Failed to parse Wikipedia response: ${error.message}`);
            resolve(null);
          }
        });
      })
      .on('error', (error) => {
        console.error(`   ⚠️  Wikipedia API request failed: ${error.message}`);
        resolve(null);
      });
  });
}

/**
 * Parse HTML to extract game results
 *
 * Looks for patterns like:
 * - "Team A 5, Team B 3"
 * - "June 14: Stanford 16, Florida State 5"
 * - Table rows with team names and scores
 */
function parseGameResults(html, year) {
  const games = [];

  // Determine venue based on year
  let venue;
  if (year <= 2010) {
    venue = VENUE_MAP['2000-2010'];
  } else if (year <= 2019) {
    venue = VENUE_MAP['2011-2019'];
  } else {
    venue = VENUE_MAP['2020-present'];
  }

  const defaultAttendance = ATTENDANCE_DEFAULTS[venue];

  // Pattern 1: "June DD: Team A XX, Team B YY"
  const dateScorePattern = /June\s+(\d+):\s*([^0-9]+?)\s+(\d+),\s*([^0-9]+?)\s+(\d+)/gi;
  let match;

  while ((match = dateScorePattern.exec(html)) !== null) {
    const day = match[1].padStart(2, '0');
    const team1 = normalizeTeamName(match[2].trim());
    const score1 = parseInt(match[3]);
    const team2 = normalizeTeamName(match[4].trim());
    const score2 = parseInt(match[5]);

    const gameDate = `${year}-06-${day}`;

    // Determine home/away (higher seed typically home, but hard to determine from HTML)
    // For now, use first team as home
    const homeTeam = team1;
    const awayTeam = team2;
    const homeScore = score1;
    const awayScore = score2;

    // Generate game ID
    const homeAbbr = homeTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const awayAbbr = awayTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const gameId = `cws-${year}-${gameDate.replace(/-/g, '')}-${homeAbbr}-${awayAbbr}`;

    // Determine round from context
    let tournamentRound = 'College World Series - Bracket';
    if (day >= '14' && day <= '16') {
      tournamentRound = 'College World Series - Opening Round';
    } else if (day >= '23') {
      tournamentRound = 'College World Series Finals - Finals Game';
    } else if (html.toLowerCase().includes('elimination')) {
      tournamentRound = 'College World Series - Elimination Game';
    }

    games.push({
      game_id: gameId,
      date: gameDate,
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: homeScore,
      away_score: awayScore,
      sport: 'baseball',
      tournament_round: tournamentRound,
      venue,
      attendance: defaultAttendance,
      innings: 9, // Default, will adjust if we find extra innings info
      extra_innings: 0,
      lead_changes: 0, // Not available from Wikipedia
      created_at: new Date().toISOString(),
    });
  }

  // Remove duplicates by game_id
  const uniqueGames = Array.from(new Map(games.map((g) => [g.game_id, g])).values());

  return uniqueGames;
}

/**
 * Normalize team names to match our database convention
 */
function normalizeTeamName(name) {
  // Remove common suffixes
  name = name.replace(
    /\s+(Bulldogs|Tigers|Longhorns|Hurricanes|Chanticleers|Beavers|Gamecocks|Tar Heels|Cavaliers|Commodores|Cardinals|Sun Devils|Bears|Green Wave|Cornhuskers|Volunteers|Demon Deacons|Bruins|Trojans|Blue Devils|Seminoles|Gators|Wildcats|Razorbacks|Crimson Tide|Rebels|Aggies|Red Raiders)$/i,
    ''
  );

  // Apply manual mappings
  if (TEAM_NAME_MAP[name.trim()]) {
    return TEAM_NAME_MAP[name.trim()];
  }

  return name.trim();
}

/**
 * Validate game data before insertion
 */
function validateGame(game, year) {
  const errors = [];

  // Required fields
  if (!game.game_id || game.game_id.trim() === '') {
    errors.push('Missing game_id');
  }
  if (!game.date || !/^\d{4}-\d{2}-\d{2}$/.test(game.date)) {
    errors.push(`Invalid date format: ${game.date}`);
  }
  if (!game.home_team || game.home_team.trim() === '') {
    errors.push('Missing home_team');
  }
  if (!game.away_team || game.away_team.trim() === '') {
    errors.push('Missing away_team');
  }
  if (!game.venue || game.venue.trim() === '') {
    errors.push('Missing venue');
  }

  // Validate date is in June of correct year
  if (game.date) {
    const gameYear = parseInt(game.date.substring(0, 4));
    const gameMonth = parseInt(game.date.substring(5, 7));
    if (gameYear !== year) {
      errors.push(`Date year ${gameYear} doesn't match expected year ${year}`);
    }
    if (gameMonth !== 6) {
      errors.push(`CWS games should be in June, got month ${gameMonth}`);
    }
  }

  // Numeric validations
  if (typeof game.home_score !== 'number' || game.home_score < 0) {
    errors.push(`Invalid home_score: ${game.home_score}`);
  }
  if (typeof game.away_score !== 'number' || game.away_score < 0) {
    errors.push(`Invalid away_score: ${game.away_score}`);
  }
  if (typeof game.attendance !== 'number' || game.attendance < 0) {
    errors.push(`Invalid attendance: ${game.attendance}`);
  }
  if (typeof game.innings !== 'number' || game.innings < 9) {
    errors.push(`Invalid innings (must be >= 9): ${game.innings}`);
  }

  return errors;
}

// ============================================================================
// Database Functions
// ============================================================================

/**
 * Generate SQL INSERT statement for games
 */
function generateInsertSQL(games) {
  if (games.length === 0) {
    return '';
  }

  let sql = `INSERT OR IGNORE INTO historical_games (\n`;
  sql += `  game_id, date, home_team, away_team, home_score, away_score,\n`;
  sql += `  sport, tournament_round, venue, attendance, innings, extra_innings,\n`;
  sql += `  lead_changes, created_at\n`;
  sql += `)\nVALUES\n`;

  const values = games.map((g) => {
    const escapeSql = (str) => String(str).replace(/'/g, "''");
    return `  ('${escapeSql(g.game_id)}', '${g.date}', '${escapeSql(g.home_team)}', '${escapeSql(g.away_team)}', ${g.home_score}, ${g.away_score}, '${g.sport}', '${escapeSql(g.tournament_round)}', '${escapeSql(g.venue)}', ${g.attendance}, ${g.innings}, ${g.extra_innings}, ${g.lead_changes}, '${g.created_at}')`;
  });

  sql += values.join(',\n') + ';\n';
  return sql;
}

/**
 * Execute D1 SQL command via wrangler
 */
function executeD1Command(sql, successMessage) {
  if (dryRun) {
    console.log(`   💾 [DRY RUN] Would execute SQL:\n${sql.substring(0, 200)}...`);
    return true;
  }

  if (!sql || sql.trim() === '') {
    console.log(`   ⏭️  No SQL to execute`);
    return true;
  }

  // Write SQL to temporary file
  const tempDir = '/tmp/claude';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `cws-batch-${Date.now()}.sql`);
  fs.writeFileSync(tempFile, sql);

  try {
    // Pass CLOUDFLARE_API_TOKEN from environment
    const env = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
    };

    const output = execSync(
      `~/.npm-global/bin/wrangler d1 execute blazesports-historical --remote --file=${tempFile} 2>&1`,
      { encoding: 'utf8', shell: '/bin/bash', env }
    );

    // Check for success indicators
    if (output.includes('Success') || output.includes('Executed')) {
      console.log(`   ✅ ${successMessage}`);
      return true;
    } else if (output.includes('ERROR') || output.includes('Error')) {
      console.error(`   ❌ Failed: ${successMessage}`);
      console.error(`   ${output}`);
      return false;
    } else {
      // Assume success if no explicit error
      console.log(`   ✅ ${successMessage}`);
      return true;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${successMessage}`);
    console.error(`   ${error.message}`);
    return false;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function processYear(year) {
  console.log(`\n📅 Processing ${year} College World Series`);

  // Fetch Wikipedia page HTML
  const html = await fetchWikipediaPage(year);

  if (!html) {
    console.log(`   ⚠️  Could not fetch Wikipedia data for ${year}`);
    return { year, games: [], success: false };
  }

  console.log(`   📊 Fetched Wikipedia page (${Math.round(html.length / 1024)} KB)`);

  // Parse game results
  const games = parseGameResults(html, year);
  console.log(`   🎯 Found ${games.length} games in HTML`);

  if (games.length === 0) {
    console.log(`   ⚠️  No games found for ${year} (may need manual parsing)`);
    return { year, games: [], success: false };
  }

  // Validate games
  const validGames = [];
  const invalidGames = [];

  for (const game of games) {
    const validationErrors = validateGame(game, year);
    if (validationErrors.length === 0) {
      validGames.push(game);
    } else {
      invalidGames.push({ game, errors: validationErrors });
      console.error(`   ❌ Invalid game ${game.game_id}: ${validationErrors.join(', ')}`);
    }
  }

  if (invalidGames.length > 0) {
    console.log(`   ⚠️  Skipped ${invalidGames.length} invalid game(s)`);
  }

  if (validGames.length === 0) {
    console.log(`   ⚠️  No valid games to insert for ${year}`);
    return { year, games: [], success: false };
  }

  // Generate and execute SQL
  const sql = generateInsertSQL(validGames);
  const success = executeD1Command(sql, `Inserted ${validGames.length} games for ${year}`);

  return { year, games: validGames, success };
}

async function main() {
  const years = specificYear
    ? [parseInt(specificYear)]
    : Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

  const results = [];
  let totalGamesFound = 0;
  let totalGamesInserted = 0;
  const failedYears = [];

  for (const year of years) {
    const result = await processYear(year);
    results.push(result);

    totalGamesFound += result.games.length;
    if (result.success) {
      totalGamesInserted += result.games.length;
    } else {
      failedYears.push(year);
    }

    // Rate limit: wait 2 seconds between requests
    if (year !== years[years.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Backfill Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Years processed: ${years.length}`);
  console.log(`Total games found: ${totalGamesFound}`);
  console.log(`Successfully inserted: ${dryRun ? 'N/A (dry run)' : totalGamesInserted}`);
  console.log(`Failed years: ${failedYears.length > 0 ? failedYears.join(', ') : 'None'}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failedYears.length > 0) {
    console.log(`⚠️  Manual review needed for years: ${failedYears.join(', ')}`);
    console.log(`   Consider checking Wikipedia pages for these years manually.\n`);
  }

  console.log(`✅ Backfill process complete!\n`);
}

// Run the script
main().catch((error) => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

export { fetchWikipediaPage, parseGameResults, validateGame };
