#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * @typedef {Object} StandingsEntry
 * @property {string} team
 * @property {number} [confWins]
 * @property {number} [confLosses]
 * @property {number} [overallWins]
 * @property {number} [overallLosses]
 */

/**
 * @typedef {Object} StandingsPayload
 * @property {string} [conference]
 * @property {StandingsEntry[]} [standings]
 * @property {StandingsEntry[]} [teams]
 */

/**
 * @typedef {Object} CliOptions
 * @property {string} local
 * @property {string} [remote]
 * @property {string} [conference]
 */

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.local) {
    console.error('Usage: audit-standings --local <file> [--remote <url|file>] [--conference <name>]');
    process.exit(1);
  }

  const [localPayload, remotePayload] = await Promise.all([
    loadStandings(options.local),
    options.remote ? loadStandings(options.remote) : Promise.resolve(null),
  ]);

  const conferenceLabel = options.conference ?? localPayload.conference ?? 'Unknown Conference';
  console.log(`\n📊 Standings audit — ${conferenceLabel}`);

  if (options.remote) {
    console.log(`Local source:   ${options.local}`);
    console.log(`Remote source:  ${options.remote}`);
  } else {
    console.log(`Local source:   ${options.local}`);
  }

  const localStandings = extractStandings(localPayload);
  if (!localStandings.size) {
    console.error('No standings data found in local payload.');
    process.exit(1);
  }

  if (!remotePayload) {
    console.log('\nNo remote payload supplied — validating local data only.');
    printQualityChecks(localStandings);
    process.exit(0);
  }

  const remoteStandings = extractStandings(remotePayload);
  if (!remoteStandings.size) {
    console.error('Remote payload did not include a standings collection.');
    process.exit(1);
  }

  const differences = compareStandings(localStandings, remoteStandings);

  if (differences.missingTeams.length === 0 && differences.mismatches.length === 0) {
    console.log('\n✅ Local standings match remote source.');
  } else {
    console.log('\n⚠️  Detected discrepancies between local and remote standings:');
    for (const team of differences.missingTeams) {
      console.log(`  • Missing from local: ${team}`);
    }
    for (const mismatch of differences.mismatches) {
      console.log(`  • ${mismatch.team} — ${mismatch.field}: local ${mismatch.local} vs remote ${mismatch.remote}`);
    }
  }

  printQualityChecks(localStandings);
}

/**
 * @param {string[]} args
 * @returns {CliOptions}
 */
function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--local') {
      options.local = args[i + 1];
      i += 1;
    } else if (arg === '--remote') {
      options.remote = args[i + 1];
      i += 1;
    } else if (arg === '--conference') {
      options.conference = args[i + 1];
      i += 1;
    }
  }
  return options;
}

/**
 * @param {string} source
 * @returns {Promise<StandingsPayload>}
 */
async function loadStandings(source) {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source} (${response.status})`);
    }
    return /** @type {StandingsPayload} */ (await response.json());
  }

  const filePath = resolve(process.cwd(), source);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * @param {StandingsPayload} payload
 * @returns {Map<string, StandingsEntry>}
 */
function extractStandings(payload) {
  const entries = Array.isArray(payload.standings)
    ? payload.standings
    : Array.isArray(payload.teams)
      ? payload.teams
      : [];

  const map = new Map();
  for (const entry of entries) {
    const key = String(entry.team ?? entry.school ?? '').trim();
    if (!key) {
      continue;
    }
    map.set(key.toLowerCase(), entry);
  }
  return map;
}

/**
 * @param {Map<string, StandingsEntry>} local
 * @param {Map<string, StandingsEntry>} remote
 */
function compareStandings(local, remote) {
  /** @type {string[]} */
  const missingTeams = [];
  /** @type {{ team: string; field: string; local: number | undefined; remote: number | undefined }[]} */
  const mismatches = [];

  for (const [teamKey, remoteEntry] of remote.entries()) {
    const localEntry = local.get(teamKey);
    if (!localEntry) {
      missingTeams.push(remoteEntry.team ?? teamKey);
      continue;
    }

    for (const field of ['confWins', 'confLosses', 'overallWins', 'overallLosses']) {
      const localValue = typeof localEntry[field] === 'number' ? localEntry[field] : undefined;
      const remoteValue = typeof remoteEntry[field] === 'number' ? remoteEntry[field] : undefined;
      if (localValue !== remoteValue) {
        mismatches.push({
          team: remoteEntry.team ?? teamKey,
          field,
          local: localValue,
          remote: remoteValue,
        });
      }
    }
  }

  return { missingTeams, mismatches };
}

/**
 * @param {Map<string, StandingsEntry>} standings
 */
function printQualityChecks(standings) {
  console.log('\nQuality checks');
  console.log('──────────────');
  console.log(`Teams tracked: ${standings.size}`);

  let totalConfWins = 0;
  let totalConfLosses = 0;

  for (const entry of standings.values()) {
    if (typeof entry.confWins === 'number') {
      totalConfWins += entry.confWins;
    }
    if (typeof entry.confLosses === 'number') {
      totalConfLosses += entry.confLosses;
    }
  }

  console.log(`Total conference wins:   ${totalConfWins}`);
  console.log(`Total conference losses: ${totalConfLosses}`);
  if (totalConfWins !== totalConfLosses) {
    console.log('⚠️  Wins and losses are not balanced — double-check inputs.');
  } else {
    console.log('✅ Conference wins/losses balanced.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
