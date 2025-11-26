'use client';

import { useQuery } from '@tanstack/react-query';
import { mlbApi, nflApi, nbaApi, ncaaApi, type Sport } from '@/lib/api/client';

/**
 * Hook for fetching live scores with automatic refresh
 * Refresh interval: 30 seconds for live games, 5 minutes for others
 */
export function useLiveScores(sport: Sport, options?: { date?: string; week?: number }) {
  return useQuery({
    queryKey: ['scores', sport, options],
    queryFn: async () => {
      switch (sport) {
        case 'mlb':
          return mlbApi.getScores(options?.date);
        case 'nfl':
          return nflApi.getScores(options?.week);
        case 'nba':
          return nbaApi.getScores(options?.date);
        case 'ncaa-baseball':
          return ncaaApi.getBaseballGames(options?.date);
        case 'ncaa-football':
          return ncaaApi.getFootballGames(options?.week);
        default:
          throw new Error(`Unknown sport: ${sport}`);
      }
    },
    // Refresh every 30 seconds for live game updates
    refetchInterval: 30_000,
    // 10 seconds stale time
    staleTime: 10_000,
  });
}

/**
 * Hook for fetching standings (less frequent refresh)
 */
export function useStandings(sport: Sport, options?: { conference?: string }) {
  return useQuery({
    queryKey: ['standings', sport, options],
    queryFn: async () => {
      switch (sport) {
        case 'mlb':
          return mlbApi.getStandings();
        case 'nfl':
          return nflApi.getStandings();
        case 'nba':
          return nbaApi.getStandings();
        case 'ncaa-baseball':
          return ncaaApi.getBaseballStandings(options?.conference);
        case 'ncaa-football':
          return ncaaApi.getFootballStandings();
        default:
          throw new Error(`Unknown sport: ${sport}`);
      }
    },
    // Standings refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // 1 minute stale time
    staleTime: 60_000,
  });
}

/**
 * Hook for fetching players
 */
export function usePlayers(sport: 'mlb' | 'nfl' | 'nba') {
  return useQuery({
    queryKey: ['players', sport],
    queryFn: async () => {
      switch (sport) {
        case 'mlb':
          return mlbApi.getPlayers();
        case 'nfl':
          return nflApi.getPlayers();
        case 'nba':
          return nbaApi.getPlayers();
        default:
          throw new Error(`Unknown sport: ${sport}`);
      }
    },
    // Players refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60_000,
  });
}
