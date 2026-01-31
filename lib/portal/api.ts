/**
 * Transfer Portal API Client
 *
 * Client-side API wrapper for fetching portal data.
 * Handles caching, error states, and real-time updates.
 */

import type {
  PortalEntry,
  PortalFilters,
  PortalApiResponse,
  PortalFreshnessResponse,
  PortalSport,
} from './types';

const API_BASE = '/api/portal';

interface FetchOptions {
  signal?: AbortSignal;
  cache?: RequestCache;
}

/**
 * Fetch portal entries with filters (v2 — reads from D1)
 */
export async function fetchPortalEntries(
  sport: PortalSport,
  filters: Partial<PortalFilters> = {},
  options: FetchOptions & {
    since?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<PortalApiResponse> {
  const params = new URLSearchParams();
  params.set('sport', sport);

  if (filters.position) params.set('position', filters.position);
  if (filters.conference) params.set('conference', filters.conference);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.minStars) params.set('minStars', String(filters.minStars));
  if (options.since) params.set('since', options.since);
  if (options.sort) params.set('sort', options.sort);
  if (options.order) params.set('order', options.order);
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));

  const response = await fetch(`${API_BASE}/v2/entries?${params.toString()}`, {
    signal: options.signal,
    cache: options.cache ?? 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Portal API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch freshness status and recent changes
 */
export async function fetchPortalFreshness(
  sport?: PortalSport,
  limit = 20,
  options: FetchOptions = {}
): Promise<PortalFreshnessResponse> {
  const params = new URLSearchParams();
  if (sport) params.set('sport', sport);
  params.set('limit', String(limit));

  const response = await fetch(`${API_BASE}/freshness?${params.toString()}`, {
    signal: options.signal,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Freshness API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch single portal entry by ID
 */
export async function fetchPortalEntry(
  id: string,
  options: FetchOptions = {}
): Promise<PortalEntry> {
  const response = await fetch(`${API_BASE}/player/${id}`, {
    signal: options.signal,
    cache: options.cache ?? 'default',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Portal API Error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { data: PortalEntry };
  return data.data;
}

/**
 * Subscribe to portal alerts
 */
export async function subscribeToAlerts(
  email: string,
  preferences: {
    sport?: PortalSport;
    conferences?: string[];
    positions?: string[];
    tier?: 'free' | 'pro';
  }
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/alerts/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, ...preferences }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(error.message || 'Failed to subscribe');
  }

  return response.json() as Promise<{ success: boolean; message: string }>;
}

/**
 * Fetch trending portal entries
 */
export async function fetchTrendingEntries(sport: PortalSport, limit = 10): Promise<PortalEntry[]> {
  const response = await fetch(`${API_BASE}/trending?sport=${sport}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Portal API Error: ${response.status}`);
  }

  const data = (await response.json()) as { data: PortalEntry[] };
  return data.data;
}

/**
 * Fetch portal stats summary
 */
export async function fetchPortalStats(sport: PortalSport): Promise<{
  total: number;
  in_portal: number;
  committed: number;
  withdrawn: number;
  last_updated: string;
}> {
  const response = await fetch(`${API_BASE}/stats?sport=${sport}`);

  if (!response.ok) {
    throw new Error(`Portal API Error: ${response.status}`);
  }

  return response.json() as Promise<{
    total: number;
    in_portal: number;
    committed: number;
    withdrawn: number;
    last_updated: string;
  }>;
}

/**
 * Search portal entries
 */
export async function searchPortal(query: string, sport?: PortalSport): Promise<PortalEntry[]> {
  const params = new URLSearchParams({ q: query });
  if (sport) params.set('sport', sport);

  const response = await fetch(`${API_BASE}/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Portal API Error: ${response.status}`);
  }

  const data = (await response.json()) as { data: PortalEntry[] };
  return data.data;
}
