import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for handling redirects and canonical URL enforcement
 * This ensures a single source of truth for all routes and proper SEO
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect map for legacy and duplicate URLs
  const redirects: Record<string, string> = {
    // Legal pages - canonicalize to root-level
    '/legal/accessibility/': '/accessibility',
    '/legal/accessibility': '/accessibility',
    '/legal/cookies/': '/cookies',
    '/legal/cookies': '/cookies',
    '/legal/copyright/': '/dmca',
    '/legal/copyright': '/dmca',
    '/legal/privacy/': '/privacy',
    '/legal/privacy': '/privacy',
    '/legal/terms/': '/terms',
    '/legal/terms': '/terms',

    // Legacy analytics to features
    '/analytics': '/features',
    '/analytics/': '/features',

    // Legacy sport routes to new structure
    '/mlb': '/baseball/mlb',
    '/mlb/': '/baseball/mlb',
    '/nfl': '/football/nfl',
    '/nfl/': '/football/nfl',
    '/cbb': '/basketball',
    '/cbb/': '/basketball',
    '/cfb': '/CFP', // Redirect to CFP for now until /football/cfb is created
    '/cfb/': '/CFP',

    // Historical data consistency
    '/HistoricalData': '/historical-comparisons',
    '/historicalcomparisons': '/historical-comparisons',

    // Legacy college baseball routes
    '/college-baseball': '/baseball/ncaab',
    '/college-baseball/': '/baseball/ncaab',
    '/college-baseball/games': '/baseball/ncaab/games',
    '/college-baseball/games/': '/baseball/ncaab/games',
    '/college-baseball/teams': '/baseball/ncaab/teams',
    '/college-baseball/teams/': '/baseball/ncaab/teams',
    '/college-baseball/players': '/baseball/ncaab/players',
    '/college-baseball/players/': '/baseball/ncaab/players',
    '/college-baseball/standings': '/baseball/ncaab/standings',
    '/college-baseball/standings/': '/baseball/ncaab/standings',

    // Legacy copilot routes (once /copilot is created)
    '/copilot/endpoints': '/copilot',
    '/copilot/insights': '/copilot',
    '/copilot/search': '/copilot',

    // Legacy dashboard routes
    '/dashboards/championship': '/command-center',
    '/dashboards/manager': '/account',

    // Legacy live routes
    '/live/scores': '/command-center',
    '/live/data': '/api-docs',

    // Legacy prediction routes
    '/predictions/analytics-engine': '/CFP',
    '/predictions/stream': '/command-center',
  };

  // Check if current pathname needs redirect
  const redirectTo = redirects[pathname];
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url, 301);
  }

  // Continue with request
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * Match all routes except static assets, API routes, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, css, js)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|css|js|games/bbp-web).*)',
  ],
};
