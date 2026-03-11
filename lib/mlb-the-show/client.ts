import type {
  DDBuildRecord,
  ShowCardDetail,
  ShowCardSummary,
  ShowCaptainCard,
  ShowCollectionDetail,
  ShowCollectionSummary,
  ShowHistoryPoint,
  ShowHistorySummary,
  ShowMarketCurrent,
  ShowMarketOverview,
  ShowSourceStatus,
  ShowWatchEvent,
} from './types';

export interface ShowCardsResponse {
  cards: (ShowCardSummary & { market: ShowMarketCurrent | null })[];
  page: number;
  perPage: number;
  totalPages: number;
  totalCards: number;
  supportedFilters: string[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
    partial_catalog?: boolean;
    source_status: ShowSourceStatus;
  };
}

export interface ShowCardDetailResponse {
  detail: ShowCardDetail;
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
  };
}

export interface ShowHistoryResponse {
  cardId: string;
  metric: 'sell' | 'buy' | 'spread' | 'sale';
  points: ShowHistoryPoint[];
  summary: ShowHistorySummary;
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
  };
}

export interface ShowCollectionDetailResponse {
  detail: ShowCollectionDetail;
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
  };
}

export interface ShowWatchEventsResponse {
  events: ShowWatchEvent[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
  };
}

export interface ShowMarketOverviewResponse {
  overview: ShowMarketOverview;
  collections: ShowCollectionSummary[];
  captains: ShowCaptainCard[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
    source_status: ShowSourceStatus;
  };
}

export interface ShowBuildResponse {
  build: DDBuildRecord;
  meta: {
    source: string;
    fetched_at: string;
    timezone: string;
    degraded?: boolean;
  };
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchShowStatus() {
  return getJson<{ status: ShowSourceStatus; meta: Record<string, unknown> }>('/api/mlb/the-show-26/source-status');
}

export function fetchShowOverview() {
  return getJson<ShowMarketOverviewResponse>('/api/mlb/the-show-26/market/overview');
}

export function fetchShowCollections() {
  return getJson<{
    collections: ShowCollectionSummary[];
    meta: {
      source: string;
      fetched_at: string;
      timezone: string;
      degraded?: boolean;
    };
  }>('/api/mlb/the-show-26/collections');
}

export function fetchShowCollectionDetail(collectionId: string, search?: URLSearchParams) {
  const suffix = search?.toString() ? `?${search.toString()}` : '';
  return getJson<ShowCollectionDetailResponse>(`/api/mlb/the-show-26/collections/${encodeURIComponent(collectionId)}${suffix}`);
}

export function fetchShowCards(search: URLSearchParams) {
  return getJson<ShowCardsResponse>(`/api/mlb/the-show-26/cards?${search.toString()}`);
}

export function fetchShowCardDetail(cardId: string) {
  return getJson<ShowCardDetailResponse>(`/api/mlb/the-show-26/cards/${encodeURIComponent(cardId)}`);
}

export function fetchShowCardHistory(cardId: string, params: URLSearchParams) {
  return getJson<ShowHistoryResponse>(`/api/mlb/the-show-26/cards/${encodeURIComponent(cardId)}/history?${params.toString()}`);
}

export function fetchShowWatchEvents(params?: URLSearchParams) {
  const suffix = params?.toString() ? `?${params.toString()}` : '';
  return getJson<ShowWatchEventsResponse>(`/api/mlb/the-show-26/watch-events${suffix}`);
}

export function fetchTeamBuilderReference() {
  return getJson<{
    slots: Array<{
      key: string;
      label: string;
      group: 'lineup' | 'bench' | 'rotation' | 'bullpen' | 'captain';
      accepts: string[];
    }>;
    captains: ShowCaptainCard[];
    collections: ShowCollectionSummary[];
    parallelLevels: number[];
    parallelMods: string[];
    meta: { source: string; fetched_at: string; timezone: string; degraded?: boolean };
  }>('/api/mlb/the-show-26/team-builder/reference');
}

export function saveBuild(body: { title: string; captainCardId: string | null; cards: unknown[] }) {
  return getJson<ShowBuildResponse>('/api/mlb/the-show-26/builds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function fetchBuild(buildId: string) {
  return getJson<ShowBuildResponse>(`/api/mlb/the-show-26/builds/${encodeURIComponent(buildId)}`);
}
