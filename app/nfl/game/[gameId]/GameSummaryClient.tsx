'use client';

import { useGameData } from './layout';
import { Card } from '@/components/ui/Card';

export default function GameSummaryClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null;
  }

  const hasLeaders = game.leaders?.passing || game.leaders?.rushing || game.leaders?.receiving;

  return (
    <div className="space-y-6">
      {hasLeaders && (
        <Card variant="default" padding="md">
          <h3 className="text-lg font-semibold text-white mb-4">Game Leaders</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {game.leaders?.passing && (
              <div className="p-3 bg-graphite rounded-lg">
                <p className="text-xs text-text-tertiary uppercase mb-1">Passing</p>
                <p className="font-semibold text-white">{game.leaders.passing.name}</p>
                <p className="text-text-secondary text-sm">{game.leaders.passing.stats}</p>
              </div>
            )}
            {game.leaders?.rushing && (
              <div className="p-3 bg-graphite rounded-lg">
                <p className="text-xs text-text-tertiary uppercase mb-1">Rushing</p>
                <p className="font-semibold text-white">{game.leaders.rushing.name}</p>
                <p className="text-text-secondary text-sm">{game.leaders.rushing.stats}</p>
              </div>
            )}
            {game.leaders?.receiving && (
              <div className="p-3 bg-graphite rounded-lg">
                <p className="text-xs text-text-tertiary uppercase mb-1">Receiving</p>
                <p className="font-semibold text-white">{game.leaders.receiving.name}</p>
                <p className="text-text-secondary text-sm">{game.leaders.receiving.stats}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card variant="default" padding="md">
        <h3 className="text-lg font-semibold text-white mb-4">Scoring Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary">
                <th className="text-left py-2 pr-4 w-16">Team</th>
                <th className="text-center py-2 w-10">Q1</th>
                <th className="text-center py-2 w-10">Q2</th>
                <th className="text-center py-2 w-10">Q3</th>
                <th className="text-center py-2 w-10">Q4</th>
                <th className="text-center py-2 w-10 border-l border-border-subtle font-bold text-burnt-orange">
                  T
                </th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border-subtle">
                <td className="py-2 font-semibold text-white">{game.teams.away.abbreviation}</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2 font-bold text-white border-l border-border-subtle">
                  {game.teams.away.score}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-white">{game.teams.home.abbreviation}</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2 font-bold text-white border-l border-border-subtle">
                  {game.teams.home.score}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

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
              Full game stats will appear once kickoff happens
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
