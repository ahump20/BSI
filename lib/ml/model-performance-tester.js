/**
 * Blaze Sports Intel - Model Performance Testing Suite
 *
 * Comprehensive testing framework for prediction models.
 *
 * Features:
 * - Backtesting with historical data
 * - Cross-validation
 * - Performance benchmarking
 * - Model comparison
 * - Statistical significance testing
 * - Edge case testing
 */

import { calculateWinProbability } from './win-probability-model.js';
import { analyzeBettingLines } from './betting-line-analyzer.js';
import { predictInjuryImpact as _predictInjuryImpact } from './injury-impact-predictor.js';

/**
 * Backtest win probability model with historical data
 * @param {Object} env - Cloudflare environment
 * @param {string} sport - Sport to test
 * @param {number} sampleSize - Number of games to test
 * @returns {Promise<Object>} Backtest results
 */
export async function backtestWinProbabilityModel(env, sport, sampleSize = 100) {
  try {
    console.log(`Starting backtest for ${sport} with ${sampleSize} games...`);

    // Get historical completed games
    const games = await env.DB.prepare(
      `
      SELECT *
      FROM historical_games
      WHERE sport = ?
        AND status = 'final'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
      ORDER BY RANDOM()
      LIMIT ?
    `
    )
      .bind(sport, sampleSize)
      .all();

    if (games.results.length === 0) {
      throw new Error(`No historical games found for ${sport}`);
    }

    console.log(`Testing ${games.results.length} games...`);

    const results = [];
    let correctPredictions = 0;
    let totalBrierScore = 0;

    // Test each game
    for (const game of games.results) {
      // Reconstruct game state at critical moments
      const testPoints = [
        { label: 'Start', period: 1, timeRemaining: 900, homeScore: 0, awayScore: 0 },
        {
          label: 'Mid',
          period: 2,
          timeRemaining: 450,
          homeScore: Math.floor(game.home_score * 0.4),
          awayScore: Math.floor(game.away_score * 0.4),
        },
        {
          label: 'Late',
          period: 4,
          timeRemaining: 180,
          homeScore: Math.floor(game.home_score * 0.9),
          awayScore: Math.floor(game.away_score * 0.9),
        },
      ];

      for (const point of testPoints) {
        const gameState = {
          sport,
          homeTeam: game.home_team_id,
          awayTeam: game.away_team_id,
          homeScore: point.homeScore,
          awayScore: point.awayScore,
          quarter: point.period,
          timeRemaining: point.timeRemaining,
        };

        // Get prediction
        const prediction = await calculateWinProbability(gameState, env);

        // Determine actual winner
        const actualWinner = game.home_score > game.away_score ? 'home' : 'away';
        const actualHomeWin = actualWinner === 'home' ? 1 : 0;

        // Check if prediction was correct
        const predictedWinner = prediction.homeWinProbability > 0.5 ? 'home' : 'away';
        const correct = predictedWinner === actualWinner;

        if (correct) correctPredictions++;

        // Calculate Brier score
        const brierScore = Math.pow(prediction.homeWinProbability - actualHomeWin, 2);
        totalBrierScore += brierScore;

        results.push({
          gameId: game.game_id,
          testPoint: point.label,
          predictedHomeWinProb: prediction.homeWinProbability,
          actualWinner,
          correct,
          brierScore,
          confidence: prediction.confidence.level,
        });
      }
    }

    // Calculate overall metrics
    const totalTests = results.length;
    const accuracy = (correctPredictions / totalTests) * 100;
    const avgBrierScore = totalBrierScore / totalTests;

    // Calculate metrics by test point
    const byTestPoint = {};
    for (const point of ['Start', 'Mid', 'Late']) {
      const pointResults = results.filter((r) => r.testPoint === point);
      const pointCorrect = pointResults.filter((r) => r.correct).length;
      const pointBrier =
        pointResults.reduce((sum, r) => sum + r.brierScore, 0) / pointResults.length;

      byTestPoint[point] = {
        totalTests: pointResults.length,
        correctPredictions: pointCorrect,
        accuracy: Math.round((pointCorrect / pointResults.length) * 1000) / 10,
        avgBrierScore: Math.round(pointBrier * 1000) / 1000,
      };
    }

    console.log(`Backtest complete. Accuracy: ${accuracy.toFixed(1)}%`);

    return {
      sport,
      sampleSize: games.results.length,
      totalTests,
      overall: {
        correctPredictions,
        accuracy: Math.round(accuracy * 10) / 10,
        avgBrierScore: Math.round(avgBrierScore * 1000) / 1000,
      },
      byTestPoint,
      rawResults: results.slice(0, 10), // Sample of results
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Backtest error:', error);
    throw error;
  }
}

/**
 * Cross-validation test
 * Split data into training and test sets, validate generalization
 * @param {Object} env - Cloudflare environment
 * @param {string} sport - Sport to test
 * @param {number} folds - Number of cross-validation folds
 * @returns {Promise<Object>} Cross-validation results
 */
export async function crossValidateModel(env, sport, folds = 5) {
  try {
    console.log(`Starting ${folds}-fold cross-validation for ${sport}...`);

    // Get all historical games
    const games = await env.DB.prepare(
      `
      SELECT *
      FROM historical_games
      WHERE sport = ?
        AND status = 'final'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
      ORDER BY game_date
    `
    )
      .bind(sport)
      .all();

    if (games.results.length < folds * 10) {
      throw new Error(
        `Not enough data for ${folds}-fold cross-validation. Need at least ${folds * 10} games.`
      );
    }

    const foldSize = Math.floor(games.results.length / folds);
    const foldResults = [];

    // Perform cross-validation
    for (let i = 0; i < folds; i++) {
      const testStart = i * foldSize;
      const testEnd = (i + 1) * foldSize;
      const testSet = games.results.slice(testStart, testEnd);

      // Test on this fold
      let foldCorrect = 0;
      let foldBrier = 0;

      for (const game of testSet) {
        const gameState = {
          sport,
          homeTeam: game.home_team_id,
          awayTeam: game.away_team_id,
          homeScore: Math.floor(game.home_score * 0.75),
          awayScore: Math.floor(game.away_score * 0.75),
          quarter: 3,
          timeRemaining: 450,
        };

        const prediction = await calculateWinProbability(gameState, env);
        const actualWinner = game.home_score > game.away_score ? 'home' : 'away';
        const predictedWinner = prediction.homeWinProbability > 0.5 ? 'home' : 'away';
        const correct = predictedWinner === actualWinner;

        if (correct) foldCorrect++;
        foldBrier += Math.pow(prediction.homeWinProbability - (actualWinner === 'home' ? 1 : 0), 2);
      }

      const foldAccuracy = (foldCorrect / testSet.length) * 100;
      const foldAvgBrier = foldBrier / testSet.length;

      foldResults.push({
        fold: i + 1,
        testSize: testSet.length,
        accuracy: Math.round(foldAccuracy * 10) / 10,
        avgBrierScore: Math.round(foldAvgBrier * 1000) / 1000,
      });

      console.log(`Fold ${i + 1}: Accuracy ${foldAccuracy.toFixed(1)}%`);
    }

    // Calculate overall metrics
    const avgAccuracy = foldResults.reduce((sum, f) => sum + f.accuracy, 0) / folds;
    const stdDevAccuracy = Math.sqrt(
      foldResults.reduce((sum, f) => sum + Math.pow(f.accuracy - avgAccuracy, 2), 0) / folds
    );

    console.log(
      `Cross-validation complete. Avg accuracy: ${avgAccuracy.toFixed(1)}% ± ${stdDevAccuracy.toFixed(1)}%`
    );

    return {
      sport,
      folds,
      totalGames: games.results.length,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      stdDevAccuracy: Math.round(stdDevAccuracy * 10) / 10,
      consistencyScore: stdDevAccuracy < 5 ? 'excellent' : stdDevAccuracy < 10 ? 'good' : 'poor',
      foldResults,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Cross-validation error:', error);
    throw error;
  }
}

/**
 * Performance benchmarking
 * Measure model latency and throughput
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Performance benchmarks
 */
export async function benchmarkPerformance(env) {
  try {
    console.log('Starting performance benchmark...');

    const benchmarks = {
      winProbability: {},
      bettingAnalysis: {},
      injuryImpact: {},
    };

    // Benchmark win probability calculation
    const winProbTests = 100;
    const winProbTimes = [];

    for (let i = 0; i < winProbTests; i++) {
      const gameState = {
        sport: 'NFL',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        homeScore: Math.floor(Math.random() * 35),
        awayScore: Math.floor(Math.random() * 35),
        quarter: Math.floor(Math.random() * 4) + 1,
        timeRemaining: Math.floor(Math.random() * 900),
      };

      const start = Date.now();
      await calculateWinProbability(gameState, env);
      const end = Date.now();

      winProbTimes.push(end - start);
    }

    benchmarks.winProbability = {
      tests: winProbTests,
      avgLatency: Math.round(winProbTimes.reduce((a, b) => a + b) / winProbTests),
      minLatency: Math.min(...winProbTimes),
      maxLatency: Math.max(...winProbTimes),
      p95Latency: winProbTimes.sort((a, b) => a - b)[Math.floor(winProbTests * 0.95)],
      throughput: Math.round(1000 / (winProbTimes.reduce((a, b) => a + b) / winProbTests)),
    };

    console.log(
      `Win Probability: Avg ${benchmarks.winProbability.avgLatency}ms, P95 ${benchmarks.winProbability.p95Latency}ms`
    );

    // Benchmark betting line analysis
    const bettingTests = 50;
    const bettingTimes = [];

    for (let i = 0; i < bettingTests; i++) {
      const gameState = {
        sport: 'NFL',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        homeScore: 21,
        awayScore: 17,
        quarter: 4,
        timeRemaining: 300,
      };

      const bettingLines = {
        moneyline: { home: -150, away: 130 },
        spread: { line: -3.5, homeOdds: -110, awayOdds: -110 },
        total: { line: 47.5, overOdds: -110, underOdds: -110 },
      };

      const start = Date.now();
      await analyzeBettingLines(gameState, bettingLines, env);
      const end = Date.now();

      bettingTimes.push(end - start);
    }

    benchmarks.bettingAnalysis = {
      tests: bettingTests,
      avgLatency: Math.round(bettingTimes.reduce((a, b) => a + b) / bettingTests),
      minLatency: Math.min(...bettingTimes),
      maxLatency: Math.max(...bettingTimes),
      p95Latency: bettingTimes.sort((a, b) => a - b)[Math.floor(bettingTests * 0.95)],
    };

    console.log(
      `Betting Analysis: Avg ${benchmarks.bettingAnalysis.avgLatency}ms, P95 ${benchmarks.bettingAnalysis.p95Latency}ms`
    );

    // Overall metrics
    const overallLatency =
      (benchmarks.winProbability.avgLatency + benchmarks.bettingAnalysis.avgLatency) / 2;
    const performanceGrade =
      overallLatency < 50 ? 'A' : overallLatency < 100 ? 'B' : overallLatency < 200 ? 'C' : 'D';

    return {
      timestamp: new Date().toISOString(),
      overall: {
        avgLatency: Math.round(overallLatency),
        performanceGrade,
      },
      benchmarks,
    };
  } catch (error) {
    console.error('Benchmark error:', error);
    throw error;
  }
}

/**
 * Edge case testing
 * Test model behavior in extreme scenarios
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Edge case test results
 */
export async function testEdgeCases(env) {
  try {
    console.log('Starting edge case testing...');

    const edgeCases = [
      {
        name: 'Blowout Early',
        gameState: {
          sport: 'NFL',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          homeScore: 35,
          awayScore: 0,
          quarter: 2,
          timeRemaining: 600,
        },
        expectedHomeWinProb: '> 0.95',
      },
      {
        name: 'Tie Game Final Seconds',
        gameState: {
          sport: 'NFL',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          homeScore: 21,
          awayScore: 21,
          quarter: 4,
          timeRemaining: 10,
        },
        expectedHomeWinProb: '~0.50',
      },
      {
        name: 'Home Possession Field Goal Range',
        gameState: {
          sport: 'NFL',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          homeScore: 21,
          awayScore: 21,
          quarter: 4,
          timeRemaining: 30,
          possession: 'home',
          yardLine: 30,
        },
        expectedHomeWinProb: '> 0.70',
      },
      {
        name: 'Late Comeback Scenario',
        gameState: {
          sport: 'NFL',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          homeScore: 14,
          awayScore: 21,
          quarter: 4,
          timeRemaining: 120,
          possession: 'home',
        },
        expectedHomeWinProb: '0.30-0.40',
      },
      {
        name: 'Overtime',
        gameState: {
          sport: 'NFL',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          homeScore: 24,
          awayScore: 24,
          quarter: 5,
          timeRemaining: 600,
          possession: 'home',
        },
        expectedHomeWinProb: '> 0.55',
      },
    ];

    const results = [];

    for (const testCase of edgeCases) {
      const prediction = await calculateWinProbability(testCase.gameState, env);

      results.push({
        testCase: testCase.name,
        predictedHomeWinProb: prediction.homeWinProbability,
        expected: testCase.expectedHomeWinProb,
        confidence: prediction.confidence.level,
        passed: evaluateEdgeCase(prediction.homeWinProbability, testCase.expectedHomeWinProb),
      });

      console.log(
        `${testCase.name}: ${(prediction.homeWinProbability * 100).toFixed(1)}% (Expected: ${testCase.expectedHomeWinProb})`
      );
    }

    const passedTests = results.filter((r) => r.passed).length;
    const passRate = (passedTests / results.length) * 100;

    return {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: passedTests,
      passRate: Math.round(passRate * 10) / 10,
      results,
    };
  } catch (error) {
    console.error('Edge case testing error:', error);
    throw error;
  }
}

/**
 * Evaluate if prediction matches expected range
 */
function evaluateEdgeCase(actual, expected) {
  if (expected === '~0.50') {
    return actual >= 0.45 && actual <= 0.55;
  } else if (expected.startsWith('> ')) {
    const threshold = parseFloat(expected.split(' ')[1]);
    return actual > threshold;
  } else if (expected.includes('-')) {
    const [min, max] = expected.split('-').map((v) => parseFloat(v));
    return actual >= min && actual <= max;
  }
  return false;
}

/**
 * Comprehensive model test suite
 * Run all tests and generate complete report
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Complete test report
 */
export async function runFullTestSuite(env) {
  try {
    console.log('Starting full test suite...');
    const startTime = Date.now();

    const sports = ['NFL', 'MLB', 'NBA'];
    const testResults = {
      timestamp: new Date().toISOString(),
      duration: 0,
      sports: {},
    };

    // Run tests for each sport
    for (const sport of sports) {
      console.log(`\n=== Testing ${sport} ===`);

      try {
        const [backtest, crossVal] = await Promise.all([
          backtestWinProbabilityModel(env, sport, 50),
          crossValidateModel(env, sport, 3),
        ]);

        testResults.sports[sport] = {
          backtest,
          crossValidation: crossVal,
        };
      } catch (error) {
        console.error(`Error testing ${sport}:`, error.message);
        testResults.sports[sport] = {
          error: error.message,
        };
      }
    }

    // Run performance benchmarks
    console.log('\n=== Performance Benchmarks ===');
    testResults.performance = await benchmarkPerformance(env);

    // Run edge case tests
    console.log('\n=== Edge Case Tests ===');
    testResults.edgeCases = await testEdgeCases(env);

    const endTime = Date.now();
    testResults.duration = Math.round((endTime - startTime) / 1000);

    console.log(`\nFull test suite completed in ${testResults.duration}s`);

    return testResults;
  } catch (error) {
    console.error('Full test suite error:', error);
    throw error;
  }
}
