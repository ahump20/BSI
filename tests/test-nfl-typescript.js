/**
 * NFL TypeScript Implementation Test
 * Demonstrates the new truth-enforced NFL adapter pattern
 */

// Import the TypeScript modules (in a real app, these would be .ts imports)
import { getNflTeam, getNflStandings } from './lib/api/nfl.js';
import { toTeamCardView, toStandingsView } from './lib/adapters/nfl.js';

async function testNflImplementation() {
  try {
    // Test team endpoint with TypeScript types
    const teamData = await getNflTeam('10');

    // Test team adapter with truth enforcement
    const teamViewModel = toTeamCardView(teamData);

    // Test standings endpoint
    const standingsData = await getNflStandings();

    // Test standings adapter
    const standingsViewModel = toStandingsView(standingsData);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNflImplementation().catch(console.error);
