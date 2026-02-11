'use client';

import { useState, useEffect, useRef } from 'react';
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

function normalizeGames(sport: Sport, data: Record<string, unknown>): GameScore[] {
  const scoreboard = data.scoreboard as Record<string, unknown> | undefined;
  const rawGames = (data.games || scoreboard?.games || []) as Record<string, unknown>[];
  return rawGames.map((g: Record<string, unknown>, i: number) => {
    // ESPN returns teams as array with homeAway field, or as { home, away } object
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

export function LiveScoresPanel({ sport, className = '' }: LiveScoresPanelProps) {
  const [games, setGames] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gamesRef = useRef(games);
  gamesRef.current = games;

  useEffect(() => {
    let cancelled = false;

    async function fetchScores() {
      setLoading(true);
      setError(null);

      const origin = process.env.NEXT_PUBLIC_API_BASE || '';
      const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
      const endpoint = `${origin}${sport === 'nba' ? `${apiBase}/scoreboard` : `${apiBase}/scores`}`;

      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setGames(normalizeGames(sport, data as Record<string, unknown>));
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
  }, [sport]);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Live Scores</h3>
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
            <p className="text-white/40 text-sm">No games scheduled today</p>
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
