import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestGet: PagesFunction = async () => {
  const body = {
    status: 'ok',
    service: 'agent-health',
    checkedAt: new Date().toISOString(),
    timezone: 'America/Chicago',
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
    },
  });
};
