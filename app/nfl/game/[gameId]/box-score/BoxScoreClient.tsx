'use client';

import { useGameData } from '../layout';
import { Card } from '@/components/ui/Card';

export default function BoxScoreClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null;
  }

  const isGameStarted = game.status.isLive || game.status.isFinal;

  if (!isGameStarted) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16 text-text-tertiary mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-text-secondary">Box score data not available yet</p>
          <p className="text-text-tertiary text-sm mt-2">
            The full box score will appear once the game gets underway
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="default" padding="md">
        <h3 className="text-lg font-semibold text-white mb-4">Team Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary">
                <th className="text-left py-2">Stat</th>
                <th className="text-center py-2">{game.teams.away.abbreviation}</th>
                <th className="text-center py-2">{game.teams.home.abbreviation}</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border-subtle">
                <td className="py-2">Total Yards</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-2">Passing Yards</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-2">Rushing Yards</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-2">First Downs</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-2">3rd Down Efficiency</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-2">Turnovers</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
              <tr>
                <td className="py-2">Time of Possession</td>
                <td className="text-center py-2">-</td>
                <td className="text-center py-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-tertiary text-xs mt-4 text-center">
          Detailed player stats require API enhancement. Coming soon.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="default" padding="md">
          <h4 className="text-sm font-semibold text-text-tertiary uppercase mb-3">
            {game.teams.away.name} Key Players
          </h4>
          <p className="text-text-secondary text-sm">
            Player stats will be available when full box score API is connected
          </p>
        </Card>

        <Card variant="default" padding="md">
          <h4 className="text-sm font-semibold text-text-tertiary uppercase mb-3">
            {game.teams.home.name} Key Players
          </h4>
          <p className="text-text-secondary text-sm">
            Player stats will be available when full box score API is connected
          </p>
        </Card>
      </div>
    </div>
  );
}
