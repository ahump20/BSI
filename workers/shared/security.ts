/**
 * Shared security middleware for BSI Workers.
 *
 * Applies security headers to all HTTP responses. Use `securityMiddleware`
 * for Hono apps and `applySecurityHeaders` for raw Response objects.
 *
 * Headers applied:
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *   - Permissions-Policy: camera=(), microphone=(), geolocation=()
 */

import type { MiddlewareHandler } from 'hono';

export const REQUIRED_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Hono middleware — applies security headers to all responses after next().
 */
export const securityMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  for (const [key, value] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    c.res.headers.set(key, value);
  }
};

/**
 * Helper for raw Response objects (non-Hono workers).
 * Mutates the response headers in-place.
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
