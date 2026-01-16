/**
 * MLB Data Update Cron Job
 * Runs every 10 minutes during season to refresh standings, scores, and stats
 */

import { SportsDataIOClient } from '../../lib/sportsdata/client.js';
import {
  adaptMLBStanding,
  adaptMLBGame,
  adaptMLBTeamSeasonStats,
  upsertStandings,
  upsertGames,
} from '../../lib/sportsdata/adapters.js';

export default {
  async scheduled(event, env, ctx) {
    const client = new SportsDataIOClient(env.SPORTSDATA_API_KEY, env);
    const season = new Date().getFullYear(); // Current season

    try {
      // Update standings
      const standingsResult = await client.getMLBStandings(season.toString());
      if (standingsResult.success && env.DB) {
        const standings = standingsResult.data.map((s) => adaptMLBStanding(s, season));
        await upsertStandings(env.DB, standings);
        await client.logSync(
          'MLB',
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
      const gamesResult = await client.getMLBGames(season.toString());
      if (gamesResult.success && env.DB) {
        const games = gamesResult.data.map((g) => adaptMLBGame(g, season));
        await upsertGames(env.DB, games);
        await client.logSync('MLB', 'games', season, 'SUCCESS', games.length);
      }

      // Update team season stats
      const statsResult = await client.getMLBTeamSeasonStats(season.toString());
      if (statsResult.success && env.DB) {
        const stats = statsResult.data.map((s) => adaptMLBTeamSeasonStats(s, season));
        await client.logSync('MLB', 'team-stats', season, 'SUCCESS', stats.length);
      }

      // Update today's game stats (for box scores)
      const today = new Date().toISOString().split('T')[0];
      const todayGamesResult = await client.getMLBTeamGameStatsByDate(today);
      if (todayGamesResult.success) {
        await client.logSync('MLB', 'today-games', season, 'SUCCESS', todayGamesResult.data.length);
      }
    } catch (error) {
      console.error('[MLB CRON] MLB data update failed:', error);
      await client.logSync('MLB', 'cron-update', season, 'ERROR', 0, error.message);
    }
  },
};
