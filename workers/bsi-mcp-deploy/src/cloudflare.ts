/**
 * Cloudflare API Integration
 * Handles queries for Workers, KV, D1, and R2 resources
 */

import type { Env } from './types';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const ACCOUNT_ID = 'a12cb329d84130460eed99b816e4d0d3';

function cfHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface CFResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
}

/**
 * List all Workers in the account
 */
export async function listWorkers(env: Env): Promise<string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return 'Error: CLOUDFLARE_API_TOKEN not configured';
  }

  const url = `${CF_API_BASE}/accounts/${ACCOUNT_ID}/workers/scripts`;
  const response = await fetch(url, {
    headers: cfHeaders(env.CLOUDFLARE_API_TOKEN),
  });

  if (!response.ok) {
    const error = await response.text();
    return `Error listing workers: ${response.status} - ${error}`;
  }

  const data = (await response.json()) as CFResponse<Array<{ id: string; modified_on: string }>>;

  if (!data.success) {
    return `Error: ${data.errors.map((e) => e.message).join(', ')}`;
  }

  const workers = data.result
    .sort((a, b) => new Date(b.modified_on).getTime() - new Date(a.modified_on).getTime())
    .slice(0, 20)
    .map((w) => `- ${w.id} (modified: ${new Date(w.modified_on).toLocaleDateString()})`)
    .join('\n');

  return `Cloudflare Workers (${data.result.length} total, showing 20 most recent):\n${workers}`;
}

/**
 * List KV namespaces
 */
export async function listKVNamespaces(env: Env): Promise<string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return 'Error: CLOUDFLARE_API_TOKEN not configured';
  }

  const url = `${CF_API_BASE}/accounts/${ACCOUNT_ID}/storage/kv/namespaces`;
  const response = await fetch(url, {
    headers: cfHeaders(env.CLOUDFLARE_API_TOKEN),
  });

  if (!response.ok) {
    const error = await response.text();
    return `Error listing KV namespaces: ${response.status} - ${error}`;
  }

  const data = (await response.json()) as CFResponse<Array<{ id: string; title: string }>>;

  if (!data.success) {
    return `Error: ${data.errors.map((e) => e.message).join(', ')}`;
  }

  const namespaces = data.result.map((ns) => `- ${ns.title} (${ns.id})`).join('\n');

  return `KV Namespaces (${data.result.length}):\n${namespaces}`;
}

/**
 * List D1 databases
 */
export async function listD1Databases(env: Env): Promise<string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return 'Error: CLOUDFLARE_API_TOKEN not configured';
  }

  const url = `${CF_API_BASE}/accounts/${ACCOUNT_ID}/d1/database`;
  const response = await fetch(url, {
    headers: cfHeaders(env.CLOUDFLARE_API_TOKEN),
  });

  if (!response.ok) {
    const error = await response.text();
    return `Error listing D1 databases: ${response.status} - ${error}`;
  }

  const data = (await response.json()) as CFResponse<
    Array<{ uuid: string; name: string; created_at: string }>
  >;

  if (!data.success) {
    return `Error: ${data.errors.map((e) => e.message).join(', ')}`;
  }

  const databases = data.result
    .map((db) => `- ${db.name} (${db.uuid})`)
    .join('\n');

  return `D1 Databases (${data.result.length}):\n${databases || '  No databases found'}`;
}

/**
 * List R2 buckets
 */
export async function listR2Buckets(env: Env): Promise<string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return 'Error: CLOUDFLARE_API_TOKEN not configured';
  }

  const url = `${CF_API_BASE}/accounts/${ACCOUNT_ID}/r2/buckets`;
  const response = await fetch(url, {
    headers: cfHeaders(env.CLOUDFLARE_API_TOKEN),
  });

  if (!response.ok) {
    const error = await response.text();
    return `Error listing R2 buckets: ${response.status} - ${error}`;
  }

  const data = (await response.json()) as CFResponse<{ buckets: Array<{ name: string; creation_date: string }> }>;

  if (!data.success) {
    return `Error: ${data.errors.map((e) => e.message).join(', ')}`;
  }

  const buckets = data.result.buckets
    .map((b) => `- ${b.name} (created: ${new Date(b.creation_date).toLocaleDateString()})`)
    .join('\n');

  return `R2 Buckets (${data.result.buckets.length}):\n${buckets || '  No buckets found'}`;
}

/**
 * Get Worker routes for a domain
 */
export async function getWorkerRoutes(env: Env, domain: string): Promise<string> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return 'Error: CLOUDFLARE_API_TOKEN not configured';
  }

  // First get zones to find the zone ID
  const zonesUrl = `${CF_API_BASE}/zones?name=${domain}`;
  const zonesResponse = await fetch(zonesUrl, {
    headers: cfHeaders(env.CLOUDFLARE_API_TOKEN),
  });

  if (!zonesResponse.ok) {
    return `Error finding zone for ${domain}`;
  }

  const zonesData = (await zonesResponse.json()) as CFResponse<Array<{ id: string; name: string }>>;

  if (!zonesData.success || zonesData.result.length === 0) {
    return `Zone not found for domain: ${domain}`;
  }

  const zoneId = zonesData.result[0].id;

  // Get routes for the zone
  const routesUrl = `${CF_API_BASE}/zones/${zoneId}/workers/routes`;
  const routesResponse = await fetch(routesUrl, {
    headers: cfHeaders(env.CLOUDFLARE_API_TOKEN),
  });

  if (!routesResponse.ok) {
    const error = await routesResponse.text();
    return `Error listing routes: ${routesResponse.status} - ${error}`;
  }

  const routesData = (await routesResponse.json()) as CFResponse<
    Array<{ id: string; pattern: string; script: string }>
  >;

  if (!routesData.success) {
    return `Error: ${routesData.errors.map((e) => e.message).join(', ')}`;
  }

  const routes = routesData.result
    .map((r) => `- ${r.pattern} -> ${r.script || '(no worker)'}`)
    .join('\n');

  return `Worker Routes for ${domain} (${routesData.result.length}):\n${routes || '  No routes found'}`;
}
