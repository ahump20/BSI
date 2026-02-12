#!/usr/bin/env node

const API_KEY = process.env.SPORTS_DATA_IO_API_KEY;

if (!API_KEY) {
  console.error('Missing SPORTS_DATA_IO_API_KEY');
  process.exit(1);
}

const base = 'https://api.sportsdata.io';
const checks = [
  { sport: 'GRid', endpoint: 'grid/json/Sports' },
  { sport: 'NFL', endpoint: 'v3/nfl/scores/json/CurrentSeason' },
  { sport: 'NBA', endpoint: 'v3/nba/scores/json/CurrentSeason' },
  { sport: 'MLB', endpoint: 'v3/mlb/scores/json/CurrentSeason' },
  { sport: 'CFB', endpoint: 'v3/cfb/scores/json/CurrentSeason' },
  { sport: 'CBB', endpoint: 'v3/cbb/scores/json/CurrentSeason' },
];

const headers = { 'Ocp-Apim-Subscription-Key': API_KEY };

const golfEndpoint = process.env.SPORTS_DATA_IO_GOLF_ENDPOINT;
if (golfEndpoint) {
  checks.push({ sport: 'Golf', endpoint: golfEndpoint });
} else {
  console.warn('Golf endpoint not checked: set SPORTS_DATA_IO_GOLF_ENDPOINT to a documented v2 golf path.');
}

async function run() {
  let failed = false;
  for (const check of checks) {
    const url = `${base}/${check.endpoint}`;
    const res = await fetch(url, { headers });
    const contentType = res.headers.get('content-type') || '';
    const body = await res.text();
    const hasJson = contentType.includes('application/json');
    const bodyLooksJson = body.trim().startsWith('{') || body.trim().startsWith('[');
    const ok = res.status === 200 && (hasJson || bodyLooksJson);
    console.log(`${check.sport}\t${res.status}\t${ok ? 'OK' : 'FAIL'}\t${url}`);
    if (!ok) {
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
