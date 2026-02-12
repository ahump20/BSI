const API_KEY = process.env.SPORTS_DATA_IO_API_KEY;

if (!API_KEY) {
  console.error('Missing SPORTS_DATA_IO_API_KEY');
  process.exit(1);
}

const checks = [
  ['GRid', 'https://api.sportsdata.io/grid/json/Sports'],
  ['NFL', 'https://api.sportsdata.io/v3/nfl/scores/json/CurrentSeason'],
  ['NBA', 'https://api.sportsdata.io/v3/nba/scores/json/CurrentSeason'],
  ['MLB', 'https://api.sportsdata.io/v3/mlb/scores/json/CurrentSeason'],
  ['CFB', 'https://api.sportsdata.io/v3/cfb/scores/json/CurrentSeason'],
  ['CBB', 'https://api.sportsdata.io/v3/cbb/scores/json/CurrentSeason'],
  ['Golf', 'https://api.sportsdata.io/golf/v2/json/Tournaments'],
];

let failures = 0;

for (const [sport, endpoint] of checks) {
  try {
    const res = await fetch(endpoint, {
      headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
    });

    let parsed;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }

    const validJson = parsed !== null && typeof parsed === 'object';
    const ok = res.status === 200 && validJson;

    console.log(`${sport}: ${res.status} ${ok ? 'OK' : 'FAIL'} ${endpoint}`);

    if (!ok) {
      failures += 1;
    }
  } catch (error) {
    failures += 1;
    console.log(`${sport}: ERROR ${endpoint} -> ${error.message}`);
  }
}

if (failures > 0) {
  process.exit(1);
}
