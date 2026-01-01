/**
 * CFB Previews API
 *
 * GET /api/college-football/previews - List upcoming game previews
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
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = await fetch(`${CFB_AI_WORKER}/previews`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BSI-Pages-Function/1.0',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Previews service unavailable',
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
    console.error('Previews API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch previews',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
