/**
 * Next.js Middleware for Request Logging and Monitoring
 *
 * This middleware runs on every request and:
 * - Logs request details
 * - Measures response time
 * - Adds correlation IDs
 * - Records metrics
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Generate correlation ID for request tracing
  const correlationId =
    request.headers.get('x-correlation-id') ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  // Clone the request headers and add correlation ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-correlation-id', correlationId);

  // Log request (in production, this would use Winston)
  if (process.env.NODE_ENV === 'production') {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Incoming request',
        correlationId,
        http: {
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        },
      })
    );
  }

  // Continue with the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add correlation ID to response headers
  response.headers.set('x-correlation-id', correlationId);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Calculate and log response time
  const duration = Date.now() - startTime;

  if (process.env.NODE_ENV === 'production') {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Request completed',
        correlationId,
        http: {
          method: request.method,
          url: request.url,
          duration: `${duration}ms`,
        },
      })
    );
  }

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
