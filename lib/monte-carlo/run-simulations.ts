/**
 * Blaze Sports Intel - Monte Carlo Simulation Runner
 *
 * Executes simulations for all SEC, NFL, and MLB teams
 * Based on 2025 season data
 *
 * @author Austin Humphrey - Blaze Intelligence
 */

import { monteCarloEngine, TeamStats, Schedule, SimulationResult } from './simulation-engine';

/**
 * SEC Football Teams - 2025 Season Data (Current through Week 5)
 * Source: ESPN College Football Stats - VERIFIED September 30, 2025
 */
const SEC_TEAMS: TeamStats[] = [
  {
    teamId: 'OLE',
    teamName: 'Ole Miss Rebels',
    sport: 'SEC',
    wins: 5,
    losses: 0,
    pointsFor: 203,
    pointsAgainst: 94,
    recentForm: [1, 1, 1, 1, 1], // Last 5 games
    strengthOfSchedule: 0.62,
    injuryImpact: 0.98,
  },
  {
    teamId: 'VAN',
    teamName: 'Vanderbilt Commodores',
    sport: 'SEC',
    wins: 5,
    losses: 0,
    pointsFor: 245,
    pointsAgainst: 86,
    recentForm: [1, 1, 1, 1, 1],
    strengthOfSchedule: 0.58,
    injuryImpact: 0.96,
  },
  {
    teamId: 'MO',
    teamName: 'Missouri Tigers',
    sport: 'SEC',
    wins: 5,
    losses: 0,
    pointsFor: 226,
    pointsAgainst: 73,
    recentForm: [1, 1, 1, 1, 1],
    strengthOfSchedule: 0.56,
    injuryImpact: 0.95,
  },
  {
    teamId: 'TAMU',
    teamName: 'Texas A&M Aggies',
    sport: 'SEC',
    wins: 4,
    losses: 0,
    pointsFor: 143,
    pointsAgainst: 96,
    recentForm: [1, 1, 1, 1],
    strengthOfSchedule: 0.63,
    injuryImpact: 0.93,
  },
  {
    teamId: 'OK',
    teamName: 'Oklahoma Sooners',
    sport: 'SEC',
    wins: 4,
    losses: 0,
    pointsFor: 125,
    pointsAgainst: 36,
    recentForm: [1, 1, 1, 1],
    strengthOfSchedule: 0.6,
    injuryImpact: 0.94,
  },
  {
    teamId: 'TENN',
    teamName: 'Tennessee Volunteers',
    sport: 'SEC',
    wins: 4,
    losses: 1,
    pointsFor: 255,
    pointsAgainst: 145,
    recentForm: [1, 1, 1, 0, 1],
    strengthOfSchedule: 0.61,
    injuryImpact: 0.92,
  },
  {
    teamId: 'TEXAS',
    teamName: 'Texas Longhorns',
    sport: 'SEC',
    wins: 4,
    losses: 1,
    pointsFor: 135,
    pointsAgainst: 61,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.65,
    injuryImpact: 0.91,
  },
  {
    teamId: 'ALA',
    teamName: 'Alabama Crimson Tide',
    sport: 'SEC',
    wins: 3,
    losses: 1,
    pointsFor: 152,
    pointsAgainst: 66,
    recentForm: [1, 1, 1, 0],
    strengthOfSchedule: 0.68,
    injuryImpact: 0.95,
  },
  {
    teamId: 'UGA',
    teamName: 'Georgia Bulldogs',
    sport: 'SEC',
    wins: 3,
    losses: 1,
    pointsFor: 138,
    pointsAgainst: 78,
    recentForm: [1, 1, 1, 0],
    strengthOfSchedule: 0.7,
    injuryImpact: 0.96,
  },
  {
    teamId: 'LSU',
    teamName: 'LSU Tigers',
    sport: 'SEC',
    wins: 3,
    losses: 1,
    pointsFor: 152,
    pointsAgainst: 66,
    recentForm: [1, 0, 1, 1],
    strengthOfSchedule: 0.59,
    injuryImpact: 0.9,
  },
  {
    teamId: 'SC',
    teamName: 'South Carolina Gamecocks',
    sport: 'SEC',
    wins: 3,
    losses: 2,
    pointsFor: 124,
    pointsAgainst: 94,
    recentForm: [1, 1, 0, 0, 1],
    strengthOfSchedule: 0.55,
    injuryImpact: 0.88,
  },
  {
    teamId: 'FLA',
    teamName: 'Florida Gators',
    sport: 'SEC',
    wins: 2,
    losses: 3,
    pointsFor: 187,
    pointsAgainst: 150,
    recentForm: [0, 1, 0, 1, 0],
    strengthOfSchedule: 0.6,
    injuryImpact: 0.85,
  },
  {
    teamId: 'UK',
    teamName: 'Kentucky Wildcats',
    sport: 'SEC',
    wins: 2,
    losses: 2,
    pointsFor: 108,
    pointsAgainst: 104,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.58,
    injuryImpact: 0.87,
  },
  {
    teamId: 'AUB',
    teamName: 'Auburn Tigers',
    sport: 'SEC',
    wins: 2,
    losses: 2,
    pointsFor: 138,
    pointsAgainst: 82,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.61,
    injuryImpact: 0.86,
  },
  {
    teamId: 'ARK',
    teamName: 'Arkansas Razorbacks',
    sport: 'SEC',
    wins: 1,
    losses: 3,
    pointsFor: 88,
    pointsAgainst: 64,
    recentForm: [0, 1, 0, 0],
    strengthOfSchedule: 0.57,
    injuryImpact: 0.84,
  },
  {
    teamId: 'MISS',
    teamName: 'Mississippi State Bulldogs',
    sport: 'SEC',
    wins: 2,
    losses: 3,
    pointsFor: 115,
    pointsAgainst: 148,
    recentForm: [0, 0, 1, 0, 1],
    strengthOfSchedule: 0.59,
    injuryImpact: 0.82,
  },
];

/**
 * NFL Teams - 2025 Season Data (Week 4)
 * Source: ESPN NFL Stats - Updated September 30, 2025
 */
const NFL_TEAMS: TeamStats[] = [
  {
    teamId: 'KC',
    teamName: 'Kansas City Chiefs',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 88,
    pointsAgainst: 71,
    recentForm: [1, 1, 0, 1], // Last 4 games
    strengthOfSchedule: 0.48,
    injuryImpact: 0.96,
  },
  {
    teamId: 'BUF',
    teamName: 'Buffalo Bills',
    sport: 'NFL',
    wins: 4,
    losses: 0,
    pointsFor: 133,
    pointsAgainst: 90,
    recentForm: [1, 1, 1, 1],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.94,
  },
  {
    teamId: 'PHI',
    teamName: 'Philadelphia Eagles',
    sport: 'NFL',
    wins: 4,
    losses: 0,
    pointsFor: 108,
    pointsAgainst: 88,
    recentForm: [1, 1, 1, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.97,
  },
  {
    teamId: 'DET',
    teamName: 'Detroit Lions',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 137,
    pointsAgainst: 88,
    recentForm: [0, 1, 1, 1],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.94,
  },
  {
    teamId: 'SF',
    teamName: 'San Francisco 49ers',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 98,
    pointsAgainst: 76,
    recentForm: [1, 1, 1, 0],
    strengthOfSchedule: 0.55,
    injuryImpact: 0.78,
  },
  {
    teamId: 'DAL',
    teamName: 'Dallas Cowboys',
    sport: 'NFL',
    wins: 1,
    losses: 2,
    ties: 1,
    pointsFor: 114,
    pointsAgainst: 132,
    recentForm: [0, 0, 1, 0], // Tie vs Packers in Week 4
    strengthOfSchedule: 0.51,
    injuryImpact: 0.88,
  },
  {
    teamId: 'BAL',
    teamName: 'Baltimore Ravens',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 131,
    pointsAgainst: 133,
    recentForm: [0, 1, 0, 0],
    strengthOfSchedule: 0.53,
    injuryImpact: 0.91,
  },
  {
    teamId: 'PIT',
    teamName: 'Pittsburgh Steelers',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 96,
    pointsAgainst: 98,
    recentForm: [1, 1, 0, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.93,
  },
  {
    teamId: 'LAC',
    teamName: 'Los Angeles Chargers',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 97,
    pointsAgainst: 76,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.88,
  },
  {
    teamId: 'MIN',
    teamName: 'Minnesota Vikings',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 94,
    pointsAgainst: 88,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.92,
  },
  {
    teamId: 'GB',
    teamName: 'Green Bay Packers',
    sport: 'NFL',
    wins: 2,
    losses: 1,
    ties: 1,
    pointsFor: 105,
    pointsAgainst: 95,
    recentForm: [1, 1, 0, 0], // Last result was tie vs Cowboys
    strengthOfSchedule: 0.51,
    injuryImpact: 0.91,
  },
  {
    teamId: 'TB',
    teamName: 'Tampa Bay Buccaneers',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 102,
    pointsAgainst: 88,
    recentForm: [1, 1, 1, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.87,
  },
  {
    teamId: 'SEA',
    teamName: 'Seattle Seahawks',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 95,
    pointsAgainst: 82,
    recentForm: [1, 1, 0, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.89,
  },
  {
    teamId: 'LAR',
    teamName: 'Los Angeles Rams',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 87,
    pointsAgainst: 71,
    recentForm: [1, 0, 1, 1],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.86,
  },
  {
    teamId: 'ATL',
    teamName: 'Atlanta Falcons',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 98,
    pointsAgainst: 89,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.88,
  },
  {
    teamId: 'HOU',
    teamName: 'Houston Texans',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 64,
    pointsAgainst: 51,
    recentForm: [0, 1, 0, 0],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.84,
  },
  {
    teamId: 'DEN',
    teamName: 'Denver Broncos',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 96,
    pointsAgainst: 67,
    recentForm: [1, 1, 0, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.92,
  },
  {
    teamId: 'MIA',
    teamName: 'Miami Dolphins',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 83,
    pointsAgainst: 118,
    recentForm: [0, 1, 0, 0],
    strengthOfSchedule: 0.54,
    injuryImpact: 0.8,
  },
  {
    teamId: 'IND',
    teamName: 'Indianapolis Colts',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 123,
    pointsAgainst: 83,
    recentForm: [1, 1, 1, 0],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.91,
  },
  {
    teamId: 'JAX',
    teamName: 'Jacksonville Jaguars',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 96,
    pointsAgainst: 72,
    recentForm: [1, 1, 0, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.88,
  },
  {
    teamId: 'TEN',
    teamName: 'Tennessee Titans',
    sport: 'NFL',
    wins: 0,
    losses: 4,
    pointsFor: 51,
    pointsAgainst: 120,
    recentForm: [0, 0, 0, 0],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.75,
  },
  {
    teamId: 'NE',
    teamName: 'New England Patriots',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 102,
    pointsAgainst: 81,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.87,
  },
  {
    teamId: 'NYJ',
    teamName: 'New York Jets',
    sport: 'NFL',
    wins: 0,
    losses: 4,
    pointsFor: 90,
    pointsAgainst: 120,
    recentForm: [0, 0, 0, 0],
    strengthOfSchedule: 0.53,
    injuryImpact: 0.78,
  },
  {
    teamId: 'CIN',
    teamName: 'Cincinnati Bengals',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 61,
    pointsAgainst: 119,
    recentForm: [0, 1, 0, 1],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.85,
  },
  {
    teamId: 'CLE',
    teamName: 'Cleveland Browns',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 56,
    pointsAgainst: 102,
    recentForm: [0, 0, 1, 0],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.8,
  },
  {
    teamId: 'LV',
    teamName: 'Las Vegas Raiders',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 77,
    pointsAgainst: 99,
    recentForm: [0, 1, 0, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.83,
  },
  {
    teamId: 'WAS',
    teamName: 'Washington Commanders',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 107,
    pointsAgainst: 91,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.89,
  },
  {
    teamId: 'NYG',
    teamName: 'New York Giants',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 73,
    pointsAgainst: 101,
    recentForm: [0, 1, 0, 0],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.82,
  },
  {
    teamId: 'CHI',
    teamName: 'Chicago Bears',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 88,
    pointsAgainst: 85,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.86,
  },
  {
    teamId: 'NO',
    teamName: 'New Orleans Saints',
    sport: 'NFL',
    wins: 0,
    losses: 4,
    pointsFor: 72,
    pointsAgainst: 115,
    recentForm: [0, 0, 0, 0],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.77,
  },
  {
    teamId: 'CAR',
    teamName: 'Carolina Panthers',
    sport: 'NFL',
    wins: 1,
    losses: 3,
    pointsFor: 68,
    pointsAgainst: 98,
    recentForm: [0, 0, 1, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.81,
  },
  {
    teamId: 'ARI',
    teamName: 'Arizona Cardinals',
    sport: 'NFL',
    wins: 2,
    losses: 2,
    pointsFor: 94,
    pointsAgainst: 92,
    recentForm: [1, 0, 1, 0],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.84,
  },
];

/**
 * MLB Teams - 2025 Season Projections
 * Source: Based on 2024 performance + offseason moves
 */
const MLB_TEAMS: TeamStats[] = [
  {
    teamId: 'LAD',
    teamName: 'Los Angeles Dodgers',
    sport: 'MLB',
    wins: 98,
    losses: 64,
    pointsFor: 842,
    pointsAgainst: 645,
    recentForm: [1, 1, 1, 0, 1],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.94,
  },
  {
    teamId: 'ATL',
    teamName: 'Atlanta Braves',
    sport: 'MLB',
    wins: 95,
    losses: 67,
    pointsFor: 815,
    pointsAgainst: 672,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.92,
  },
  {
    teamId: 'BAL',
    teamName: 'Baltimore Orioles',
    sport: 'MLB',
    wins: 101,
    losses: 61,
    pointsFor: 878,
    pointsAgainst: 658,
    recentForm: [1, 1, 1, 1, 1],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.96,
  },
  {
    teamId: 'HOU',
    teamName: 'Houston Astros',
    sport: 'MLB',
    wins: 88,
    losses: 74,
    pointsFor: 765,
    pointsAgainst: 698,
    recentForm: [1, 0, 1, 1, 0],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.89,
  },
  {
    teamId: 'TEX',
    teamName: 'Texas Rangers',
    sport: 'MLB',
    wins: 90,
    losses: 72,
    pointsFor: 792,
    pointsAgainst: 712,
    recentForm: [1, 1, 1, 0, 1],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.91,
  },
  {
    teamId: 'NYY',
    teamName: 'New York Yankees',
    sport: 'MLB',
    wins: 94,
    losses: 68,
    pointsFor: 825,
    pointsAgainst: 678,
    recentForm: [1, 1, 1, 1, 0],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.93,
  },
  {
    teamId: 'TB',
    teamName: 'Tampa Bay Rays',
    sport: 'MLB',
    wins: 85,
    losses: 77,
    pointsFor: 742,
    pointsAgainst: 715,
    recentForm: [1, 0, 1, 0, 1],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.87,
  },
  {
    teamId: 'TOR',
    teamName: 'Toronto Blue Jays',
    sport: 'MLB',
    wins: 89,
    losses: 73,
    pointsFor: 768,
    pointsAgainst: 698,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.9,
  },
  {
    teamId: 'MIN',
    teamName: 'Minnesota Twins',
    sport: 'MLB',
    wins: 87,
    losses: 75,
    pointsFor: 758,
    pointsAgainst: 705,
    recentForm: [1, 0, 1, 1, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.88,
  },
  {
    teamId: 'CLE',
    teamName: 'Cleveland Guardians',
    sport: 'MLB',
    wins: 92,
    losses: 70,
    pointsFor: 785,
    pointsAgainst: 682,
    recentForm: [1, 1, 1, 0, 1],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.91,
  },
  {
    teamId: 'STL',
    teamName: 'St. Louis Cardinals',
    sport: 'MLB',
    wins: 71,
    losses: 91,
    pointsFor: 668,
    pointsAgainst: 785,
    recentForm: [0, 1, 0, 0, 1],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.82,
  },
  {
    teamId: 'MIL',
    teamName: 'Milwaukee Brewers',
    sport: 'MLB',
    wins: 93,
    losses: 69,
    pointsFor: 798,
    pointsAgainst: 672,
    recentForm: [1, 1, 1, 1, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.92,
  },
  {
    teamId: 'CHC',
    teamName: 'Chicago Cubs',
    sport: 'MLB',
    wins: 83,
    losses: 79,
    pointsFor: 735,
    pointsAgainst: 728,
    recentForm: [1, 0, 1, 0, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.86,
  },
  {
    teamId: 'SD',
    teamName: 'San Diego Padres',
    sport: 'MLB',
    wins: 93,
    losses: 69,
    pointsFor: 802,
    pointsAgainst: 665,
    recentForm: [1, 1, 1, 1, 1],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.94,
  },
  {
    teamId: 'ARI',
    teamName: 'Arizona Diamondbacks',
    sport: 'MLB',
    wins: 89,
    losses: 73,
    pointsFor: 772,
    pointsAgainst: 695,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.9,
  },
  {
    teamId: 'SF',
    teamName: 'San Francisco Giants',
    sport: 'MLB',
    wins: 80,
    losses: 82,
    pointsFor: 715,
    pointsAgainst: 742,
    recentForm: [0, 1, 1, 0, 1],
    strengthOfSchedule: 0.52,
    injuryImpact: 0.85,
  },
  {
    teamId: 'PHI',
    teamName: 'Philadelphia Phillies',
    sport: 'MLB',
    wins: 95,
    losses: 67,
    pointsFor: 818,
    pointsAgainst: 675,
    recentForm: [1, 1, 1, 0, 1],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.93,
  },
  {
    teamId: 'NYM',
    teamName: 'New York Mets',
    sport: 'MLB',
    wins: 89,
    losses: 73,
    pointsFor: 775,
    pointsAgainst: 702,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.5,
    injuryImpact: 0.89,
  },
];

/**
 * Generate generic schedule for remaining games
 * In production, this would use real schedule data
 */
function generateSchedule(
  currentWins: number,
  currentLosses: number,
  totalGames: number,
  avgOpponentStrength: number = 0.5
): Schedule[] {
  const gamesPlayed = currentWins + currentLosses;
  const remainingGames = totalGames - gamesPlayed;
  const schedule: Schedule[] = [];

  for (let i = 0; i < remainingGames; i++) {
    // Vary opponent strength with some randomness
    const strengthVariation = (Math.random() - 0.5) * 0.3;
    const opponentStrength = Math.max(0.2, Math.min(0.8, avgOpponentStrength + strengthVariation));

    schedule.push({
      opponent: `Opponent ${i + 1}`,
      location: i % 3 === 0 ? 'home' : i % 3 === 1 ? 'away' : 'neutral',
      opponentStrength,
      completed: false,
    });
  }

  return schedule;
}

/**
 * Run all simulations and save results
 */
export async function runAllSimulations(): Promise<{
  sec: SimulationResult[];
  nfl: SimulationResult[];
  mlb: SimulationResult[];
}> {
  console.log('🔥 Blaze Sports Intel - Monte Carlo Simulation Engine');
  console.log('Starting 10,000 simulations per team...\n');

  // SEC Simulations (14-game regular season)
  console.log('🏈 Running SEC simulations...');
  const secSchedules = new Map<string, Schedule[]>();
  SEC_TEAMS.forEach((team) => {
    secSchedules.set(team.teamId, generateSchedule(team.wins, team.losses, 14, 0.6));
  });
  const secResults = monteCarloEngine.batchSimulate(SEC_TEAMS, secSchedules);
  console.log(`✅ Completed ${secResults.length} SEC team simulations\n`);

  // NFL Simulations (17-game regular season)
  console.log('🏈 Running NFL simulations...');
  const nflSchedules = new Map<string, Schedule[]>();
  NFL_TEAMS.forEach((team) => {
    nflSchedules.set(team.teamId, generateSchedule(team.wins, team.losses, 17, 0.5));
  });
  const nflResults = monteCarloEngine.batchSimulate(NFL_TEAMS, nflSchedules);
  console.log(`✅ Completed ${nflResults.length} NFL team simulations\n`);

  // MLB Simulations (162-game regular season)
  console.log('⚾ Running MLB simulations...');
  const mlbSchedules = new Map<string, Schedule[]>();
  MLB_TEAMS.forEach((team) => {
    mlbSchedules.set(team.teamId, generateSchedule(team.wins, team.losses, 162, 0.5));
  });
  const mlbResults = monteCarloEngine.batchSimulate(MLB_TEAMS, mlbSchedules);
  console.log(`✅ Completed ${mlbResults.length} MLB team simulations\n`);

  console.log('🎉 All simulations complete!\n');
  console.log('Summary:');
  console.log(`  SEC Teams: ${secResults.length}`);
  console.log(`  NFL Teams: ${nflResults.length}`);
  console.log(`  MLB Teams: ${mlbResults.length}`);
  console.log(
    `  Total Simulations: ${(secResults.length + nflResults.length + mlbResults.length) * 10000}`
  );

  return {
    sec: secResults,
    nfl: nflResults,
    mlb: mlbResults,
  };
}

/**
 * Format simulation results for display
 */
export function formatSimulationResult(result: SimulationResult): string {
  return `
${result.teamName} (${result.sport})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Projected Record: ${result.projectedWins}-${result.projectedLosses}
Confidence Interval: ${result.confidenceInterval.lower} - ${result.confidenceInterval.upper} wins

Probabilities:
  Playoff: ${result.playoffProbability}%
  Division: ${result.divisionWinProbability}%
  Championship: ${result.championshipProbability}%

Statistics:
  Pythagorean Exp: ${result.metadata.pythagoreanExpectation}%
  Std Deviation: ${result.metadata.standardDeviation}
  Simulations: ${result.simulations.toLocaleString()}
`;
}

// Export for use in other modules
export { SEC_TEAMS, NFL_TEAMS, MLB_TEAMS };
