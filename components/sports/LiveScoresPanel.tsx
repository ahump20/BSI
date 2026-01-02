'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScoreCard, ScoreCardSkeleton } from './ScoreCard';
import { LiveBadge } from '@/components/ui/Badge';
import { GameDetailModal } from '@/components/game-detail';
import type { Sport } from './SportTabs';
import type { UnifiedSportKey } from '@/lib/types/adapters';

const API_BASE = 'https://blazesportsintel.com/api';

// Sport key mapping for the unified live-scores endpoint
const SPORT_QUERY_MAP: Record<Sport, string> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  ncaa: 'ncaa-baseball', // Default NCAA to baseball
};

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

// ESPN API response types from unified live-scores endpoint
interface ESPNCompetitor {
  id?: string;
  order?: number;
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    abbreviation?: string;
    logos?: Array<{ href?: string }>;
    rank?: number;
  };
  records?: Array<{ summary?: string }>;
}

interface ESPNGameStatus {
  type?: {
    name?: string;
    detail?: string;
    shortDetail?: string;
    completed?: boolean;
    state?: string;
  };
  period?: number;
  displayClock?: string;
  balls?: number;
  strikes?: number;
  outs?: number;
}

interface ESPNGame {
  id?: string;
  name?: string;
  startTime?: string;
  status?: ESPNGameStatus;
  competitors?: ESPNCompetitor[];
  venue?: { name?: string };
}

interface LiveScoresResponse {
  sports?: {
    mlb?: { games?: ESPNGame[] };
    nfl?: { games?: ESPNGame[]; week?: number };
    nba?: { games?: ESPNGame[] };
    ncaa?: { football?: { games?: ESPNGame[] } };
    ncaaBaseball?: { games?: ESPNGame[] };
  };
}

/**
 * Transform ESPN game format to our standard Game interface
 */
function transformESPNGame(
  game: ESPNGame,
  sportType: 'baseball' | 'football' | 'basketball'
): Game {
  const competitors = game.competitors || [];
  const homeCompetitor = competitors.find((c) => c.homeAway === 'home');
  const awayCompetitor = competitors.find((c) => c.homeAway === 'away');

  // Map ESPN status to our status
  const statusType = game.status?.type?.name?.toLowerCase() || '';
  const statusState = game.status?.type?.state?.toLowerCase() || '';
  let status: Game['status'] = 'scheduled';

  if (game.status?.type?.completed) {
    status = 'final';
  } else if (statusType.includes('in') || statusState === 'in') {
    status = 'live';
  } else if (statusType.includes('delayed') || statusType.includes('delay')) {
    status = 'delayed';
  } else if (statusType.includes('postponed')) {
    status = 'postponed';
  } else if (
    statusType.includes('scheduled') ||
    statusType.includes('pre') ||
    statusState === 'pre'
  ) {
    status = 'scheduled';
  } else if (statusType.includes('final') || statusState === 'post') {
    status = 'final';
  }

  // Build game time string
  let gameTime = game.status?.type?.shortDetail || game.status?.type?.detail;
  if (!gameTime && game.startTime) {
    gameTime = new Date(game.startTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  }

  // Build period/inning/quarter string based on sport
  const periodInfo: { inning?: string; quarter?: string; period?: string } = {};
  if (sportType === 'baseball' && game.status?.period) {
    periodInfo.inning = `${game.status.period}${game.status.type?.state === 'in' ? ' - Live' : ''}`;
  } else if (sportType === 'football' && game.status?.period) {
    periodInfo.quarter = game.status.displayClock
      ? `Q${game.status.period} - ${game.status.displayClock}`
      : `Q${game.status.period}`;
  } else if (sportType === 'basketball' && game.status?.period) {
    periodInfo.period = game.status.displayClock
      ? `${game.status.period}Q - ${game.status.displayClock}`
      : `${game.status.period}Q`;
  }

  return {
    id: game.id || String(Math.random()),
    homeTeam: {
      name: homeCompetitor?.team?.displayName || 'Home',
      abbreviation: homeCompetitor?.team?.abbreviation || 'HOM',
      score: parseInt(homeCompetitor?.score || '0', 10) || 0,
    },
    awayTeam: {
      name: awayCompetitor?.team?.displayName || 'Away',
      abbreviation: awayCompetitor?.team?.abbreviation || 'AWY',
      score: parseInt(awayCompetitor?.score || '0', 10) || 0,
    },
    status,
    gameTime,
    venue: game.venue?.name,
    ...periodInfo,
  };
}

async function fetchScores(sport: Sport): Promise<Game[]> {
  const sportQuery = SPORT_QUERY_MAP[sport];
  const endpoint = `${API_BASE}/live-scores?sport=${sportQuery}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      return getMockGames(sport);
    }

    const data = (await res.json()) as LiveScoresResponse;

    // Extract games based on sport type
    let games: ESPNGame[] = [];
    let sportType: 'baseball' | 'football' | 'basketball' = 'baseball';

    switch (sport) {
      case 'mlb':
        games = data.sports?.mlb?.games || [];
        sportType = 'baseball';
        break;
      case 'nfl':
        games = data.sports?.nfl?.games || [];
        sportType = 'football';
        break;
      case 'nba':
        games = data.sports?.nba?.games || [];
        sportType = 'basketball';
        break;
      case 'ncaa':
        // Default NCAA to baseball (college baseball)
        games = data.sports?.ncaaBaseball?.games || [];
        sportType = 'baseball';
        break;
    }

    if (games.length === 0) {
      return getMockGames(sport);
    }

    // Transform ESPN format to our Game interface
    return games.slice(0, 9).map((game) => transformESPNGame(game, sportType));
  } catch {
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
