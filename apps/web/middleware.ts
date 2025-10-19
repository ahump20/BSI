import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isDiamondProRoute = createRouteMatcher([
  '/baseball/ncaab/hub(.*)',
  '/baseball/ncaab/players(.*)',
  '/baseball/ncaab/games(.*)',
  '/baseball/ncaab/teams(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isDiamondProRoute(request)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const metadata = (sessionClaims?.publicMetadata ?? {}) as {
    diamondProActive?: boolean;
  };

  const isDiamondPro = Boolean(metadata.diamondProActive);

  if (!isDiamondPro) {
    const upgradeUrl = new URL('/account?upgrade=diamond-pro', request.url);
    return NextResponse.redirect(upgradeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/baseball/ncaab/hub/:path*',
    '/baseball/ncaab/players/:path*',
    '/baseball/ncaab/games/:path*',
    '/baseball/ncaab/teams/:path*'
  ]
};
