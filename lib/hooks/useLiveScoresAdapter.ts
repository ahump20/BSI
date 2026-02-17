'use client';

import { useLiveScores } from './useLiveScores';
import type { LiveGame } from './useLiveScores';
import type { GameScore } from '@/lib/scores/normalize';

/**
 * Adapter: maps LiveGame (from WebSocket hook) to GameScore (used by UI components).
 *
 * LiveGame uses status 'in'/'post'/'pre'; GameScore uses isLive/isFinal booleans.
 * Field mapping is thin — the types already overlap closely.
 */
export function liveGameToGameScore(game: LiveGame): GameScore {
  const statusMap: Record<string, string> = {
    pre: 'Scheduled',
    in: game.detailedState || 'In Progress',
    post: 'Final',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
  };

  const inningDetail =
    game.status === 'in' && game.inning
      ? `${game.inningHalf === 'top' ? 'Top' : 'Bot'} ${game.inning}${game.outs !== undefined ? ` · ${game.outs} out${game.outs !== 1 ? 's' : ''}` : ''}`
      : undefined;

  return {
    id: game.id,
    away: {
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.shortName || undefined,
      score: game.awayTeam.score,
      rank: game.awayTeam.ranking,
    },
    home: {
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.shortName || undefined,
      score: game.homeTeam.score,
      rank: game.homeTeam.ranking,
    },
    status: statusMap[game.status] || game.detailedState || 'Unknown',
    isLive: game.status === 'in',
    isFinal: game.status === 'post',
    isPostponed: game.status === 'postponed',
    detail: inningDetail || (game.status === 'post' ? 'Final' : undefined),
    startTime: game.startTime || undefined,
  };
}

interface UseLiveScoresAdapterReturn {
  games: GameScore[];
  isLive: boolean;
  lastUpdate: Date | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'polling';
  error: string | null;
  retry: () => void;
}

/**
 * Drop-in replacement for REST polling in components that consume GameScore[].
 * Wraps useLiveScores() and maps LiveGame[] → GameScore[].
 */
export function useLiveScoresAdapter(
  options?: Parameters<typeof useLiveScores>[0]
): UseLiveScoresAdapterReturn {
  const { games: liveGames, isLive, lastUpdate, connectionStatus, error, retry } =
    useLiveScores(options);

  const games = liveGames.map(liveGameToGameScore);

  return { games, isLive, lastUpdate, connectionStatus, error, retry };
}
