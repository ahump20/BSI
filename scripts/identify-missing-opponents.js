/**
 * Identify missing opponent teams across multiple seasons
 * Usage: node scripts/identify-missing-opponents.js --seasons 2023,2025
 */

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

const headers = {
  'User-Agent': 'BlazeSportsIntel/1.0',
  Accept: 'application/json',
};

async function fetchTeamSchedule(teamId, season) {
  const url = `${ESPN_API_BASE}/teams/${teamId}/schedule?season=${season}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  return response.json();
}

async function main() {
  const targetTeams = [
    { id: '126', name: 'Texas Longhorns' },
    { id: '85', name: 'LSU Tigers' },
    { id: '120', name: 'Vanderbilt Commodores' },
  ];

  // Parse seasons from command line
  const args = process.argv.slice(2);
  const seasonsArg = args.find((arg) => arg.startsWith('--seasons'));
  const seasons = seasonsArg
    ? seasonsArg
        .split('=')[1]
        .split(',')
        .map((s) => parseInt(s.trim()))
    : [2023, 2025];

  const allOpponents = new Map();

  for (const season of seasons) {
    console.log(`\n🔍 Processing ${season} season...\n`);

    for (const team of targetTeams) {
      console.log(`  Fetching schedule for ${team.name} (${team.id})...`);

      try {
        const scheduleData = await fetchTeamSchedule(team.id, season);
        const games = scheduleData.events || [];

        for (const game of games) {
          const competition = game.competitions?.[0];
          if (!competition) continue;

          const competitors = competition.competitors || [];

          for (const competitor of competitors) {
            // Skip our target teams
            if (targetTeams.some((t) => t.id === competitor.id)) continue;

            const oppId = competitor.id;
            const oppTeam = competitor.team;

            if (!allOpponents.has(oppId)) {
              allOpponents.set(oppId, {
                id: oppId,
                name: oppTeam.displayName,
                abbreviation: oppTeam.abbreviation,
                location: oppTeam.location,
                seasons: new Set(),
                count: 0,
              });
            }

            const opp = allOpponents.get(oppId);
            opp.seasons.add(season);
            opp.count++;
          }
        }

        console.log(`    ✓ Found ${games.length} games`);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`    ❌ Error fetching ${team.name}: ${error.message}`);
      }
    }
  }

  // Sort by frequency (most common opponents first)
  const opponents = Array.from(allOpponents.values()).sort((a, b) => b.count - a.count);

  console.log('\n' + '='.repeat(70));
  console.log('📊 Opponent Teams Summary');
  console.log('='.repeat(70));
  console.log(`\nSeasons analyzed: ${seasons.join(', ')}`);
  console.log(`Total unique opponents: ${opponents.length}\n`);

  console.log('Top 25 Most Common Opponents:\n');
  opponents.slice(0, 25).forEach((opp, i) => {
    const seasonsList = Array.from(opp.seasons).sort().join(',');
    console.log(
      `${String(i + 1).padStart(2)}. ${opp.name.padEnd(35)} (ID: ${opp.id.padEnd(4)}) - ${opp.count} games (${seasonsList})`
    );
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 To ingest ALL teams, run:');
  console.log(
    '   node scripts/batch-ingest-teams.js --teams ' + opponents.map((o) => o.id).join(',')
  );

  console.log('\n📋 All opponent team IDs:');
  console.log(opponents.map((o) => o.id).join(','));
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
