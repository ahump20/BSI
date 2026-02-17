'use client';

import { useGameData } from '../layout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * College Baseball Box Score Page
 *
 * Full batting and pitching lines for both teams.
 */
export default function CollegeBoxScoreClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const { boxscore } = game;

  // No box score available
  if (!boxscore) {
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p className="text-text-secondary">Box score not available yet.</p>
          <p className="text-text-tertiary text-sm mt-2">
            Once the first pitch flies, every at-bat and every pitch gets tracked here. The full
            picture, no ESPN filter.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Away Team */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange relative">
            {game.teams.away.abbreviation}
            {game.teams.away.ranking && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                {game.teams.away.ranking}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{game.teams.away.name}</h3>
            <p className="text-text-tertiary text-sm">{game.teams.away.record}</p>
          </div>
        </div>

        {/* Away Batting */}
        <Card variant="default" padding="none" className="mb-4 overflow-hidden">
          <CardHeader className="bg-graphite">
            <CardTitle size="sm">Batting</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={`${game.teams.away.abbreviation || 'Away'} batting statistics`}>
              <thead>
                <tr className="border-b border-border-subtle bg-charcoal text-text-tertiary">
                  <th scope="col" className="text-left p-3 font-medium">Player</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">AB</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">R</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">H</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">RBI</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">BB</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">SO</th>
                  <th scope="col" className="text-center p-3 font-medium w-16">AVG</th>
                </tr>
              </thead>
              <tbody>
                {boxscore.away.batting.map((batter, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary text-xs w-6">
                          {batter.player.position}
                        </span>
                        <span className="text-white font-medium">{batter.player.name}</span>
                        {batter.player.year && (
                          <span className="text-text-tertiary text-xs">({batter.player.year})</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.ab}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.r}</td>
                    <td className="text-center p-3 font-mono text-white font-semibold">
                      {batter.h}
                    </td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.rbi}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.bb}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.so}</td>
                    <td className="text-center p-3 font-mono text-text-tertiary">{batter.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Away Pitching */}
        <Card variant="default" padding="none" className="overflow-hidden">
          <CardHeader className="bg-graphite">
            <CardTitle size="sm">Pitching</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={`${game.teams.away.abbreviation || 'Away'} pitching statistics`}>
              <thead>
                <tr className="border-b border-border-subtle bg-charcoal text-text-tertiary">
                  <th scope="col" className="text-left p-3 font-medium">Pitcher</th>
                  <th scope="col" className="text-center p-3 font-medium w-14">IP</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">H</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">R</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">ER</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">BB</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">K</th>
                  <th scope="col" className="text-center p-3 font-medium w-16">ERA</th>
                </tr>
              </thead>
              <tbody>
                {boxscore.away.pitching.map((pitcher, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{pitcher.player.name}</span>
                        {pitcher.player.year && (
                          <span className="text-text-tertiary text-xs">
                            ({pitcher.player.year})
                          </span>
                        )}
                        {pitcher.decision && (
                          <Badge
                            variant={
                              pitcher.decision === 'W'
                                ? 'success'
                                : pitcher.decision === 'L'
                                  ? 'error'
                                  : 'secondary'
                            }
                            size="sm"
                          >
                            {pitcher.decision}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3 font-mono text-white font-semibold">
                      {pitcher.ip}
                    </td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.h}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.r}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.er}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.bb}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.so}</td>
                    <td className="text-center p-3 font-mono text-text-tertiary">{pitcher.era}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Home Team */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange relative">
            {game.teams.home.abbreviation}
            {game.teams.home.ranking && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                {game.teams.home.ranking}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{game.teams.home.name}</h3>
            <p className="text-text-tertiary text-sm">{game.teams.home.record}</p>
          </div>
        </div>

        {/* Home Batting */}
        <Card variant="default" padding="none" className="mb-4 overflow-hidden">
          <CardHeader className="bg-graphite">
            <CardTitle size="sm">Batting</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={`${game.teams.home.abbreviation || 'Home'} batting statistics`}>
              <thead>
                <tr className="border-b border-border-subtle bg-charcoal text-text-tertiary">
                  <th scope="col" className="text-left p-3 font-medium">Player</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">AB</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">R</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">H</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">RBI</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">BB</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">SO</th>
                  <th scope="col" className="text-center p-3 font-medium w-16">AVG</th>
                </tr>
              </thead>
              <tbody>
                {boxscore.home.batting.map((batter, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary text-xs w-6">
                          {batter.player.position}
                        </span>
                        <span className="text-white font-medium">{batter.player.name}</span>
                        {batter.player.year && (
                          <span className="text-text-tertiary text-xs">({batter.player.year})</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.ab}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.r}</td>
                    <td className="text-center p-3 font-mono text-white font-semibold">
                      {batter.h}
                    </td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.rbi}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.bb}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{batter.so}</td>
                    <td className="text-center p-3 font-mono text-text-tertiary">{batter.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Home Pitching */}
        <Card variant="default" padding="none" className="overflow-hidden">
          <CardHeader className="bg-graphite">
            <CardTitle size="sm">Pitching</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={`${game.teams.home.abbreviation || 'Home'} pitching statistics`}>
              <thead>
                <tr className="border-b border-border-subtle bg-charcoal text-text-tertiary">
                  <th scope="col" className="text-left p-3 font-medium">Pitcher</th>
                  <th scope="col" className="text-center p-3 font-medium w-14">IP</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">H</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">R</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">ER</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">BB</th>
                  <th scope="col" className="text-center p-3 font-medium w-12">K</th>
                  <th scope="col" className="text-center p-3 font-medium w-16">ERA</th>
                </tr>
              </thead>
              <tbody>
                {boxscore.home.pitching.map((pitcher, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{pitcher.player.name}</span>
                        {pitcher.player.year && (
                          <span className="text-text-tertiary text-xs">
                            ({pitcher.player.year})
                          </span>
                        )}
                        {pitcher.decision && (
                          <Badge
                            variant={
                              pitcher.decision === 'W'
                                ? 'success'
                                : pitcher.decision === 'L'
                                  ? 'error'
                                  : 'secondary'
                            }
                            size="sm"
                          >
                            {pitcher.decision}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-3 font-mono text-white font-semibold">
                      {pitcher.ip}
                    </td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.h}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.r}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.er}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.bb}</td>
                    <td className="text-center p-3 font-mono text-text-secondary">{pitcher.so}</td>
                    <td className="text-center p-3 font-mono text-text-tertiary">{pitcher.era}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
