import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const requirePro = createRouteMatcher([
  '/baseball/ncaab/game/:gameId/advanced(.*)',
  '/api/v1/(.*)/advanced(.*)'
]);

function extractEntitlements(sessionClaims: Record<string, unknown> | null | undefined): string[] {
  if (!sessionClaims || typeof sessionClaims !== 'object') return [];
  const publicMetadata = (sessionClaims as Record<string, unknown>).publicMetadata as
    | Record<string, unknown>
    | undefined;
  const entitlements = publicMetadata?.entitlements;
  if (Array.isArray(entitlements)) {
    return entitlements.map((value) => String(value));
  }
  return [];
}

const DIAMOND_PRO_CODE = 'diamond-pro';

export default clerkMiddleware(async (auth, req) => {
  if (!requirePro(req)) {
    return;
  }

  const session = await auth();
  const { userId, sessionClaims, redirectToSignIn } = session;

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  const entitlements = extractEntitlements(sessionClaims);
  const isPro = entitlements.includes(DIAMOND_PRO_CODE);

  if (isPro) {
    return;
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Diamond Pro subscription required for advanced endpoints.' },
      { status: 402 }
    );
  }

  const subscribeUrl = new URL('/account/subscribe', req.url);
  subscribeUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(subscribeUrl);
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/(.*)']
};
