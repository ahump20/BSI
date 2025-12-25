/**
 * CFB Recaps API
 *
 * GET /api/college-football/recaps - List completed game recaps
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
    const response = await fetch(`${CFB_AI_WORKER}/recaps`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BSI-Pages-Function/1.0',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Recaps service unavailable',
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
    console.error('Recaps API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch recaps',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
