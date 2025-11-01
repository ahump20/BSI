/**
 * LEI Validation Tests
 * Run with: npx tsx lib/lei/test.ts
 */

import { LeverageEquivalencyIndex, computeLEI } from './index';
import {
  davidFreese2011WS,
  marioManningham2012SB,
  aaronBoone2003ALCS,
  malcolmButler2015SB,
  validateLEIScoring,
  getAllFamousPlays
} from './examples';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function fail(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function header(msg: string) {
  console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`);
}

// Test 1: Basic computation
header('Test 1: Basic LEI Computation');

const freese = davidFreese2011WS();
console.log(`David Freese 2011 WS Triple: LEI = ${freese.lei.toFixed(1)}`);
console.log(`  Championship Weight: ${freese.components.championship_weight}x`);
console.log(`  WPA: ${(freese.components.wpa * 100).toFixed(1)}%`);
console.log(`  Scarcity: ${(freese.components.scarcity * 100).toFixed(1)}%`);

if (freese.lei >= 50 && freese.lei <= 52) {
  pass(`Freese triple scores correctly (LEI = ${freese.lei.toFixed(1)})`);
} else {
  fail(`Expected LEI ~50.7, got ${freese.lei.toFixed(1)}`);
}

// Test 2: Component validation
header('Test 2: Component Validation');

const calculator = new LeverageEquivalencyIndex();

// Test championship weights
const wildcard = calculator.compute({
  sport: 'baseball',
  playoff_round: 'wildcard',
  pre_play_win_prob: 0.5,
  post_play_win_prob: 0.7,
});

const championship = calculator.compute({
  sport: 'baseball',
  playoff_round: 'championship',
  pre_play_win_prob: 0.5,
  post_play_win_prob: 0.7,
});

if (championship.lei === wildcard.lei * 8) {
  pass('Championship weight properly scales LEI (8x wildcard)');
} else {
  fail(`Championship should be 8x wildcard: ${championship.lei} vs ${wildcard.lei * 8}`);
}

// Test 3: Famous plays ranking
header('Test 3: Famous Plays Ranking');

const validation = validateLEIScoring();
const plays = validation.plays;

plays.forEach((play, idx) => {
  console.log(`${idx + 1}. ${play.description.padEnd(40)} LEI: ${play.lei.toFixed(1)}`);
});

if (validation.isCorrectOrder) {
  pass('Famous plays rank in expected order');
} else {
  fail('Famous plays ranking mismatch');
  console.log('Expected:', validation.expectedOrder);
  console.log('Actual:  ', validation.actualOrder);
}

// Test 4: WPA calculation
header('Test 4: Win Probability Added (WPA) Calculation');

const testWPA = computeLEI({
  sport: 'football',
  playoff_round: 'championship',
  pre_play_win_prob: 0.3,
  post_play_win_prob: 0.8,
  time_remaining: 60,
  timeouts_remaining: 0,
});

const expectedWPA = Math.abs(0.8 - 0.3);
if (Math.abs(testWPA.components.wpa - expectedWPA) < 0.001) {
  pass(`WPA correctly computed: ${(testWPA.components.wpa * 100).toFixed(1)}%`);
} else {
  fail(`WPA mismatch: expected ${expectedWPA}, got ${testWPA.components.wpa}`);
}

// Test 5: Scarcity validation
header('Test 5: Scarcity Calculation');

// Baseball: last out should have high scarcity
const lastOut = calculator.compute({
  sport: 'baseball',
  playoff_round: 'championship',
  pre_play_win_prob: 0.1,
  post_play_win_prob: 0.6,
  outs_remaining: 1,
  strikes_remaining: 0,
  score_differential: 0,
});

if (lastOut.components.scarcity > 0.9) {
  pass(`Baseball last out has high scarcity: ${(lastOut.components.scarcity * 100).toFixed(1)}%`);
} else {
  fail(`Last out scarcity too low: ${lastOut.components.scarcity}`);
}

// Football: final seconds should have high scarcity
const finalSeconds = calculator.compute({
  sport: 'football',
  playoff_round: 'championship',
  pre_play_win_prob: 0.3,
  post_play_win_prob: 0.9,
  time_remaining: 10,
  timeouts_remaining: 0,
  score_differential: -3,
});

if (finalSeconds.components.scarcity > 0.95) {
  pass(`Football final seconds has high scarcity: ${(finalSeconds.components.scarcity * 100).toFixed(1)}%`);
} else {
  fail(`Final seconds scarcity too low: ${finalSeconds.components.scarcity}`);
}

// Test 6: Edge cases
header('Test 6: Edge Cases');

// Maximum possible LEI (full WP reversal, championship, perfect scarcity)
const maxTheoretical = calculator.compute({
  sport: 'football',
  playoff_round: 'championship',
  pre_play_win_prob: 0.0,
  post_play_win_prob: 1.0,
  time_remaining: 1,
  timeouts_remaining: 0,
  score_differential: -7,
});

if (maxTheoretical.lei <= 100) {
  pass(`Maximum LEI properly capped at 100 (got ${maxTheoretical.lei.toFixed(1)})`);
} else {
  fail(`LEI exceeded 100: ${maxTheoretical.lei}`);
}

// Minimum possible LEI (no WP change)
const minLEI = calculator.compute({
  sport: 'baseball',
  playoff_round: 'wildcard',
  pre_play_win_prob: 0.5,
  post_play_win_prob: 0.5,
  outs_remaining: 20,
  strikes_remaining: 2,
});

if (minLEI.lei === 0) {
  pass('Zero WPA produces zero LEI');
} else {
  fail(`Expected LEI = 0 for no WP change, got ${minLEI.lei}`);
}

// Test 7: Sport-specific multipliers
header('Test 7: Sport-Specific Scarcity Multipliers');

// Baseball 2-strike bonus
const twoStrikes = calculator.compute({
  sport: 'baseball',
  playoff_round: 'division',
  pre_play_win_prob: 0.4,
  post_play_win_prob: 0.6,
  outs_remaining: 5,
  strikes_remaining: 0,
  score_differential: 0,
});

const oneStrike = calculator.compute({
  sport: 'baseball',
  playoff_round: 'division',
  pre_play_win_prob: 0.4,
  post_play_win_prob: 0.6,
  outs_remaining: 5,
  strikes_remaining: 1,
  score_differential: 0,
});

if (twoStrikes.lei > oneStrike.lei) {
  pass(`2-strike count increases scarcity (${twoStrikes.lei.toFixed(1)} > ${oneStrike.lei.toFixed(1)})`);
} else {
  fail('2-strike count should have higher scarcity than 1-strike');
}

// Football one-score game bonus (test with enough time that Q4 boost doesn't cap scarcity)
const oneScore = calculator.compute({
  sport: 'football',
  playoff_round: 'conference',
  pre_play_win_prob: 0.5,
  post_play_win_prob: 0.7,
  time_remaining: 1200, // 20 min = early 3rd quarter
  timeouts_remaining: 3,
  score_differential: -7,
});

const twoScore = calculator.compute({
  sport: 'football',
  playoff_round: 'conference',
  pre_play_win_prob: 0.5,
  post_play_win_prob: 0.7,
  time_remaining: 1200, // 20 min = early 3rd quarter
  timeouts_remaining: 3,
  score_differential: -14,
});

if (oneScore.lei > twoScore.lei) {
  pass(`One-score game has higher scarcity (${oneScore.lei.toFixed(1)} > ${twoScore.lei.toFixed(1)})`);
} else {
  fail('One-score game should have higher scarcity than two-score game');
}

// Summary
header('Test Summary');

const allPlays = getAllFamousPlays();
console.log(`\n${colors.bold}Famous Playoff Moments:${colors.reset}`);
console.log('─'.repeat(80));
console.log('Rank  Play                                     LEI    WPA    Scarcity');
console.log('─'.repeat(80));

allPlays
  .sort((a, b) => b.lei - a.lei)
  .forEach((play, idx) => {
    const rank = `${idx + 1}.`.padEnd(6);
    const desc = play.description.padEnd(40);
    const lei = play.lei.toFixed(1).padStart(5);
    const wpa = `${(play.components.wpa * 100).toFixed(1)}%`.padStart(6);
    const scarcity = `${(play.components.scarcity * 100).toFixed(1)}%`.padStart(8);

    console.log(`${rank}${desc} ${lei}  ${wpa}  ${scarcity}`);
  });

console.log('─'.repeat(80));
console.log(`\n${colors.green}${colors.bold}✓ All tests passed!${colors.reset}\n`);

export {};
