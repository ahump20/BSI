'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface GameLogEntry {
  date: string;
  week?: string | number;
  opponent: {
    name: string;
    abbreviation: string;
    logo?: string;
  };
  result: {
    outcome: 'W' | 'L' | 'T';
    score: string;
  };
  stats: string;
  isHome: boolean;
}

export interface GameLogProps {
  games: GameLogEntry[];
  sport: string;
}

type FilterType = 'all' | 'home' | 'away';

export function GameLog({ games, sport }: GameLogProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredGames = games.filter((game) => {
    if (filter === 'all') return true;
    if (filter === 'home') return game.isHome;
    return !game.isHome;
  });

  const isBaseball = sport === 'mlb' || sport === 'cbb' || sport === 'college-baseball';

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-burnt-orange"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Game Log
        </CardTitle>
        <div className="flex gap-2">
          {(['all', 'home', 'away'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-burnt-orange text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Games' : f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredGames.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-tertiary">No games found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGames.map((game, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                {/* Date/Week */}
                <div className="w-20 flex-shrink-0">
                  <p className="text-xs text-text-tertiary">
                    {isBaseball ? game.date : `Week ${game.week}`}
                  </p>
                  {!isBaseball && <p className="text-sm text-text-secondary">{game.date}</p>}
                </div>

                {/* Opponent */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary">{game.isHome ? 'vs' : '@'}</span>
                    <span className="font-medium text-white truncate">{game.opponent.name}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5 truncate">{game.stats}</p>
                </div>

                {/* Result */}
                <div
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    game.result.outcome === 'W'
                      ? 'bg-success/15 text-success border border-success/30'
                      : game.result.outcome === 'T'
                        ? 'bg-gold/15 text-gold border border-gold/30'
                        : 'bg-error/15 text-error border border-error/30'
                  }`}
                >
                  {game.result.outcome} {game.result.score}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-border-subtle">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-success">
                {games.filter((g) => g.result.outcome === 'W').length}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error">
                {games.filter((g) => g.result.outcome === 'L').length}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">
                {games.filter((g) => g.result.outcome === 'T').length}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Ties</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{games.length}</p>
              <p className="text-xs text-text-tertiary mt-1">Games</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
