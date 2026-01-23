'use client';

import { useGameData } from './GameLayoutClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function GameSummaryClient() {
  const { game } = useGameData();

  if (!game) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Game Leaders</CardTitle>
        </CardHeader>
        <CardContent>
          {game.leaders ? (
            <div className="space-y-4">
              {game.leaders.points && (
                <div>
                  <p className="text-xs text-text-tertiary uppercase">Points</p>
                  <p className="text-white font-medium">{game.leaders.points.name}</p>
                  <p className="text-sm text-text-secondary">{game.leaders.points.stats}</p>
                </div>
              )}
              {game.leaders.rebounds && (
                <div>
                  <p className="text-xs text-text-tertiary uppercase">Rebounds</p>
                  <p className="text-white font-medium">{game.leaders.rebounds.name}</p>
                  <p className="text-sm text-text-secondary">{game.leaders.rebounds.stats}</p>
                </div>
              )}
              {game.leaders.assists && (
                <div>
                  <p className="text-xs text-text-tertiary uppercase">Assists</p>
                  <p className="text-white font-medium">{game.leaders.assists.name}</p>
                  <p className="text-sm text-text-secondary">{game.leaders.assists.stats}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-text-secondary">Leaders not available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Game Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Venue</dt>
              <dd className="text-white">{game.venue}</dd>
            </div>
            {game.broadcast && (
              <div className="flex justify-between">
                <dt className="text-text-tertiary">TV</dt>
                <dd className="text-white">{game.broadcast}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Status</dt>
              <dd className="text-white">{game.status.state}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
