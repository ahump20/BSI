#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseUrl = process.env.BSI_BASE_URL || 'https://blazesportsintel.com';
const defaultDates = [
  new Date().toISOString().split('T')[0],
  '2026-02-14',
  '2026-02-20',
];

const dates = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultDates;

function toEspnDate(isoDate) {
  return isoDate.replace(/-/g, '');
}

function normalizeInternalGames(payload) {
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.games)) return payload.games;
  return [];
}

function normalizeInternalIds(games) {
  return new Set(games.map((game) => String(game?.id ?? '')).filter(Boolean));
}

function normalizeEspnIds(payload) {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return new Set(events.map((event) => String(event?.id ?? '')).filter(Boolean));
}

function computeOverlap(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const id of setA) {
    if (setB.has(id)) shared += 1;
  }
  return shared / Math.max(setA.size, setB.size);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function checkDate(isoDate) {
  const internalUrl = `${baseUrl}/api/college-baseball/schedule?date=${isoDate}`;
  const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=${toEspnDate(isoDate)}`;

  const [internalPayload, espnPayload] = await Promise.all([
    fetchJson(internalUrl),
    fetchJson(espnUrl),
  ]);

  const internalGames = normalizeInternalGames(internalPayload);
  const internalIds = normalizeInternalIds(internalGames);
  const espnIds = normalizeEspnIds(espnPayload);

  const internalCount = internalGames.length;
  const espnCount = espnIds.size;
  const countDelta = Math.abs(internalCount - espnCount);
  const overlapRatio = computeOverlap(internalIds, espnIds);

  const pass = countDelta <= 3 && overlapRatio >= 0.9;

  return {
    date: isoDate,
    pass,
    thresholds: {
      maxCountDelta: 3,
      minOverlapRatio: 0.9,
    },
    counts: {
      internal: internalCount,
      espn: espnCount,
      delta: countDelta,
    },
    overlapRatio,
    sampled: {
      internalIds: Array.from(internalIds).slice(0, 10),
      espnIds: Array.from(espnIds).slice(0, 10),
    },
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const results = [];

  for (const date of dates) {
    const result = await checkDate(date);
    results.push(result);
  }

  const summary = {
    startedAt,
    completedAt: new Date().toISOString(),
    baseUrl,
    overallPass: results.every((entry) => entry.pass),
    results,
  };

  const outputDir = resolve(process.cwd(), 'output/college-baseball');
  mkdirSync(outputDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = resolve(outputDir, `source-drift-${stamp}.json`);
  writeFileSync(outputFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  process.stdout.write('College baseball source drift check\n');
  for (const entry of results) {
    process.stdout.write(
      `${entry.pass ? 'PASS' : 'FAIL'} ${entry.date} | internal=${entry.counts.internal} espn=${entry.counts.espn} delta=${entry.counts.delta} overlap=${entry.overlapRatio.toFixed(3)}\n`
    );
  }
  process.stdout.write(`Snapshot: ${outputFile}\n`);

  if (!summary.overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`Drift check failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
