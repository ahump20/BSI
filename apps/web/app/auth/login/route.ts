import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { buildAuthorizationUrl, sanitizeReturnTo } from '../../../lib/auth0';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'bsi_auth_state';
const RETURN_COOKIE = 'bsi_return_to';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedReturnTo = url.searchParams.get('returnTo');
  const returnTo = sanitizeReturnTo(requestedReturnTo);

  const state = randomUUID();
  const cookieStore = cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 600
  });
  cookieStore.set(RETURN_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 600
  });

  const authorizationUrl = buildAuthorizationUrl(state, returnTo);
  return NextResponse.redirect(authorizationUrl);
}
