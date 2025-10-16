/**
 * CFB Standings API - Cloudflare Pages Function
 * Dedicated endpoint for /api/cfb/standings
 * Proxies to SportsDataIO CFB API with caching
 */

import { onRequest as routeHandler } from './[[route]].js';

/**
 * CFB Standings endpoint
 * GET /api/cfb/standings?season=2025&conference=SEC
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
