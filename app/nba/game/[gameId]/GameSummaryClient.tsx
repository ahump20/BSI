'use client';

import { useGameData } from './layout';
import { Card } from '@/components/ui/Card';

export default function GameSummaryClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null;
  }

  const hasLeaders = game.leaders && game.leaders.length > 0;

  return (
    <div className="space-y-6">
      {hasLeaders && (
        <Card variant="default" padding="md">
          <h3 className="text-lg font-semibold text-white mb-4">Game Leaders</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {game.leaders?.map((teamLeaders, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-sm font-semibold text-text-tertiary uppercase">
                  {teamLeaders.team}
                </h4>
                {teamLeaders.categories?.map((cat, catIdx) => (
                  <div key={catIdx} className="p-3 bg-graphite rounded-lg">
                    <p className="text-xs text-text-tertiary uppercase mb-1">{cat.category}</p>
                    <p className="font-semibold text-white">{cat.leader?.name || '-'}</p>
                    <p className="text-text-secondary text-sm">{cat.leader?.value || '-'}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!game.status.isLive && !game.status.isFinal && (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <svg
              viewBox="0 0 24 24"
              className="w-16 h-16 text-text-tertiary mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            <p className="text-text-secondary">Game hasn&apos;t started yet</p>
            <p className="text-text-tertiary text-sm mt-2">
              Full game stats will appear once tip-off happens
            </p>
          </div>
        </Card>
      )}

      {(game.status.isLive || game.status.isFinal) && !hasLeaders && (
        <Card variant="default" padding="md">
          <p className="text-text-secondary text-center py-4">
            Game leaders will appear when stats are available
          </p>
        </Card>
      )}
    </div>
  );
}
