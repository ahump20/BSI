#!/usr/bin/env node
/**
 * Blaze Sports Intel - Monte Carlo Simulation Generator
 *
 * Generates simulation results for all SEC, NFL, and MLB teams
 * Saves results to JSON files for dashboard consumption
 *
 * Usage: node scripts/generate-simulations.js
 */

const fs = require('fs');
const path = require('path');

// Since we can't directly import TypeScript in Node, we'll implement the core logic here
// This is a JavaScript implementation of the Monte Carlo engine

class MonteCarloEngine {
  constructor() {
    this.SIMULATIONS = 10000;
    this.SPORT_EXPONENTS = {
      SEC: 2.37,
      NFL: 2.37,
      MLB: 1.83,
    };
    this.HOME_ADVANTAGE = {
      SEC: 0.08,
      NFL: 0.06,
      MLB: 0.04,
    };
  }

  calculatePythagoreanExpectation(pointsFor, pointsAgainst, sport) {
    const exponent = this.SPORT_EXPONENTS[sport];
    if (pointsFor === 0 && pointsAgainst === 0) return 0.5;

    const numerator = Math.pow(pointsFor, exponent);
    const denominator = numerator + Math.pow(pointsAgainst, exponent);
    return numerator / denominator;
  }

  calculateFormFactor(recentForm) {
    if (!recentForm || recentForm.length === 0) return 1.0;

    let totalWeight = 0;
    let weightedSum = 0;

    recentForm.forEach((result, index) => {
      const weight = Math.pow(1.5, index);
      weightedSum += result * weight;
      totalWeight += weight;
    });

    const formPct = weightedSum / totalWeight;
    return 0.9 + formPct * 0.2;
  }

  calculateGameWinProbability(teamStats, opponent) {
    let winProbability = this.calculatePythagoreanExpectation(
      teamStats.pointsFor,
      teamStats.pointsAgainst,
      teamStats.sport
    );

    const opponentAdjustment = (1 - opponent.opponentStrength) * 0.3;
    winProbability += opponentAdjustment;

    if (opponent.location === 'home') {
      winProbability += this.HOME_ADVANTAGE[teamStats.sport];
    } else if (opponent.location === 'away') {
      winProbability -= this.HOME_ADVANTAGE[teamStats.sport];
    }

    const formFactor = this.calculateFormFactor(teamStats.recentForm);
    winProbability *= formFactor;

    if (teamStats.injuryImpact !== undefined) {
      winProbability *= teamStats.injuryImpact;
    }

    if (teamStats.strengthOfSchedule !== undefined) {
      const sosAdjustment = (0.5 - teamStats.strengthOfSchedule) * 0.1;
      winProbability += sosAdjustment;
    }

    return Math.max(0.05, Math.min(0.95, winProbability));
  }

  simulateSeason(teamStats, schedule) {
    let wins = teamStats.wins;
    const remainingGames = schedule.filter((game) => !game.completed);

    remainingGames.forEach((game) => {
      const winProbability = this.calculateGameWinProbability(teamStats, game);
      if (Math.random() < winProbability) {
        wins++;
      }
    });

    return wins;
  }

  simulate(teamStats, schedule, simulations = this.SIMULATIONS) {
    const totalGames =
      teamStats.wins + teamStats.losses + schedule.filter((g) => !g.completed).length;

    const winCounts = new Array(totalGames + 1).fill(0);
    let totalWins = 0;
    const allWins = [];

    for (let i = 0; i < simulations; i++) {
      const seasonWins = this.simulateSeason(teamStats, schedule);
      winCounts[seasonWins]++;
      totalWins += seasonWins;
      allWins.push(seasonWins);
    }

    const winDistribution = winCounts.map((count) => count / simulations);
    const projectedWins = totalWins / simulations;
    const projectedLosses = totalGames - projectedWins;

    allWins.sort((a, b) => a - b);
    const percentile = (p) => {
      const index = Math.floor(simulations * p);
      return allWins[index];
    };

    const variance =
      allWins.reduce((sum, wins) => {
        return sum + Math.pow(wins - projectedWins, 2);
      }, 0) / simulations;
    const standardDeviation = Math.sqrt(variance);

    const PLAYOFF_THRESHOLDS = {
      SEC: totalGames * 0.75,
      NFL: totalGames * 0.5625,
      MLB: totalGames * 0.525,
    };

    const CHAMPIONSHIP_THRESHOLDS = {
      SEC: totalGames * 0.85,
      NFL: totalGames * 0.75,
      MLB: totalGames * 0.6,
    };

    const playoffThreshold = PLAYOFF_THRESHOLDS[teamStats.sport];
    const divisionThreshold = totalGames * 0.65;
    const championshipThreshold = CHAMPIONSHIP_THRESHOLDS[teamStats.sport];

    let playoffProb = 0;
    let divisionProb = 0;
    let championshipProb = 0;

    winDistribution.forEach((probability, wins) => {
      if (wins >= playoffThreshold) playoffProb += probability;
      if (wins >= divisionThreshold) divisionProb += probability;
      if (wins >= championshipThreshold) championshipProb += probability;
    });

    const pythagoreanExpectation = this.calculatePythagoreanExpectation(
      teamStats.pointsFor,
      teamStats.pointsAgainst,
      teamStats.sport
    );

    return {
      teamId: teamStats.teamId,
      teamName: teamStats.teamName,
      sport: teamStats.sport,
      simulations,
      projectedWins: Math.round(projectedWins * 10) / 10,
      projectedLosses: Math.round(projectedLosses * 10) / 10,
      winDistribution,
      playoffProbability: Math.round(playoffProb * 1000) / 10,
      divisionWinProbability: Math.round(divisionProb * 1000) / 10,
      championshipProbability: Math.round(championshipProb * 1000) / 10,
      confidenceInterval: {
        lower: percentile(0.05),
        median: percentile(0.5),
        upper: percentile(0.95),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        pythagoreanExpectation: Math.round(pythagoreanExpectation * 1000) / 10,
        averageWinProbability: Math.round(pythagoreanExpectation * 100 * 10) / 10,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
      },
    };
  }
}

function generateSchedule(currentWins, currentLosses, totalGames, avgOpponentStrength = 0.5) {
  const gamesPlayed = currentWins + currentLosses;
  const remainingGames = totalGames - gamesPlayed;
  const schedule = [];

  for (let i = 0; i < remainingGames; i++) {
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

// Team data
const SEC_TEAMS = [
  {
    teamId: 'TEXAS',
    teamName: 'Texas Longhorns',
    sport: 'SEC',
    wins: 11,
    losses: 2,
    pointsFor: 438,
    pointsAgainst: 295,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.62,
    injuryImpact: 0.95,
  },
  {
    teamId: 'ALA',
    teamName: 'Alabama Crimson Tide',
    sport: 'SEC',
    wins: 10,
    losses: 3,
    pointsFor: 412,
    pointsAgainst: 278,
    recentForm: [1, 1, 1, 0, 1],
    strengthOfSchedule: 0.65,
    injuryImpact: 0.92,
  },
  {
    teamId: 'UGA',
    teamName: 'Georgia Bulldogs',
    sport: 'SEC',
    wins: 11,
    losses: 2,
    pointsFor: 445,
    pointsAgainst: 215,
    recentForm: [1, 1, 1, 1, 0],
    strengthOfSchedule: 0.68,
    injuryImpact: 0.98,
  },
  {
    teamId: 'LSU',
    teamName: 'LSU Tigers',
    sport: 'SEC',
    wins: 9,
    losses: 4,
    pointsFor: 389,
    pointsAgainst: 312,
    recentForm: [1, 0, 1, 1, 0],
    strengthOfSchedule: 0.59,
    injuryImpact: 0.88,
  },
  {
    teamId: 'TENN',
    teamName: 'Tennessee Volunteers',
    sport: 'SEC',
    wins: 10,
    losses: 3,
    pointsFor: 425,
    pointsAgainst: 268,
    recentForm: [1, 1, 1, 1, 0],
    strengthOfSchedule: 0.61,
    injuryImpact: 0.94,
  },
  {
    teamId: 'OLE',
    teamName: 'Ole Miss Rebels',
    sport: 'SEC',
    wins: 9,
    losses: 4,
    pointsFor: 398,
    pointsAgainst: 289,
    recentForm: [1, 1, 0, 1, 1],
    strengthOfSchedule: 0.58,
    injuryImpact: 0.91,
  },
  {
    teamId: 'MO',
    teamName: 'Missouri Tigers',
    sport: 'SEC',
    wins: 8,
    losses: 4,
    pointsFor: 356,
    pointsAgainst: 298,
    recentForm: [1, 0, 1, 1, 0],
    strengthOfSchedule: 0.56,
    injuryImpact: 0.89,
  },
  {
    teamId: 'TAMU',
    teamName: 'Texas A&M Aggies',
    sport: 'SEC',
    wins: 8,
    losses: 5,
    pointsFor: 342,
    pointsAgainst: 315,
    recentForm: [0, 1, 1, 0, 1],
    strengthOfSchedule: 0.63,
    injuryImpact: 0.86,
  },
  {
    teamId: 'SC',
    teamName: 'South Carolina Gamecocks',
    sport: 'SEC',
    wins: 7,
    losses: 5,
    pointsFor: 328,
    pointsAgainst: 302,
    recentForm: [1, 1, 0, 0, 1],
    strengthOfSchedule: 0.55,
    injuryImpact: 0.9,
  },
  {
    teamId: 'FLA',
    teamName: 'Florida Gators',
    sport: 'SEC',
    wins: 7,
    losses: 6,
    pointsFor: 312,
    pointsAgainst: 325,
    recentForm: [0, 1, 0, 1, 1],
    strengthOfSchedule: 0.6,
    injuryImpact: 0.85,
  },
  {
    teamId: 'ARK',
    teamName: 'Arkansas Razorbacks',
    sport: 'SEC',
    wins: 6,
    losses: 6,
    pointsFor: 295,
    pointsAgainst: 318,
    recentForm: [0, 1, 0, 1, 0],
    strengthOfSchedule: 0.57,
    injuryImpact: 0.87,
  },
  {
    teamId: 'AUB',
    teamName: 'Auburn Tigers',
    sport: 'SEC',
    wins: 5,
    losses: 7,
    pointsFor: 278,
    pointsAgainst: 342,
    recentForm: [0, 0, 1, 0, 1],
    strengthOfSchedule: 0.61,
    injuryImpact: 0.82,
  },
  {
    teamId: 'UK',
    teamName: 'Kentucky Wildcats',
    sport: 'SEC',
    wins: 4,
    losses: 8,
    pointsFor: 252,
    pointsAgainst: 356,
    recentForm: [0, 0, 1, 0, 0],
    strengthOfSchedule: 0.58,
    injuryImpact: 0.8,
  },
  {
    teamId: 'MISS',
    teamName: 'Mississippi State Bulldogs',
    sport: 'SEC',
    wins: 3,
    losses: 9,
    pointsFor: 235,
    pointsAgainst: 389,
    recentForm: [0, 0, 0, 1, 0],
    strengthOfSchedule: 0.59,
    injuryImpact: 0.78,
  },
  {
    teamId: 'VAN',
    teamName: 'Vanderbilt Commodores',
    sport: 'SEC',
    wins: 2,
    losses: 10,
    pointsFor: 218,
    pointsAgainst: 412,
    recentForm: [0, 0, 0, 0, 1],
    strengthOfSchedule: 0.62,
    injuryImpact: 0.75,
  },
];

const NFL_TEAMS = [
  {
    teamId: 'KC',
    teamName: 'Kansas City Chiefs',
    sport: 'NFL',
    wins: 3,
    losses: 1,
    pointsFor: 88,
    pointsAgainst: 71,
    recentForm: [1, 1, 0, 1],
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
    pointsFor: 115,
    pointsAgainst: 89,
    recentForm: [1, 1, 1, 0],
    strengthOfSchedule: 0.49,
    injuryImpact: 0.92,
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
    pointsFor: 114,
    pointsAgainst: 132,
    recentForm: [0, 1, 0],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.85,
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
    wins: 4,
    losses: 0,
    pointsFor: 120,
    pointsAgainst: 85,
    recentForm: [1, 1, 1, 1],
    strengthOfSchedule: 0.48,
    injuryImpact: 0.95,
  },
  {
    teamId: 'GB',
    teamName: 'Green Bay Packers',
    sport: 'NFL',
    wins: 2,
    losses: 1,
    pointsFor: 89,
    pointsAgainst: 78,
    recentForm: [1, 0, 1],
    strengthOfSchedule: 0.51,
    injuryImpact: 0.9,
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

const MLB_TEAMS = [
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

// Main execution
async function main() {
  console.log('🔥 Blaze Sports Intel - Monte Carlo Simulation Engine\n');
  console.log('Starting 10,000 simulations per team...\n');

  const engine = new MonteCarloEngine();
  const results = {
    sec: [],
    nfl: [],
    mlb: [],
    metadata: {
      generated: new Date().toISOString(),
      totalSimulations: 0,
      version: '1.0.0',
    },
  };

  // SEC Simulations
  console.log('🏈 Running SEC simulations...');
  SEC_TEAMS.forEach((team) => {
    const schedule = generateSchedule(team.wins, team.losses, 14, 0.6);
    const result = engine.simulate(team, schedule);
    results.sec.push(result);
    console.log(
      `  ✓ ${team.teamName}: ${result.projectedWins}-${result.projectedLosses} (Playoff: ${result.playoffProbability}%)`
    );
  });
  console.log(`✅ Completed ${results.sec.length} SEC team simulations\n`);

  // NFL Simulations
  console.log('🏈 Running NFL simulations...');
  NFL_TEAMS.forEach((team) => {
    const schedule = generateSchedule(team.wins, team.losses, 17, 0.5);
    const result = engine.simulate(team, schedule);
    results.nfl.push(result);
    console.log(
      `  ✓ ${team.teamName}: ${result.projectedWins}-${result.projectedLosses} (Playoff: ${result.playoffProbability}%)`
    );
  });
  console.log(`✅ Completed ${results.nfl.length} NFL team simulations\n`);

  // MLB Simulations
  console.log('⚾ Running MLB simulations...');
  MLB_TEAMS.forEach((team) => {
    const schedule = generateSchedule(team.wins, team.losses, 162, 0.5);
    const result = engine.simulate(team, schedule);
    results.mlb.push(result);
    console.log(
      `  ✓ ${team.teamName}: ${result.projectedWins}-${result.projectedLosses} (Playoff: ${result.playoffProbability}%)`
    );
  });
  console.log(`✅ Completed ${results.mlb.length} MLB team simulations\n`);

  results.metadata.totalSimulations =
    (results.sec.length + results.nfl.length + results.mlb.length) * 10000;

  // Save results
  const dataDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'monte-carlo-simulations.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('🎉 All simulations complete!\n');
  console.log('Summary:');
  console.log(`  SEC Teams: ${results.sec.length}`);
  console.log(`  NFL Teams: ${results.nfl.length}`);
  console.log(`  MLB Teams: ${results.mlb.length}`);
  console.log(`  Total Simulations: ${results.metadata.totalSimulations.toLocaleString()}`);
  console.log(`\n📁 Results saved to: public/data/monte-carlo-simulations.json`);
}

main().catch(console.error);
