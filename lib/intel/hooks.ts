'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import type {
  IntelGame,
  IntelMode,
  IntelSport,
  StandingsTeam,
  NewsItem,
} from './types';
import { ESPN_NEWS_MAP, ESPN_SCORES_MAP, ESPN_STANDINGS_MAP } from './types';
import {
  normalizeToIntelGames,
  normalizeCollegeBaseballGames,
  normalizeCollegeBaseballStandings,
  normalizeStandings,
  normalizeNews,
  assignTiers,
  generateSignals,
  asObject,
  asArray,
} from './normalizers';

// Re-export search hook so existing consumers importing from this file still work
export { useIntelSearch } from './use-intel-search';

// ─── Clock ──────────────────────────────────────────────────────────────────

export function useChicagoClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'America/Chicago',
  });
  const date = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/Chicago',
  });
  return { time, date, now };
}

// ─── Pinned Briefing ────────────────────────────────────────────────────────

const PIN_KEY = 'bsi-intel-pinned';

export function usePinnedBriefing() {
  const [pinned, setPinned] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(PIN_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });

  const toggle = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(PIN_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinned.has(id), [pinned]);

  return { pinned, toggle, isPinned };
}

// ─── API Fetching ───────────────────────────────────────────────────────────

function sportApiBase(sport: Exclude<IntelSport, 'all'>): string {
  const map: Record<typeof sport, string> = {
    mlb: '/api/mlb',
    nfl: '/api/nfl',
    nba: '/api/nba',
    ncaafb: '/api/cfb',
    cbb: '/api/cbb',
    d1bb: '/api/college-baseball',
  };
  return map[sport];
}

function scoresEndpoint(sport: Exclude<IntelSport, 'all'>): string {
  const base = sportApiBase(sport);
  if (sport === 'd1bb') return `${base}/scores`;
  return sport === 'nba' ? `${base}/scoreboard` : `${base}/scores`;
}

function standingsEndpoint(sport: Exclude<IntelSport, 'all'>): string {
  return `${sportApiBase(sport)}/standings`;
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

const ACTIVE_SPORTS: Exclude<IntelSport, 'all'>[] = ['nfl', 'nba', 'mlb', 'ncaafb', 'cbb', 'd1bb'];

export function useIntelDashboard(sport: IntelSport, mode: IntelMode, teamLens: string | null) {
  // Fetch scores with stable hook ordering for all supported sports.
  // SportsDataIO leagues do not fall back to ESPN.
  const scoreQueryResults = useQueries({
    queries: ACTIVE_SPORTS.map((s) => ({
      queryKey: ['intel-scores', s],
      queryFn: async () => {
        // CBB has no worker route — go straight to ESPN
        if (s === 'cbb') {
          return fetchJson<Record<string, unknown>>(ESPN_SCORES_MAP[s]);
        }
        try {
          return await fetchJson<Record<string, unknown>>(scoresEndpoint(s));
        } catch {
          if (s === 'd1bb') {
            return fetchJson<Record<string, unknown>>(ESPN_SCORES_MAP[s]);
          }
          throw new Error(`Score feed unavailable for ${s}`);
        }
      },
      refetchInterval: 30_000,
      enabled: sport === 'all' || sport === s,
    })),
  });

  const scoreQueries = useMemo(
    () => {
      const sportsToFetch = sport === 'all' ? ACTIVE_SPORTS : [sport];
      return sportsToFetch.map((s) => {
        const index = ACTIVE_SPORTS.indexOf(s);
        const result = scoreQueryResults[index];
        return {
          sport: s,
          data: result?.data as Record<string, unknown> | undefined,
          isLoading: result?.isLoading ?? false,
          isFetching: result?.isFetching ?? false,
          isError: result?.isError ?? false,
        };
      });
    },
    [sport, scoreQueryResults],
  );

  // Fetch standings for the primary sport (or NBA by default)
  const standingsSport = sport === 'all' ? 'nba' : sport;
  const standingsQuery = useQuery({
    queryKey: ['intel-standings', standingsSport],
    queryFn: async () => {
      // CBB has no worker route — go straight to ESPN
      if (standingsSport === 'cbb') {
        return fetchJson<Record<string, unknown>>(ESPN_STANDINGS_MAP[standingsSport]);
      }
      try {
        return await fetchJson<Record<string, unknown>>(standingsEndpoint(standingsSport));
      } catch {
        if (standingsSport === 'd1bb') {
          return fetchJson<Record<string, unknown>>(ESPN_STANDINGS_MAP[standingsSport]);
        }
        throw new Error(`Standings feed unavailable for ${standingsSport}`);
      }
    },
    refetchInterval: 60_000,
  });

  // Normalize games across all fetched sports
  const games = useMemo(() => {
    const allGames: IntelGame[] = [];
    for (const q of scoreQueries) {
      if (q.data) {
        if (q.sport === 'd1bb') {
          const items = asArray(q.data.data || q.data.matches || []);
          const firstItem = items.length > 0 ? asObject(items[0]) : null;
          const isHighlightly = firstItem && ('homeTeam' in firstItem || 'awayTeam' in firstItem);
          if (isHighlightly) {
            allGames.push(...normalizeCollegeBaseballGames(q.data));
          } else {
            const normalized = q.data.data ? { ...q.data, events: q.data.data } : q.data;
            allGames.push(...normalizeToIntelGames(q.sport, normalized as Record<string, unknown>));
          }
        } else {
          allGames.push(...normalizeToIntelGames(q.sport, q.data));
        }
      }
    }
    // Apply team lens
    const filtered = teamLens
      ? allGames.filter((g) =>
          g.home.abbreviation === teamLens ||
          g.away.abbreviation === teamLens ||
          g.home.name.includes(teamLens) ||
          g.away.name.includes(teamLens))
      : allGames;
    return assignTiers(filtered);
  }, [scoreQueries, teamLens]);

  // Extract standings
  const standings = useMemo<StandingsTeam[]>(() => {
    if (!standingsQuery.data) return [];
    // College baseball: use Highlightly normalizer if data has that shape
    if (standingsSport === 'd1bb' && Array.isArray(standingsQuery.data)) {
      return normalizeCollegeBaseballStandings(standingsQuery.data as unknown as Record<string, unknown>).slice(0, 15);
    }
    const all = normalizeStandings(standingsQuery.data);
    all.sort((a, b) => {
      const pctA = a.winPct ?? a.wins / Math.max(a.wins + a.losses, 1);
      const pctB = b.winPct ?? b.wins / Math.max(b.wins + b.losses, 1);
      return pctB - pctA;
    });
    return all.slice(0, 15);
  }, [standingsQuery.data, standingsSport]);

  // Derive all unique teams for team lens picker
  const allTeams = useMemo(() => {
    const set = new Set<string>();
    for (const g of games) {
      if (g.home.abbreviation) set.add(g.home.abbreviation);
      if (g.away.abbreviation) set.add(g.away.abbreviation);
    }
    return [...set].sort();
  }, [games]);

  // Generate signals
  const signals = useMemo(
    () => generateSignals(games, standings, mode),
    [games, standings, mode],
  );

  const prioritySignals = useMemo(
    () => signals.filter((s) => s.priority === 'high').slice(0, 6),
    [signals],
  );

  // Enrich games with signal counts
  const enrichedGames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of signals) {
      if (s.gameId) counts.set(s.gameId, (counts.get(s.gameId) ?? 0) + 1);
    }
    return games.map((g) => ({ ...g, signalCount: counts.get(g.id) ?? 0 }));
  }, [games, signals]);

  // Fetch news via Workers proxy (CORS-safe, KV-cached)
  const newsSportParam = sport === 'all' ? 'all' : sport;
  const newsQuery = useQuery({
    queryKey: ['intel-news', newsSportParam],
    queryFn: async () => {
      try {
        const data = await fetchJson<Array<{ sport: string; data: Record<string, unknown> }>>(
          `/api/intel/news?sport=${newsSportParam}`,
        );
        // Normalize to the shape normalizeNews expects
        return data.map((entry) => ({
          sport: entry.sport as Exclude<IntelSport, 'all'>,
          data: entry.data,
        }));
      } catch {
        // Fallback: only college baseball (d1bb) uses direct ESPN.
        const newsSports = sport === 'all' ? ACTIVE_SPORTS : [sport];
        return Promise.all(
          newsSports.map(async (s) => {
            if (s !== 'd1bb') {
              return { sport: s, data: { articles: [] } as Record<string, unknown> };
            }
            try {
              const espnData = await fetchJson<Record<string, unknown>>(ESPN_NEWS_MAP[s]);
              return { sport: s, data: espnData };
            } catch {
              return { sport: s, data: { articles: [] } as Record<string, unknown> };
            }
          }),
        );
      }
    },
    refetchInterval: 120_000,
    retry: 1,
  });

  const news = useMemo<NewsItem[]>(() => {
    if (!newsQuery.data) return [];
    return normalizeNews(newsQuery.data);
  }, [newsQuery.data]);

  // Show dashboard as soon as ANY sport has data — don't block on all 6
  const hasAnyData = scoreQueries.some((q) => !!q.data);
  const allStillLoading = scoreQueries.every((q) => q.isLoading && !q.data);
  const isLoading = !hasAnyData && allStillLoading;
  const isError = scoreQueries.length > 0 && scoreQueries.every((q) => q.isError);

  const hero = useMemo(() => enrichedGames.find((g) => g.tier === 'hero'), [enrichedGames]);
  const marquee = useMemo(() => enrichedGames.filter((g) => g.tier === 'marquee'), [enrichedGames]);
  const standard = useMemo(() => enrichedGames.filter((g) => g.tier === 'standard'), [enrichedGames]);

  // Most recent successful fetch timestamp across all score queries
  const lastFetched = useMemo(
    () => Math.max(...scoreQueryResults.map(r => r.dataUpdatedAt ?? 0)) || undefined,
    [scoreQueryResults],
  );

  return {
    games: enrichedGames,
    hero,
    marquee,
    standard,
    signals,
    prioritySignals,
    standings,
    allTeams,
    news,
    newsLoading: newsQuery.isLoading,
    isLoading,
    isError,
    lastFetched,
  };
}
