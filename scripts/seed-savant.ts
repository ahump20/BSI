/**
 * Seed script: College Baseball Savant advanced analytics tables
 *
 * Run: npx tsx scripts/seed-savant.ts
 *
 * What this does:
 *   1. Queries all player_season_stats rows for season 2026 from bsi-prod-db
 *   2. Runs the savant compute pipeline (wOBA, FIP, wRC+, etc.)
 *   3. UPSERTs results into cbb_batting_advanced, cbb_pitching_advanced,
 *      cbb_park_factors, cbb_conference_strength
 *
 * Prerequisites:
 *   - player_season_stats must have data (run /api/college-baseball/sync-stats first)
 *   - Migration 043 (cbb_savant) must be applied
 *   - wrangler CLI available and authenticated
 */

import { spawnSync } from 'child_process';
import { teamMetadata } from '../lib/data/team-metadata';
import {
  computeSavantData,
  type RawPlayerRow,
  type TeamConferenceMap,
  type BattingAdvancedRow,
  type PitchingAdvancedRow,
  type ParkFactorRow,
  type ConferenceStrengthRow,
} from '../lib/analytics/savant-compute';

const D1_DB = 'bsi-prod-db';
const SEASON = 2026;

// ---------------------------------------------------------------------------
// Wrangler helpers
// ---------------------------------------------------------------------------

function d1Query(sql: string): string {
  const result = spawnSync('npx', [
    'wrangler', 'd1', 'execute', D1_DB, '--remote',
    '--command', sql,
  ], {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50 MB for large result sets
    timeout: 120_000,
  });

  if (result.status !== 0) {
    console.error('wrangler d1 query failed:', result.stderr);
    throw new Error(`D1 query failed: ${result.stderr?.slice(0, 500)}`);
  }
  return result.stdout;
}

function d1Execute(sql: string): void {
  const result = spawnSync('npx', [
    'wrangler', 'd1', 'execute', D1_DB, '--remote',
    '--command', sql,
  ], {
    encoding: 'utf-8',
    timeout: 120_000,
  });

  if (result.status !== 0) {
    console.error('wrangler d1 execute failed:', result.stderr);
    throw new Error(`D1 execute failed: ${result.stderr?.slice(0, 500)}`);
  }
}

/** Parse wrangler d1 JSON output to extract result rows. */
function parseD1Output(output: string): Record<string, unknown>[] {
  // Wrangler outputs JSON after some log lines. Find the JSON array.
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        // wrangler d1 execute --json returns [{ results: [...], ... }]
        if (Array.isArray(parsed) && parsed[0]?.results) {
          return parsed[0].results;
        }
        if (parsed.results) {
          return parsed.results;
        }
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, continue
      }
    }
  }

  // Try parsing the entire output as JSON
  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed) && parsed[0]?.results) {
      return parsed[0].results;
    }
    if (parsed.results) return parsed.results;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through
  }

  return [];
}

// ---------------------------------------------------------------------------
// Team conference map builder
// ---------------------------------------------------------------------------

function buildTeamConferenceMap(): TeamConferenceMap {
  const map: TeamConferenceMap = {};

  for (const [_slug, meta] of Object.entries(teamMetadata)) {
    // Map display name (e.g., "Texas Longhorns") to conference
    map[meta.name] = {
      conference: meta.conference,
      stadium: meta.location.stadium,
    };
    // Also map shortName + mascot for common variants
    map[`${meta.shortName} ${meta.mascot}`] = {
      conference: meta.conference,
      stadium: meta.location.stadium,
    };
  }

  return map;
}

// ---------------------------------------------------------------------------
// SQL builders
// ---------------------------------------------------------------------------

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function battingUpsertSQL(row: BattingAdvancedRow): string {
  return `INSERT INTO cbb_batting_advanced (
    player_id, player_name, team, team_id, conference, season, position, class_year,
    g, ab, pa, r, h, doubles, triples, hr, rbi, bb, so, sb, cs,
    avg, obp, slg, ops, k_pct, bb_pct, iso, babip,
    woba, wrc_plus, ops_plus, e_ba, e_slg, e_woba,
    park_adjusted, data_source, computed_at
  ) VALUES (
    ${escapeSQL(row.player_id)}, ${escapeSQL(row.player_name)}, ${escapeSQL(row.team)},
    ${escapeSQL(row.team_id)}, ${escapeSQL(row.conference)}, ${row.season},
    ${escapeSQL(row.position)}, ${escapeSQL(row.class_year)},
    ${row.g}, ${row.ab}, ${row.pa}, ${row.r}, ${row.h},
    ${row.doubles}, ${row.triples}, ${row.hr}, ${row.rbi}, ${row.bb}, ${row.so},
    ${row.sb}, ${row.cs},
    ${row.avg}, ${row.obp}, ${row.slg}, ${row.ops},
    ${row.k_pct}, ${row.bb_pct}, ${row.iso}, ${row.babip},
    ${row.woba}, ${row.wrc_plus}, ${row.ops_plus},
    ${escapeSQL(row.e_ba)}, ${escapeSQL(row.e_slg)}, ${escapeSQL(row.e_woba)},
    ${row.park_adjusted}, ${escapeSQL(row.data_source)}, ${escapeSQL(row.computed_at)}
  ) ON CONFLICT(player_id, season) DO UPDATE SET
    player_name=excluded.player_name, team=excluded.team, team_id=excluded.team_id,
    conference=excluded.conference, position=excluded.position,
    g=excluded.g, ab=excluded.ab, pa=excluded.pa, r=excluded.r, h=excluded.h,
    doubles=excluded.doubles, triples=excluded.triples, hr=excluded.hr, rbi=excluded.rbi,
    bb=excluded.bb, so=excluded.so, sb=excluded.sb, cs=excluded.cs,
    avg=excluded.avg, obp=excluded.obp, slg=excluded.slg, ops=excluded.ops,
    k_pct=excluded.k_pct, bb_pct=excluded.bb_pct, iso=excluded.iso, babip=excluded.babip,
    woba=excluded.woba, wrc_plus=excluded.wrc_plus, ops_plus=excluded.ops_plus,
    e_ba=excluded.e_ba, e_slg=excluded.e_slg, e_woba=excluded.e_woba,
    park_adjusted=excluded.park_adjusted, computed_at=excluded.computed_at;`;
}

function pitchingUpsertSQL(row: PitchingAdvancedRow): string {
  return `INSERT INTO cbb_pitching_advanced (
    player_id, player_name, team, team_id, conference, season, position, class_year,
    g, gs, w, l, sv, ip, h, er, bb, hbp, so, era, whip,
    k_9, bb_9, hr_9, fip, x_fip, era_minus, k_bb, lob_pct, babip,
    park_adjusted, data_source, computed_at
  ) VALUES (
    ${escapeSQL(row.player_id)}, ${escapeSQL(row.player_name)}, ${escapeSQL(row.team)},
    ${escapeSQL(row.team_id)}, ${escapeSQL(row.conference)}, ${row.season},
    ${escapeSQL(row.position)}, ${escapeSQL(row.class_year)},
    ${row.g}, ${row.gs}, ${row.w}, ${row.l}, ${row.sv}, ${row.ip},
    ${row.h}, ${row.er}, ${row.bb}, ${row.hbp}, ${row.so},
    ${row.era}, ${row.whip},
    ${row.k_9}, ${row.bb_9}, ${row.hr_9},
    ${row.fip}, ${escapeSQL(row.x_fip)}, ${row.era_minus},
    ${row.k_bb}, ${row.lob_pct}, ${row.babip},
    ${row.park_adjusted}, ${escapeSQL(row.data_source)}, ${escapeSQL(row.computed_at)}
  ) ON CONFLICT(player_id, season) DO UPDATE SET
    player_name=excluded.player_name, team=excluded.team, team_id=excluded.team_id,
    conference=excluded.conference, position=excluded.position,
    g=excluded.g, gs=excluded.gs, w=excluded.w, l=excluded.l, sv=excluded.sv,
    ip=excluded.ip, h=excluded.h, er=excluded.er, bb=excluded.bb, hbp=excluded.hbp,
    so=excluded.so, era=excluded.era, whip=excluded.whip,
    k_9=excluded.k_9, bb_9=excluded.bb_9, hr_9=excluded.hr_9,
    fip=excluded.fip, x_fip=excluded.x_fip, era_minus=excluded.era_minus,
    k_bb=excluded.k_bb, lob_pct=excluded.lob_pct, babip=excluded.babip,
    park_adjusted=excluded.park_adjusted, computed_at=excluded.computed_at;`;
}

function parkFactorUpsertSQL(row: ParkFactorRow): string {
  return `INSERT INTO cbb_park_factors (
    team, team_id, venue_name, conference, season,
    runs_factor, hits_factor, hr_factor, bb_factor, so_factor,
    sample_games, methodology_note, computed_at
  ) VALUES (
    ${escapeSQL(row.team)}, ${escapeSQL(row.team_id)}, ${escapeSQL(row.venue_name)},
    ${escapeSQL(row.conference)}, ${row.season},
    ${row.runs_factor}, ${row.hits_factor}, ${row.hr_factor},
    ${row.bb_factor}, ${row.so_factor},
    ${row.sample_games}, ${escapeSQL(row.methodology_note)}, ${escapeSQL(row.computed_at)}
  ) ON CONFLICT(team, season) DO UPDATE SET
    venue_name=excluded.venue_name, conference=excluded.conference,
    runs_factor=excluded.runs_factor, hits_factor=excluded.hits_factor,
    hr_factor=excluded.hr_factor, bb_factor=excluded.bb_factor,
    so_factor=excluded.so_factor, sample_games=excluded.sample_games,
    methodology_note=excluded.methodology_note, computed_at=excluded.computed_at;`;
}

function confStrengthUpsertSQL(row: ConferenceStrengthRow): string {
  return `INSERT INTO cbb_conference_strength (
    conference, season, strength_index, run_environment,
    avg_era, avg_ops, avg_woba, inter_conf_win_pct, rpi_avg, is_power,
    computed_at
  ) VALUES (
    ${escapeSQL(row.conference)}, ${row.season},
    ${row.strength_index}, ${row.run_environment},
    ${row.avg_era}, ${row.avg_ops}, ${row.avg_woba},
    ${row.inter_conf_win_pct}, ${row.rpi_avg}, ${row.is_power},
    ${escapeSQL(row.computed_at)}
  ) ON CONFLICT(conference, season) DO UPDATE SET
    strength_index=excluded.strength_index, run_environment=excluded.run_environment,
    avg_era=excluded.avg_era, avg_ops=excluded.avg_ops, avg_woba=excluded.avg_woba,
    inter_conf_win_pct=excluded.inter_conf_win_pct, rpi_avg=excluded.rpi_avg,
    is_power=excluded.is_power, computed_at=excluded.computed_at;`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== College Baseball Savant — Seed Script ===\n');

  // 1. Build team → conference map
  const teamMap = buildTeamConferenceMap();
  console.log(`Team conference map: ${Object.keys(teamMap).length} entries`);

  // 2. Query player_season_stats
  console.log(`\nQuerying player_season_stats for season ${SEASON}...`);
  const output = d1Query(
    `SELECT * FROM player_season_stats WHERE season = ${SEASON} AND sport = 'college-baseball'`
  );
  const rawRows = parseD1Output(output) as unknown as RawPlayerRow[];

  if (rawRows.length === 0) {
    console.error('\n❌ No player_season_stats rows found for season', SEASON);
    console.error('Run the admin sync endpoint first:');
    console.error('  curl https://blazesportsintel.com/api/college-baseball/sync-stats?conference=SEC&key=YOUR_ADMIN_KEY');
    console.error('  (repeat for ACC, Big 12, Big Ten, etc.)');
    process.exit(1);
  }

  console.log(`Found ${rawRows.length} player rows`);

  // 3. Run compute pipeline
  console.log('\nComputing advanced metrics...');
  const result = computeSavantData(rawRows, teamMap, SEASON);

  console.log(`\nResults:`);
  console.log(`  Qualified batters:  ${result.summary.qualifiedBatters}`);
  console.log(`  Qualified pitchers: ${result.summary.qualifiedPitchers}`);
  console.log(`  Venues:             ${result.summary.venues}`);
  console.log(`  Conferences:        ${result.summary.conferences}`);
  console.log(`\nLeague context:`);
  console.log(`  wOBA: ${result.league.woba.toFixed(3)}`);
  console.log(`  OBP:  ${result.league.obp.toFixed(3)}`);
  console.log(`  ERA:  ${result.league.era.toFixed(2)}`);
  console.log(`  FIP constant: ${result.league.fipConstant.toFixed(2)}`);
  console.log(`  wOBA scale:   ${result.league.wobaScale.toFixed(3)}`);

  // 4. UPSERT batting
  console.log(`\nUpserting ${result.batting.length} batting rows...`);
  let batCount = 0;
  for (const row of result.batting) {
    try {
      d1Execute(battingUpsertSQL(row));
      batCount++;
      if (batCount % 50 === 0) console.log(`  ...${batCount} batters`);
    } catch (err) {
      console.error(`  Failed for ${row.player_name}: ${err}`);
    }
  }
  console.log(`  Done: ${batCount} batting rows upserted`);

  // 5. UPSERT pitching
  console.log(`\nUpserting ${result.pitching.length} pitching rows...`);
  let pitchCount = 0;
  for (const row of result.pitching) {
    try {
      d1Execute(pitchingUpsertSQL(row));
      pitchCount++;
      if (pitchCount % 50 === 0) console.log(`  ...${pitchCount} pitchers`);
    } catch (err) {
      console.error(`  Failed for ${row.player_name}: ${err}`);
    }
  }
  console.log(`  Done: ${pitchCount} pitching rows upserted`);

  // 6. UPSERT park factors
  console.log(`\nUpserting ${result.parkFactors.length} park factor rows...`);
  let parkCount = 0;
  for (const row of result.parkFactors) {
    try {
      d1Execute(parkFactorUpsertSQL(row));
      parkCount++;
    } catch (err) {
      console.error(`  Failed for ${row.team}: ${err}`);
    }
  }
  console.log(`  Done: ${parkCount} park factor rows upserted`);

  // 7. UPSERT conference strength
  console.log(`\nUpserting ${result.conferenceStrength.length} conference strength rows...`);
  let confCount = 0;
  for (const row of result.conferenceStrength) {
    try {
      d1Execute(confStrengthUpsertSQL(row));
      confCount++;
    } catch (err) {
      console.error(`  Failed for ${row.conference}: ${err}`);
    }
  }
  console.log(`  Done: ${confCount} conference strength rows upserted`);

  // Summary
  console.log(`\n=== Seed Complete ===`);
  console.log(`  ${batCount} batters`);
  console.log(`  ${pitchCount} pitchers`);
  console.log(`  ${parkCount} venues`);
  console.log(`  ${confCount} conferences`);
  console.log(`\nVerify: npx wrangler d1 execute ${D1_DB} --remote --command "SELECT COUNT(*) as n FROM cbb_batting_advanced"`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
