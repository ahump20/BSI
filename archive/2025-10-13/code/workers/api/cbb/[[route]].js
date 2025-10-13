/**
 * CBB (College Basketball) API Endpoints
 * Proxies SportsDataIO CBB API with caching and error handling
 * Focuses on SEC teams per Blaze Intelligence requirements
 */

import { SportsDataIOClient } from '../../../lib/sportsdata/client.js';
import {
    adaptCFBTeam as adaptCBBTeam,
    adaptCFBStanding as adaptCBBStanding,
    adaptCFBPlayer as adaptCBBPlayer,
    adaptCFBGame as adaptCBBGame,
    adaptCFBTeamSeasonStats as adaptCBBTeamSeasonStats,
    upsertTeams,
    upsertStandings,
    upsertGames
} from '../../../lib/sportsdata/adapters.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const route = params.route ? params.route.join('/') : '';

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Initialize SportsDataIO client
    const client = new SportsDataIOClient(env.SPORTSDATA_API_KEY, env);

    try {
        // Route handlers
        if (route === 'standings') {
            return await handleStandings(client, env, url, corsHeaders);
        }

        if (route === 'teams') {
            return await handleTeams(client, env, url, corsHeaders);
        }

        if (route === 'players') {
            return await handlePlayers(client, env, url, corsHeaders);
        }

        if (route === 'depth-charts') {
            return await handleDepthCharts(client, env, url, corsHeaders);
        }

        if (route === 'games') {
            return await handleGames(client, env, url, corsHeaders);
        }

        if (route === 'team-stats') {
            return await handleTeamStats(client, env, url, corsHeaders);
        }

        if (route === 'player-stats') {
            return await handlePlayerStats(client, env, url, corsHeaders);
        }

        if (route === 'team-game-stats') {
            return await handleTeamGameStats(client, env, url, corsHeaders);
        }

        if (route === 'player-game-stats') {
            return await handlePlayerGameStats(client, env, url, corsHeaders);
        }

        if (route === 'rankings') {
            return await handleRankings(client, env, url, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: 'Not Found',
            availableRoutes: [
                '/api/cbb/standings?season=2026&conference=SEC',
                '/api/cbb/teams',
                '/api/cbb/players?teamId=1',
                '/api/cbb/depth-charts',
                '/api/cbb/games?season=2026',
                '/api/cbb/team-stats?season=2026',
                '/api/cbb/player-stats?season=2026',
                '/api/cbb/team-game-stats?date=2026-01-15',
                '/api/cbb/player-game-stats?date=2026-01-15',
                '/api/cbb/rankings?season=2026'
            ]
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('CBB API Error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// =============================================
// ROUTE HANDLERS
// =============================================

async function handleStandings(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2026';
    const conference = url.searchParams.get('conference'); // e.g., 'SEC'
    const refresh = url.searchParams.get('refresh') === 'true';

    // Fetch from API
    const result = await client.getCBBStandings(season);

    if (!result.success) {
        await client.logSync('CBB', 'standings', season, 'ERROR', 0, result.error);
        return new Response(JSON.stringify({
            error: result.error,
            cached: result.cached
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Filter for SEC if requested
    let standings = result.data;
    if (conference === 'SEC') {
        standings = client.filterSECTeams(standings);
    }

    // Transform and store in D1 if requested
    if (env.DB && !result.cached) {
        try {
            const standingsToStore = standings.map(s => adaptCBBStanding(s, season));
            await upsertStandings(env.DB, standingsToStore);
            await client.logSync('CBB', 'standings', season, 'SUCCESS', standingsToStore.length, null, result.duration, result.retries);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: standings,
        meta: {
            season: parseInt(season),
            sport: 'CBB',
            conference: conference || 'all',
            cached: result.cached || false,
            timestamp: new Date().toISOString(),
            source: 'SportsDataIO'
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleTeams(client, env, url, corsHeaders) {
    const conference = url.searchParams.get('conference'); // e.g., 'SEC'
    const result = await client.getCBBTeams();

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Filter for SEC if requested
    let teams = result.data;
    if (conference === 'SEC') {
        teams = client.filterSECTeams(teams);
    }

    // Store teams in D1
    if (env.DB && !result.cached) {
        try {
            const teamsToStore = teams.map(adaptCBBTeam);
            await upsertTeams(env.DB, teamsToStore);
            await client.logSync('CBB', 'teams', null, 'SUCCESS', teamsToStore.length);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: teams,
        meta: {
            count: teams.length,
            sport: 'CBB',
            conference: conference || 'all',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handlePlayers(client, env, url, corsHeaders) {
    const teamId = url.searchParams.get('teamId');

    // Note: SportsDataIO CBB API may not have a players endpoint
    // This is a placeholder for when/if they add it
    return new Response(JSON.stringify({
        error: 'CBB players endpoint not yet available',
        note: 'Use depth-charts endpoint for roster information'
    }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleDepthCharts(client, env, url, corsHeaders) {
    const result = await client.getCBBDepthCharts();

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGames(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2026';
    const result = await client.getCBBGames(season);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Store games in D1
    if (env.DB && !result.cached) {
        try {
            const gamesToStore = result.data.map(g => adaptCBBGame(g, season));
            await upsertGames(env.DB, gamesToStore);
            await client.logSync('CBB', 'games', season, 'SUCCESS', gamesToStore.length);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            season: parseInt(season),
            count: result.data.length,
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleTeamStats(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2026';
    const conference = url.searchParams.get('conference');

    const result = await client.getCBBTeamSeasonStats(season);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Filter for SEC if requested
    let stats = result.data;
    if (conference === 'SEC') {
        stats = client.filterSECTeams(stats);
    }

    return new Response(JSON.stringify({
        data: stats,
        meta: {
            season: parseInt(season),
            conference: conference || 'all',
            count: stats.length,
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handlePlayerStats(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2026';
    const result = await client.getCBBPlayerSeasonStats(season);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            season: parseInt(season),
            count: result.data.length,
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleTeamGameStats(client, env, url, corsHeaders) {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const result = await client.getCBBTeamGameStatsByDate(date);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            date: date,
            count: result.data.length,
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handlePlayerGameStats(client, env, url, corsHeaders) {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const result = await client.getCBBPlayerGameStatsByDate(date);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            date: date,
            count: result.data.length,
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleRankings(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2026';
    const result = await client.getCBBRankings(season);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            season: parseInt(season),
            sport: 'CBB',
            cached: result.cached || false,
            timestamp: new Date().toISOString(),
            source: 'SportsDataIO'
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
