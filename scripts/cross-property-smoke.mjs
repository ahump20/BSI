#!/usr/bin/env node

import process from 'node:process';

const DEFAULT_TIMEOUT_MS = 15000;

function parseArgs(argv) {
  const args = {
    bsiUrl: 'https://blazesportsintel.com',
    austinUrl: 'https://austinhumphrey.com',
    blazecraftUrl: 'https://blazecraft.app',
    timeoutMs: DEFAULT_TIMEOUT_MS,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--bsi-url') {
      args.bsiUrl = argv[i + 1] ?? args.bsiUrl;
      i += 1;
      continue;
    }
    if (current === '--austin-url') {
      args.austinUrl = argv[i + 1] ?? args.austinUrl;
      i += 1;
      continue;
    }
    if (current === '--blazecraft-url') {
      args.blazecraftUrl = argv[i + 1] ?? args.blazecraftUrl;
      i += 1;
      continue;
    }
    if (current === '--timeout-ms') {
      const candidate = Number(argv[i + 1] ?? args.timeoutMs);
      args.timeoutMs = Number.isFinite(candidate) && candidate > 0 ? candidate : args.timeoutMs;
      i += 1;
      continue;
    }
    if (current === '--json') {
      args.json = true;
    }
  }

  return args;
}

function normalizeBase(base) {
  return base.replace(/\/+$/, '');
}

function createChecks(args) {
  const bsiBase = normalizeBase(args.bsiUrl);
  const austinBase = normalizeBase(args.austinUrl);
  const blazecraftBase = normalizeBase(args.blazecraftUrl);

  return [
    {
      id: 'bsi-home',
      url: `${bsiBase}/`,
      expectedStatus: 200,
      mustContain: ['Blaze Sports Intel', 'Born to Blaze the Path Beaten Less'],
      mustNotContain: ['SERIOUS-FAN COVERAGE'],
    },
    {
      id: 'bsi-college-baseball',
      url: `${bsiBase}/college-baseball`,
      expectedStatus: 200,
      mustContain: ['Start Here', 'Ecosystem'],
      mustNotContain: [],
    },
    {
      id: 'austin-home',
      url: `${austinBase}/`,
      expectedStatus: 200,
      mustContain: ['Austin Humphrey', 'Blaze Sports Intel'],
      mustNotContain: [],
    },
    {
      id: 'blazecraft-home',
      url: `${blazecraftBase}/`,
      expectedStatus: 200,
      mustContain: ['BlazeCraft', 'id="game"'],
      mustNotContain: [],
    },
  ];
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    const body = await response.text();
    return { response, body, error: null };
  } catch (error) {
    return { response: null, body: '', error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

async function runChecks(checks, timeoutMs) {
  const results = [];

  for (const check of checks) {
    const { response, body, error } = await fetchWithTimeout(check.url, timeoutMs);
    const failures = [];

    if (error) {
      failures.push(`request failed: ${error}`);
    } else if (!response) {
      failures.push('request failed: no response');
    } else {
      if (response.status !== check.expectedStatus) {
        failures.push(`expected status ${check.expectedStatus}, got ${response.status}`);
      }

      for (const marker of check.mustContain) {
        if (!body.includes(marker)) {
          failures.push(`missing marker: ${marker}`);
        }
      }

      for (const blocked of check.mustNotContain) {
        if (body.includes(blocked)) {
          failures.push(`unexpected marker present: ${blocked}`);
        }
      }
    }

    results.push({
      ...check,
      status: response?.status ?? 0,
      ok: failures.length === 0,
      failures,
    });
  }

  return results;
}

function printHumanReport(results) {
  console.log('\nCross-Property Smoke Report\n');

  for (const result of results) {
    const badge = result.ok ? 'PASS' : 'FAIL';
    console.log(`[${badge}] ${result.id} (${result.url}) status=${result.status}`);
    for (const failure of result.failures) {
      console.log(`  - ${failure}`);
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  console.log(`\nSummary: ${results.length - failed}/${results.length} checks passed.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = createChecks(args);
  const results = await runChecks(checks, args.timeoutMs);

  if (args.json) {
    console.log(JSON.stringify({ results }, null, 2));
  } else {
    printHumanReport(results);
  }

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

await main();
