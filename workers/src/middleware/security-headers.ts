import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';

const BASE: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const DEFAULT_PERMISSIONS = 'camera=(), microphone=(), geolocation=()';
const PRESENCE_PERMISSIONS = 'camera=(self), microphone=(self), geolocation=()';

function isPresenceCoachPath(pathname: string): boolean {
  return (
    pathname === '/presence-coach' ||
    pathname.startsWith('/presence-coach/') ||
    pathname === '/api/presence-coach' ||
    pathname.startsWith('/api/presence-coach/')
  );
}

export const securityHeaders = () =>
  createMiddleware<{ Bindings: Env }>(async (c, next) => {
    await next();
    const pathname = new URL(c.req.url).pathname;
    for (const [key, value] of Object.entries(BASE)) {
      c.res.headers.set(key, value);
    }
    c.res.headers.set(
      'Permissions-Policy',
      isPresenceCoachPath(pathname) ? PRESENCE_PERMISSIONS : DEFAULT_PERMISSIONS,
    );
  });
