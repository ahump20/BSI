'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  IntelGame,
  IntelMode,
  IntelSignal,
  IntelSport,
  GameStatus,
  StandingsTeam,
} from './types';
import { SIGNAL_TYPES_BY_MODE } from './sample-data';

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
    ncaafb: '/api/nfl', // CFB shares ESPN pattern
    cbb: '/api/nba',
  };
  return map[sport];
}

function scoresEndpoint(sport: Exclude<IntelSport, 'all'>): string {
  const base = sportApiBase(sport);
  return sport === 'nba' || sport === 'cbb' ? `${base}/scoreboard` : `${base}/scores`;
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Normalize ESPN Data → IntelGame ────────────────────────────────────────

function parseStatus(status: unknown): { gameStatus: GameStatus; detail?: string } {
  if (typeof status === 'string') {
    const low = status.toLowerCase();
    if (low.includes('in progress') || low.includes('in ')) return { gameStatus: 'live', detail: status };
    if (low.includes('final')) return { gameStatus: 'final', detail: status };
    return { gameStatus: 'scheduled', detail: status };
  }
  if (typeof status === 'object' && status) {
    const s = status as Record<string, unknown>;
    const type = s.type as Record<string, unknown> | undefined;
    const state = type?.state as string | undefined;
    const desc = (s.detailedState as string) || (type?.description as string) || 'Scheduled';
    if (state === 'in' || s.isLive === true) return { gameStatus: 'live', detail: desc };
    if (state === 'post' || s.isFinal === true) return { gameStatus: 'final', detail: desc };
    return { gameStatus: 'scheduled', detail: desc };
  }
  return { gameStatus: 'scheduled' };
}

function normalizeToIntelGames(sport: Exclude<IntelSport, 'all'>, data: Record<string, unknown>): IntelGame[] {
  const sb = data.scoreboard as Record<string, unknown> | undefined;
  const raw = (data.games || sb?.games || []) as Record<string, unknown>[];

  return raw.map((g, i) => {
    const teams = g.teams as Record<string, Record<string, unknown>> | undefined;
    const { gameStatus, detail } = parseStatus(g.status);

    const away = teams?.away || (g.awayTeam as Record<string, unknown>) || {};
    const home = teams?.home || (g.homeTeam as Record<string, unknown>) || {};

    return {
      id: String(g.id ?? i),
      sport,
      away: {
        name: String(away.name || 'Away'),
        abbreviation: String(away.abbreviation || ''),
        score: Number(away.score ?? 0),
        record: String(away.record || ''),
      },
      home: {
        name: String(home.name || 'Home'),
        abbreviation: String(home.abbreviation || ''),
        score: Number(home.score ?? 0),
        record: String(home.record || ''),
      },
      status: gameStatus,
      statusDetail: detail,
      venue: String(g.venue || ''),
      startTime: String(g.startTime || g.time || ''),
      tier: 'standard' as const,
      signalCount: 0,
    };
  });
}

// ─── Assign Game Tiers ──────────────────────────────────────────────────────

function assignTiers(games: IntelGame[]): IntelGame[] {
  if (games.length === 0) return games;

  // Live games get priority. Then finals. Then scheduled.
  const sorted = [...games].sort((a, b) => {
    const order: Record<GameStatus, number> = { live: 0, final: 1, scheduled: 2 };
    return order[a.status] - order[b.status];
  });

  return sorted.map((g, i) => ({
    ...g,
    tier: i === 0 ? 'hero' : i <= 3 ? 'marquee' : 'standard',
  }));
}

// ─── Signal Generation ──────────────────────────────────────────────────────

function generateSignals(
  games: IntelGame[],
  standings: StandingsTeam[],
  mode: IntelMode,
): IntelSignal[] {
  const signals: IntelSignal[] = [];
  const types = SIGNAL_TYPES_BY_MODE[mode];
  let idx = 0;

  for (const game of games) {
    const diff = Math.abs(game.home.score - game.away.score);
    const leader = game.home.score >= game.away.score ? game.home : game.away;
    const trailer = game.home.score >= game.away.score ? game.away : game.home;

    // Live game, close score → clutch time
    if (game.status === 'live' && diff <= 5) {
      signals.push({
        id: `sig-clutch-${game.id}`,
        text: `${leader.abbreviation || leader.name} leads ${trailer.abbreviation || trailer.name} by ${diff}. Clutch time.`,
        sport: game.sport,
        priority: 'high',
        type: types[idx % types.length],
        modes: ['coach', 'fan'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Live',
      });
      idx++;
    }

    // Blowout
    if (game.status === 'live' && diff >= 20) {
      signals.push({
        id: `sig-blowout-${game.id}`,
        text: `${leader.abbreviation || leader.name} up ${diff} over ${trailer.abbreviation || trailer.name}. Blowout territory.`,
        sport: game.sport,
        priority: 'medium',
        type: 'RECAP',
        modes: ['coach', 'fan'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Live',
      });
      idx++;
    }

    // Final game with narrow margin
    if (game.status === 'final' && diff <= 3) {
      signals.push({
        id: `sig-nail-${game.id}`,
        text: `${leader.abbreviation || leader.name} edged ${trailer.abbreviation || trailer.name} ${leader.score}-${trailer.score}. Nail-biter.`,
        sport: game.sport,
        priority: 'medium',
        type: 'RECAP',
        modes: ['coach', 'fan', 'scout'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Final',
      });
      idx++;
    }
  }

  // Standings-based signals
  for (const team of standings.slice(0, 3)) {
    const pct = team.winPct ?? (team.wins / Math.max(team.wins + team.losses, 1));
    if (pct > 0.65) {
      signals.push({
        id: `sig-standing-${team.teamName}`,
        text: `${team.teamName}: ${team.wins}-${team.losses} (.${Math.round(pct * 1000)}). Top of the standings.`,
        sport: games[0]?.sport ?? 'nba',
        priority: 'low',
        type: 'TREND',
        modes: ['fan', 'scout'],
        teamTags: [team.abbreviation || team.teamName.split(' ').pop() || ''],
        timestamp: 'Season',
      });
    }
  }

  // Filter by mode
  return signals
    .filter((s) => s.modes.includes(mode))
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

const ACTIVE_SPORTS: Exclude<IntelSport, 'all'>[] = ['nfl', 'nba', 'mlb', 'ncaafb', 'cbb'];

export function useIntelDashboard(sport: IntelSport, mode: IntelMode, teamLens: string | null) {
  const sportsToFetch = sport === 'all' ? ACTIVE_SPORTS : [sport];

  // Fetch scores for each selected sport
  const scoreQueries = sportsToFetch.map((s) => ({
    sport: s,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ...useQuery({
      queryKey: ['intel-scores', s],
      queryFn: () => fetchJson<Record<string, unknown>>(scoresEndpoint(s)),
      refetchInterval: 30_000,
    }),
  }));

  // Fetch standings for the primary sport (or NBA by default)
  const standingsSport = sport === 'all' ? 'nba' : sport;
  const standingsQuery = useQuery({
    queryKey: ['intel-standings', standingsSport],
    queryFn: () => fetchJson<Record<string, unknown>>(`${sportApiBase(standingsSport)}/standings`),
    refetchInterval: 60_000,
  });

  // Normalize games across all fetched sports
  const games = useMemo(() => {
    const allGames: IntelGame[] = [];
    for (const q of scoreQueries) {
      if (q.data) {
        allGames.push(...normalizeToIntelGames(q.sport, q.data));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreQueries.map((q) => q.dataUpdatedAt).join(','), teamLens]);

  // Extract standings
  const standings = useMemo<StandingsTeam[]>(() => {
    if (!standingsQuery.data) return [];
    const d = standingsQuery.data;
    const list = (d.standings || d.teams || []) as StandingsTeam[];
    return list.slice(0, 15);
  }, [standingsQuery.data]);

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

  const isLoading = scoreQueries.some((q) => q.isLoading);
  const isError = scoreQueries.every((q) => q.isError);

  const hero = useMemo(() => games.find((g) => g.tier === 'hero'), [games]);
  const marquee = useMemo(() => games.filter((g) => g.tier === 'marquee'), [games]);
  const standard = useMemo(() => games.filter((g) => g.tier === 'standard'), [games]);

  return {
    games,
    hero,
    marquee,
    standard,
    signals,
    prioritySignals,
    standings,
    allTeams,
    isLoading,
    isError,
  };
}
