/**
 * NFL Scoreboard Alias
 * Redirects /api/nfl/scoreboard to /api/nfl/scores for backwards compatibility
 */

export { onRequest } from './scores';
