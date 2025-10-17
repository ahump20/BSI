import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

export type SessionData = {
  userId: string;
  email?: string;
  name?: string;
  roles: string[];
  expiresAt: number;
};

const SESSION_COOKIE_NAME = 'bsi_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-only-secret';

function signPayload(payload: string) {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function decodeSession(value?: string | null): SessionData | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  if (expected !== signature) {
    return null;
  }
  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const data = JSON.parse(json) as SessionData;
    if (!data || typeof data.userId !== 'string' || typeof data.expiresAt !== 'number') {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function getSession(): SessionData | null {
  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(raw);
  if (!session) {
    return null;
  }
  if (session.expiresAt <= Date.now()) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }
  return session;
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export function persistSession(session: SessionData) {
  const maxAgeSeconds = Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000));
  cookies().set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds
  });
}

export { SESSION_COOKIE_NAME };
