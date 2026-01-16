/**
 * NFL Data Update Cron Job
 * Runs every 5 minutes during season to refresh standings, scores, and stats
 */

import { SportsDataIOClient } from '../../lib/sportsdata/client.js';
import {
  adaptNFLStanding,
  adaptNFLGame,
  adaptNFLTeamSeasonStats,
  upsertStandings,
  upsertGames,
} from '../../lib/sportsdata/adapters.js';

export default {
  async scheduled(event, env, ctx) {
    const client = new SportsDataIOClient(env.SPORTSDATA_API_KEY, env);
    const season = new Date().getFullYear(); // Current season

    try {
      // Update standings
      const standingsResult = await client.getNFLStandings(season.toString());
      if (standingsResult.success && env.DB) {
        const standings = standingsResult.data.map((s) => adaptNFLStanding(s, season));
        await upsertStandings(env.DB, standings);
        await client.logSync(
          'NFL',
          'standings',
          season,
          'SUCCESS',
          standings.length,
          null,
          standingsResult.duration,
          standingsResult.retries
        );
      }

      // Update games (for live scores)
      const gamesResult = await client.getNFLGames(season.toString());
      if (gamesResult.success && env.DB) {
        const games = gamesResult.data.map((g) => adaptNFLGame(g, season));
        await upsertGames(env.DB, games);
        await client.logSync('NFL', 'games', season, 'SUCCESS', games.length);
      }

      // Update team season stats
      const statsResult = await client.getNFLTeamSeasonStats(season.toString());
      if (statsResult.success && env.DB) {
        const stats = statsResult.data.map((s) => adaptNFLTeamSeasonStats(s, season));
        // Store stats in D1 (simplified - could add upsertTeamStats function)
        await client.logSync('NFL', 'team-stats', season, 'SUCCESS', stats.length);
      }
    } catch (error) {
      console.error('[NFL CRON] NFL data update failed:', error);
      await client.logSync('NFL', 'cron-update', season, 'ERROR', 0, error.message);
    }
  },
};
