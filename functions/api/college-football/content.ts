/**
 * CFB Content API - Previews, Recaps, and Articles
 *
 * Routes:
 * - GET /api/college-football/content?type=preview|recap|analysis
 * - GET /api/college-football/content?conference=SEC
 *
 * Proxies to bsi-cfb-ai Worker for content retrieval.
 */

interface Env {
  BSI_CFB_AI?: string; // Worker binding or URL
}

const CFB_AI_WORKER = 'https://bsi-cfb-ai.ahump20.workers.dev';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Build the proxy URL to the CFB AI worker
    const proxyUrl = new URL('/articles', CFB_AI_WORKER);

    // Forward query parameters
    const type = url.searchParams.get('type');
    const conference = url.searchParams.get('conference');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');

    if (type) proxyUrl.searchParams.set('type', type);
    if (conference) proxyUrl.searchParams.set('conference', conference);
    if (limit) proxyUrl.searchParams.set('limit', limit);
    if (offset) proxyUrl.searchParams.set('offset', offset);

    const response = await fetch(proxyUrl.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BSI-Pages-Function/1.0',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Content service unavailable',
          status: response.status,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'X-Proxy-To': 'bsi-cfb-ai' },
    });
  } catch (error) {
    console.error('Content API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch content',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
