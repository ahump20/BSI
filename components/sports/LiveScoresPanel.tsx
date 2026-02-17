'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Sport } from './SportTabs';
import { normalizeGames, sortGames, type GameScore } from '@/lib/scores/normalize';
import { useLiveScoresAsGameScores } from '@/lib/hooks/useLiveScoresAdapter';
import { ConnectionIndicator } from '@/components/ui/ConnectionIndicator';

interface LiveScoresPanelProps {
  sport: Sport;
  className?: string;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * NCAA (college baseball) uses WebSocket-first via useLiveScores.
 * Other sports use HTTP polling until the DO is extended for multi-sport.
 */
function useNCAAWebSocketScores() {
  return useLiveScoresAsGameScores({ pollingInterval: 30_000 });
}

export function LiveScoresPanel({ sport, className = '' }: LiveScoresPanelProps) {
  // For NCAA: use WebSocket hook
  const wsData = useNCAAWebSocketScores();
  const useWebSocket = sport === 'ncaa';

  const [games, setGames] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isYesterday, setIsYesterday] = useState(false);
  const gamesRef = useRef(games);
  gamesRef.current = games;

  // When using WebSocket for NCAA, sync from the hook
  useEffect(() => {
    if (!useWebSocket) return;
    if (wsData.games.length > 0) {
      setGames(sortGames(wsData.games));
      setLoading(false);
      setError(wsData.error);
      setIsYesterday(false);
    } else if (wsData.error) {
      setError(wsData.error);
      setLoading(false);
    } else if (wsData.connectionStatus === 'connected' || wsData.connectionStatus === 'polling') {
      // Connected with no active games — show empty state instead of perpetual skeleton
      setLoading(false);
    }
  }, [useWebSocket, wsData.games, wsData.error, wsData.connectionStatus]);

  const buildEndpoint = useCallback((dateParam?: string) => {
    const origin = process.env.NEXT_PUBLIC_API_BASE || '';
    const apiBase = sport === 'ncaa' ? '/api/college-baseball' : `/api/${sport}`;
    const endpoint = `${origin}${sport === 'nba' ? `${apiBase}/scoreboard` : `${apiBase}/scores`}`;
    return dateParam ? `${endpoint}?date=${dateParam}` : endpoint;
  }, [sport]);

  // HTTP polling for non-NCAA sports
  useEffect(() => {
    if (useWebSocket) return;
    let cancelled = false;

    async function fetchScores() {
      setLoading(true);
      setError(null);
      setIsYesterday(false);

      try {
        const res = await fetch(buildEndpoint());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const todayGames = normalizeGames(sport, data as Record<string, unknown>);

        if (!cancelled) {
          if (todayGames.length > 0) {
            setGames(sortGames(todayGames));
          } else {
            try {
              const yRes = await fetch(buildEndpoint(getYesterdayDateString()));
              if (yRes.ok) {
                const yData = await yRes.json();
                const yGames = normalizeGames(sport, yData as Record<string, unknown>);
                if (yGames.length > 0) {
                  setGames(sortGames(yGames));
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
  }, [sport, buildEndpoint, useWebSocket]);

  return (
    <div className={`bg-white/5 border border-white/[0.06] rounded-xl ${className}`}>
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {isYesterday ? "Yesterday's Results" : 'Live Scores'}
        </h3>
        <span className="flex items-center gap-3">
          {useWebSocket && <ConnectionIndicator status={wsData.connectionStatus} />}
          <span className="text-xs text-white/40 uppercase tracking-wider">{sport.toUpperCase()}</span>
        </span>
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
              role="group"
              aria-label={`${game.away.name} at ${game.home.name}`}
              className={`bg-white/5 rounded-lg p-4 border transition-colors ${
                game.isLive
                  ? 'border-green-500/30'
                  : game.isPostponed
                    ? 'border-white/[0.03] opacity-50'
                    : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                  {game.away.rank && (
                    <span className="text-[10px] font-bold text-[#BF5700] bg-[#BF5700]/10 px-1.5 py-0.5 rounded-md leading-none">
                      #{game.away.rank}
                    </span>
                  )}
                  {game.away.name}
                </span>
                <span className="font-bold text-[#BF5700] text-lg tabular-nums" aria-label={`${game.away.name} score`} {...(game.isLive ? { 'aria-live': 'polite' as const } : {})}>{game.away.score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                  {game.home.rank && (
                    <span className="text-[10px] font-bold text-[#BF5700] bg-[#BF5700]/10 px-1.5 py-0.5 rounded-md leading-none">
                      #{game.home.rank}
                    </span>
                  )}
                  {game.home.name}
                </span>
                <span className="font-bold text-[#BF5700] text-lg tabular-nums" aria-label={`${game.home.name} score`} {...(game.isLive ? { 'aria-live': 'polite' as const } : {})}>{game.home.score}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {game.isLive && (
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" role="status" aria-label="Game in progress" />
                )}
                <span className={`text-xs ${
                  game.isLive ? 'text-green-400'
                    : game.isPostponed ? 'text-yellow-500/60'
                    : game.isFinal ? 'text-white/30'
                    : 'text-[#BF5700]'
                }`}>
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
