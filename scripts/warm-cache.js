#!/usr/bin/env node
/**
 * BSI Cache Warm CLI
 *
 * Manually re-fires the score, ranking, and sabermetric warmers by hitting
 * each satellite worker's /run endpoint plus the main worker's apex routes.
 * Used after deploys, after KV namespace changes, or any time you suspect
 * a cron skipped a cycle.
 *
 * Usage:
 *   node scripts/warm-cache.js
 *   node scripts/warm-cache.js --only=cbb-analytics,savant
 *   ADMIN_KEY=... node scripts/warm-cache.js --apex
 */

const ONLY = (() => {
  const arg = process.argv.find((a) => a.startsWith('--only='));
  if (!arg) return null;
  return new Set(arg.replace('--only=', '').split(',').map((s) => s.trim()));
})();
const APEX = process.argv.includes('--apex');
const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.BSI_ADMIN_KEY;

const TARGETS = [
  // Sabermetric recompute (every 6h normally — manual fire here)
  { name: 'cbb-analytics',     url: 'https://bsi-cbb-analytics.ahump20.workers.dev/run',     method: 'POST' },
  { name: 'savant-compute',    url: 'https://bsi-savant-compute.ahump20.workers.dev/run',    method: 'POST' },
  // Score warming — these are normally driven by the main minute cron, but the
  // apex routes themselves serve cached data and force a refresh on read.
  ...(APEX ? [
    { name: 'apex-mlb-scores',     url: 'https://blazesportsintel.com/api/mlb/scores',                method: 'GET' },
    { name: 'apex-nfl-scores',     url: 'https://blazesportsintel.com/api/nfl/scores',                method: 'GET' },
    { name: 'apex-nba-scores',     url: 'https://blazesportsintel.com/api/nba/scores',                method: 'GET' },
    { name: 'apex-cfb-scores',     url: 'https://blazesportsintel.com/api/cfb/scores',                method: 'GET' },
    { name: 'apex-cb-scores',      url: 'https://blazesportsintel.com/api/college-baseball/scores',   method: 'GET' },
    { name: 'apex-cb-rankings',    url: 'https://blazesportsintel.com/api/college-baseball/rankings', method: 'GET' },
  ] : []),
];

function color(code, s) {
  return process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
}
const green = (s) => color('32', s);
const red = (s) => color('31', s);
const gray = (s) => color('90', s);
const bold = (s) => color('1', s);

async function fireOne(t) {
  if (ONLY && !ONLY.has(t.name)) return { ...t, status: 'skipped' };

  const startMs = Date.now();
  try {
    const headers = { 'User-Agent': 'bsi-warm-cache/1.0' };
    if (ADMIN_KEY) headers['X-Admin-Key'] = ADMIN_KEY;
    const res = await fetch(t.url, { method: t.method, headers });
    const latencyMs = Date.now() - startMs;
    return {
      ...t,
      status: res.ok ? 'ok' : 'error',
      httpStatus: res.status,
      latencyMs,
    };
  } catch (err) {
    return {
      ...t,
      status: 'error',
      latencyMs: Date.now() - startMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log();
  console.log(bold('BSI CACHE WARM'));
  console.log(gray(`firing ${TARGETS.length} targets${APEX ? ' (incl. apex)' : ''}${ONLY ? ` filtered to: ${[...ONLY].join(',')}` : ''}`));
  console.log();

  const results = await Promise.all(TARGETS.map(fireOne));

  let okCount = 0;
  let errCount = 0;
  let skipCount = 0;

  for (const r of results) {
    if (r.status === 'skipped') {
      skipCount++;
      if (VERBOSE) console.log(gray(`  SKIP    ${r.name}`));
      continue;
    }
    if (r.status === 'ok') {
      okCount++;
      console.log(green(`  OK      ${r.name.padEnd(20)} HTTP ${r.httpStatus}  ${r.latencyMs}ms`));
    } else {
      errCount++;
      console.log(red(`  ERROR   ${r.name.padEnd(20)} ${r.httpStatus ? `HTTP ${r.httpStatus}` : (r.error || 'unknown')}  ${r.latencyMs}ms`));
    }
  }

  console.log();
  console.log(`${green(`${okCount} ok`)}  ${red(`${errCount} error`)}  ${gray(`${skipCount} skipped`)}`);
  process.exit(errCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(red('UNEXPECTED ERROR:'), err instanceof Error ? err.stack : err);
  process.exit(2);
});
