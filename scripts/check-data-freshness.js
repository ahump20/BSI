#!/usr/bin/env node
/**
 * BSI Data Freshness CLI
 *
 * Hits /api/admin/freshness on production (or BSI_BASE_URL) and prints a
 * colorized table of every data source's status. Exits with code 1 if any
 * source is STALE or MISSING so this can gate CI / pre-deploy.
 *
 * Usage:
 *   ADMIN_KEY=... node scripts/check-data-freshness.js
 *   ADMIN_KEY=... BSI_BASE_URL=https://preview.blazesportsintel.pages.dev node scripts/check-data-freshness.js
 *   ADMIN_KEY=... node scripts/check-data-freshness.js --deep
 *   ADMIN_KEY=... node scripts/check-data-freshness.js --json
 */

const BASE_URL = process.env.BSI_BASE_URL || 'https://blazesportsintel.com';
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.BSI_ADMIN_KEY;
const DEEP = process.argv.includes('--deep');
const JSON_OUTPUT = process.argv.includes('--json');

if (!ADMIN_KEY) {
  console.error('Missing ADMIN_KEY env var. Set it and try again:');
  console.error('  ADMIN_KEY=... node scripts/check-data-freshness.js');
  process.exit(2);
}

const COLOR = process.stdout.isTTY && !JSON_OUTPUT;
const c = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => c('32', s);
const yellow = (s) => c('33', s);
const red = (s) => c('31', s);
const gray = (s) => c('90', s);
const bold = (s) => c('1', s);

const STATUS_RENDER = {
  fresh: green('FRESH    '),
  stale: red('STALE    '),
  degraded: yellow('DEGRADED '),
  missing: red('MISSING  '),
  'off-season': gray('OFFSEASON'),
};

function pad(s, width) {
  s = String(s ?? '');
  if (s.length >= width) return s.slice(0, width - 1) + '…';
  return s + ' '.repeat(width - s.length);
}

function ageLabel(minutes) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function ageHoursLabel(hours) {
  if (hours == null) return '—';
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

async function main() {
  const url = `${BASE_URL}/api/admin/freshness${DEEP ? '?deep=true' : ''}`;
  const startMs = Date.now();
  let res;
  try {
    res = await fetch(url, {
      headers: { 'X-Admin-Key': ADMIN_KEY, 'User-Agent': 'bsi-freshness-cli/1.0' },
    });
  } catch (err) {
    console.error(red('FETCH FAILED:'), err instanceof Error ? err.message : err);
    process.exit(2);
  }
  const latencyMs = Date.now() - startMs;

  if (res.status === 401) {
    console.error(red('Unauthorized.'), 'Check your ADMIN_KEY.');
    process.exit(2);
  }
  if (!res.ok) {
    console.error(red(`HTTP ${res.status} from ${url}`));
    console.error(await res.text());
    process.exit(2);
  }

  const report = await res.json();

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report, latencyMs);
  }

  // Exit code: 1 if anything stale or missing; 0 otherwise.
  // 'degraded' and 'off-season' are non-blocking.
  const broken = (report.summary?.stale ?? 0) + (report.summary?.missing ?? 0);
  process.exit(broken > 0 ? 1 : 0);
}

function printReport(report, latencyMs) {
  const ts = new Date(report.timestamp || Date.now()).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
  console.log();
  console.log(bold('BSI DATA FRESHNESS'), gray(`(${BASE_URL})`));
  console.log(gray(`checked at ${ts} CT — ${latencyMs}ms`));
  console.log();

  // Summary line
  const s = report.summary || {};
  const summaryLine = [
    `${green(`${s.fresh ?? 0} fresh`)}`,
    `${yellow(`${s.degraded ?? 0} degraded`)}`,
    `${red(`${s.stale ?? 0} stale`)}`,
    `${red(`${s.missing ?? 0} missing`)}`,
    gray(`${s.total ?? 0} total`),
  ].join('  ');
  console.log(summaryLine);
  console.log();

  // Live endpoints (KV)
  if (Array.isArray(report.liveEndpoints) && report.liveEndpoints.length) {
    console.log(bold('LIVE DATA (KV)'));
    console.log(gray(pad('Source', 32) + pad('Sport', 18) + pad('Status', 11) + pad('Age', 7) + pad('Items', 7) + pad('Source', 12)));
    for (const e of report.liveEndpoints) {
      console.log(
        pad(e.name, 32) +
        pad(e.sport, 18) +
        (STATUS_RENDER[e.status] || pad(e.status, 11)) +
        pad(ageLabel(e.ageMinutes), 7) +
        pad(e.itemCount ?? '—', 7) +
        pad(e.source, 12),
      );
    }
    console.log();
  }

  // D1 tables
  if (Array.isArray(report.d1Tables) && report.d1Tables.length) {
    console.log(bold('SABERMETRICS (D1)'));
    console.log(gray(pad('Table', 32) + pad('Status', 11) + pad('Rows', 10) + pad('Age', 10)));
    for (const t of report.d1Tables) {
      console.log(
        pad(t.name, 32) +
        (STATUS_RENDER[t.status] || pad(t.status, 11)) +
        pad((t.rows ?? 0).toLocaleString(), 10) +
        pad(ageHoursLabel(t.ageHours), 10),
      );
    }
    console.log();
  }

  // Upstream APIs (only present when ?deep=true)
  if (Array.isArray(report.upstream) && report.upstream.length) {
    console.log(bold('UPSTREAM APIs'));
    console.log(gray(pad('Provider', 24) + pad('Status', 11) + pad('Latency', 12)));
    for (const u of report.upstream) {
      const statusRender = u.status === 'ok'
        ? green(pad('OK', 11))
        : u.status === 'slow'
        ? yellow(pad('SLOW', 11))
        : red(pad(String(u.status).toUpperCase(), 11));
      console.log(
        pad(u.provider, 24) +
        statusRender +
        pad(`${u.latencyMs ?? '—'}ms`, 12),
      );
      if (u.error) console.log(gray(`  ${u.error}`));
    }
    console.log();
  }

  // Cron health
  if (report.cronHealth?.workers) {
    console.log(bold('CRON WORKERS'));
    console.log(gray(pad('Worker', 32) + pad('Status', 11) + pad('Last Run', 16)));
    for (const [name, w] of Object.entries(report.cronHealth.workers)) {
      const statusRender = w.status === 'ok'
        ? green(pad('OK', 11))
        : w.status === 'silent'
        ? red(pad('SILENT', 11))
        : yellow(pad('DEGRADED', 11));
      const lastRun = w.lastRunAt
        ? new Date(w.lastRunAt).toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })
        : '—';
      console.log(pad(name, 32) + statusRender + pad(lastRun, 16));
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(red('UNEXPECTED ERROR:'), err instanceof Error ? err.stack : err);
  process.exit(2);
});
