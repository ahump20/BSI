/**
 * BSI API Module Index
 * Exports all handlers and utilities for the main worker
 *
 * Usage:
 * import { handleMLBRequest, handleNFLRequest } from './src/workers/api/index.js';
 */

// Constants
export {
  SPORTSDATAIO_BASE,
  COLLEGEFOOTBALL_BASE,
  SPORTSRADAR_BASE,
  THEODDS_BASE,
  STRIPE_API_BASE,
  STRIPE_PRICES,
  CACHE_TTL,
  getCorsHeaders,
} from './constants.js';

// Utility functions
export {
  getTodayDate,
  getMonthAbbrev,
  getChicagoTimestamp,
  formatGameDate,
  jsonResponse,
  fetchSportsData,
  fetchCFBData,
} from './utils/helpers.js';

// Sports handlers
export {
  handleMLBRequest,
  handleNFLRequest,
  handleNBARequest,
  handleCFBRequest,
  handleOddsRequest,
  handleNCAAFootballScores,
} from './handlers/sports.js';
