/**
 * Blaze Sports Intel - Real-Time Prediction Stream Manager
 *
 * Manages real-time prediction updates for live games
 * with WebSocket broadcasting and intelligent caching.
 *
 * Features:
 * - Live prediction updates every 30 seconds
 * - WebSocket broadcasting to connected clients
 * - Intelligent cache invalidation
 * - Prediction history tracking
 * - Performance monitoring
 */

import { calculateWinProbability } from './win-probability-model.js';
import { analyzeBettingLines } from './betting-line-analyzer.js';

/**
 * Initialize real-time prediction streaming for a game
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Stream initialization result
 */
export async function initializePredictionStream(gameId, env) {
  try {
    // Create stream tracking entry in KV
    const streamKey = `stream:${gameId}`;
    const streamData = {
      gameId,
      status: 'active',
      startedAt: new Date().toISOString(),
      updateInterval: 30000, // 30 seconds
      lastUpdate: null,
      updateCount: 0,
      connectedClients: 0,
    };

    await env.SPORTS_DATA_KV.put(streamKey, JSON.stringify(streamData), {
      expirationTtl: 14400, // 4 hours
    });

    // Initialize prediction history
    const historyKey = `predictions:history:${gameId}`;
    await env.SPORTS_DATA_KV.put(historyKey, JSON.stringify([]), {
      expirationTtl: 86400, // 24 hours
    });

    return {
      gameId,
      status: 'initialized',
      streamKey,
      updateInterval: 30000,
    };
  } catch (error) {
    console.error('Stream initialization error:', error);
    throw error;
  }
}

/**
 * Update predictions for a live game
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Updated predictions
 */
export async function updateLivePredictions(gameId, env) {
  try {
    // Get current game state
    const gameState = await fetchGameState(env, gameId);

    // Calculate predictions in parallel
    const [winProb, bettingAnalysis] = await Promise.all([
      calculateWinProbability(gameState, env),
      fetchAndAnalyzeBettingLines(gameState, env),
    ]);

    // Create prediction snapshot
    const snapshot = {
      timestamp: new Date().toISOString(),
      gameState: {
        period: gameState.period || gameState.quarter || gameState.inning,
        timeRemaining: gameState.timeRemaining,
        homeScore: gameState.homeScore,
        awayScore: gameState.awayScore,
      },
      predictions: {
        winProbability: {
          home: winProb.homeWinProbability,
          away: winProb.awayWinProbability,
          confidence: winProb.confidence.level,
        },
        betting: bettingAnalysis
          ? {
              bestOpportunity: bettingAnalysis.bestOpportunity,
              homeEdge: bettingAnalysis.analysis?.moneyline?.home?.edge || 0,
              awayEdge: bettingAnalysis.analysis?.moneyline?.away?.edge || 0,
            }
          : null,
      },
    };

    // Update prediction history
    await appendPredictionHistory(gameId, snapshot, env);

    // Update stream status
    await updateStreamStatus(gameId, env);

    // Cache current prediction
    await cachePrediction(gameId, snapshot, env);

    return snapshot;
  } catch (error) {
    console.error('Live prediction update error:', error);
    throw error;
  }
}

/**
 * Get prediction history for a game
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Array>} Prediction history
 */
export async function getPredictionHistory(gameId, env) {
  try {
    const historyKey = `predictions:history:${gameId}`;
    const history = await env.SPORTS_DATA_KV.get(historyKey, 'json');

    if (!history) {
      return [];
    }

    // Calculate prediction swings
    const historyWithSwings = history.map((snapshot, index) => {
      if (index === 0) {
        return { ...snapshot, swing: 0 };
      }

      const prevProb = history[index - 1].predictions.winProbability.home;
      const currProb = snapshot.predictions.winProbability.home;
      const swing = Math.round((currProb - prevProb) * 1000) / 10; // As percentage

      return { ...snapshot, swing };
    });

    return historyWithSwings;
  } catch (error) {
    console.error('Error getting prediction history:', error);
    return [];
  }
}

/**
 * Identify key prediction moments (large swings)
 * @param {Array} history - Prediction history
 * @returns {Array} Key moments
 */
export function identifyKeyMoments(history) {
  const keyMoments = [];

  for (let i = 1; i < history.length; i++) {
    const prevProb = history[i - 1].predictions.winProbability.home;
    const currProb = history[i].predictions.winProbability.home;
    const swing = Math.abs(currProb - prevProb);

    // Identify swings > 5%
    if (swing >= 0.05) {
      keyMoments.push({
        timestamp: history[i].timestamp,
        period: history[i].gameState.period,
        homeScore: history[i].gameState.homeScore,
        awayScore: history[i].gameState.awayScore,
        prevProbability: Math.round(prevProb * 100) / 100,
        newProbability: Math.round(currProb * 100) / 100,
        swing: Math.round(swing * 1000) / 10,
        direction: currProb > prevProb ? 'home' : 'away',
        magnitude: swing >= 0.1 ? 'major' : swing >= 0.07 ? 'significant' : 'notable',
      });
    }
  }

  return keyMoments;
}

/**
 * Broadcast prediction update via WebSocket
 * @param {string} gameId - Game identifier
 * @param {Object} prediction - Prediction snapshot
 * @param {Object} env - Cloudflare environment
 */
export async function broadcastPredictionUpdate(gameId, prediction, env) {
  try {
    // Get connected WebSocket sessions from Durable Objects
    // This would integrate with Cloudflare's WebSocket support

    const message = {
      type: 'prediction_update',
      gameId,
      timestamp: prediction.timestamp,
      data: prediction,
    };

    // In production, would send to Durable Object managing WebSocket connections
    // For now, store in KV for SSE polling
    const broadcastKey = `broadcast:${gameId}`;
    await env.SPORTS_DATA_KV.put(broadcastKey, JSON.stringify(message), {
      expirationTtl: 60, // 1 minute
    });
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

/**
 * Fetch game state from database
 */
async function fetchGameState(env, gameId) {
  const game = await env.DB.prepare(
    `
    SELECT * FROM historical_games WHERE game_id = ?
  `
  )
    .bind(gameId)
    .first();

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  return {
    gameId: game.game_id,
    sport: game.sport,
    homeTeam: game.home_team_id,
    awayTeam: game.away_team_id,
    homeScore: game.home_score || 0,
    awayScore: game.away_score || 0,
    period: game.period || game.quarter || game.inning,
    timeRemaining: game.time_remaining,
    possession: game.possession_team,
    down: game.down,
    distance: game.distance,
    yardLine: game.yard_line,
    inning: game.inning,
    isTopHalf: game.is_top_half,
    outs: game.outs,
    runnersOn: game.runners_on ? JSON.parse(game.runners_on) : [],
    quarter: game.quarter,
    status: game.status,
  };
}

/**
 * Fetch and analyze betting lines
 */
async function fetchAndAnalyzeBettingLines(gameState, env) {
  try {
    const linesKey = `lines:${gameState.gameId}`;
    const lines = await env.SPORTS_DATA_KV.get(linesKey, 'json');

    if (!lines) {
      return null;
    }

    const currentLines = {
      moneyline: lines.moneyline[lines.moneyline.length - 1],
      spread: lines.spread[lines.spread.length - 1],
      total: lines.total[lines.total.length - 1],
    };

    return await analyzeBettingLines(gameState, currentLines, env);
  } catch (error) {
    console.error('Error fetching/analyzing betting lines:', error);
    return null;
  }
}

/**
 * Append prediction to history
 */
async function appendPredictionHistory(gameId, snapshot, env) {
  try {
    const historyKey = `predictions:history:${gameId}`;
    const history = (await env.SPORTS_DATA_KV.get(historyKey, 'json')) || [];

    history.push(snapshot);

    // Keep last 200 snapshots (about 1.5 hours at 30s intervals)
    const trimmedHistory = history.slice(-200);

    await env.SPORTS_DATA_KV.put(historyKey, JSON.stringify(trimmedHistory), {
      expirationTtl: 86400, // 24 hours
    });
  } catch (error) {
    console.error('Error appending prediction history:', error);
  }
}

/**
 * Update stream status
 */
async function updateStreamStatus(gameId, env) {
  try {
    const streamKey = `stream:${gameId}`;
    const streamData = await env.SPORTS_DATA_KV.get(streamKey, 'json');

    if (streamData) {
      streamData.lastUpdate = new Date().toISOString();
      streamData.updateCount = (streamData.updateCount || 0) + 1;

      await env.SPORTS_DATA_KV.put(streamKey, JSON.stringify(streamData), {
        expirationTtl: 14400, // 4 hours
      });
    }
  } catch (error) {
    console.error('Error updating stream status:', error);
  }
}

/**
 * Cache current prediction
 */
async function cachePrediction(gameId, snapshot, env) {
  try {
    const cacheKey = `predictions:current:${gameId}`;
    await env.SPORTS_DATA_KV.put(cacheKey, JSON.stringify(snapshot), {
      expirationTtl: 60, // 1 minute
    });
  } catch (error) {
    console.error('Error caching prediction:', error);
  }
}

/**
 * Stop prediction streaming for a game
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 */
export async function stopPredictionStream(gameId, env) {
  try {
    const streamKey = `stream:${gameId}`;
    const streamData = await env.SPORTS_DATA_KV.get(streamKey, 'json');

    if (streamData) {
      streamData.status = 'stopped';
      streamData.stoppedAt = new Date().toISOString();

      await env.SPORTS_DATA_KV.put(streamKey, JSON.stringify(streamData), {
        expirationTtl: 3600, // 1 hour retention after stopping
      });
    }

    return {
      gameId,
      status: 'stopped',
    };
  } catch (error) {
    console.error('Error stopping stream:', error);
    throw error;
  }
}

/**
 * Get stream status
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Stream status
 */
export async function getStreamStatus(gameId, env) {
  try {
    const streamKey = `stream:${gameId}`;
    const streamData = await env.SPORTS_DATA_KV.get(streamKey, 'json');

    if (!streamData) {
      return {
        gameId,
        status: 'not_initialized',
      };
    }

    return streamData;
  } catch (error) {
    console.error('Error getting stream status:', error);
    return {
      gameId,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Get prediction performance metrics
 * @param {string} gameId - Game identifier
 * @param {Object} env - Cloudflare environment
 * @returns {Promise<Object>} Performance metrics
 */
export async function getPredictionMetrics(gameId, env) {
  try {
    const history = await getPredictionHistory(gameId, env);

    if (history.length === 0) {
      return {
        gameId,
        available: false,
      };
    }

    // Calculate metrics
    const totalUpdates = history.length;
    const keyMoments = identifyKeyMoments(history);

    // Calculate average confidence
    const avgConfidence =
      history.reduce((sum, snap) => {
        const conf = snap.predictions.winProbability.confidence;
        return sum + (conf === 'high' ? 1 : conf === 'medium' ? 0.7 : 0.4);
      }, 0) / totalUpdates;

    // Calculate prediction volatility (average swing magnitude)
    let totalSwing = 0;
    for (let i = 1; i < history.length; i++) {
      const prevProb = history[i - 1].predictions.winProbability.home;
      const currProb = history[i].predictions.winProbability.home;
      totalSwing += Math.abs(currProb - prevProb);
    }
    const avgVolatility = totalUpdates > 1 ? totalSwing / (totalUpdates - 1) : 0;

    return {
      gameId,
      available: true,
      metrics: {
        totalUpdates,
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        averageVolatility: Math.round(avgVolatility * 1000) / 10, // As percentage
        keyMoments: keyMoments.length,
        largestSwing: keyMoments.length > 0 ? Math.max(...keyMoments.map((m) => m.swing)) : 0,
        updateFrequency: '30 seconds',
        dataQuality: avgConfidence > 0.8 ? 'high' : avgConfidence > 0.6 ? 'medium' : 'low',
      },
      lastUpdated: history[history.length - 1].timestamp,
    };
  } catch (error) {
    console.error('Error getting prediction metrics:', error);
    throw error;
  }
}
