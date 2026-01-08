'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScoreCard, ScoreCardSkeleton } from './ScoreCard';
import { LiveBadge } from '@/components/ui/Badge';
import { GameDetailModal } from '@/components/game-detail';
import type { Sport } from './SportTabs';
import type { UnifiedSportKey } from '@/lib/types/adapters';

const API_BASE = 'https://blazesportsintel.com/api';

interface Game {
  id: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    score: number;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    score: number;
  };
  status: 'scheduled' | 'live' | 'final' | 'delayed' | 'postponed';
  gameTime?: string;
  venue?: string;
  inning?: string;
  quarter?: string;
  period?: string;
}

// NFL API game structure
interface NFLGameRaw {
  GlobalGameID?: number;
  GameID?: number;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamName?: string;
  HomeTeamName?: string;
  AwayScore?: number;
  HomeScore?: number;
  Status?: string;
  DateTime?: string;
  StadiumDetails?: { Name?: string };
  Quarter?: string;
  TimeRemaining?: string;
  IsInProgress?: boolean;
  IsOver?: boolean;
}

// NBA API game structure - handles both flat and nested team structures
interface NBATeamRaw {
  id?: string;
  teamName?: string;
  teamTricode?: string;
  name?: string;
  team?: string;
  abbreviation?: string;
  score?: string | number;
  record?: string;
}

interface NBAGameRaw {
  id: string;
  homeTeam?: NBATeamRaw;
  awayTeam?: NBATeamRaw;
  // ESPN API uses nested teams structure
  teams?: {
    away?: NBATeamRaw;
    home?: NBATeamRaw;
  };
  status: string | { state?: string; isLive?: boolean; isFinal?: boolean; detail?: string };
  gameTime?: string;
  gameStatusText?: string;
  venue?: { name?: string };
  arenaName?: string;
  period?: number;
}

// NFL nested games structure
interface NFLGamesResponse {
  games?: {
    live?: NFLGameRaw[];
    final?: NFLGameRaw[];
    scheduled?: NFLGameRaw[];
  };
}

function parseNFLGames(data: NFLGamesResponse): Game[] {
  const gamesObj = data.games || {};
  const allGames: NFLGameRaw[] = [
    ...(gamesObj.live || []),
    ...(gamesObj.final || []),
    ...(gamesObj.scheduled || []),
  ];

  return allGames.slice(0, 9).map((game) => ({
    id: String(game.GlobalGameID || game.GameID || Math.random()),
    homeTeam: {
      name: game.HomeTeamName || game.HomeTeam,
      abbreviation: game.HomeTeam,
      score: game.HomeScore || 0,
    },
    awayTeam: {
      name: game.AwayTeamName || game.AwayTeam,
      abbreviation: game.AwayTeam,
      score: game.AwayScore || 0,
    },
    status: game.IsInProgress ? 'live' : game.IsOver ? 'final' : 'scheduled',
    gameTime: game.DateTime
      ? new Date(game.DateTime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/Chicago',
        })
      : undefined,
    venue: game.StadiumDetails?.Name,
    quarter: game.Quarter ? `${game.Quarter} - ${game.TimeRemaining || ''}` : undefined,
  }));
}

function parseNBAGames(games: NBAGameRaw[]): Game[] {
  return games
    .filter((game) => {
      if (!game) return false;
      // Support both flat (homeTeam/awayTeam) and nested (teams.home/teams.away) structures
      const hasFlat = game.homeTeam && game.awayTeam;
      const hasNested = game.teams?.home && game.teams?.away;
      return hasFlat || hasNested;
    })
    .slice(0, 9)
    .map((game) => {
      // Extract teams from either structure
      const homeTeam = game.homeTeam || game.teams?.home;
      const awayTeam = game.awayTeam || game.teams?.away;

      // Get team name - API uses 'team' field for full name
      const homeName = homeTeam?.teamName || homeTeam?.team || homeTeam?.name || 'Home';
      const awayName = awayTeam?.teamName || awayTeam?.team || awayTeam?.name || 'Away';

      // Get abbreviation
      const homeAbbr = homeTeam?.teamTricode || homeTeam?.abbreviation || 'HOM';
      const awayAbbr = awayTeam?.teamTricode || awayTeam?.abbreviation || 'AWY';

      // Get score (can be string or number)
      const homeScore =
        typeof homeTeam?.score === 'string'
          ? parseInt(homeTeam.score, 10) || 0
          : homeTeam?.score || 0;
      const awayScore =
        typeof awayTeam?.score === 'string'
          ? parseInt(awayTeam.score, 10) || 0
          : awayTeam?.score || 0;

      // Parse status - can be string or object
      let gameStatus: Game['status'] = 'scheduled';
      if (typeof game.status === 'object') {
        if (game.status.isLive) gameStatus = 'live';
        else if (game.status.isFinal) gameStatus = 'final';
        else if (game.status.state === 'pre') gameStatus = 'scheduled';
        else if (game.status.state === 'in') gameStatus = 'live';
        else if (game.status.state === 'post') gameStatus = 'final';
      } else {
        if (game.status === 'pre') gameStatus = 'scheduled';
        else if (game.status === 'in') gameStatus = 'live';
        else if (game.status === 'post') gameStatus = 'final';
        else gameStatus = (game.status as Game['status']) || 'scheduled';
      }

      // Get game time from status detail or other fields
      const statusDetail = typeof game.status === 'object' ? game.status.detail : undefined;
      const gameTime = game.gameTime || game.gameStatusText || statusDetail;

      return {
        id: game.id || String(Math.random()),
        homeTeam: {
          name: homeName,
          abbreviation: homeAbbr,
          score: homeScore,
        },
        awayTeam: {
          name: awayName,
          abbreviation: awayAbbr,
          score: awayScore,
        },
        status: gameStatus,
        gameTime,
        venue: game.venue?.name || game.arenaName,
        period: game.period ? `${game.period}Q` : undefined,
      };
    });
}

async function fetchScores(sport: Sport): Promise<Game[]> {
  const endpoints: Record<Sport, string> = {
    mlb: `${API_BASE}/mlb/scores`,
    nfl: `${API_BASE}/nfl/scores`,
    nba: `${API_BASE}/nba/scores`,
    ncaa: `${API_BASE}/ncaa/scores`,
  };

  try {
    const res = await fetch(endpoints[sport]);
    if (!res.ok) {
      // Return mock data for development
      return getMockGames(sport);
    }
    const data = await res.json();

    // Handle NFL nested structure
    if (
      sport === 'nfl' &&
      data.games &&
      typeof data.games === 'object' &&
      !Array.isArray(data.games)
    ) {
      return parseNFLGames(data as NFLGamesResponse);
    }

    // Handle NBA array structure
    if (sport === 'nba' && data.games && Array.isArray(data.games)) {
      return parseNBAGames(data.games as NBAGameRaw[]);
    }

    // Fallback for flat arrays (MLB, NCAA)
    if (data.games && Array.isArray(data.games)) {
      return data.games as Game[];
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data as Game[];
    }

    return getMockGames(sport);
  } catch {
    // Return mock data if API fails
    return getMockGames(sport);
  }
}

function getMockGames(sport: Sport): Game[] {
  const mockGames: Record<Sport, Game[]> = {
    mlb: [
      {
        id: '1',
        homeTeam: { name: 'Cardinals', abbreviation: 'STL', score: 0 },
        awayTeam: { name: 'Cubs', abbreviation: 'CHC', score: 0 },
        status: 'scheduled',
        gameTime: 'Spring Training',
        venue: 'Busch Stadium',
      },
    ],
    nfl: [
      {
        id: '1',
        homeTeam: { name: 'Chiefs', abbreviation: 'KC', score: 24 },
        awayTeam: { name: 'Bills', abbreviation: 'BUF', score: 21 },
        status: 'final',
        quarter: 'Final',
        venue: 'Arrowhead Stadium',
      },
      {
        id: '2',
        homeTeam: { name: 'Titans', abbreviation: 'TEN', score: 17 },
        awayTeam: { name: 'Texans', abbreviation: 'HOU', score: 14 },
        status: 'final',
        quarter: 'Final',
        venue: 'Nissan Stadium',
      },
    ],
    nba: [
      {
        id: '1',
        homeTeam: { name: 'Grizzlies', abbreviation: 'MEM', score: 108 },
        awayTeam: { name: 'Lakers', abbreviation: 'LAL', score: 102 },
        status: 'live',
        quarter: '4th Qtr - 3:45',
        venue: 'FedExForum',
      },
      {
        id: '2',
        homeTeam: { name: 'Celtics', abbreviation: 'BOS', score: 115 },
        awayTeam: { name: 'Bucks', abbreviation: 'MIL', score: 110 },
        status: 'final',
        quarter: 'Final',
        venue: 'TD Garden',
      },
    ],
    ncaa: [
      {
        id: '1',
        homeTeam: { name: 'Texas', abbreviation: 'TEX', score: 0 },
        awayTeam: { name: 'Oklahoma', abbreviation: 'OU', score: 0 },
        status: 'scheduled',
        gameTime: 'Feb 14, 6:00 PM CT',
        venue: 'UFCU Disch-Falk Field',
      },
    ],
  };

  return mockGames[sport] || [];
}

// Map Sport to UnifiedSportKey for the modal
const SPORT_KEY_MAP: Record<Sport, UnifiedSportKey> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  ncaa: 'cbb', // Default to college baseball for NCAA
};

interface LiveScoresPanelProps {
  sport: Sport;
}

export function LiveScoresPanel({ sport }: LiveScoresPanelProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGameClick = (gameId: string) => {
    setSelectedGameId(gameId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGameId(null);
  };

  const {
    data: games,
    isLoading,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['scores', sport],
    queryFn: () => fetchScores(sport),
    refetchInterval: 30_000, // 30 seconds
    staleTime: 10_000,
  });

  const liveGames = games?.filter((g) => g.status === 'live') || [];
  const hasLiveGames = liveGames.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display text-white">SCORES</h2>
          {hasLiveGames && <LiveBadge />}
        </div>
        {dataUpdatedAt && (
          <span className="text-xs text-white/40">
            Updated{' '}
            {new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/Chicago',
            })}{' '}
            CT
          </span>
        )}
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <ScoreCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60">Unable to load scores</p>
          <p className="text-white/40 text-sm mt-1">Please try again later</p>
        </div>
      ) : games && games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <ScoreCard
              key={game.id}
              gameId={game.id}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              status={game.status}
              gameTime={game.gameTime}
              venue={game.venue}
              inning={game.inning}
              quarter={game.quarter}
              period={game.period}
              onClick={() => handleGameClick(game.id)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60">No games scheduled</p>
          <p className="text-white/40 text-sm mt-1">Check back later for upcoming matchups</p>
        </div>
      )}

      {/* Game Detail Modal */}
      <GameDetailModal
        gameId={selectedGameId}
        sport={SPORT_KEY_MAP[sport]}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
