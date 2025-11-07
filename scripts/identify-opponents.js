/**
 * Identify opponent teams from Texas, LSU, and Vanderbilt schedules
 * Outputs unique opponent team IDs and their information
 */

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

const headers = {
  'User-Agent': 'BlazeSportsIntel/1.0',
  Accept: 'application/json'
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
    { id: '120', name: 'Vanderbilt Commodores' }
  ];

  const season = 2024;
  const opponentMap = new Map();

  console.log('🔍 Identifying opponent teams from 2024 schedules...\n');

  for (const team of targetTeams) {
    console.log(`Fetching schedule for ${team.name} (${team.id})...`);

    const scheduleData = await fetchTeamSchedule(team.id, season);
    const games = scheduleData.events || [];

    for (const game of games) {
      const competition = game.competitions?.[0];
      if (!competition) continue;

      const competitors = competition.competitors || [];

      for (const competitor of competitors) {
        // Skip our target teams
        if (targetTeams.some(t => t.id === competitor.id)) continue;

        const oppId = competitor.id;
        const oppTeam = competitor.team;

        if (!opponentMap.has(oppId)) {
          opponentMap.set(oppId, {
            id: oppId,
            name: oppTeam.displayName,
            abbreviation: oppTeam.abbreviation,
            location: oppTeam.location,
            count: 0
          });
        }

        opponentMap.get(oppId).count++;
      }
    }

    console.log(`  ✓ Found ${games.length} games\n`);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Sort by frequency (most common opponents first)
  const opponents = Array.from(opponentMap.values())
    .sort((a, b) => b.count - a.count);

  console.log('='.repeat(70));
  console.log('📊 Opponent Teams Summary');
  console.log('='.repeat(70));
  console.log(`\nTotal unique opponents: ${opponents.length}\n`);

  console.log('Top 20 Most Common Opponents:\n');
  opponents.slice(0, 20).forEach((opp, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${opp.name.padEnd(30)} (ID: ${opp.id.padEnd(4)}) - ${opp.count} games`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 To ingest these teams, run:');
  console.log('   node scripts/batch-ingest-teams.js --teams ' +
    opponents.slice(0, 15).map(o => o.id).join(','));

  // Output all opponent IDs for reference
  console.log('\n📋 All opponent team IDs:');
  console.log(opponents.map(o => o.id).join(','));
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
