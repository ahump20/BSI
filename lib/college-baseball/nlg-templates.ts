/**
 * Natural Language Generation Templates for College Baseball
 * Automated previews and recaps for every game
 * 
 * Multilingual-safe templates with contextual data insertion
 */

import type { Game, BoxScore, Team, Standing } from './types';

/**
 * Generate a game preview based on team data and context
 */
export function generateGamePreview(game: Game, homeStanding?: Standing, awayStanding?: Standing): string {
  const { homeTeam, awayTeam, date, time, venue, conference } = game;
  
  const homeRecord = `${homeTeam.record.wins}-${homeTeam.record.losses}`;
  const awayRecord = `${awayTeam.record.wins}-${awayTeam.record.losses}`;
  
  let preview = `${awayTeam.name} (${awayRecord}) travels to face ${homeTeam.name} (${homeRecord}) `;
  preview += `at ${venue} on ${formatDate(date)} at ${time}. `;
  
  // Add conference context
  if (conference) {
    preview += `This ${conference} matchup `;
  } else {
    preview += `This matchup `;
  }
  
  // Add ranking context if available
  if (homeTeam.ranking && awayTeam.ranking) {
    preview += `features No. ${awayTeam.ranking} ${awayTeam.name} against No. ${homeTeam.ranking} ${homeTeam.name}. `;
  } else if (homeTeam.ranking) {
    preview += `pits ${awayTeam.name} against No. ${homeTeam.ranking} ${homeTeam.name}. `;
  } else if (awayTeam.ranking) {
    preview += `sees No. ${awayTeam.ranking} ${awayTeam.name} visiting ${homeTeam.name}. `;
  }
  
  // Add RPI context if available
  if (homeTeam.rpi && awayTeam.rpi) {
    const homeRpiStr = homeTeam.rpi.toFixed(4);
    const awayRpiStr = awayTeam.rpi.toFixed(4);
    preview += `${homeTeam.shortName} enters with an RPI of ${homeRpiStr}, while ${awayTeam.shortName} holds an RPI of ${awayRpiStr}. `;
  }
  
  // Add standing context
  if (homeStanding && awayStanding) {
    const homeConf = `${homeStanding.conferenceRecord.wins}-${homeStanding.conferenceRecord.losses}`;
    const awayConf = `${awayStanding.conferenceRecord.wins}-${awayStanding.conferenceRecord.losses}`;
    preview += `In conference play, ${homeTeam.shortName} is ${homeConf} and ${awayTeam.shortName} is ${awayConf}. `;
    
    // Add streak info
    if (homeStanding.streakCount > 2) {
      preview += `${homeTeam.shortName} comes in ${homeStanding.streakType === 'W' ? 'hot' : 'struggling'} `;
      preview += `with ${homeStanding.streakCount} consecutive ${homeStanding.streakType === 'W' ? 'wins' : 'losses'}. `;
    }
  }
  
  return preview.trim();
}

/**
 * Generate a game recap based on box score
 */
export function generateGameRecap(game: Game, boxScore: BoxScore): string {
  const { homeTeam, awayTeam } = boxScore;
  const winner = homeTeam.score > awayTeam.score ? homeTeam : awayTeam;
  const loser = homeTeam.score > awayTeam.score ? awayTeam : homeTeam;
  const finalScore = `${winner.score}-${loser.score}`;
  
  let recap = `${winner.team.name} defeats ${loser.team.name} ${finalScore} `;
  
  // Add location context
  if (winner.team.id === homeTeam.team.id) {
    recap += `at ${game.venue}. `;
  } else {
    recap += `on the road at ${game.venue}. `;
  }
  
  // Find top performers
  const topBatter = findTopBatter(winner.batting);
  const topPitcher = findWinningPitcher(winner.pitching);
  
  if (topBatter) {
    recap += `${topBatter.playerName} led the offense, going ${topBatter.hits}-for-${topBatter.atBats} `;
    if (topBatter.rbi > 0) {
      recap += `with ${topBatter.rbi} RBI${topBatter.rbi > 1 ? 's' : ''}`;
    }
    if (topBatter.runs > 0) {
      recap += ` and ${topBatter.runs} run${topBatter.runs > 1 ? 's' : ''} scored`;
    }
    recap += '. ';
  }
  
  if (topPitcher) {
    recap += `On the mound, ${topPitcher.playerName} earned the ${topPitcher.decision === 'W' ? 'win' : 'save'}, `;
    recap += `throwing ${topPitcher.innings} innings with ${topPitcher.strikeouts} strikeout${topPitcher.strikeouts !== 1 ? 's' : ''} `;
    recap += `and ${topPitcher.walks} walk${topPitcher.walks !== 1 ? 's' : ''}. `;
  }
  
  // Add key moments
  const bigInning = findBigInning(winner.lineScore);
  if (bigInning.runs >= 3) {
    recap += `${winner.team.shortName} broke the game open with ${bigInning.runs} runs in the ${formatInning(bigInning.inning)}. `;
  }
  
  // Add defensive context
  if (loser.errors >= 3) {
    recap += `${loser.team.shortName} committed ${loser.errors} errors in the loss. `;
  }
  
  // Add game flow if close
  const scoreDiff = Math.abs(winner.score - loser.score);
  if (scoreDiff <= 2) {
    recap += `The game was tightly contested throughout, with neither team able to pull away. `;
  } else if (scoreDiff >= 8) {
    recap += `${winner.team.shortName} dominated from start to finish in the decisive victory. `;
  }
  
  return recap.trim();
}

/**
 * Generate a quick game summary for notifications
 */
export function generateGameSummary(game: Game, boxScore: BoxScore): string {
  const { homeTeam, awayTeam } = boxScore;
  const winner = homeTeam.score > awayTeam.score ? homeTeam : awayTeam;
  const loser = homeTeam.score > awayTeam.score ? awayTeam : homeTeam;
  
  return `${winner.team.shortName} ${winner.score}, ${loser.team.shortName} ${loser.score} - Final`;
}

/**
 * Generate inning update for push notifications
 */
export function generateInningUpdate(boxScore: BoxScore): string {
  const { homeTeam, awayTeam, inning, inningHalf } = boxScore;
  
  if (inningHalf === 'end') {
    return `End of ${formatInning(inning)}: ${awayTeam.team.shortName} ${awayTeam.score}, ${homeTeam.team.shortName} ${homeTeam.score}`;
  }
  
  const battingTeam = inningHalf === 'top' ? awayTeam : homeTeam;
  return `${formatInningHalf(inningHalf)} ${formatInning(inning)}: ${awayTeam.team.shortName} ${awayTeam.score}, ${homeTeam.team.shortName} ${homeTeam.score}`;
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatInning(inning: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = inning % 100;
  return inning + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function formatInningHalf(half: 'top' | 'bottom' | 'end'): string {
  if (half === 'top') return 'Top';
  if (half === 'bottom') return 'Bottom';
  return 'End';
}

function findTopBatter(batting: any[]): any | null {
  if (!batting || batting.length === 0) return null;
  
  // Find batter with most combined hits + RBIs
  return batting.reduce((top, current) => {
    const topValue = (top.hits || 0) + (top.rbi || 0);
    const currentValue = (current.hits || 0) + (current.rbi || 0);
    return currentValue > topValue ? current : top;
  }, batting[0]);
}

function findWinningPitcher(pitching: any[]): any | null {
  if (!pitching || pitching.length === 0) return null;
  
  // Find pitcher with W or S decision
  return pitching.find(p => p.decision === 'W' || p.decision === 'S') || null;
}

function findBigInning(lineScore: number[]): { inning: number; runs: number } {
  let maxRuns = 0;
  let maxInning = 0;
  
  lineScore.forEach((runs, index) => {
    if (runs > maxRuns) {
      maxRuns = runs;
      maxInning = index + 1;
    }
  });
  
  return { inning: maxInning, runs: maxRuns };
}

/**
 * Generate conference standings summary
 */
export function generateStandingsSummary(conference: string, standings: Standing[]): string {
  if (!standings || standings.length === 0) return '';
  
  const leader = standings[0];
  const summary = `${leader.team.name} leads the ${conference} with a ${leader.conferenceRecord.wins}-${leader.conferenceRecord.losses} conference record. `;
  
  if (standings.length > 1) {
    const second = standings[1];
    const gamesBehind = leader.conferenceRecord.wins - second.conferenceRecord.wins;
    if (gamesBehind > 0) {
      return summary + `${second.team.shortName} trails by ${gamesBehind} game${gamesBehind > 1 ? 's' : ''}.`;
    }
  }
  
  return summary;
}
