'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface LiveScore {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

export function HomeLiveScores() {
  const [scores, setScores] = useState<LiveScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/college-baseball/scores')
      .then((r) => r.json())
      .then((data: { games?: LiveScore[] }) => setScores(data.games ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-charcoal rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <Card padding="md" className="text-center">
        <p className="text-text-tertiary">No live games right now. Check back during game time.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scores.slice(0, 6).map((game) => (
        <Link key={game.id} href={`/college-baseball/games/${game.id}`}>
          <Card padding="sm" className="hover:border-burnt-orange/40 transition-colors cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium text-sm">{game.awayTeam}</div>
                <div className="text-white font-medium text-sm">{game.homeTeam}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-mono">{game.awayScore}</div>
                <div className="text-white font-mono">{game.homeScore}</div>
              </div>
            </div>
            <div className="text-xs text-burnt-orange mt-1">{game.status}</div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
