'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type GameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' | 'DELAYED';

export type LiveGameTeam = {
  id: string;
  name: string;
  shortName: string;
  displayName: string;
  abbreviation: string | null;
  logo: string | null;
  record: string | null;
  score: number | null;
  rank: number | null;
  conferenceId: string | null;
  conferenceName: string | null;
};

export type LiveGame = {
  id: string;
  status: GameStatus;
  statusText: string | null;
  startTime: string | null;
  venue: string | null;
  location: {
    city: string | null;
    state: string | null;
  } | null;
  network: string | null;
  inning: number | null;
  inningHalf: 'TOP' | 'BOTTOM' | null;
  counts: {
    balls: number | null;
    strikes: number | null;
    outs: number | null;
  };
  conferenceCompetition: boolean;
  home: LiveGameTeam;
  away: LiveGameTeam;
  lineScore: Array<{
    inning: number;
    home: number | null;
    away: number | null;
  }>;
};

export type LiveGamesMeta = {
  cacheKey: string;
  cacheStatus: 'hit' | 'miss';
  cacheTTLSeconds: number;
  conference: string | null;
  date: string;
  fetchedAt: string;
  provider: 'espn';
  upstreamUrl: string;
};

export type LiveGamesResponse = {
  meta: LiveGamesMeta;
  games: LiveGame[];
};

export type UseLiveGamesOptions = {
  date?: string;
  conference?: string;
  refreshIntervalMs?: number;
  enabled?: boolean;
};

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/v1/games/live';

export function useLiveCollegeBaseballGames(options?: UseLiveGamesOptions) {
  const { date, conference, refreshIntervalMs = 60000, enabled = true } = options ?? {};

  const [data, setData] = useState<LiveGamesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (date) {
      params.set('date', date);
    }
    if (conference) {
      params.set('conference', conference);
    }
    const query = params.toString();
    return query.length > 0 ? `?${query}` : '';
  }, [date, conference]);

  const fetchLiveGames = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`${API_ENDPOINT}${queryString}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to load live games (status ${response.status})`);
      }

      const payload = (await response.json()) as LiveGamesResponse;

      if (!isMountedRef.current) {
        return;
      }

      setData(payload);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      setError(err instanceof Error ? err : new Error('Unknown error while loading live games'));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, queryString]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;

    void fetchLiveGames();

    if (refreshIntervalMs > 0) {
      intervalId = setInterval(() => {
        void fetchLiveGames();
      }, refreshIntervalMs);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, fetchLiveGames, refreshIntervalMs]);

  const refresh = useCallback(() => {
    void fetchLiveGames();
  }, [fetchLiveGames]);

  return {
    data,
    games: data?.games ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    refresh
  };
}
