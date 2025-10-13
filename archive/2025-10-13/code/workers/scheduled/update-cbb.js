/**
 * CBB (College Basketball) Data Update Cron Job
 * Runs every 20 minutes during season to refresh SEC standings, scores, and stats
 */

import { SportsDataIOClient } from '../../lib/sportsdata/client.js';
import {
    adaptCBBStanding,
    adaptCBBGame,
    adaptCBBTeamSeasonStats,
    upsertStandings,
    upsertGames
} from '../../lib/sportsdata/adapters.js';

export default {
    async scheduled(event, env, ctx) {
        const client = new SportsDataIOClient(env.SPORTSDATA_API_KEY, env);

        // Basketball season spans two calendar years (e.g., 2025-2026 season)
        const now = new Date();
        const month = now.getMonth();
        const season = month >= 9 ? now.getFullYear() + 1 : now.getFullYear(); // Oct-Sep → next year


        try {
            // Update standings
            const standingsResult = await client.getCBBStandings(season.toString());
            if (standingsResult.success && env.DB) {
                // Filter for SEC teams
                const secStandings = client.filterSECTeams(standingsResult.data);
                const standings = secStandings.map(s => adaptCBBStanding(s, season));
                await upsertStandings(env.DB, standings);
                await client.logSync('CBB', 'standings', season, 'SUCCESS', standings.length, null, standingsResult.duration, standingsResult.retries);
            }

            // Update games (for live scores)
            const gamesResult = await client.getCBBGames(season.toString());
            if (gamesResult.success && env.DB) {
                // Filter for SEC teams
                const secGames = gamesResult.data.filter(g =>
                    g.HomeConference === 'SEC' || g.AwayConference === 'SEC'
                );
                const games = secGames.map(g => adaptCBBGame(g, season));
                await upsertGames(env.DB, games);
                await client.logSync('CBB', 'games', season, 'SUCCESS', games.length);
            }

            // Update team season stats
            const statsResult = await client.getCBBTeamSeasonStats(season.toString());
            if (statsResult.success && env.DB) {
                const secStats = client.filterSECTeams(statsResult.data);
                const stats = secStats.map(s => adaptCBBTeamSeasonStats(s, season));
                await client.logSync('CBB', 'team-stats', season, 'SUCCESS', stats.length);
            }

            // Update today's rankings
            const rankingsResult = await client.getCBBRankings(season.toString());
            if (rankingsResult.success) {
                await client.logSync('CBB', 'rankings', season, 'SUCCESS', rankingsResult.data.length);
            }


        } catch (error) {
            console.error('[CBB CRON] CBB data update failed:', error);
            await client.logSync('CBB', 'cron-update', season, 'ERROR', 0, error.message);
        }
    }
};
