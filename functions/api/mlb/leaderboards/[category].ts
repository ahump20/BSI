/**
 * Pages Function — /api/mlb/leaderboards/:category
 *
 * Fallback for MLB leaderboard requests when the Worker route is unavailable.
 */

import { ok, preflight } from '../../_utils';

interface LeaderboardResponse {
  leaderboard: {
    category: string;
    type: 'bat' | 'pit';
    season: number;
    league: string;
    position: string;
    qualified: boolean;
    sortBy: string;
    sortDirection: string;
  };
  data: unknown[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
  meta: {
    dataSource: string;
    lastUpdated: string;
    timezone: string;
    notice: string;
  };
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const category = (context.params as Record<string, string>).category || 'batting';
  const statType = url.searchParams.get('stat') === 'pit' ? 'pit' : 'bat';
  const sortBy = url.searchParams.get('sortby') || 'WAR';
  const sortDirection = url.searchParams.get('sortdir') || (sortBy === 'ERA' || sortBy === 'FIP' ? 'asc' : 'desc');
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '50');

  const response: LeaderboardResponse = {
    leaderboard: {
      category,
      type: statType,
      season: new Date().getFullYear(),
      league: url.searchParams.get('lg') || 'MLB',
      position: url.searchParams.get('pos') || 'all',
      qualified: (url.searchParams.get('qual') || 'y') === 'y',
      sortBy,
      sortDirection,
    },
    data: [],
    pagination: {
      page,
      pageSize: limit,
      totalResults: 0,
      totalPages: 0,
    },
    meta: {
      dataSource: 'FanGraphs',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      notice: 'Leaderboard data temporarily unavailable',
    },
  };

  return ok(response);
};

export const onRequestOptions: PagesFunction = async () => preflight();
