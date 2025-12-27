/**
 * CFB Article by Slug API
 *
 * GET /api/college-football/articles/:slug - Get article by URL slug
 * Proxies to bsi-cfb-ai Worker
 */

const CFB_AI_WORKER = 'https://bsi-cfb-ai.ahump20.workers.dev';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get slug from params
    const slugParts = params.slug as string[] | undefined;
    const slug = slugParts?.join('/');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Article slug is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const response = await fetch(`${CFB_AI_WORKER}/article/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BSI-Pages-Function/1.0',
      },
    });

    if (response.status === 404) {
      return new Response(
        JSON.stringify({ error: 'Article not found', slug }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Article service unavailable',
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
    console.error('Article API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch article',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
