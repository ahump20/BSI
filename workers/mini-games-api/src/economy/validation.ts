import type { MatchResult } from '../types';

const MAX_COINS_PER_MATCH = 200;
const MAX_XP_PER_MATCH = 500;

interface EarningsBreakdown {
  coins: number;
  xp: number;
  reasons: string[];
}

export function validateMatchResult(result: MatchResult): string | null {
  if (!result.deviceId || typeof result.deviceId !== 'string') return 'Missing deviceId';
  if (typeof result.unitsKilled !== 'number' || result.unitsKilled < 0) return 'Invalid unitsKilled';
  if (typeof result.buildingsDestroyed !== 'number' || result.buildingsDestroyed < 0) return 'Invalid buildingsDestroyed';
  if (typeof result.resourcesGathered !== 'number' || result.resourcesGathered < 0) return 'Invalid resourcesGathered';
  if (typeof result.matchDurationSec !== 'number' || result.matchDurationSec < 0) return 'Invalid matchDurationSec';
  if (typeof result.victory !== 'boolean') return 'Invalid victory';

  // Anti-cheat bounds
  if (result.unitsKilled > 500) return 'unitsKilled exceeds maximum';
  if (result.buildingsDestroyed > 100) return 'buildingsDestroyed exceeds maximum';
  if (result.resourcesGathered > 50000) return 'resourcesGathered exceeds maximum';
  if (result.matchDurationSec > 3600) return 'matchDurationSec exceeds maximum';

  return null;
}

export function calculateEarnings(result: MatchResult): EarningsBreakdown {
  let coins = 0;
  let xp = 0;
  const reasons: string[] = [];

  // Base completion
  coins += 10;
  xp += 25;
  reasons.push('match_completion');

  // Per unit killed
  coins += result.unitsKilled * 2;
  xp += result.unitsKilled * 5;
  if (result.unitsKilled > 0) reasons.push(`${result.unitsKilled}_kills`);

  // Per building destroyed
  coins += result.buildingsDestroyed * 5;
  xp += result.buildingsDestroyed * 15;
  if (result.buildingsDestroyed > 0) reasons.push(`${result.buildingsDestroyed}_buildings`);

  // Victory bonus
  if (result.victory) {
    coins += 25;
    xp += 50;
    reasons.push('victory');
  }

  // Resources gathered (per 500)
  const resourceBonusUnits = Math.floor(result.resourcesGathered / 500);
  coins += resourceBonusUnits * 1;
  xp += resourceBonusUnits * 3;
  if (resourceBonusUnits > 0) reasons.push(`${resourceBonusUnits}x500_resources`);

  // Long match bonus (>5 min)
  if (result.matchDurationSec > 300) {
    coins += 5;
    xp += 10;
    reasons.push('long_match');
  }

  // Apply caps
  coins = Math.min(coins, MAX_COINS_PER_MATCH);
  xp = Math.min(xp, MAX_XP_PER_MATCH);

  return { coins, xp, reasons };
}
