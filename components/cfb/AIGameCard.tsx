'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface GameTeam {
  name: string;
  abbreviation: string;
  logo: string;
  score: string;
  record: string;
}

interface CFBGame {
  id: string;
  name: string;
  date: string;
  status: string;
  completed: boolean;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  venue: string;
  broadcast: string;
  contentType: 'preview' | 'recap';
  aiContent: string;
}

interface AIGameCardProps {
  game: CFBGame;
}

export function AIGameCard({ game }: AIGameCardProps) {
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });
  const formattedTime = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });

  return (
    <Card className="overflow-hidden hover:border-burnt-orange/50 transition-all duration-300">
      {/* Game Header */}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant={game.completed ? 'success' : 'warning'}>
            {game.completed ? 'Final' : game.status}
          </Badge>
          <div className="text-right text-xs text-text-tertiary">
            <div>{formattedDate}</div>
            {!game.completed && <div>{formattedTime} CT</div>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Matchup */}
        <div className="flex items-center justify-between gap-4">
          {/* Away Team */}
          <div className="flex-1 text-center">
            {game.awayTeam.logo && (
              <div className="w-12 h-12 mx-auto mb-2 relative">
                <Image
                  src={game.awayTeam.logo}
                  alt={game.awayTeam.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="font-semibold text-white text-sm">{game.awayTeam.abbreviation}</div>
            <div className="text-xs text-text-tertiary">{game.awayTeam.record}</div>
            {game.completed && (
              <div className="text-2xl font-bold text-white mt-1">{game.awayTeam.score}</div>
            )}
          </div>

          {/* VS / Score Separator */}
          <div className="text-text-tertiary font-medium">
            {game.completed ? '-' : '@'}
          </div>

          {/* Home Team */}
          <div className="flex-1 text-center">
            {game.homeTeam.logo && (
              <div className="w-12 h-12 mx-auto mb-2 relative">
                <Image
                  src={game.homeTeam.logo}
                  alt={game.homeTeam.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="font-semibold text-white text-sm">{game.homeTeam.abbreviation}</div>
            <div className="text-xs text-text-tertiary">{game.homeTeam.record}</div>
            {game.completed && (
              <div className="text-2xl font-bold text-white mt-1">{game.homeTeam.score}</div>
            )}
          </div>
        </div>

        {/* Venue & Broadcast */}
        <div className="text-xs text-text-tertiary text-center border-t border-border-subtle pt-3">
          {game.venue && <div>{game.venue}</div>}
          {game.broadcast && <div className="text-burnt-orange">{game.broadcast}</div>}
        </div>

        {/* AI Content */}
        <div className="bg-charcoal/50 rounded-lg p-4 border border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-orange">
              AI {game.contentType === 'preview' ? 'Preview' : 'Recap'}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Workers AI
            </Badge>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {game.aiContent}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface CFBGamesListProps {
  date?: string;
  limit?: number;
}

export function CFBGamesList({ date, limit = 6 }: CFBGamesListProps) {
  const [games, setGames] = useState<CFBGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        params.set('limit', limit.toString());

        const response = await fetch(`/api/cfb/games?${params}`);
        if (!response.ok) throw new Error('Failed to fetch games');

        const data = await response.json();
        setGames(data.games || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [date, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-charcoal rounded w-1/4 mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 bg-charcoal rounded-full" />
                <div className="h-6 bg-charcoal rounded w-8" />
                <div className="w-12 h-12 bg-charcoal rounded-full" />
              </div>
              <div className="h-20 bg-charcoal rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-text-tertiary">{error}</p>
          <p className="text-sm text-text-tertiary mt-2">
            CFB AI previews and recaps will be available during the season.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-text-tertiary">No games scheduled for this date.</p>
          <p className="text-sm text-burnt-orange mt-2">
            Check back during the CFB season for AI-powered previews and recaps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <AIGameCard key={game.id} game={game} />
      ))}
    </div>
  );
}

export default CFBGamesList;
