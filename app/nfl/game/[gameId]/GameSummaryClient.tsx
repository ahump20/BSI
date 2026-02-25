'use client';

import { useGameData } from './layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Game Summary Page (default tab)
 *
 * Shows leaders (passing, rushing, receiving) and key stat comparison.
 * This is the main landing page for /nfl/game/[gameId]
 */
export default function GameSummaryClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const homeTeam = game.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game.competitors?.find((c) => c.homeAway === 'away');

  // Extract leaders from the game data
  // ESPN leaders shape: [{name: 'passingYards', displayName: 'Passing', leaders: [{displayValue, athlete}]}]
  const leaders = game.leaders || [];

  const leaderLabels: Record<string, string> = {
    passingYards: 'Passing',
    passingLeader: 'Passing',
    rushingYards: 'Rushing',
    rushingLeader: 'Rushing',
    receivingYards: 'Receiving',
    receivingLeader: 'Receiving',
  };

  const leaderBadgeVariants: Record<string, 'primary' | 'success' | 'secondary'> = {
    passingYards: 'primary',
    passingLeader: 'primary',
    rushingYards: 'success',
    rushingLeader: 'success',
    receivingYards: 'secondary',
    receivingLeader: 'secondary',
  };

  // Extract key statistics from competitors
  const getStatValue = (
    competitor: typeof homeTeam,
    statName: string
  ): string | undefined => {
    return competitor?.statistics?.find((s) => s.name === statName)?.displayValue;
  };

  // Key comparison stats for NFL
  const comparisonStats = [
    { label: 'Total Yards', stat: 'totalYards' },
    { label: 'Passing Yards', stat: 'netPassingYards' },
    { label: 'Rushing Yards', stat: 'rushingYards' },
    { label: '1st Downs', stat: 'firstDowns' },
    { label: '3rd Down Eff', stat: 'thirdDownEff' },
    { label: 'Turnovers', stat: 'turnovers', inverse: true },
  ];

  const hasStats = homeTeam?.statistics && homeTeam.statistics.length > 0;
  const hasLeaders = leaders.length > 0;
  const hasData = hasStats || hasLeaders;

  return (
    <div className="space-y-6">
      {/* Leaders Cards */}
      {hasLeaders && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leaders.map((leader) => {
            const topPerformer = leader.leaders?.[0];
            if (!topPerformer) return null;

            const statKey = leader.name || '';
            const label = leaderLabels[statKey] || leader.displayName || statKey;
            const variant = leaderBadgeVariants[statKey] || 'secondary';

            return (
              <Card key={statKey} variant="default" padding="md">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={variant}>{label}</Badge>
                  <span className="text-text-tertiary text-sm">Leader</span>
                </div>
                <p className="text-white font-semibold text-lg">
                  {topPerformer.athlete?.displayName || 'Unknown'}
                </p>
                <p className="text-text-secondary text-sm mt-1">
                  {topPerformer.displayValue || ''}
                  {topPerformer.athlete?.position?.abbreviation && (
                    <span className="text-text-tertiary ml-2">
                      ({topPerformer.athlete.position.abbreviation})
                    </span>
                  )}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Key Stat Comparison */}
      {hasStats && (
        <Card variant="default" padding="md">
          <h3 className="text-lg font-semibold text-white mb-4">Key Stats</h3>
          <div className="space-y-4">
            {comparisonStats.map((item) => {
              const awayVal = getStatValue(awayTeam, item.stat);
              const homeVal = getStatValue(homeTeam, item.stat);
              if (!awayVal && !homeVal) return null;

              // Parse numeric portion — handles "5/12" style values by using first number
              const parseNum = (val: string | undefined) => {
                if (!val) return 0;
                const match = val.match(/^[\d.]+/);
                return match ? parseFloat(match[0]) : 0;
              };

              const awayNum = parseNum(awayVal);
              const homeNum = parseNum(homeVal);
              const isInverse = item.inverse;
              const awayBetter = isInverse ? awayNum < homeNum : awayNum > homeNum;
              const tied = awayNum === homeNum;

              return (
                <div key={item.stat} className="px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-mono ${
                        !tied && awayBetter ? 'text-success font-bold' : 'text-text-secondary'
                      }`}
                    >
                      {awayVal || '-'}
                    </span>
                    <span className="text-xs text-text-tertiary uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        !tied && !awayBetter ? 'text-success font-bold' : 'text-text-secondary'
                      }`}
                    >
                      {homeVal || '-'}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-graphite">
                    <div
                      className={`transition-all ${
                        !tied && awayBetter ? 'bg-success' : 'bg-burnt-orange/50'
                      }`}
                      style={{
                        width: `${awayNum + homeNum > 0 ? (awayNum / (awayNum + homeNum)) * 100 : 50}%`,
                      }}
                    />
                    <div
                      className={`transition-all ${
                        !tied && !awayBetter ? 'bg-success' : 'bg-burnt-orange/50'
                      }`}
                      style={{
                        width: `${awayNum + homeNum > 0 ? (homeNum / (awayNum + homeNum)) * 100 : 50}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!hasData && (
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
            <p className="text-text-secondary">Game hasn't started yet</p>
            <p className="text-text-tertiary text-sm mt-2">
              Leaders, stats, and box score will appear once kickoff happens
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
