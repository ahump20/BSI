#!/usr/bin/env node
/**
 * map-logo-ids.mjs — One-shot script to discover correct ESPN logo CDN IDs
 * for all college baseball teams in team-metadata.ts.
 *
 * ESPN's logo CDN (a.espncdn.com/i/teamlogos/ncaa/500/{id}.png) uses general
 * school-level NCAA IDs. BSI's espnId field stores baseball-specific API IDs —
 * different numbering. This script finds the correct CDN IDs.
 *
 * Usage: node scripts/map-logo-ids.mjs [--apply] [--dry-run]
 *   --apply   Write logoId directly into team-metadata.ts
 *   --dry-run Just report, don't write files (default)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const METADATA_PATH = resolve(__dirname, '../lib/data/team-metadata.ts');
const MAPPING_PATH = resolve(__dirname, 'logo-id-mapping.json');
const CDN_BASE = 'https://a.espncdn.com/i/teamlogos/ncaa/500';

const shouldApply = process.argv.includes('--apply');
const CONCURRENCY = 15;

// ─── Parse team-metadata.ts ──────────────────────────────────────────────────

function parseTeamMetadata(source) {
  const teams = [];
  // Match both bare keys (texas: {) and quoted keys ('texas-am': {)
  const entryRegex = /(?:['"]([a-z0-9-]+)['"]|([a-z][a-z0-9]*))\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  while ((match = entryRegex.exec(source)) !== null) {
    const slug = match[1] || match[2];
    const body = match[3];

    const name = body.match(/name:\s*['"]([^'"]+)['"]/)?.[1] || '';
    const shortName = body.match(/shortName:\s*['"]([^'"]+)['"]/)?.[1] || '';
    const espnId = body.match(/espnId:\s*['"]([^'"]+)['"]/)?.[1] || '';
    const logoId = body.match(/logoId:\s*['"]([^'"]+)['"]/)?.[1] || null;

    if (espnId) {
      teams.push({ slug, name, shortName, espnId, logoId });
    }
  }
  return teams;
}

// ─── HEAD-check CDN ──────────────────────────────────────────────────────────

async function checkCdn(id) {
  try {
    const res = await fetch(`${CDN_BASE}/${id}.png`, { method: 'HEAD', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

async function batchCheckCdn(ids) {
  const results = new Map();
  const queue = [...ids];
  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      results.set(id, await checkCdn(id));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return results;
}

// ─── Fetch ESPN team directories ─────────────────────────────────────────────

async function fetchEspnTeams(sport, league) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=500`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => ({
      id: t.team.id,
      name: t.team.displayName || t.team.name,
      shortName: t.team.shortDisplayName || t.team.abbreviation,
      abbreviation: t.team.abbreviation,
      location: t.team.location || '',
    }));
  } catch (e) {
    console.error(`Failed to fetch ${sport}/${league}:`, e.message);
    return [];
  }
}

// ─── Normalize for matching ──────────────────────────────────────────────────

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/\buniversity\b/g, '')
    .replace(/\bcollege\b/g, '')
    .replace(/\bstate\b/g, 'st')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bnorthern\b/g, 'n')
    .replace(/\bsouthern\b/g, 's')
    .replace(/\beastern\b/g, 'e')
    .replace(/\bwestern\b/g, 'w')
    .replace(/[^a-z0-9]/g, '');
}

function matchScore(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 80;
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const total = Math.max(wordsA.size, wordsB.size);
  return Math.round((overlap / total) * 70);
}

function findBestMatch(team, espnTeams) {
  let best = null;
  let bestScore = 0;

  for (const et of espnTeams) {
    const candidates = [et.name, et.shortName, et.location];
    const teamCandidates = [team.name, team.shortName];

    for (const a of teamCandidates) {
      for (const b of candidates) {
        const score = matchScore(a, b);
        if (score > bestScore) {
          bestScore = score;
          best = et;
        }
      }
    }
  }

  return bestScore >= 60 ? best : null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading team-metadata.ts...');
  const source = readFileSync(METADATA_PATH, 'utf-8');
  const teams = parseTeamMetadata(source);
  console.log(`Found ${teams.length} teams\n`);

  // Step 1: Check which espnIds already work on CDN
  console.log('Step 1: HEAD-checking espnIds against CDN...');
  const espnIds = [...new Set(teams.map((t) => t.espnId))];
  const cdnResults = await batchCheckCdn(espnIds);

  const working = teams.filter((t) => cdnResults.get(t.espnId));
  const broken = teams.filter((t) => !cdnResults.get(t.espnId) && !t.logoId);
  const alreadyFixed = teams.filter((t) => t.logoId);

  console.log(`  ${working.length} espnIds work on CDN (no logoId needed)`);
  console.log(`  ${alreadyFixed.length} already have logoId`);
  console.log(`  ${broken.length} need logoId mapping\n`);

  if (broken.length === 0) {
    console.log('All teams have working logos! Nothing to do.');
    return;
  }

  // Step 2: Fetch ESPN team directories
  console.log('Step 2: Fetching ESPN team directories...');
  const [footballTeams, basketballTeams, baseballTeams] = await Promise.all([
    fetchEspnTeams('football', 'college-football'),
    fetchEspnTeams('basketball', 'mens-college-basketball'),
    fetchEspnTeams('baseball', 'college-baseball'),
  ]);
  console.log(`  Football: ${footballTeams.length} teams`);
  console.log(`  Basketball: ${basketballTeams.length} teams`);
  console.log(`  Baseball: ${baseballTeams.length} teams\n`);

  // Combine — football first (CDN uses those IDs primarily)
  const allEspnTeams = new Map();
  for (const t of [...footballTeams, ...basketballTeams, ...baseballTeams]) {
    if (!allEspnTeams.has(t.id)) allEspnTeams.set(t.id, t);
  }
  const espnDirectory = [...allEspnTeams.values()];

  // Step 3: Match broken teams to ESPN directory
  console.log('Step 3: Matching broken teams to ESPN directory...');
  const mappings = [];
  const unmatched = [];

  for (const team of broken) {
    const match = findBestMatch(team, espnDirectory);
    if (match) {
      mappings.push({
        slug: team.slug,
        name: team.name,
        espnId: team.espnId,
        logoId: match.id,
        matchedTo: match.name,
      });
    } else {
      unmatched.push(team);
    }
  }

  // Step 4: Validate matched IDs against CDN
  console.log(`Step 4: Validating ${mappings.length} matched IDs against CDN...`);
  const matchedIds = [...new Set(mappings.map((m) => m.logoId))];
  const validationResults = await batchCheckCdn(matchedIds);

  const validated = [];
  const failedValidation = [];

  for (const m of mappings) {
    if (validationResults.get(m.logoId)) {
      validated.push(m);
    } else {
      failedValidation.push(m);
      unmatched.push({ slug: m.slug, name: m.name, espnId: m.espnId });
    }
  }

  console.log(`  ${validated.length} validated (CDN returns 200)`);
  console.log(`  ${failedValidation.length} failed validation\n`);

  // Report
  console.log('═══ Results ═══════════════════════════════════════');
  console.log(`Teams with working espnId:  ${working.length}`);
  console.log(`Teams already having logoId: ${alreadyFixed.length}`);
  console.log(`Teams newly mapped:          ${validated.length}`);
  console.log(`Teams unresolvable:          ${unmatched.length}`);
  console.log(`Total:                       ${teams.length}\n`);

  if (validated.length > 0) {
    console.log('─── Newly Mapped ──────────────────────────────────');
    for (const m of validated) {
      console.log(`  ${m.slug}: espnId=${m.espnId} → logoId=${m.logoId} (matched: ${m.matchedTo})`);
    }
    console.log();
  }

  if (unmatched.length > 0) {
    console.log('─── Unmatched (will use placeholder) ──────────────');
    for (const t of unmatched) {
      console.log(`  ${t.slug}: espnId=${t.espnId} (${t.name})`);
    }
    console.log();
  }

  if (failedValidation.length > 0) {
    console.log('─── Failed CDN Validation ─────────────────────────');
    for (const m of failedValidation) {
      console.log(`  ${m.slug}: matched to ${m.matchedTo} (id=${m.logoId}) but CDN returned non-200`);
    }
    console.log();
  }

  // Write mapping JSON
  const mappingOutput = validated.map((m) => ({
    slug: m.slug,
    espnId: m.espnId,
    logoId: m.logoId,
    matchedTo: m.matchedTo,
  }));
  writeFileSync(MAPPING_PATH, JSON.stringify(mappingOutput, null, 2) + '\n');
  console.log(`Wrote ${MAPPING_PATH}`);

  // Apply to team-metadata.ts if --apply
  if (shouldApply && validated.length > 0) {
    console.log('\nApplying logoId to team-metadata.ts...');
    let modified = source;
    let applied = 0;

    for (const m of validated) {
      const searchStart = modified.indexOf(`'${m.slug}'`) !== -1
        ? modified.indexOf(`'${m.slug}'`)
        : modified.indexOf(`"${m.slug}"`);

      if (searchStart === -1) {
        console.warn(`  Could not find slug '${m.slug}' in source`);
        continue;
      }

      const searchRegion = modified.substring(searchStart, searchStart + 500);
      const espnLine = `espnId: '${m.espnId}',`;
      const espnIdx = searchRegion.indexOf(espnLine);

      if (espnIdx !== -1) {
        const absoluteIdx = searchStart + espnIdx;
        const insertPoint = absoluteIdx + espnLine.length;
        modified =
          modified.substring(0, insertPoint) +
          `\n    logoId: '${m.logoId}',` +
          modified.substring(insertPoint);
        applied++;
      } else {
        console.warn(`  Could not find espnId line for ${m.slug}`);
      }
    }
    writeFileSync(METADATA_PATH, modified);
    console.log(`Applied logoId to ${applied} teams in team-metadata.ts`);
  } else if (!shouldApply && validated.length > 0) {
    console.log('\nRun with --apply to write logoId into team-metadata.ts');
  }
}

main().catch(console.error);
