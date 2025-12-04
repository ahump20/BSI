/**
 * College Baseball Data Ingestion Script
 * Fetches live data from ESPN API and populates D1 database
 *
 * Run: node scripts/ingest-college-baseball.js
 *
 * Data Sources:
 * - ESPN College Baseball API (teams, rosters, records, games)
 * - D1Baseball (rankings) - manual/scheduled
 * - Baseball America (rankings) - manual/scheduled
 */

import { writeFileSync } from 'node:fs';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/baseball/leagues/college-baseball';
const USER_AGENT = 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)';

// Conference mappings - using ESPN slug patterns (team-name-mascot)
const CONFERENCES = {
  SEC: { id: '23', teams: ['alabama-crimson-tide', 'arkansas-razorbacks', 'auburn-tigers', 'florida-gators', 'georgia-bulldogs', 'kentucky-wildcats', 'lsu-tigers', 'mississippi-state-bulldogs', 'missouri-tigers', 'ole-miss-rebels', 'oklahoma-sooners', 'south-carolina-gamecocks', 'tennessee-volunteers', 'texas-longhorns', 'texas-am-aggies', 'vanderbilt-commodores'] },
  ACC: { id: '1', teams: ['boston-college-eagles', 'california-golden-bears', 'clemson-tigers', 'duke-blue-devils', 'florida-state-seminoles', 'georgia-tech-yellow-jackets', 'louisville-cardinals', 'miami-hurricanes', 'nc-state-wolfpack', 'north-carolina-tar-heels', 'notre-dame-fighting-irish', 'pittsburgh-panthers', 'smu-mustangs', 'stanford-cardinal', 'syracuse-orange', 'virginia-cavaliers', 'virginia-tech-hokies', 'wake-forest-demon-deacons'] },
  'Big Ten': { id: '5', teams: ['illinois-fighting-illini', 'indiana-hoosiers', 'iowa-hawkeyes', 'maryland-terrapins', 'michigan-wolverines', 'michigan-state-spartans', 'minnesota-golden-gophers', 'nebraska-cornhuskers', 'northwestern-wildcats', 'ohio-state-buckeyes', 'oregon-ducks', 'penn-state-nittany-lions', 'purdue-boilermakers', 'rutgers-scarlet-knights', 'ucla-bruins', 'usc-trojans', 'washington-huskies', 'wisconsin-badgers'] },
  'Big 12': { id: '4', teams: ['arizona-wildcats', 'arizona-state-sun-devils', 'baylor-bears', 'byu-cougars', 'cincinnati-bearcats', 'houston-cougars', 'kansas-jayhawks', 'kansas-state-wildcats', 'oklahoma-state-cowboys', 'tcu-horned-frogs', 'texas-tech-red-raiders', 'ucf-knights', 'utah-utes', 'west-virginia-mountaineers'] }
};

// Slug normalization - maps ESPN slugs to short team IDs
function normalizeSlug(slug) {
  const mappings = {
    'texas-longhorns': 'texas', 'texas-am-aggies': 'texas-am', 'florida-state-seminoles': 'florida-state',
    'stanford-cardinal': 'stanford', 'nc-state-wolfpack': 'nc-state', 'clemson-tigers': 'clemson',
    'virginia-cavaliers': 'virginia', 'north-carolina-tar-heels': 'north-carolina', 'louisville-cardinals': 'louisville',
    'wake-forest-demon-deacons': 'wake-forest', 'miami-hurricanes': 'miami', 'oklahoma-state-cowboys': 'oklahoma-state',
    'tennessee-volunteers': 'tennessee', 'virginia-tech-hokies': 'virginia-tech', 'georgia-tech-yellow-jackets': 'georgia-tech',
    'lsu-tigers': 'lsu', 'notre-dame-fighting-irish': 'notre-dame', 'baylor-bears': 'baylor',
    'california-golden-bears': 'california', 'duke-blue-devils': 'duke', 'smu-mustangs': 'smu',
    'boston-college-eagles': 'boston-college', 'pittsburgh-panthers': 'pittsburgh', 'syracuse-orange': 'syracuse',
    'alabama-crimson-tide': 'alabama', 'arkansas-razorbacks': 'arkansas', 'auburn-tigers': 'auburn',
    'florida-gators': 'florida', 'georgia-bulldogs': 'georgia', 'kentucky-wildcats': 'kentucky',
    'mississippi-state-bulldogs': 'mississippi-state', 'missouri-tigers': 'missouri', 'ole-miss-rebels': 'ole-miss',
    'oklahoma-sooners': 'oklahoma', 'south-carolina-gamecocks': 'south-carolina', 'vanderbilt-commodores': 'vanderbilt',
    'illinois-fighting-illini': 'illinois', 'indiana-hoosiers': 'indiana', 'iowa-hawkeyes': 'iowa',
    'maryland-terrapins': 'maryland', 'michigan-wolverines': 'michigan', 'michigan-state-spartans': 'michigan-state',
    'minnesota-golden-gophers': 'minnesota', 'nebraska-cornhuskers': 'nebraska', 'northwestern-wildcats': 'northwestern',
    'ohio-state-buckeyes': 'ohio-state', 'oregon-ducks': 'oregon', 'penn-state-nittany-lions': 'penn-state',
    'purdue-boilermakers': 'purdue', 'rutgers-scarlet-knights': 'rutgers', 'ucla-bruins': 'ucla',
    'usc-trojans': 'usc', 'washington-huskies': 'washington', 'wisconsin-badgers': 'wisconsin',
    'arizona-wildcats': 'arizona', 'arizona-state-sun-devils': 'arizona-state', 'byu-cougars': 'byu',
    'cincinnati-bearcats': 'cincinnati', 'houston-cougars': 'houston', 'kansas-jayhawks': 'kansas',
    'kansas-state-wildcats': 'kansas-state', 'tcu-horned-frogs': 'tcu', 'texas-tech-red-raiders': 'texas-tech',
    'ucf-knights': 'ucf', 'utah-utes': 'utah', 'west-virginia-mountaineers': 'west-virginia'
  };
  return mappings[slug] || slug;
}

// 2026 Preseason Rankings (from D1Baseball/Baseball America projections)
const PRESEASON_RANKINGS = {
  // Top 25 D1Baseball
  'd1baseball': {
    'texas': 1, 'texas-am': 2, 'stanford': 3, 'florida-state': 4, 'nc-state': 5,
    'clemson': 6, 'north-carolina': 7, 'virginia': 8, 'louisville': 9, 'wake-forest': 10,
    'miami': 11, 'oklahoma-state': 12, 'tennessee': 13, 'virginia-tech': 14, 'georgia-tech': 15,
    'lsu': 16, 'notre-dame': 17, 'baylor': 18, 'california': 19, 'ucf': 20,
    'smu': 21, 'houston': 22, 'duke': 23, 'west-virginia': 24, 'byu': 25
  },
  'baseball_america': {
    'texas': 1, 'texas-am': 2, 'stanford': 3, 'florida-state': 4, 'nc-state': 4,
    'clemson': 6, 'virginia': 7, 'north-carolina': 8, 'louisville': 9, 'tennessee': 10,
    'wake-forest': 11, 'virginia-tech': 12, 'miami': 13, 'lsu': 14, 'oklahoma-state': 15,
    'notre-dame': 16, 'georgia-tech': 17, 'baylor': 18, 'california': 19, 'smu': 20
  }
};

// Team metadata not available from ESPN
const TEAM_METADATA = {
  'texas': { colors: ['#BF5700', '#FFFFFF'], stadium: { name: 'UFCU Disch-Falk Field', capacity: 7273, surface: 'Turf' }, coach: { name: 'David Pierce', years: 9, record: '292-130' } },
  'texas-am': { colors: ['#500000', '#FFFFFF'], stadium: { name: 'Blue Bell Park', capacity: 6100, surface: 'Grass' }, coach: { name: 'Jim Schlossnagle', years: 4, record: '158-58' } },
  'florida-state': { colors: ['#782F40', '#CEB888'], stadium: { name: 'Dick Howser Stadium', capacity: 6700, surface: 'Grass' }, coach: { name: 'Link Jarrett', years: 4, record: '146-62' } },
  'stanford': { colors: ['#8C1515', '#FFFFFF'], stadium: { name: 'Klein Field at Sunken Diamond', capacity: 4000, surface: 'Grass' }, coach: { name: 'Brock Holt', years: 2, record: '48-14' } },
  'nc-state': { colors: ['#CC0000', '#000000'], stadium: { name: 'Doak Field', capacity: 3500, surface: 'Turf' }, coach: { name: 'Elliott Avent', years: 28, record: '978-565' } },
  'clemson': { colors: ['#F66733', '#522D80'], stadium: { name: 'Doug Kingsmore Stadium', capacity: 6500, surface: 'Grass' }, coach: { name: 'Erik Bakich', years: 3, record: '115-52' } },
  'virginia': { colors: ['#232D4B', '#F84C1E'], stadium: { name: 'Disharoon Park', capacity: 5074, surface: 'Grass' }, coach: { name: 'Brian O\'Connor', years: 22, record: '918-428' } },
  'north-carolina': { colors: ['#7BAFD4', '#FFFFFF'], stadium: { name: 'Boshamer Stadium', capacity: 4500, surface: 'Grass' }, coach: { name: 'Scott Forbes', years: 5, record: '168-92' } },
  'louisville': { colors: ['#AD0000', '#000000'], stadium: { name: 'Jim Patterson Stadium', capacity: 4000, surface: 'Turf' }, coach: { name: 'Dan McDonnell', years: 19, record: '765-332' } },
  'wake-forest': { colors: ['#9E7E38', '#000000'], stadium: { name: 'David F. Couch Ballpark', capacity: 3211, surface: 'Grass' }, coach: { name: 'Tom Walter', years: 16, record: '482-365' } },
  'miami': { colors: ['#F47321', '#005030'], stadium: { name: 'Mark Light Field', capacity: 5000, surface: 'Grass' }, coach: { name: 'JD Arteaga', years: 2, record: '76-42' } },
  'oklahoma-state': { colors: ['#FF7300', '#000000'], stadium: { name: 'O\'Brate Stadium', capacity: 8000, surface: 'Grass' }, coach: { name: 'Josh Holliday', years: 12, record: '412-252' } },
  'tennessee': { colors: ['#FF8200', '#FFFFFF'], stadium: { name: 'Lindsey Nelson Stadium', capacity: 4500, surface: 'Turf' }, coach: { name: 'Tony Vitello', years: 8, record: '268-118' } },
  'virginia-tech': { colors: ['#630031', '#CF4420'], stadium: { name: 'English Field at Atlantic Union Bank Park', capacity: 4000, surface: 'Grass' }, coach: { name: 'John Szefc', years: 9, record: '308-198' } },
  'georgia-tech': { colors: ['#B3A369', '#003057'], stadium: { name: 'Russ Chandler Stadium', capacity: 4157, surface: 'Grass' }, coach: { name: 'Danny Hall', years: 31, record: '1122-648' } },
  'lsu': { colors: ['#461D7C', '#FDD023'], stadium: { name: 'Alex Box Stadium', capacity: 10326, surface: 'Grass' }, coach: { name: 'Jay Johnson', years: 4, record: '152-62' } },
  'notre-dame': { colors: ['#0C2340', '#C99700'], stadium: { name: 'Frank Eck Stadium', capacity: 2500, surface: 'Grass' }, coach: { name: 'Shawn Stiffler', years: 4, record: '132-68' } },
  'baylor': { colors: ['#154734', '#FFB81C'], stadium: { name: 'Baylor Ballpark', capacity: 5000, surface: 'Grass' }, coach: { name: 'Mitch Thompson', years: 3, record: '95-68' } },
  'california': { colors: ['#003262', '#FDB515'], stadium: { name: 'Evans Diamond', capacity: 2500, surface: 'Grass' }, coach: { name: 'Mike Neu', years: 4, record: '118-88' } }
};

// Program history data
const PROGRAM_HISTORY = {
  'texas': { cwsAppearances: 38, lastCWS: 2024, nationalTitles: 6, regionals: 65 },
  'texas-am': { cwsAppearances: 9, lastCWS: 2024, nationalTitles: 0, regionals: 22 },
  'florida-state': { cwsAppearances: 24, lastCWS: 2023, nationalTitles: 0, regionals: 44 },
  'stanford': { cwsAppearances: 17, lastCWS: 2023, nationalTitles: 2, regionals: 34 },
  'nc-state': { cwsAppearances: 4, lastCWS: 2024, nationalTitles: 0, regionals: 14 },
  'clemson': { cwsAppearances: 13, lastCWS: 2010, nationalTitles: 0, regionals: 31 },
  'virginia': { cwsAppearances: 7, lastCWS: 2021, nationalTitles: 1, regionals: 18 },
  'north-carolina': { cwsAppearances: 11, lastCWS: 2018, nationalTitles: 0, regionals: 29 },
  'louisville': { cwsAppearances: 7, lastCWS: 2019, nationalTitles: 0, regionals: 15 },
  'wake-forest': { cwsAppearances: 3, lastCWS: 2022, nationalTitles: 0, regionals: 12 },
  'miami': { cwsAppearances: 25, lastCWS: 2016, nationalTitles: 4, regionals: 47 },
  'oklahoma-state': { cwsAppearances: 20, lastCWS: 2016, nationalTitles: 0, regionals: 30 },
  'tennessee': { cwsAppearances: 6, lastCWS: 2024, nationalTitles: 0, regionals: 17 },
  'virginia-tech': { cwsAppearances: 2, lastCWS: 2024, nationalTitles: 0, regionals: 8 },
  'georgia-tech': { cwsAppearances: 5, lastCWS: 2006, nationalTitles: 0, regionals: 26 },
  'lsu': { cwsAppearances: 18, lastCWS: 2023, nationalTitles: 6, regionals: 35 },
  'notre-dame': { cwsAppearances: 2, lastCWS: 2022, nationalTitles: 0, regionals: 10 },
  'baylor': { cwsAppearances: 5, lastCWS: 2005, nationalTitles: 0, regionals: 12 },
  'california': { cwsAppearances: 3, lastCWS: 1992, nationalTitles: 0, regionals: 10 }
};

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.json();
}

async function fetchAllTeams() {
  console.log('Fetching teams from ESPN...');
  const data = await fetchJSON(`${ESPN_BASE}/teams?limit=400`);

  const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
  console.log(`Found ${teams.length} teams from ESPN`);

  return teams.map(t => {
    const espnSlug = t.team.slug;
    const normalizedId = normalizeSlug(espnSlug);
    return {
      id: normalizedId,
      espnSlug: espnSlug,
      espnId: t.team.id,
      name: t.team.displayName,
      mascot: t.team.name,
      abbreviation: t.team.abbreviation,
      location: t.team.location,
      logo: t.team.logos?.[0]?.href,
      conference: getConference(espnSlug)
    };
  });
}

async function fetchTeamRoster(teamSlug, espnId) {
  try {
    const data = await fetchJSON(`${ESPN_BASE}/teams/${espnId}/roster`);
    const athletes = data.athletes || [];

    return athletes.map(a => ({
      id: `${teamSlug}-${a.id}`,
      teamId: teamSlug,
      name: a.displayName,
      jersey: a.jersey,
      position: a.position?.abbreviation || a.position?.name,
      classYear: getClassYear(a.experience?.years),
      height: a.displayHeight,
      weight: parseInt(a.displayWeight) || 0, // Parse "232 lbs" to 232
      hometown: a.birthPlace?.city ? `${a.birthPlace.city}, ${a.birthPlace.state}` : null,
      headshot: a.headshot?.href
    }));
  } catch (e) {
    console.log(`  No roster data for ${teamSlug}`);
    return [];
  }
}

async function fetchTeamRecord(teamSlug, espnId) {
  try {
    const data = await fetchJSON(`${ESPN_BASE}/teams/${espnId}`);
    const team = data.team;

    const overallRecord = team?.record?.items?.find(r => r.type === 'total');
    const confRecord = team?.record?.items?.find(r => r.type === 'vsconf');

    return {
      teamId: teamSlug,
      season: 2025, // Current season
      overallWins: parseInt(overallRecord?.stats?.find(s => s.name === 'wins')?.value) || 0,
      overallLosses: parseInt(overallRecord?.stats?.find(s => s.name === 'losses')?.value) || 0,
      conferenceWins: parseInt(confRecord?.stats?.find(s => s.name === 'wins')?.value) || 0,
      conferenceLosses: parseInt(confRecord?.stats?.find(s => s.name === 'losses')?.value) || 0,
      streak: overallRecord?.stats?.find(s => s.name === 'streak')?.displayValue || 'N0'
    };
  } catch (e) {
    return null;
  }
}

function getConference(slug) {
  for (const [conf, data] of Object.entries(CONFERENCES)) {
    if (data.teams.includes(slug)) return conf;
  }
  return 'Other';
}

function getClassYear(years) {
  if (!years) return 'Fr';
  if (years === 0) return 'Fr';
  if (years === 1) return 'So';
  if (years === 2) return 'Jr';
  if (years === 3) return 'Sr';
  return 'Gr';
}

function generateSQL(teams, rosters, records) {
  const statements = [];
  const timestamp = new Date().toISOString();

  // Insert teams
  for (const team of teams) {
    const conf = getConference(team.espnSlug);
    if (conf === 'Other') continue; // Only Power 5

    const meta = TEAM_METADATA[team.id] || {};
    const history = PROGRAM_HISTORY[team.id] || {};
    const d1Rank = PRESEASON_RANKINGS.d1baseball[team.id];
    const baRank = PRESEASON_RANKINGS.baseball_america[team.id];

    statements.push(`
INSERT OR REPLACE INTO college_baseball_teams
  (id, espn_id, name, mascot, abbreviation, conference, city, state, primary_color, secondary_color, logo_url, stadium_name, stadium_capacity, stadium_surface, coach_name, coach_years, coach_record, updated_at)
VALUES
  ('${team.id}', '${team.espnId}', '${escapeSql(team.name)}', '${escapeSql(team.mascot)}', '${team.abbreviation}', '${conf}',
   '${team.location?.city || ''}', '${team.location?.state || ''}',
   '${meta.colors?.[0] || '#333333'}', '${meta.colors?.[1] || '#FFFFFF'}', '${team.logo || ''}',
   '${escapeSql(meta.stadium?.name || '')}', ${meta.stadium?.capacity || 0}, '${meta.stadium?.surface || 'Grass'}',
   '${escapeSql(meta.coach?.name || '')}', ${meta.coach?.years || 0}, '${meta.coach?.record || ''}',
   '${timestamp}');`);

    // Insert rankings
    if (d1Rank) {
      statements.push(`
INSERT OR REPLACE INTO college_baseball_rankings (team_id, source, rank, week, season, updated_at)
VALUES ('${team.id}', 'd1baseball', ${d1Rank}, 0, 2026, '${timestamp}');`);
    }
    if (baRank) {
      statements.push(`
INSERT OR REPLACE INTO college_baseball_rankings (team_id, source, rank, week, season, updated_at)
VALUES ('${team.id}', 'baseball_america', ${baRank}, 0, 2026, '${timestamp}');`);
    }

    // Insert history
    if (history.cwsAppearances !== undefined) {
      statements.push(`
INSERT OR REPLACE INTO college_baseball_history (team_id, cws_appearances, last_cws_year, national_titles, regional_appearances, updated_at)
VALUES ('${team.id}', ${history.cwsAppearances || 0}, ${history.lastCWS || 'NULL'}, ${history.nationalTitles || 0}, ${history.regionals || 0}, '${timestamp}');`);
    }
  }

  // Insert players from rosters
  for (const player of rosters) {
    statements.push(`
INSERT OR REPLACE INTO college_baseball_players
  (id, team_id, name, jersey_number, position, class_year, height, weight, hometown, updated_at)
VALUES
  ('${player.id}', '${player.teamId}', '${escapeSql(player.name)}', '${player.jersey || ''}', '${player.position || ''}',
   '${player.classYear}', '${escapeSql(player.height || '')}', ${player.weight || 0}, '${escapeSql(player.hometown || '')}', '${timestamp}');`);
  }

  // Insert records
  for (const record of records) {
    if (!record) continue;
    const streakType = record.streak?.charAt(0) || 'N';
    const streakCount = parseInt(record.streak?.slice(1)) || 0;

    statements.push(`
INSERT OR REPLACE INTO college_baseball_records
  (team_id, season, overall_wins, overall_losses, conference_wins, conference_losses, streak_type, streak_count, updated_at)
VALUES
  ('${record.teamId}', ${record.season}, ${record.overallWins}, ${record.overallLosses},
   ${record.conferenceWins}, ${record.conferenceLosses}, '${streakType}', ${streakCount}, '${timestamp}');`);
  }

  // Log sync
  statements.push(`
INSERT INTO data_sync_log (source, entity_type, last_sync, records_updated, status)
VALUES ('espn', 'teams', '${timestamp}', ${teams.length}, 'success');`);

  return statements.join('\n');
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

async function main() {
  console.log('=== College Baseball Data Ingestion ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Fetch all teams
    const teams = await fetchAllTeams();

    // Filter to Power 5 conferences (use espnSlug for conference matching)
    const power5Teams = teams.filter(t => getConference(t.espnSlug) !== 'Other');
    console.log(`Power 5 teams: ${power5Teams.length}`);

    // Debug: show first few teams matched
    if (power5Teams.length > 0) {
      console.log('Sample teams:', power5Teams.slice(0, 5).map(t => `${t.name} (${t.id}, conf: ${getConference(t.espnSlug)})`));
    } else {
      // Debug: show some sample slugs
      const sampleSlugs = teams.slice(0, 10).map(t => t.espnSlug);
      console.log('Sample ESPN slugs:', sampleSlugs);
      console.log('Expected SEC teams:', CONFERENCES.SEC.teams.slice(0, 5));
    }

    // Fetch rosters for each team
    const allRosters = [];
    const allRecords = [];

    for (const team of power5Teams) { // Fetch all Power 5 teams
      console.log(`Fetching data for ${team.name}...`);

      const roster = await fetchTeamRoster(team.id, team.espnId);
      allRosters.push(...roster);

      const record = await fetchTeamRecord(team.id, team.espnId);
      if (record) allRecords.push(record);

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`Total players: ${allRosters.length}`);
    console.log(`Total records: ${allRecords.length}`);

    // Generate SQL
    const sql = generateSQL(power5Teams, allRosters, allRecords);

    // Write to file for review
    writeFileSync('/tmp/college-baseball-data.sql', sql);
    console.log('SQL written to /tmp/college-baseball-data.sql');

    console.log('\n=== Ingestion Complete ===');
    console.log('Run: wrangler d1 execute bsi-historical-db --remote --file=/tmp/college-baseball-data.sql');

  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  }
}

main();
