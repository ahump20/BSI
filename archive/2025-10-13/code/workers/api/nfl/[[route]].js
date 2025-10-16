/**
 * NFL API Endpoints
 * Proxies SportsDataIO NFL API with caching and error handling
 */

import { SportsDataIOClient } from '../../../lib/sportsdata/client.js';
import {
    adaptNFLTeam,
    adaptNFLStanding,
    adaptNFLPlayer,
    adaptNFLGame,
    adaptNFLTeamSeasonStats,
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

        return new Response(JSON.stringify({
            error: 'Not Found',
            availableRoutes: [
                '/api/nfl/standings?season=2025',
                '/api/nfl/teams',
                '/api/nfl/players?teamId=1',
                '/api/nfl/depth-charts',
                '/api/nfl/games?season=2025',
                '/api/nfl/team-stats?season=2025',
                '/api/nfl/player-stats?season=2025',
                '/api/nfl/team-game-stats?season=2025&week=4',
                '/api/nfl/player-game-stats?season=2025&week=4'
            ]
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('NFL API Error:', error);
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
    const season = url.searchParams.get('season') || '2025';
    const refresh = url.searchParams.get('refresh') === 'true';

    // Fetch from API
    const result = await client.getNFLStandings(season);

    if (!result.success) {
        await client.logSync('NFL', 'standings', season, 'ERROR', 0, result.error);
        return new Response(JSON.stringify({
            error: result.error,
            cached: result.cached
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Transform and store in D1 if requested
    if (env.DB && !result.cached) {
        try {
            const standings = result.data.map(s => adaptNFLStanding(s, season));
            await upsertStandings(env.DB, standings);
            await client.logSync('NFL', 'standings', season, 'SUCCESS', standings.length, null, result.duration, result.retries);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            season: parseInt(season),
            sport: 'NFL',
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
    const result = await client.getNFLTeams();

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Store teams in D1
    if (env.DB && !result.cached) {
        try {
            const teams = result.data.map(adaptNFLTeam);
            await upsertTeams(env.DB, teams);
            await client.logSync('NFL', 'teams', null, 'SUCCESS', teams.length);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            count: result.data.length,
            sport: 'NFL',
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
    const result = await client.getNFLPlayers(teamId);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            count: result.data.length,
            teamId: teamId ? parseInt(teamId) : null,
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleDepthCharts(client, env, url, corsHeaders) {
    const result = await client.getNFLDepthCharts();

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGames(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2025';
    const result = await client.getNFLGames(season);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Store games in D1
    if (env.DB && !result.cached) {
        try {
            const games = result.data.map(g => adaptNFLGame(g, season));
            await upsertGames(env.DB, games);
            await client.logSync('NFL', 'games', season, 'SUCCESS', games.length);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            season: parseInt(season),
            count: result.data.length,
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleTeamStats(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2025';
    const result = await client.getNFLTeamSeasonStats(season);

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
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handlePlayerStats(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2025';
    const result = await client.getNFLPlayerSeasonStats(season);

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
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleTeamGameStats(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2025';
    const week = url.searchParams.get('week') || '1';
    const result = await client.getNFLTeamGameStats(season, week);

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
            week: parseInt(week),
            count: result.data.length,
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handlePlayerGameStats(client, env, url, corsHeaders) {
    const season = url.searchParams.get('season') || '2025';
    const week = url.searchParams.get('week') || '1';
    const result = await client.getNFLPlayerGameStats(season, week);

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
            week: parseInt(week),
            count: result.data.length,
            sport: 'NFL',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
