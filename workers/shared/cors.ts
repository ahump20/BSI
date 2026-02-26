import type { Env } from './types';
import { PROD_ORIGINS, DEV_ORIGINS, ALLOWED_PAGES_DOMAINS } from './constants';

export function corsOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') ?? '';
  if (PROD_ORIGINS.has(origin)) return origin;
  if (ALLOWED_PAGES_DOMAINS.some(d => origin === `https://${d}` || origin.endsWith(`.${d}`))) return origin;
  if (env.ENVIRONMENT !== 'production' && DEV_ORIGINS.has(origin)) return origin;
  return '';
}

export function corsHeaders(request: Request, env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(request, env),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-BSI-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function mcpCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
