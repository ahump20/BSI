'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TrendingPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  stat: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}

interface TopGame {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  reason: string;
}

export function TrendingPlayers() {
  const [players, setPlayers] = useState<TrendingPlayer[]>([]);
  const [games, setGames] = useState<TopGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/college-baseball/trending')
      .then((r) => r.json())
      .then((data: { trendingPlayers?: TrendingPlayer[]; topGames?: TopGame[] }) => {
        setPlayers(data.trendingPlayers ?? []);
        setGames(data.topGames ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card padding="md">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-charcoal rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card padding="md">
        <h3 className="font-display text-lg font-bold text-white mb-4">Trending Players</h3>
        {players.length === 0 ? (
          <p className="text-text-tertiary text-sm">No trending data available yet.</p>
        ) : (
          <div className="space-y-3">
            {players.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/college-baseball/players/${p.id}`}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0 hover:bg-charcoal/50 -mx-2 px-2 rounded transition-colors"
              >
                <div>
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-text-tertiary text-xs ml-2">{p.team} &middot; {p.position}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm">{p.stat}: {p.value}</span>
                  <span className={p.trend === 'up' ? 'text-success' : p.trend === 'down' ? 'text-error' : 'text-text-tertiary'}>
                    {p.trend === 'up' ? '\u2191' : p.trend === 'down' ? '\u2193' : '-'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <h3 className="font-display text-lg font-bold text-white mb-4">Top Games</h3>
        {games.length === 0 ? (
          <p className="text-text-tertiary text-sm">No top games available yet.</p>
        ) : (
          <div className="space-y-3">
            {games.slice(0, 5).map((g) => (
              <Link
                key={g.id}
                href={`/college-baseball/games/${g.id}`}
                className="block py-2 border-b border-border-subtle last:border-0 hover:bg-charcoal/50 -mx-2 px-2 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{g.teamA} vs {g.teamB}</span>
                  <span className="text-text-secondary text-sm font-mono">{g.scoreA}-{g.scoreB}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" size="sm">{g.status}</Badge>
                  <span className="text-text-tertiary text-xs">{g.reason}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
