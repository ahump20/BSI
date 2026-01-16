'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface Game {
  id: string;
  league: string;
  status: {
    isLive: boolean;
    isFinal: boolean;
    detail: string;
    shortDetail: string;
    period?: number;
    clock?: string;
    inning?: number;
    quarter?: number;
  };
  teams: {
    away: {
      team: string;
      abbreviation: string;
      logo?: string;
      score: number;
    };
    home: {
      team: string;
      abbreviation: string;
      logo?: string;
      score: number;
    };
  };
}

interface LiveGamesData {
  mlb: Game[];
  nfl: Game[];
  nba: Game[];
}

interface ScoresResponse {
  data?: { games?: unknown[] };
}

function LiveBadge({ league }: { league: string }) {
  const colors: Record<string, string> = {
    MLB: 'bg-red-500/20 text-red-400',
    NFL: 'bg-green-500/20 text-green-400',
    NBA: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors[league] || 'bg-success/20 text-success'}`}
    >
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
      {league}
    </span>
  );
}

function GameMiniCard({ game }: { game: Game }) {
  const { teams, status, league } = game;

  return (
    <Card className="p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <LiveBadge league={league} />
        <span className="text-xs text-white/50">{status.shortDetail}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">{teams.away.abbreviation}</span>
          <span className="text-white font-medium">{teams.away.score}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">{teams.home.abbreviation}</span>
          <span className="text-white font-medium">{teams.home.score}</span>
        </div>
      </div>
    </Card>
  );
}

export function LiveGamesWidget() {
  const [games, setGames] = useState<LiveGamesData>({ mlb: [], nfl: [], nba: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllLiveGames() {
      try {
        // Fetch from all three sports in parallel
        const [mlbRes, nflRes, nbaRes] = await Promise.allSettled([
          fetch('/api/mlb/scores'),
          fetch('/api/nfl/scores'),
          fetch('/api/nba/scores'),
        ]);

        const processResponse = async (
          res: PromiseSettledResult<Response>,
          league: string
        ): Promise<Game[]> => {
          if (res.status === 'rejected') return [];
          const data = (await res.value.json()) as ScoresResponse;
          if (!data.data?.games) return [];

          return data.data.games
            .filter((g: any) => g.status?.isLive)
            .map((g: any) => ({
              ...g,
              league,
            }));
        };

        const mlbGames = await processResponse(mlbRes, 'MLB');
        const nflGames = await processResponse(nflRes, 'NFL');
        const nbaGames = await processResponse(nbaRes, 'NBA');

        setGames({ mlb: mlbGames, nfl: nflGames, nba: nbaGames });
        setLoading(false);
      } catch (err) {
        setError('Failed to load live games');
        setLoading(false);
      }
    }

    fetchAllLiveGames();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAllLiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const allLiveGames = [...games.mlb, ...games.nfl, ...games.nba];
  const hasLiveGames = allLiveGames.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !hasLiveGames) {
    return (
      <div className="text-center py-8">
        <p className="text-white/50 mb-4">{error || 'No live games right now'}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/mlb" className="text-sm text-burnt-orange hover:underline">
            Check MLB Schedule
          </Link>
          <Link href="/nfl" className="text-sm text-burnt-orange hover:underline">
            Check NFL Schedule
          </Link>
          <Link href="/nba" className="text-sm text-burnt-orange hover:underline">
            Check NBA Schedule
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          LIVE NOW
        </span>
        <span className="text-white/50 text-sm">
          {allLiveGames.length} game{allLiveGames.length !== 1 ? 's' : ''} in progress
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
        {allLiveGames.map((game) => (
          <GameMiniCard key={`${game.league}-${game.id}`} game={game} />
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link href="/dashboard" className="text-sm text-burnt-orange hover:underline">
          View all games in Dashboard →
        </Link>
      </div>
    </div>
  );
}
