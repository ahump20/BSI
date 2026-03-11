/**
 * Pages Function: /api/platform-health
 * Same-origin proxy for the public BSI health endpoint so the portfolio site
 * can show status without cross-origin browser errors.
 */

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestGet: PagesFunction = async () => {
  try {
    const response = await fetch('https://blazesportsintel.com/api/health', {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ status: 'degraded' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders,
        },
      });
    }

    const data = (await response.json()) as { status?: string };
    return new Response(
      JSON.stringify({
        status: data.status === 'ok' ? 'ok' : 'degraded',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders,
        },
      }
    );
  } catch {
    return new Response(JSON.stringify({ status: 'offline' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
