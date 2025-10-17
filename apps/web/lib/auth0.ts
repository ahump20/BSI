import { cache } from 'react';
import { createHash } from 'crypto';

export type Auth0TokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  scope?: string;
  expires_in: number;
  token_type: 'Bearer';
};

export type Auth0UserProfile = {
  sub: string;
  email?: string;
  name?: string;
  nickname?: string;
  picture?: string;
};

export type Auth0Role = {
  id: string;
  name: string;
  description?: string;
};

const REQUIRED_ENV_VARS = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_CALLBACK_URL',
  'AUTH0_MANAGEMENT_CLIENT_ID',
  'AUTH0_MANAGEMENT_CLIENT_SECRET'
] as const;

const roleDefinitions = [
  {
    name: 'viewer',
    description: 'Free Diamond Insights access with read-only privileges.'
  },
  {
    name: 'editor',
    description: 'Diamond Pro subscription tier with advanced scouting features.'
  },
  {
    name: 'admin',
    description: 'Internal BlazeSportsIntel staff controls and elevated access.'
  }
] satisfies Array<Pick<Auth0Role, 'name' | 'description'>>;

type RoleMap = Record<string, Auth0Role>;

type ManagementTokenCache = {
  token: string;
  expiresAt: number;
};

let managementTokenCache: ManagementTokenCache | null = null;
let cachedRoleMap: RoleMap | null = null;

function getEnv(name: (typeof REQUIRED_ENV_VARS)[number] | 'AUTH0_AUDIENCE') {
  const value = process.env[name];
  if (!value && REQUIRED_ENV_VARS.includes(name as any)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAuth0BaseUrl() {
  const domain = getEnv('AUTH0_DOMAIN');
  return `https://${domain}`;
}

export function buildAuthorizationUrl(state: string, returnTo?: string) {
  const baseUrl = new URL(`${getAuth0BaseUrl()}/authorize`);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getEnv('AUTH0_CLIENT_ID'),
    redirect_uri: getEnv('AUTH0_CALLBACK_URL'),
    scope: 'openid profile email offline_access',
    state
  });

  const audience = getEnv('AUTH0_AUDIENCE');
  if (audience) {
    params.set('audience', audience);
  }

  if (returnTo) {
    params.set('returnTo', returnTo);
  }

  baseUrl.search = params.toString();
  return baseUrl.toString();
}

export async function exchangeCodeForTokens(code: string): Promise<Auth0TokenResponse> {
  const tokenEndpoint = `${getAuth0BaseUrl()}/oauth/token`;
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: getEnv('AUTH0_CLIENT_ID'),
      client_secret: getEnv('AUTH0_CLIENT_SECRET'),
      code,
      redirect_uri: getEnv('AUTH0_CALLBACK_URL')
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Auth0 token exchange failed: ${response.status} ${response.statusText} – ${body}`);
  }

  return (await response.json()) as Auth0TokenResponse;
}

function decodeSegment(segment: string) {
  return Buffer.from(segment, 'base64url').toString('utf8');
}

export function parseIdToken(idToken: string): Auth0UserProfile {
  const parts = idToken.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid ID token received from Auth0');
  }
  const payloadJson = decodeSegment(parts[1]);
  const payload = JSON.parse(payloadJson);
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    nickname: payload.nickname,
    picture: payload.picture
  } satisfies Auth0UserProfile;
}

async function fetchManagementToken(): Promise<string> {
  if (managementTokenCache && managementTokenCache.expiresAt > Date.now()) {
    return managementTokenCache.token;
  }

  const response = await fetch(`${getAuth0BaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: getEnv('AUTH0_MANAGEMENT_CLIENT_ID'),
      client_secret: getEnv('AUTH0_MANAGEMENT_CLIENT_SECRET'),
      audience: `${getAuth0BaseUrl()}/api/v2/`
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to obtain Auth0 management token: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as { access_token: string; expires_in: number };
  managementTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in - 30) * 1000
  };

  return managementTokenCache.token;
}

async function managementFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await fetchManagementToken();
  const response = await fetch(`${getAuth0BaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Auth0 management API request failed: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

async function listRoles(): Promise<Auth0Role[]> {
  const roles = await managementFetch<Auth0Role[]>('/api/v2/roles?per_page=100');
  return roles;
}

export const ensureAuth0Roles = cache(async (): Promise<RoleMap> => {
  if (cachedRoleMap) {
    return cachedRoleMap;
  }

  const existingRoles = await listRoles();
  const byName = new Map(existingRoles.map((role) => [role.name, role] as const));

  for (const definition of roleDefinitions) {
    if (!byName.has(definition.name)) {
      const role = await managementFetch<Auth0Role>('/api/v2/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: definition.name,
          description: definition.description
        })
      });
      byName.set(role.name, role);
    }
  }

  const roleMap: RoleMap = {};
  for (const definition of roleDefinitions) {
    const role = byName.get(definition.name);
    if (!role) {
      throw new Error(`Unable to ensure Auth0 role: ${definition.name}`);
    }
    roleMap[definition.name] = role;
  }

  cachedRoleMap = roleMap;
  return roleMap;
});

export async function getUserRoles(userId: string): Promise<Auth0Role[]> {
  return managementFetch<Auth0Role[]>(`/api/v2/users/${encodeURIComponent(userId)}/roles`);
}

export async function assignRoleToUser(userId: string, roleName: string) {
  const roleMap = await ensureAuth0Roles();
  const role = roleMap[roleName];
  if (!role) {
    throw new Error(`Unknown role requested: ${roleName}`);
  }

  await managementFetch(`/api/v2/users/${encodeURIComponent(userId)}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      roles: [role.id]
    })
  });
}

export function hashStateValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function sanitizeReturnTo(value: string | null, fallback = '/account') {
  if (!value) return fallback;
  try {
    const url = new URL(value, 'https://dummy');
    if (url.origin !== 'https://dummy') {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
