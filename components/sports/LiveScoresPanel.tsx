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
    // Safely extract games array from various response shapes
    const gamesArray = data?.games || data?.data || data;
    return Array.isArray(gamesArray) ? gamesArray : [];
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

  // Safely filter for live games - ensure games is actually an array
  const gamesArray = Array.isArray(games) ? games : [];
  const liveGames = gamesArray.filter((g) => g.status === 'live');
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
      ) : gamesArray.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamesArray.map((game) => (
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
