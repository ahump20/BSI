/**
 * Blaze Sports Intel - Batch Team Ingestion Script
 * Efficiently inserts teams from ESPN API into D1 database
 *
 * Usage:
 *   node scripts/batch-ingest-teams.js --teams 199,123,150,75,91
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
 * Fetch team data from ESPN
 */
async function fetchTeamData(teamId) {
  const url = `${ESPN_API_BASE}/teams/${teamId}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Build team INSERT SQL
 */
function buildTeamInsertSQL(teamData) {
  const team = teamData.team;
  const conference = team.groups?.[0];

  const name = team.displayName?.replace(/'/g, "''") || '';
  const school = (team.school || team.location)?.replace(/'/g, "''") || '';
  const abbreviation = team.abbreviation?.replace(/'/g, "''") || '';
  const mascot = team.name?.replace(/'/g, "''") || '';
  const city = team.venue?.city?.replace(/'/g, "''") || null;
  const state = team.venue?.state || null;
  const stadiumName = team.venue?.fullName?.replace(/'/g, "''") || null;
  const color = team.color || null;
  const altColor = team.alternateColor || null;
  const logoUrl = team.logos?.[0]?.href?.replace(/'/g, "''") || null;

  return `
    INSERT OR IGNORE INTO teams (
      espn_id, name, school, abbreviation, mascot,
      city, state, stadium_name, color, alt_color, logo_url, is_active
    )
    VALUES (
      '${team.id}',
      '${name}',
      '${school}',
      '${abbreviation}',
      '${mascot}',
      ${city ? `'${city}'` : 'NULL'},
      ${state ? `'${state}'` : 'NULL'},
      ${stadiumName ? `'${stadiumName}'` : 'NULL'},
      ${color ? `'${color}'` : 'NULL'},
      ${altColor ? `'${altColor}'` : 'NULL'},
      ${logoUrl ? `'${logoUrl}'` : 'NULL'},
      1
    )
  `.trim().replace(/\s+/g, ' ');
}

/**
 * Process a single team
 */
async function processTeam(teamId) {
  try {
    const teamData = await fetchTeamData(teamId);
    const teamName = teamData.team.displayName;

    console.log(`\n📊 Processing: ${teamName} (ID: ${teamId})`);

    const sql = buildTeamInsertSQL(teamData);
    const success = executeD1Command(sql);

    if (success) {
      console.log(`  ✅ Inserted successfully`);
      return { teamId, name: teamName, inserted: true, error: null };
    } else {
      console.log(`  ⚠️ Skipped (already exists or error)`);
      return { teamId, name: teamName, inserted: false, error: 'Execution failed' };
    }

  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    return { teamId, name: null, inserted: false, error: error.message };
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
  console.log('⚾ Blaze Sports Intel - Batch Team Ingestion\n');

  const config = parseArgs();

  if (!config.teams) {
    console.error('Usage: node scripts/batch-ingest-teams.js --teams <team_ids>');
    console.error('\nExample: node scripts/batch-ingest-teams.js --teams 199,123,150,75,91');
    console.error('\nCommon SEC Teams:');
    console.error('  199 - Tennessee Volunteers');
    console.error('  123 - Texas A&M Aggies');
    console.error('  150 - Mississippi State Bulldogs');
    console.error('  75  - Florida Gators');
    console.error('  91  - Missouri Tigers');
    process.exit(1);
  }

  const teams = config.teams.split(',').map(t => t.trim());

  console.log(`Processing ${teams.length} teams:\n`);

  const results = [];
  for (const teamId of teams) {
    const result = await processTeam(teamId);
    results.push(result);

    // Rate limiting - wait 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Batch Team Ingestion Summary');
  console.log('='.repeat(60));

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const result of results) {
    if (result.inserted) {
      inserted++;
    } else if (result.error) {
      errors++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ ${inserted} teams inserted`);
  console.log(`⚠️  ${skipped} teams skipped (already exist)`);
  console.log(`❌ ${errors} teams failed`);
  console.log(`📊 ${teams.length} total teams processed`);
  console.log('\n✅ Batch ingestion complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { processTeam, buildTeamInsertSQL };
