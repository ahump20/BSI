'use client';

import { useMemo } from 'react';
import { useLiveScores } from './useLiveScores';
import type { LiveGame } from './useLiveScores';
import type { GameScore } from '@/lib/scores/normalize';

/**
 * Adapter hook that wraps useLiveScores (WebSocket-first)
 * and converts LiveGame[] to GameScore[] for drop-in replacement
 * in existing components (LiveScoresPanel, SportHubCards, etc.).
 */
export function useLiveScoresAsGameScores(options?: {
  pollingInterval?: number;
  pollingOnly?: boolean;
}) {
  const { games, isLive, lastUpdate, connectionStatus, error, retry } = useLiveScores(options);

  const gameScores = useMemo(() => games.map(liveGameToGameScore), [games]);

  return {
    games: gameScores,
    isLive,
    lastUpdate,
    connectionStatus,
    error,
    retry,
    /** Raw LiveGame[] if the consumer needs the richer type */
    rawGames: games,
  };
}

function liveGameToGameScore(g: LiveGame): GameScore {
  const statusMap: Record<string, string> = {
    pre: 'scheduled',
    in: 'live',
    post: 'final',
    postponed: 'postponed',
    cancelled: 'cancelled',
  };

  return {
    id: g.id,
    away: {
      name: g.awayTeam.name,
      abbreviation: g.awayTeam.shortName || undefined,
      score: g.awayTeam.score,
      rank: g.awayTeam.ranking,
    },
    home: {
      name: g.homeTeam.name,
      abbreviation: g.homeTeam.shortName || undefined,
      score: g.homeTeam.score,
      rank: g.homeTeam.ranking,
    },
    status: statusMap[g.status] || g.detailedState,
    isLive: g.status === 'in',
    isFinal: g.status === 'post',
    isPostponed: g.status === 'postponed',
    detail: g.detailedState,
    startTime: g.startTime,
  };
}
