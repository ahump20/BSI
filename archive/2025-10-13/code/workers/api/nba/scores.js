// NBA Live Scores API - Cloudflare Pages Function
// Fetches real-time NBA game scores with 30-second cache for live games

import { ok, err, cache, withRetry, fetchWithTimeout } from '../_utils.js';

/**
 * NBA Live Scores endpoint
 * GET /api/nba/scores?date=2025-10-15&team=MEM
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const date = url.searchParams.get('date'); // Optional YYYYMMDD format
    const teamFilter = url.searchParams.get('team'); // Optional team abbreviation filter

    try {
        const cacheKey = `nba:scores:${date || 'current'}:${teamFilter || 'all'}`;

        const scores = await cache(env, cacheKey, async () => {
            return await fetchNBAScores(date, teamFilter);
        }, 30); // 30 second cache for live scores

        // Check if any games are live
        const hasLiveGames = scores.games?.some(g => g.status?.type === 'STATUS_IN_PROGRESS');

        return ok({
            league: 'NBA',
            season: '2025-26',
            date: date || 'today',
            live: hasLiveGames,
            games: scores.games,
            meta: {
                dataSource: 'ESPN NBA API',
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
 * Fetch NBA scores from ESPN API with retry logic
 */
async function fetchNBAScores(date, teamFilter) {
    return await withRetry(async () => {
        const headers = {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            'Accept': 'application/json',
            'Referer': 'https://blazesportsintel.com/'
        };

        // ESPN NBA Scoreboard API
        let scoresUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

        // Add date parameter if specified (format: YYYYMMDD)
        if (date) {
            scoresUrl += `?dates=${date}`;
        }

        const response = await fetchWithTimeout(scoresUrl, { headers }, 10000);

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Process scores data
        const processed = processScoresData(data, teamFilter);

        return processed;
    }, 3, 250); // 3 retries with 250ms base delay
}

/**
 * Process and format NBA scores data
 */
function processScoresData(data, teamFilter) {
    const season = data.season?.year || 2025;
    const events = data.events || [];

    const games = events
        .filter(event => {
            // Filter by team if specified
            if (teamFilter) {
                const competitors = event.competitions?.[0]?.competitors || [];
                return competitors.some(c => c.team?.abbreviation === teamFilter);
            }
            return true;
        })
        .map(event => {
            const competition = event.competitions?.[0] || {};
            const status = competition.status || {};
            const competitors = competition.competitors || [];

            // Extract home and away teams
            const homeTeam = competitors.find(c => c.homeAway === 'home') || {};
            const awayTeam = competitors.find(c => c.homeAway === 'away') || {};

            return {
                id: event.id,
                uid: event.uid,
                date: event.date,
                name: event.name,
                shortName: event.shortName,
                season,
                status: {
                    type: status.type?.name, // 'STATUS_SCHEDULED', 'STATUS_IN_PROGRESS', 'STATUS_FINAL'
                    state: status.type?.state, // 'pre', 'in', 'post'
                    completed: status.type?.completed || false,
                    detail: status.type?.detail,
                    shortDetail: status.type?.shortDetail,
                    period: status.period, // Quarter (1-4) or OT periods
                    clock: status.displayClock || '0:00',
                    isFinal: status.type?.completed || false,
                    isLive: status.type?.name === 'STATUS_IN_PROGRESS'
                },
                teams: {
                    away: {
                        id: awayTeam.id,
                        uid: awayTeam.uid,
                        team: awayTeam.team?.displayName,
                        abbreviation: awayTeam.team?.abbreviation,
                        logo: awayTeam.team?.logo,
                        score: awayTeam.score || 0,
                        record: awayTeam.records?.[0]?.summary || '0-0',
                        winner: awayTeam.winner || false,
                        linescores: awayTeam.linescores || [],
                        statistics: awayTeam.statistics || [],
                        leaders: awayTeam.leaders || []
                    },
                    home: {
                        id: homeTeam.id,
                        uid: homeTeam.uid,
                        team: homeTeam.team?.displayName,
                        abbreviation: homeTeam.team?.abbreviation,
                        logo: homeTeam.team?.logo,
                        score: homeTeam.score || 0,
                        record: homeTeam.records?.[0]?.summary || '0-0',
                        winner: homeTeam.winner || false,
                        linescores: homeTeam.linescores || [],
                        statistics: homeTeam.statistics || [],
                        leaders: homeTeam.leaders || []
                    }
                },
                venue: {
                    name: competition.venue?.fullName,
                    city: competition.venue?.address?.city,
                    state: competition.venue?.address?.state
                },
                broadcast: competition.broadcasts?.[0]?.names?.join(', ') || 'N/A',
                odds: competition.odds?.[0] || null,
                link: event.links?.[0]?.href
            };
        });

    return {
        season,
        games,
        count: games.length,
        liveGames: games.filter(g => g.status.isLive).length,
        completedGames: games.filter(g => g.status.isFinal).length,
        upcomingGames: games.filter(g => g.status.type === 'STATUS_SCHEDULED').length
    };
}
