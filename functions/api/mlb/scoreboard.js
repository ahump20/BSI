/**
 * MLB Scoreboard Alias
 * Redirects /api/mlb/scoreboard to /api/mlb/scores for backwards compatibility
 */

export { onRequestGet } from './scores.js';
