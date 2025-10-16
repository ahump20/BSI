// MLB Live Scores API - Cloudflare Pages Function
// Fetches real-time MLB game scores with 30-second cache for live games

import { ok, err, cache, withRetry, fetchWithTimeout } from '../_utils.js';

/**
 * MLB Live Scores endpoint
 * GET /api/mlb/scores?date=2025-07-15&team=STL
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const date = url.searchParams.get('date') || getCurrentDateString();
    const teamFilter = url.searchParams.get('team'); // Optional team abbreviation filter

    try {
        const cacheKey = `mlb:scores:${date}:${teamFilter || 'all'}`;

        const scores = await cache(env, cacheKey, async () => {
            return await fetchMLBScores(date, teamFilter);
        }, 30); // 30 second cache for live scores

        // Check if any games are live
        const hasLiveGames = scores.games?.some(g => g.status?.abstractGameState === 'Live');

        return ok({
            league: 'MLB',
            season: '2025',
            date,
            live: hasLiveGames,
            games: scores.games,
            meta: {
                dataSource: 'MLB Stats API',
                lastUpdated: new Date().toISOString(),
                timezone: 'America/Chicago',
                cacheTTL: hasLiveGames ? '30s' : '5min'
            }
        }, {
            headers: {
                'Cache-Control': hasLiveGames ? 'public, max-age=30' : 'public, max-age=300'
            }
        });
    } catch (error) {
        return err(error);
    }
}

/**
 * Fetch MLB scores from MLB Stats API with retry logic
 */
async function fetchMLBScores(date, teamFilter) {
    return await withRetry(async () => {
        const headers = {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            'Accept': 'application/json'
        };

        // MLB Stats API schedule endpoint
        const scoresUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team,linescore,decisions`;

        const response = await fetchWithTimeout(scoresUrl, { headers }, 10000);

        if (!response.ok) {
            throw new Error(`MLB API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Process scores data
        const processed = processMLBScoresData(data, teamFilter);

        return processed;
    }, 3, 250); // 3 retries with 250ms base delay
}

/**
 * Process and format MLB scores data
 */
function processMLBScoresData(data, teamFilter) {
    const dates = data.dates || [];
    const allGames = [];

    dates.forEach(dateData => {
        const games = dateData.games || [];

        games.forEach(game => {
            // Filter by team if specified
            if (teamFilter) {
                const awayAbbr = game.teams?.away?.team?.abbreviation;
                const homeAbbr = game.teams?.home?.team?.abbreviation;
                if (awayAbbr !== teamFilter && homeAbbr !== teamFilter) {
                    return;
                }
            }

            const status = game.status || {};
            const linescore = game.linescore || {};
            const awayTeam = game.teams?.away || {};
            const homeTeam = game.teams?.home || {};

            allGames.push({
                id: game.gamePk,
                date: game.gameDate,
                gameType: game.gameType,
                season: game.season,
                status: {
                    state: status.abstractGameState, // 'Preview', 'Live', 'Final'
                    detailedState: status.detailedState,
                    statusCode: status.statusCode,
                    inning: linescore.currentInning,
                    inningState: linescore.inningState, // 'Top', 'Middle', 'Bottom', 'End'
                    isLive: status.abstractGameState === 'Live',
                    isFinal: status.abstractGameState === 'Final'
                },
                teams: {
                    away: {
                        id: awayTeam.team?.id,
                        name: awayTeam.team?.name,
                        abbreviation: awayTeam.team?.abbreviation,
                        score: awayTeam.score || 0,
                        isWinner: awayTeam.isWinner || false,
                        leagueRecord: awayTeam.leagueRecord,
                        hits: linescore.teams?.away?.hits || 0,
                        errors: linescore.teams?.away?.errors || 0,
                        leftOnBase: linescore.teams?.away?.leftOnBase || 0
                    },
                    home: {
                        id: homeTeam.team?.id,
                        name: homeTeam.team?.name,
                        abbreviation: homeTeam.team?.abbreviation,
                        score: homeTeam.score || 0,
                        isWinner: homeTeam.isWinner || false,
                        leagueRecord: homeTeam.leagueRecord,
                        hits: linescore.teams?.home?.hits || 0,
                        errors: linescore.teams?.home?.errors || 0,
                        leftOnBase: linescore.teams?.home?.leftOnBase || 0
                    }
                },
                venue: {
                    id: game.venue?.id,
                    name: game.venue?.name
                },
                linescore: {
                    innings: linescore.innings || [],
                    currentInning: linescore.currentInning,
                    inningState: linescore.inningState,
                    balls: linescore.balls,
                    strikes: linescore.strikes,
                    outs: linescore.outs
                },
                pitchers: {
                    winning: game.decisions?.winner ? {
                        id: game.decisions.winner.id,
                        name: game.decisions.winner.fullName
                    } : null,
                    losing: game.decisions?.loser ? {
                        id: game.decisions.loser.id,
                        name: game.decisions.loser.fullName
                    } : null,
                    save: game.decisions?.save ? {
                        id: game.decisions.save.id,
                        name: game.decisions.save.fullName
                    } : null
                },
                broadcasts: game.broadcasts || [],
                weather: game.weather || null
            });
        });
    });

    return {
        games: allGames,
        count: allGames.length,
        liveGames: allGames.filter(g => g.status.isLive).length,
        completedGames: allGames.filter(g => g.status.isFinal).length,
        upcomingGames: allGames.filter(g => g.status.state === 'Preview').length
    };
}

/**
 * Get current date string in YYYY-MM-DD format (America/Chicago timezone)
 */
function getCurrentDateString() {
    const now = new Date();
    // Convert to Chicago timezone
    const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const year = chicagoTime.getFullYear();
    const month = String(chicagoTime.getMonth() + 1).padStart(2, '0');
    const day = String(chicagoTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
