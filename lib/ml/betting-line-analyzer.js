/**
 * Blaze Sports Intel - Betting Line Analyzer
 *
 * Analyzes betting lines for value opportunities by comparing
 * market odds with model predictions.
 *
 * Features:
 * - Line value calculation (model vs market)
 * - Kelly Criterion for optimal bet sizing
 * - Historical line movement tracking
 * - Sharp money detection
 * - Closing line value (CLV) analysis
 *
 * DISCLAIMER: For educational and analytical purposes only.
 * Not financial advice. Gambling involves risk.
 */

import { calculateWinProbability } from './win-probability-model.js';

/**
 * Analyze betting line value for a game
 * @param {Object} gameState - Current game state
 * @param {Object} bettingLines - Market betting lines
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Line analysis with value opportunities
 */
export async function analyzeBettingLines(gameState, bettingLines, env) {
  const { sport, homeTeam, awayTeam } = gameState;

  try {
    // Get model's win probability
    const modelProb = await calculateWinProbability(gameState, env);

    // Analyze different bet types
    const moneylineAnalysis = analyzeMoneyline(modelProb, bettingLines.moneyline);
    const spreadAnalysis = analyzeSpread(modelProb, bettingLines.spread, sport);
    const totalAnalysis = analyzeTotal(gameState, bettingLines.total, env);

    // Calculate overall edge
    const bestOpportunity = identifyBestOpportunity([
      moneylineAnalysis,
      spreadAnalysis,
      totalAnalysis
    ]);

    return {
      sport,
      homeTeam,
      awayTeam,
      modelProbability: {
        home: modelProb.homeWinProbability,
        away: modelProb.awayWinProbability,
        confidence: modelProb.confidence.level
      },
      marketLines: bettingLines,
      analysis: {
        moneyline: moneylineAnalysis,
        spread: spreadAnalysis,
        total: totalAnalysis
      },
      bestOpportunity,
      disclaimer: 'For educational and analytical purposes only. Not financial advice.',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago'
    };

  } catch (error) {
    console.error('Betting line analysis error:', error);
    throw error;
  }
}

/**
 * Analyze moneyline value
 */
function analyzeMoneyline(modelProb, moneyline) {
  if (!moneyline || !moneyline.home || !moneyline.away) {
    return { available: false };
  }

  // Convert American odds to implied probability
  const homeImpliedProb = oddsToImpliedProbability(moneyline.home);
  const awayImpliedProb = oddsToImpliedProbability(moneyline.away);

  // Calculate vig (bookmaker margin)
  const vig = (homeImpliedProb + awayImpliedProb - 1) * 100;

  // Calculate fair odds (removing vig)
  const homeFairProb = homeImpliedProb / (homeImpliedProb + awayImpliedProb);
  const awayFairProb = awayImpliedProb / (homeImpliedProb + awayImpliedProb);

  // Calculate edge (model probability vs fair market probability)
  const homeEdge = modelProb.homeWinProbability - homeFairProb;
  const awayEdge = modelProb.awayWinProbability - awayFairProb;

  // Kelly Criterion for optimal bet sizing (use fractional Kelly for safety)
  const fractionalKelly = 0.25; // 1/4 Kelly for conservative bankroll management
  const homeKelly = homeEdge > 0 ?
    fractionalKelly * ((modelProb.homeWinProbability * (moneyline.home / 100 + 1) - 1) / (moneyline.home / 100)) : 0;
  const awayKelly = awayEdge > 0 ?
    fractionalKelly * ((modelProb.awayWinProbability * (Math.abs(moneyline.away) / 100 + 1) - 1) / (Math.abs(moneyline.away) / 100)) : 0;

  // Identify value opportunities (edge > 5%)
  const homeValue = homeEdge > 0.05;
  const awayValue = awayEdge > 0.05;

  return {
    available: true,
    type: 'moneyline',
    vig: Math.round(vig * 100) / 100,
    home: {
      odds: moneyline.home,
      impliedProbability: Math.round(homeImpliedProb * 100) / 100,
      fairProbability: Math.round(homeFairProb * 100) / 100,
      modelProbability: Math.round(modelProb.homeWinProbability * 100) / 100,
      edge: Math.round(homeEdge * 100) / 100,
      hasValue: homeValue,
      kellyCriterion: Math.max(0, Math.round(homeKelly * 1000) / 10), // As % of bankroll
      recommendation: homeValue ? 'bet' : 'pass'
    },
    away: {
      odds: moneyline.away,
      impliedProbability: Math.round(awayImpliedProb * 100) / 100,
      fairProbability: Math.round(awayFairProb * 100) / 100,
      modelProbability: Math.round(modelProb.awayWinProbability * 100) / 100,
      edge: Math.round(awayEdge * 100) / 100,
      hasValue: awayValue,
      kellyCriterion: Math.max(0, Math.round(awayKelly * 1000) / 10),
      recommendation: awayValue ? 'bet' : 'pass'
    },
    bestSide: homeEdge > awayEdge ? 'home' : 'away',
    maxEdge: Math.max(homeEdge, awayEdge)
  };
}

/**
 * Analyze point spread value
 */
function analyzeSpread(modelProb, spread, sport) {
  if (!spread || spread.line === undefined) {
    return { available: false };
  }

  // Estimate probability of covering spread using win probability
  // and historical spread cover rates

  // For NFL: home teams cover ~50% when favored by 3, ~55% when favored by 7+
  // For MLB: spreads are run lines (typically ±1.5)
  // For NBA: larger spreads, higher variance

  const spreadLine = spread.line; // Negative means home favored
  const isFavorite = spreadLine < 0;
  const spreadMagnitude = Math.abs(spreadLine);

  // Sport-specific spread impact on win probability
  let spreadAdjustment;
  switch (sport.toUpperCase()) {
    case 'NFL':
    case 'NCAA_FOOTBALL':
      // Each point of spread ≈ 3% win probability
      spreadAdjustment = spreadLine * 0.03;
      break;
    case 'MLB':
    case 'NCAA_BASEBALL':
      // Run line (usually 1.5) ≈ 30% win probability
      spreadAdjustment = spreadLine * 0.20;
      break;
    case 'NBA':
    case 'NCAA_BASKETBALL':
      // Each point ≈ 2.5% win probability
      spreadAdjustment = spreadLine * 0.025;
      break;
    default:
      spreadAdjustment = spreadLine * 0.03;
  }

  // Adjust model probability for spread
  const homeSpreadProb = Math.max(0, Math.min(1,
    modelProb.homeWinProbability + spreadAdjustment
  ));
  const awaySpreadProb = 1 - homeSpreadProb;

  // Convert spread odds to implied probability
  const homeImpliedProb = oddsToImpliedProbability(spread.homeOdds || -110);
  const awayImpliedProb = oddsToImpliedProbability(spread.awayOdds || -110);

  // Calculate edge
  const homeEdge = homeSpreadProb - homeImpliedProb;
  const awayEdge = awaySpreadProb - awayImpliedProb;

  return {
    available: true,
    type: 'spread',
    line: spreadLine,
    home: {
      line: spreadLine,
      odds: spread.homeOdds || -110,
      impliedProbability: Math.round(homeImpliedProb * 100) / 100,
      modelProbability: Math.round(homeSpreadProb * 100) / 100,
      edge: Math.round(homeEdge * 100) / 100,
      hasValue: homeEdge > 0.05,
      recommendation: homeEdge > 0.05 ? 'bet' : 'pass'
    },
    away: {
      line: -spreadLine,
      odds: spread.awayOdds || -110,
      impliedProbability: Math.round(awayImpliedProb * 100) / 100,
      modelProbability: Math.round(awaySpreadProb * 100) / 100,
      edge: Math.round(awayEdge * 100) / 100,
      hasValue: awayEdge > 0.05,
      recommendation: awayEdge > 0.05 ? 'bet' : 'pass'
    },
    bestSide: homeEdge > awayEdge ? 'home' : 'away',
    maxEdge: Math.max(homeEdge, awayEdge)
  };
}

/**
 * Analyze over/under total value
 */
async function analyzeTotal(gameState, total, env) {
  if (!total || total.line === undefined) {
    return { available: false };
  }

  // Get team offensive/defensive ratings
  const [homeOffense, homeDefense, awayOffense, awayDefense] = await Promise.all([
    getTeamOffensiveRating(env, gameState.homeTeam, gameState.sport),
    getTeamDefensiveRating(env, gameState.homeTeam, gameState.sport),
    getTeamOffensiveRating(env, awayTeam, gameState.sport),
    getTeamDefensiveRating(env, awayTeam, gameState.sport)
  ]);

  // Project total score (simplified model)
  const homeProjectedScore = (homeOffense + awayDefense) / 2;
  const awayProjectedScore = (awayOffense + homeDefense) / 2;
  const projectedTotal = homeProjectedScore + awayProjectedScore;

  // Calculate edge on total
  const overEdge = projectedTotal - total.line;
  const underEdge = total.line - projectedTotal;

  // Convert odds to implied probability
  const overImpliedProb = oddsToImpliedProbability(total.overOdds || -110);
  const underImpliedProb = oddsToImpliedProbability(total.underOdds || -110);

  return {
    available: true,
    type: 'total',
    line: total.line,
    projectedTotal: Math.round(projectedTotal * 10) / 10,
    over: {
      line: total.line,
      odds: total.overOdds || -110,
      impliedProbability: Math.round(overImpliedProb * 100) / 100,
      edge: Math.round(overEdge * 10) / 10,
      hasValue: overEdge > 3, // 3+ points of edge
      recommendation: overEdge > 3 ? 'bet' : 'pass'
    },
    under: {
      line: total.line,
      odds: total.underOdds || -110,
      impliedProbability: Math.round(underImpliedProb * 100) / 100,
      edge: Math.round(underEdge * 10) / 10,
      hasValue: underEdge > 3,
      recommendation: underEdge > 3 ? 'bet' : 'pass'
    },
    bestSide: Math.abs(overEdge) > Math.abs(underEdge) ? 'over' : 'under',
    maxEdge: Math.max(Math.abs(overEdge), Math.abs(underEdge))
  };
}

/**
 * Convert American odds to implied probability
 */
function oddsToImpliedProbability(americanOdds) {
  if (americanOdds > 0) {
    // Underdog: 100 / (odds + 100)
    return 100 / (americanOdds + 100);
  } else {
    // Favorite: |odds| / (|odds| + 100)
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

/**
 * Identify best betting opportunity
 */
function identifyBestOpportunity(analyses) {
  let bestOpp = null;
  let maxEdge = 0;

  for (const analysis of analyses) {
    if (!analysis.available) continue;

    if (analysis.maxEdge > maxEdge) {
      maxEdge = analysis.maxEdge;
      bestOpp = {
        type: analysis.type,
        side: analysis.bestSide,
        edge: analysis.maxEdge,
        details: analysis[analysis.bestSide] || analysis.over || analysis.under
      };
    }
  }

  if (!bestOpp) {
    return {
      found: false,
      message: 'No value opportunities identified'
    };
  }

  return {
    found: true,
    type: bestOpp.type,
    side: bestOpp.side,
    edge: Math.round(bestOpp.edge * 100) / 100,
    recommendation: bestOpp.details.recommendation,
    kellyCriterion: bestOpp.details.kellyCriterion,
    confidence: maxEdge > 0.10 ? 'high' : maxEdge > 0.05 ? 'medium' : 'low'
  };
}

/**
 * Track line movement over time
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Historical line movement data
 */
export async function trackLineMovement(gameId, env) {
  try {
    // Retrieve historical line data from KV storage
    const lineHistoryKey = `lines:${gameId}`;
    const lineHistory = await env.SPORTS_DATA_KV.get(lineHistoryKey, 'json');

    if (!lineHistory) {
      return {
        gameId,
        history: [],
        movement: {
          moneyline: null,
          spread: null,
          total: null
        }
      };
    }

    // Analyze movement patterns
    const movement = {
      moneyline: analyzeLineMovement(lineHistory.moneyline, 'moneyline'),
      spread: analyzeLineMovement(lineHistory.spread, 'spread'),
      total: analyzeLineMovement(lineHistory.total, 'total')
    };

    // Detect sharp money (significant line moves)
    const sharpMoney = detectSharpMoney(lineHistory);

    return {
      gameId,
      history: lineHistory,
      movement,
      sharpMoney,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Line movement tracking error:', error);
    throw error;
  }
}

/**
 * Analyze line movement pattern
 */
function analyzeLineMovement(lineHistory, betType) {
  if (!lineHistory || lineHistory.length < 2) {
    return null;
  }

  const initial = lineHistory[0];
  const current = lineHistory[lineHistory.length - 1];

  let direction, magnitude, velocity;

  switch (betType) {
    case 'moneyline':
      const homeMove = current.home - initial.home;
      const awayMove = current.away - initial.away;
      direction = homeMove < 0 ? 'toward_home' : 'toward_away';
      magnitude = Math.abs(homeMove);
      velocity = magnitude / (lineHistory.length - 1); // Avg change per update
      break;

    case 'spread':
      const spreadMove = current.line - initial.line;
      direction = spreadMove < 0 ? 'toward_home' : 'toward_away';
      magnitude = Math.abs(spreadMove);
      velocity = magnitude / (lineHistory.length - 1);
      break;

    case 'total':
      const totalMove = current.line - initial.line;
      direction = totalMove > 0 ? 'over' : 'under';
      magnitude = Math.abs(totalMove);
      velocity = magnitude / (lineHistory.length - 1);
      break;
  }

  return {
    direction,
    magnitude: Math.round(magnitude * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    initial,
    current,
    updates: lineHistory.length
  };
}

/**
 * Detect sharp money (professional bettor activity)
 */
function detectSharpMoney(lineHistory) {
  const signals = [];

  // Check for reverse line movement (line moves against public betting %)
  // Check for steam moves (rapid line changes)
  // Check for late sharp money (significant moves close to game time)

  // Moneyline sharp detection
  if (lineHistory.moneyline && lineHistory.moneyline.length >= 3) {
    const recent = lineHistory.moneyline.slice(-3);
    const avgMove = recent.reduce((sum, line, i) =>
      i === 0 ? 0 : sum + Math.abs(line.home - recent[i - 1].home), 0
    ) / 2;

    if (avgMove > 15) { // 15+ cent move is significant
      signals.push({
        type: 'steam_move',
        betType: 'moneyline',
        magnitude: avgMove,
        description: 'Rapid moneyline movement detected'
      });
    }
  }

  // Spread sharp detection
  if (lineHistory.spread && lineHistory.spread.length >= 3) {
    const recent = lineHistory.spread.slice(-3);
    const avgMove = recent.reduce((sum, line, i) =>
      i === 0 ? 0 : sum + Math.abs(line.line - recent[i - 1].line), 0
    ) / 2;

    if (avgMove > 1) { // 1+ point move is significant
      signals.push({
        type: 'sharp_spread',
        betType: 'spread',
        magnitude: avgMove,
        description: 'Professional spread betting detected'
      });
    }
  }

  return {
    detected: signals.length > 0,
    signals,
    count: signals.length
  };
}

/**
 * Calculate closing line value (CLV)
 * Measures how good your bet was compared to the closing line
 */
export async function calculateClosingLineValue(gameId, betDetails, env) {
  try {
    // Get final closing line
    const closingLine = await getClosingLine(gameId, env);

    if (!closingLine) {
      return {
        available: false,
        message: 'Closing line not yet available'
      };
    }

    const { betType, side, odds: betOdds } = betDetails;

    let closingOdds, clv;

    switch (betType) {
      case 'moneyline':
        closingOdds = side === 'home' ? closingLine.moneyline.home : closingLine.moneyline.away;
        clv = calculateOddsValueDifference(betOdds, closingOdds);
        break;

      case 'spread':
        closingOdds = side === 'home' ? closingLine.spread.homeOdds : closingLine.spread.awayOdds;
        clv = calculateOddsValueDifference(betOdds, closingOdds);
        break;

      case 'total':
        closingOdds = side === 'over' ? closingLine.total.overOdds : closingLine.total.underOdds;
        clv = calculateOddsValueDifference(betOdds, closingOdds);
        break;
    }

    return {
      available: true,
      betOdds,
      closingOdds,
      clv: Math.round(clv * 1000) / 10, // As percentage
      assessment: clv > 0 ? 'positive_value' : 'negative_value',
      description: clv > 0 ?
        `You bet at better odds than closing line (+${Math.round(clv * 100)}%)` :
        `You bet at worse odds than closing line (${Math.round(clv * 100)}%)`
    };

  } catch (error) {
    console.error('CLV calculation error:', error);
    throw error;
  }
}

/**
 * Calculate value difference between two odds
 */
function calculateOddsValueDifference(betOdds, closingOdds) {
  const betProb = oddsToImpliedProbability(betOdds);
  const closingProb = oddsToImpliedProbability(closingOdds);

  // Positive CLV means you got better odds than closing
  return closingProb - betProb;
}

/**
 * Get closing line for a game
 */
async function getClosingLine(gameId, env) {
  try {
    const lineHistoryKey = `lines:${gameId}`;
    const lineHistory = await env.SPORTS_DATA_KV.get(lineHistoryKey, 'json');

    if (!lineHistory || lineHistory.length === 0) {
      return null;
    }

    // Return last recorded line before game start
    return {
      moneyline: lineHistory.moneyline[lineHistory.moneyline.length - 1],
      spread: lineHistory.spread[lineHistory.spread.length - 1],
      total: lineHistory.total[lineHistory.total.length - 1]
    };

  } catch (error) {
    console.error('Error getting closing line:', error);
    return null;
  }
}

/**
 * Get team offensive rating
 */
async function getTeamOffensiveRating(env, teamId, sport) {
  try {
    const result = await env.DB.prepare(`
      SELECT AVG(
        CASE
          WHEN home_team_id = ? THEN home_score
          ELSE away_score
        END
      ) as avg_score
      FROM historical_games
      WHERE (home_team_id = ? OR away_team_id = ?)
        AND sport = ?
        AND status = 'final'
        AND game_date >= date('now', '-60 days')
    `).bind(teamId, teamId, teamId, sport).first();

    return result?.avg_score || 20; // Default if no data

  } catch (error) {
    console.error('Error getting offensive rating:', error);
    return 20;
  }
}

/**
 * Get team defensive rating
 */
async function getTeamDefensiveRating(env, teamId, sport) {
  try {
    const result = await env.DB.prepare(`
      SELECT AVG(
        CASE
          WHEN home_team_id = ? THEN away_score
          ELSE home_score
        END
      ) as avg_allowed
      FROM historical_games
      WHERE (home_team_id = ? OR away_team_id = ?)
        AND sport = ?
        AND status = 'final'
        AND game_date >= date('now', '-60 days')
    `).bind(teamId, teamId, teamId, sport).first();

    return result?.avg_allowed || 20; // Default if no data

  } catch (error) {
    console.error('Error getting defensive rating:', error);
    return 20;
  }
}
