'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Sport } from './SportTabs';

interface GameScore {
  id: string | number;
  away: { name: string; abbreviation?: string; score: number };
  home: { name: string; abbreviation?: string; score: number };
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
}

interface LiveScoresPanelProps {
  sport: Sport;
  className?: string;
}

/**
 * Normalize game data from multiple API formats into a flat GameScore array.
 *
 * Handles three response shapes:
 * 1. Transformed: { games: [...] } with flattened teams[] (MLB, NFL, NBA via ESPN transform)
 * 2. Scoreboard:  { scoreboard: { games: [...] } } (NBA via SportsDataIO)
 * 3. Raw ESPN:    { data: [...events] } with competitions[].competitors[] (College Baseball)
 */
function normalizeGames(sport: Sport, data: Record<string, unknown>): GameScore[] {
  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;

  // Shape 3: College baseball raw ESPN format — { data: [...events] }
  const rawData = data.data as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].competitions) {
    return rawData.map((event, i) => {
      const competitions = event.competitions as Record<string, unknown>[] | undefined;
      const comp = competitions?.[0] as Record<string, unknown> | undefined;
      const competitors = (comp?.competitors || []) as Record<string, unknown>[];

      const homeComp = competitors.find((c) => c.homeAway === 'home');
      const awayComp = competitors.find((c) => c.homeAway === 'away');
      const homeTeam = (homeComp?.team || {}) as Record<string, unknown>;
      const awayTeam = (awayComp?.team || {}) as Record<string, unknown>;

      const status = (comp?.status || event.status || {}) as Record<string, unknown>;
      const statusType = status?.type as Record<string, unknown> | undefined;

      const isLive = statusType?.state === 'in';
      const isFinal = statusType?.state === 'post' || statusType?.completed === true;
      const statusText = (statusType?.shortDetail as string)
        || (statusType?.description as string)
        || 'Scheduled';

      return {
        id: (event.id as string | number) || i,
        away: {
          name: (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away',
          abbreviation: (awayTeam.abbreviation as string) || (awayTeam.shortDisplayName as string) || '',
          score: Number(awayComp?.score ?? 0),
        },
        home: {
          name: (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home',
          abbreviation: (homeTeam.abbreviation as string) || (homeTeam.shortDisplayName as string) || '',
          score: Number(homeComp?.score ?? 0),
        },
        status: statusText,
        isLive: Boolean(isLive),
        isFinal: Boolean(isFinal),
        detail: undefined,
      };
    });
  }

  // Shapes 1 & 2: Transformed/scoreboard format
  const rawGames = (data.games || scoreboard?.games || []) as Record<string, unknown>[];
  return rawGames.map((g: Record<string, unknown>, i: number) => {
    const rawTeams = g.teams as Record<string, unknown>[] | Record<string, Record<string, unknown>> | undefined;
    let homeEntry: Record<string, unknown> | undefined;
    let awayEntry: Record<string, unknown> | undefined;

    if (Array.isArray(rawTeams)) {
      homeEntry = rawTeams.find((t) => t.homeAway === 'home');
      awayEntry = rawTeams.find((t) => t.homeAway === 'away');
    } else if (rawTeams) {
      homeEntry = rawTeams.home as Record<string, unknown> | undefined;
      awayEntry = rawTeams.away as Record<string, unknown> | undefined;
    }

    const homeTeam = (homeEntry?.team as Record<string, unknown>) || homeEntry || {};
    const awayTeam = (awayEntry?.team as Record<string, unknown>) || awayEntry || {};

    const status = g.status as Record<string, unknown> | string | undefined;
    const statusType = typeof status === 'object' ? (status?.type as Record<string, unknown> | undefined) : undefined;

    const isLive = typeof status === 'object'
      ? statusType?.state === 'in' || status?.isLive === true
      : typeof status === 'string' && status.toLowerCase().includes('in progress');

    const isFinal = typeof status === 'object'
      ? status?.isFinal === true || statusType?.state === 'post'
      : typeof status === 'string' && status.toLowerCase().includes('final');

    const statusText = typeof status === 'object'
      ? (status?.detailedState as string) || (statusType?.description as string) || 'Scheduled'
      : (status as string) || 'Scheduled';

    return {
      id: (g.id as string | number) || i,
      away: {
        name: (awayTeam.displayName as string) || (awayTeam.name as string) || 'Away',
        abbreviation: (awayTeam.abbreviation as string) || (awayTeam.shortDisplayName as string) || '',
        score: Number(awayEntry?.score ?? 0),
      },
      home: {
        name: (homeTeam.displayName as string) || (homeTeam.name as string) || 'Home',
        abbreviation: (homeTeam.abbreviation as string) || (homeTeam.shortDisplayName as string) || '',
        score: Number(homeEntry?.score ?? 0),
      },
      status: statusText,
      isLive: Boolean(isLive),
      isFinal: Boolean(isFinal),
      detail: typeof status === 'object' && status?.inning
        ? `${status?.inningState ?? ''} ${status.inning}`
        : undefined,
    };
  });
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function LiveScoresPanel({ sport, className = '' }: LiveScoresPanelProps) {
  const [games, setGames] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isYesterday, setIsYesterday] = useState(false);
  const gamesRef = useRef(games);
  gamesRef.current = games;

  const buildEndpoint = useCallback((dateParam?: string) => {
    const origin = process.env.NEXT_PUBLIC_API_BASE || '';
    const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
    const endpoint = `${origin}${sport === 'nba' ? `${apiBase}/scoreboard` : `${apiBase}/scores`}`;
    return dateParam ? `${endpoint}?date=${dateParam}` : endpoint;
  }, [sport]);

  useEffect(() => {
    let cancelled = false;

    async function fetchScores() {
      setLoading(true);
      setError(null);
      setIsYesterday(false);

      try {
        // Try today first
        const res = await fetch(buildEndpoint());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const todayGames = normalizeGames(sport, data as Record<string, unknown>);

        if (!cancelled) {
          if (todayGames.length > 0) {
            setGames(todayGames);
          } else {
            // No games today — try yesterday as fallback
            try {
              const yRes = await fetch(buildEndpoint(getYesterdayDateString()));
              if (yRes.ok) {
                const yData = await yRes.json();
                const yGames = normalizeGames(sport, yData as Record<string, unknown>);
                if (yGames.length > 0) {
                  setGames(yGames);
                  setIsYesterday(true);
                } else {
                  setGames([]);
                }
              } else {
                setGames([]);
              }
            } catch {
              setGames([]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load scores');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchScores();
    const hasLive = gamesRef.current.some((g) => g.isLive);
    const interval = setInterval(fetchScores, hasLive ? 30000 : 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sport, buildEndpoint]);

  return (
    <div className={`bg-white/5 border border-white/[0.06] rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {isYesterday ? "Yesterday's Results" : 'Live Scores'}
        </h3>
        <span className="text-xs text-white/40 uppercase tracking-wider">{sport.toUpperCase()}</span>
      </div>
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">No games scheduled</p>
          </div>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className={`bg-white/5 rounded-lg p-4 border ${
                game.isLive ? 'border-green-500/30' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-white text-sm">{game.away.name}</span>
                <span className="font-bold text-[#BF5700] text-lg">{game.away.score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white text-sm">{game.home.name}</span>
                <span className="font-bold text-[#BF5700] text-lg">{game.home.score}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {game.isLive && (
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                )}
                <span className={`text-xs ${game.isLive ? 'text-green-400' : game.isFinal ? 'text-white/30' : 'text-[#BF5700]'}`}>
                  {game.detail || game.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
