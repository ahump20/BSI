/**
 * BLAZE SPORTS INTEL - SPORTS ANALYTICS API
 * Deep South Sports Authority Platform
 * Cloudflare Function for sports data processing
 */

export async function onRequest(context) {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    try {
        const url = new URL(request.url);
        const sport = url.searchParams.get('sport') || 'all';
        const team = url.searchParams.get('team');
        const league = url.searchParams.get('league');

        // Deep South Sports Analytics Data
        const sportsData = {
            baseball: {
                teams: ['Cardinals', 'Astros', 'Rangers', 'Braves'],
                leagues: ['MLB', 'SEC', 'Perfect Game'],
                focus: 'Biomechanics, Pitch Analytics, Youth Development'
            },
            football: {
                teams: ['Titans', 'Saints', 'Falcons', 'Texans'],
                leagues: ['NFL', 'SEC', 'Texas HS'],
                focus: 'Performance Analytics, Recruitment, Friday Night Lights'
            },
            basketball: {
                teams: ['Grizzlies', 'Hawks', 'Pelicans', 'Spurs'],
                leagues: ['NBA', 'SEC', 'AAU'],
                focus: 'Player Development, Performance Metrics'
            },
            track: {
                teams: ['Elite Programs', 'University Teams'],
                leagues: ['UIL', 'SEC', 'NCAA'],
                focus: 'Performance Analysis, Olympic Development'
            }
        };

        let response;

        if (sport === 'all') {
            response = {
                platform: 'Blaze Sports Intel - Deep South Authority',
                tagline: 'Transform Data Into Championships',
                coverage: 'Texas • SEC • Every Player • Every Level',
                sports: sportsData,
                analytics: {
                    realTimeMetrics: true,
                    biomechanicsAnalysis: true
                },
                timestamp: new Date().toISOString()
            };
        } else if (sportsData[sport]) {
            response = {
                sport: sport,
                data: sportsData[sport],
                analytics: {
                    available: true,
                    realTime: true,
                    depth: 'Championship Level'
                },
                timestamp: new Date().toISOString()
            };
        } else {
            return new Response(JSON.stringify({
                error: 'Sport not found',
                availableSports: Object.keys(sportsData)
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        return new Response(JSON.stringify(response), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}