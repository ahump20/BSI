import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const goneMatchers = [/^\/api\/nfl(?:\/.*)?$/i, /^\/api\/nba(?:\/.*)?$/i];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  for (const matcher of goneMatchers) {
    if (matcher.test(pathname)) {
      return new NextResponse(null, {
        status: 410,
        headers: {
          'cache-control': 'public, max-age=3600'
        }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
