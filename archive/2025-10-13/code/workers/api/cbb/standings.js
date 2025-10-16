/**
 * CBB Standings API - Cloudflare Pages Function
 * Dedicated endpoint for /api/cbb/standings
 * Proxies to SportsDataIO CBB API with caching
 */

import { onRequest as routeHandler } from './[[route]].js';

/**
 * CBB Standings endpoint
 * GET /api/cbb/standings?season=2025&conference=SEC
 */
export async function onRequestGet(context) {
    // Create modified context with route set to 'standings'
    const modifiedContext = {
        ...context,
        params: {
            ...context.params,
            route: ['standings']
        }
    };

    return await routeHandler(modifiedContext);
}
