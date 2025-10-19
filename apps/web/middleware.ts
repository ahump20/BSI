import { NextRequest, NextResponse } from 'next/server';

type RedirectRule = {
  match: (pathname: string) => boolean;
  destination?: string;
  status: 301 | 302 | 307 | 308 | 410;
};

const redirectRules: RedirectRule[] = [
  {
    match: (pathname) => pathname === '/analytics.html',
    destination: '/baseball/ncaab',
    status: 301,
  },
  {
    match: (pathname) => pathname === '/copilot.html',
    destination: '/',
    status: 301,
  },
  {
    match: (pathname) => pathname === '/mlb' || pathname.startsWith('/mlb/'),
    destination: '/',
    status: 301,
  },
  {
    match: (pathname) => pathname === '/nfl' || pathname.startsWith('/nfl/'),
    destination: '/',
    status: 301,
  },
  {
    match: (pathname) => pathname === '/cfb' || pathname.startsWith('/cfb/'),
    destination: '/',
    status: 301,
  },
  {
    match: (pathname) => pathname === '/cbb' || pathname.startsWith('/cbb/'),
    destination: '/',
    status: 301,
  },
  {
    match: (pathname) => pathname.startsWith('/api/mlb'),
    destination: '/api/v1/games',
    status: 301,
  },
  {
    match: (pathname) => pathname.startsWith('/api/ncaa'),
    destination: '/api/v1/games',
    status: 301,
  },
  {
    match: (pathname) =>
      pathname.startsWith('/api/nfl') ||
      pathname.startsWith('/api/nba') ||
      pathname.startsWith('/api/mls') ||
      pathname.startsWith('/api/nhl'),
    status: 410,
  },
];

function handleRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  for (const rule of redirectRules) {
    if (rule.match(pathname)) {
      if (rule.status === 410) {
        return new NextResponse(null, { status: 410 });
      }

      if (!rule.destination) {
        continue;
      }

      const url = request.nextUrl.clone();
      url.pathname = rule.destination;
      return NextResponse.redirect(url, rule.status);
    }
  }

  return null;
}

function handleAuthGating(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const tier = request.nextUrl.searchParams.get('tier');

  if (pathname.startsWith('/api/v1/') && tier === 'pro') {
    const token = request.headers.get('x-diamond-pro-token');
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Diamond Pro access token required.' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const redirectResponse = handleRedirect(request);
  if (redirectResponse) {
    return redirectResponse;
  }

  const authResponse = handleAuthGating(request);
  if (authResponse) {
    return authResponse;
  }

  const response = NextResponse.next();

  if (
    request.method === 'GET' &&
    request.headers.get('accept')?.includes('text/html') &&
    !request.nextUrl.pathname.startsWith('/api/')
  ) {
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
