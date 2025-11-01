import { LeverageEquivalencyIndex, type PlayContext } from '../../lib/lei';
import { getAllFamousPlays, validateLEIScoring } from '../../lib/lei/examples';

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Redirect legacy domain to canonical
    if (url.hostname === 'blazeintelligence.com') {
      url.hostname = 'blazesportsintel.com';
      return Response.redirect(url.toString(), 301);
    }
    // Remove .html extensions
    if (url.pathname.endsWith('.html')) {
      url.pathname = url.pathname.replace(/\.html$/, '');
      return Response.redirect(url.toString(), 301);
    }

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRoute(req, url);
    }

    // Proceed to origin (Next.js/Pages) and set security headers
    const res = await fetch(req);
    const hdrs = new Headers(res.headers);
    hdrs.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    hdrs.set('X-Content-Type-Options', 'nosniff');
    hdrs.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return new Response(res.body, { status: res.status, headers: hdrs });
  }
} satisfies ExportedHandler;

/**
 * Handle API routes for LEI computations
 */
async function handleAPIRoute(req: Request, url: URL): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST /api/lei - Compute LEI for a play
    if (url.pathname === '/api/lei' && req.method === 'POST') {
      const body = await req.json() as PlayContext;

      // Validate required fields
      if (!body.sport || !body.playoff_round ||
          body.pre_play_win_prob === undefined ||
          body.post_play_win_prob === undefined) {
        return jsonResponse(
          { error: 'Missing required fields: sport, playoff_round, pre_play_win_prob, post_play_win_prob' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Validate win probabilities
      if (body.pre_play_win_prob < 0 || body.pre_play_win_prob > 1 ||
          body.post_play_win_prob < 0 || body.post_play_win_prob > 1) {
        return jsonResponse(
          { error: 'Win probabilities must be between 0 and 1' },
          { status: 400, headers: corsHeaders }
        );
      }

      const calculator = new LeverageEquivalencyIndex();
      const result = calculator.compute(body);

      return jsonResponse(result, { headers: corsHeaders });
    }

    // GET /api/lei/examples - Get famous playoff moments
    if (url.pathname === '/api/lei/examples' && req.method === 'GET') {
      const plays = getAllFamousPlays();
      return jsonResponse({ plays }, { headers: corsHeaders });
    }

    // GET /api/lei/validate - Validate LEI scoring calibration
    if (url.pathname === '/api/lei/validate' && req.method === 'GET') {
      const validation = validateLEIScoring();
      return jsonResponse(validation, { headers: corsHeaders });
    }

    // Route not found
    return jsonResponse(
      { error: 'Not found', availableEndpoints: [
        'POST /api/lei',
        'GET /api/lei/examples',
        'GET /api/lei/validate'
      ]},
      { status: 404, headers: corsHeaders }
    );

  } catch (error) {
    console.error('API error:', error);
    return jsonResponse(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
