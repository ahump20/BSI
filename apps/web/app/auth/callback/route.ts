import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeCodeForTokens,
  parseIdToken,
  ensureAuth0Roles,
  getUserRoles,
  assignRoleToUser,
  sanitizeReturnTo
} from '../../../lib/auth0';
import { persistSession } from '../../../lib/session';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'bsi_auth_state';
const RETURN_COOKIE = 'bsi_return_to';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const returnToCookie = cookieStore.get(RETURN_COOKIE)?.value || '/account';
  const redirectTarget = sanitizeReturnTo(returnToCookie);

  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(RETURN_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect('/account?auth=invalid_state');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = parseIdToken(tokens.id_token);

    await ensureAuth0Roles();
    let roles = await getUserRoles(profile.sub);
    if (!roles || roles.length === 0) {
      await assignRoleToUser(profile.sub, 'viewer');
      roles = await getUserRoles(profile.sub);
    }

    const session = {
      userId: profile.sub,
      email: profile.email,
      name: profile.name || profile.nickname,
      roles: roles.map((role) => role.name),
      expiresAt: Date.now() + tokens.expires_in * 1000
    } as const;

    persistSession(session);

    return NextResponse.redirect(redirectTarget);
  } catch (error) {
    console.error('[auth0] callback failed', error);
    return NextResponse.redirect('/account?auth=error');
  }
}
