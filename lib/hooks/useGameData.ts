/**
 * useGameData Hook
 *
 * Fetches game data from BSI API with SWR-like caching and revalidation.
 * Supports all major sports: CFB, NFL, MLB, CBB, NBA.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type Sport = 'cfb' | 'nfl' | 'mlb' | 'cbb' | 'nba';

export interface TeamData {
  id?: string;
  name: string;
  abbreviation: string;
  score: number;
  record?: string;
  ranking?: number;
  logo?: string;
  isWinner?: boolean;
}

export interface GameStatus {
  state: 'pre' | 'in' | 'post' | 'SCHEDULED' | 'LIVE' | 'FINAL';
  detail?: string;
  shortDetail?: string;
  quarter?: number;
  timeRemaining?: string;
  inning?: number;
  inningHalf?: string;
  isLive: boolean;
  isFinal: boolean;
}

export interface PlayData {
  id: string;
  period: string;
  time: string;
  team: string;
  description: string;
  scoreValue?: number;
}

export interface LeaderData {
  name: string;
  stats: string;
  team?: string;
  position?: string;
}

export interface BoxscoreStats {
  label: string;
  away: string | number;
  home: string | number;
}

export interface LinescoreData {
  period: string;
  away: number;
  home: number;
}

export interface WinProbabilityPoint {
  timestamp: number;
  homeWinProbability: number;
  description?: string;
}

export interface GameData {
  id: string;
  sport: Sport;
  date: string;
  status: GameStatus;
  homeTeam: TeamData;
  awayTeam: TeamData;
  venue?: {
    name: string;
    city?: string;
    state?: string;
  };
  broadcast?: string;
  boxscore?: BoxscoreStats[];
  linescore?: LinescoreData[];
  plays?: PlayData[];
  leaders?: {
    passing?: LeaderData;
    rushing?: LeaderData;
    receiving?: LeaderData;
    batting?: LeaderData;
    pitching?: LeaderData;
  };
  winProbability?: WinProbabilityPoint[];
}

export interface UseGameDataResult {
  game: GameData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const SPORT_API_MAP: Record<Sport, string> = {
  cfb: '/api/cfb/game',
  nfl: '/api/nfl/games',
  mlb: '/api/mlb/game',
  cbb: '/api/cbb/game',
  nba: '/api/nba/game',
};

const REFRESH_INTERVAL = {
  live: 30000, // 30 seconds for live games
  scheduled: 300000, // 5 minutes for scheduled games
  final: null, // No refresh for final games
};

function normalizeStatus(rawStatus: any): GameStatus {
  const state = rawStatus?.state || rawStatus?.type?.name || 'SCHEDULED';
  const isLive = state === 'in' || state === 'LIVE' || state.toLowerCase().includes('progress');
  const isFinal = state === 'post' || state === 'FINAL' || state.toLowerCase().includes('final');

  return {
    state,
    detail: rawStatus?.detail || rawStatus?.type?.description,
    shortDetail: rawStatus?.shortDetail || rawStatus?.type?.shortDetail,
    quarter: rawStatus?.quarter || rawStatus?.period,
    timeRemaining: rawStatus?.timeRemaining || rawStatus?.displayClock,
    inning: rawStatus?.inning || rawStatus?.period,
    inningHalf: rawStatus?.inningHalf,
    isLive,
    isFinal,
  };
}

function normalizeTeam(rawTeam: any, homeAway: 'home' | 'away'): TeamData {
  return {
    id: rawTeam?.id,
    name: rawTeam?.name || rawTeam?.displayName || 'Unknown',
    abbreviation: rawTeam?.abbreviation || rawTeam?.abbrev || 'UNK',
    score: rawTeam?.score ?? 0,
    record: rawTeam?.record,
    ranking: rawTeam?.ranking,
    logo: rawTeam?.logo,
    isWinner: rawTeam?.isWinner,
  };
}

function normalizeGameData(raw: any, sport: Sport, gameId: string): GameData {
  const game = raw.game || raw;

  // Handle different API response structures
  const homeTeam = game.teams?.home ||
    game.homeTeam || {
      name: game.homeTeamName,
      abbreviation: game.homeTeamAbbrev,
      score: game.homeScore,
      ranking: game.homeRanking,
    };

  const awayTeam = game.teams?.away ||
    game.awayTeam || {
      name: game.awayTeamName,
      abbreviation: game.awayTeamAbbrev,
      score: game.awayScore,
      ranking: game.awayRanking,
    };

  return {
    id: gameId,
    sport,
    date: game.date || game.scheduledAt || new Date().toISOString(),
    status: normalizeStatus(game.status),
    homeTeam: normalizeTeam(homeTeam, 'home'),
    awayTeam: normalizeTeam(awayTeam, 'away'),
    venue: game.venue
      ? {
          name: typeof game.venue === 'string' ? game.venue : game.venue.name,
          city: game.venue.city,
          state: game.venue.state,
        }
      : undefined,
    broadcast: game.broadcast,
    boxscore: normalizeBoxscore(raw.boxscore),
    linescore: normalizeLinescore(raw.linescore),
    plays: normalizePlays(raw.plays),
    leaders: raw.game?.leaders || raw.leaders,
    winProbability: normalizeWinProbability(raw.winProbability),
  };
}

function normalizeBoxscore(boxscore: any): BoxscoreStats[] | undefined {
  if (!boxscore) return undefined;

  // Handle ESPN format with teams array
  if (boxscore.teams) {
    const homeStats = boxscore.teams.find((t: any) => t.homeAway === 'home')?.statistics;
    const awayStats = boxscore.teams.find((t: any) => t.homeAway === 'away')?.statistics;

    if (homeStats && awayStats) {
      return homeStats.map((stat: any, idx: number) => ({
        label: stat.displayName || stat.label || stat.name,
        home: stat.displayValue || stat.value || 0,
        away: awayStats[idx]?.displayValue || awayStats[idx]?.value || 0,
      }));
    }
  }

  return undefined;
}

function normalizeLinescore(linescore: any): LinescoreData[] | undefined {
  if (!linescore || !Array.isArray(linescore)) return undefined;

  return linescore.map((period: any) => ({
    period: period.period || period.quarter || period.inning || String(period.displayValue),
    away: period.away ?? period.awayScore ?? 0,
    home: period.home ?? period.homeScore ?? 0,
  }));
}

function normalizePlays(plays: any): PlayData[] | undefined {
  if (!plays || !Array.isArray(plays)) return undefined;

  return plays.slice(0, 50).map((play: any, idx: number) => ({
    id: play.id || String(idx),
    period: play.period?.displayValue || play.quarter || play.inning || '',
    time: play.clock?.displayValue || play.time || '',
    team: play.team?.abbreviation || play.team?.displayName || '',
    description: play.text || play.description || play.type?.text || '',
    scoreValue: play.scoringPlay ? play.pointsAfter : undefined,
  }));
}

function normalizeWinProbability(wp: any): WinProbabilityPoint[] | undefined {
  if (!wp || !Array.isArray(wp)) return undefined;

  return wp.map((point: any, idx: number) => ({
    timestamp: idx,
    homeWinProbability: point.homeWinPercentage ?? point.homeWinProbability ?? point,
    description: point.playText || point.description,
  }));
}

export function useGameData(sport: Sport, gameId: string): UseGameDataResult {
  const [game, setGame] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGame = useCallback(async () => {
    if (!gameId || gameId === 'undefined') {
      setError(new Error('Invalid game ID'));
      setIsLoading(false);
      return;
    }

    try {
      const apiPath = SPORT_API_MAP[sport];
      const response = await fetch(`${apiPath}/${gameId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const normalized = normalizeGameData(data, sport, gameId);

      setGame(normalized);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`[useGameData] Failed to fetch ${sport} game ${gameId}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to fetch game data'));
    } finally {
      setIsLoading(false);
    }
  }, [sport, gameId]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    setGame(null);
    setError(null);
    fetchGame();
  }, [fetchGame]);

  // Set up refresh interval based on game status
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!game) return;

    const interval = game.status.isLive
      ? REFRESH_INTERVAL.live
      : game.status.isFinal
        ? REFRESH_INTERVAL.final
        : REFRESH_INTERVAL.scheduled;

    if (interval) {
      intervalRef.current = setInterval(fetchGame, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [game?.status.isLive, game?.status.isFinal, fetchGame]);

  return {
    game,
    isLoading,
    error,
    refetch: fetchGame,
    lastUpdated,
  };
}
