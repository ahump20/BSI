/**
 * CFB (College Football) API Endpoints
 * Proxies SportsDataIO CFB API with caching and error handling
 * Focuses on SEC teams per Blaze Intelligence requirements
 */

import { SportsDataIOClient } from '../../../lib/sportsdata/client.js';
import {
    adaptCFBTeam,
    adaptCFBStanding,
    adaptCFBPlayer,
    adaptCFBGame,
    adaptCFBTeamSeasonStats,
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
                '/api/cfb/standings?season=2025&conference=SEC',
                '/api/cfb/teams',
                '/api/cfb/players?teamId=1',
                '/api/cfb/depth-charts',
                '/api/cfb/games?season=2025&week=5',
                '/api/cfb/team-stats?season=2025',
                '/api/cfb/player-stats?season=2025',
                '/api/cfb/team-game-stats?season=2025&week=5',
                '/api/cfb/player-game-stats?season=2025&week=5'
            ]
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('CFB API Error:', error);
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
    const conference = url.searchParams.get('conference'); // e.g., 'SEC'
    const refresh = url.searchParams.get('refresh') === 'true';

    // Fetch from API
    const result = await client.getCFBStandings(season);

    if (!result.success) {
        await client.logSync('CFB', 'standings', season, 'ERROR', 0, result.error);
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
            const standingsToStore = standings.map(s => adaptCFBStanding(s, season));
            await upsertStandings(env.DB, standingsToStore);
            await client.logSync('CFB', 'standings', season, 'SUCCESS', standingsToStore.length, null, result.duration, result.retries);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: standings,
        meta: {
            season: parseInt(season),
            sport: 'CFB',
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
    const result = await client.getCFBTeams();

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
            const teamsToStore = teams.map(adaptCFBTeam);
            await upsertTeams(env.DB, teamsToStore);
            await client.logSync('CFB', 'teams', null, 'SUCCESS', teamsToStore.length);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: teams,
        meta: {
            count: teams.length,
            sport: 'CFB',
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

    // Note: SportsDataIO CFB API may not have a players endpoint
    // This is a placeholder for when/if they add it
    return new Response(JSON.stringify({
        error: 'CFB players endpoint not yet available',
        note: 'Use depth-charts endpoint for roster information'
    }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleDepthCharts(client, env, url, corsHeaders) {
    const result = await client.getCFBDepthCharts();

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: result.data,
        meta: {
            sport: 'CFB',
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
    const week = url.searchParams.get('week');

    const result = await client.getCFBGames(season);

    if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Filter by week if specified
    let games = result.data;
    if (week) {
        games = games.filter(g => g.Week === parseInt(week));
    }

    // Store games in D1
    if (env.DB && !result.cached) {
        try {
            const gamesToStore = games.map(g => adaptCFBGame(g, season));
            await upsertGames(env.DB, gamesToStore);
            await client.logSync('CFB', 'games', season, 'SUCCESS', gamesToStore.length);
        } catch (dbError) {
            console.error('Failed to update D1:', dbError);
        }
    }

    return new Response(JSON.stringify({
        data: games,
        meta: {
            season: parseInt(season),
            week: week ? parseInt(week) : null,
            count: games.length,
            sport: 'CFB',
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
    const conference = url.searchParams.get('conference');

    const result = await client.getCFBTeamSeasonStats(season);

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
            sport: 'CFB',
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
    const result = await client.getCFBPlayerSeasonStats(season);

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
            sport: 'CFB',
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
    const result = await client.getCFBTeamGameStats(season, week);

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
            sport: 'CFB',
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
    const result = await client.getCFBPlayerGameStats(season, week);

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
            sport: 'CFB',
            cached: result.cached || false,
            timestamp: new Date().toISOString()
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
