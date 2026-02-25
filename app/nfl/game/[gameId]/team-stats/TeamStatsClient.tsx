'use client';

import { useMemo } from 'react';
import { useGameData } from '../layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

/**
 * Team Stats Page
 *
 * Team comparison stats using the statistics arrays from competitors.
 * Shows comparison bars for NFL-specific stats: total yards, passing, rushing,
 * turnovers, penalties, possession, third/fourth down efficiency, etc.
 */

// NFL stat display config: which stats to show, labels, and whether lower is better
const STAT_CONFIG: Array<{ name: string; label: string; inverse?: boolean }> = [
  { name: 'totalYards', label: 'Total Yards' },
  { name: 'netPassingYards', label: 'Passing Yards' },
  { name: 'completionAttempts', label: 'Comp/Att' },
  { name: 'yardsPerPass', label: 'Yards/Pass' },
  { name: 'rushingYards', label: 'Rushing Yards' },
  { name: 'yardsPerRushAttempt', label: 'Yards/Rush' },
  { name: 'rushingAttempts', label: 'Rush Attempts' },
  { name: 'firstDowns', label: 'First Downs' },
  { name: 'thirdDownEff', label: '3rd Down Eff' },
  { name: 'fourthDownEff', label: '4th Down Eff' },
  { name: 'totalPenaltiesYards', label: 'Penalties', inverse: true },
  { name: 'turnovers', label: 'Turnovers', inverse: true },
  { name: 'fpiConversions', label: 'Fumbles Lost', inverse: true },
  { name: 'interceptions', label: 'INTs Thrown', inverse: true },
  { name: 'possessionTime', label: 'Time of Possession' },
  { name: 'totalDrives', label: 'Total Drives' },
  { name: 'sacksYardsLost', label: 'Sacks/Yards Lost', inverse: true },
  { name: 'redZoneAttempts', label: 'Red Zone Att' },
];

function getTeamLogo(competitor: { team?: { logos?: Array<{ href?: string }>; logo?: string } } | undefined): string | null {
  return competitor?.team?.logos?.[0]?.href || competitor?.team?.logo || null;
}

export default function TeamStatsClient() {
  const { game, loading, error } = useGameData();

  const homeTeam = game?.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game?.competitors?.find((c) => c.homeAway === 'away');

  // Build comparison data from competitor statistics arrays
  const comparisonStats = useMemo(() => {
    if (!awayTeam?.statistics || !homeTeam?.statistics) return [];

    const awayMap = new Map(
      awayTeam.statistics.map((s) => [s.name, s.displayValue])
    );
    const homeMap = new Map(
      homeTeam.statistics.map((s) => [s.name, s.displayValue])
    );

    return STAT_CONFIG
      .map((cfg) => {
        const awayVal = awayMap.get(cfg.name);
        const homeVal = homeMap.get(cfg.name);
        if (!awayVal && !homeVal) return null;
        return {
          label: cfg.label,
          away: awayVal || '-',
          home: homeVal || '-',
          inverse: cfg.inverse || false,
        };
      })
      .filter(Boolean) as Array<{
        label: string;
        away: string;
        home: string;
        inverse: boolean;
      }>;
  }, [awayTeam?.statistics, homeTeam?.statistics]);

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const hasStats = comparisonStats.length > 0;

  if (!hasStats) {
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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p className="text-text-secondary">Game hasn't started yet</p>
          <p className="text-text-tertiary text-sm mt-2">
            Head-to-head team stats show up once kickoff happens. Who's got the edge? You'll know
            soon.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Comparison */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Team Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Team Headers */}
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center overflow-hidden">
                {getTeamLogo(awayTeam) ? (
                  <img
                    src={getTeamLogo(awayTeam)!}
                    alt={awayTeam?.team?.abbreviation || 'Away'}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold text-burnt-orange">
                    {awayTeam?.team?.abbreviation || 'AWY'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {awayTeam?.team?.displayName || 'Away'}
                </p>
                <p className="text-text-tertiary text-sm">
                  {awayTeam?.records?.[0]?.summary || ''}
                </p>
              </div>
            </div>
            <span className="text-text-tertiary text-sm font-semibold">VS</span>
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center overflow-hidden">
                {getTeamLogo(homeTeam) ? (
                  <img
                    src={getTeamLogo(homeTeam)!}
                    alt={homeTeam?.team?.abbreviation || 'Home'}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold text-burnt-orange">
                    {homeTeam?.team?.abbreviation || 'HME'}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">
                  {homeTeam?.team?.displayName || 'Home'}
                </p>
                <p className="text-text-tertiary text-sm">
                  {homeTeam?.records?.[0]?.summary || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bars */}
          <div className="space-y-4">
            {comparisonStats.map((stat) => {
              // Parse numeric portion — handles "5/12", "32:45", or plain numbers
              const parseNum = (val: string) => {
                if (val === '-') return 0;
                // Handle time of possession "32:45" → convert to seconds for comparison
                if (val.includes(':') && !val.includes('/')) {
                  const parts = val.split(':');
                  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
                }
                // Handle "5/12" → use first number
                const match = val.match(/^[\d.]+/);
                return match ? parseFloat(match[0]) : 0;
              };

              const awayNum = parseNum(stat.away);
              const homeNum = parseNum(stat.home);
              const total = awayNum + homeNum || 1;
              const awayPct = (awayNum / total) * 100;
              const homePct = (homeNum / total) * 100;

              let awayWins = awayNum > homeNum;
              if (stat.inverse) awayWins = awayNum < homeNum;
              const tied = awayNum === homeNum;

              return (
                <div key={stat.label} className="px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-mono ${
                        !tied && awayWins ? 'text-success font-bold' : 'text-text-secondary'
                      }`}
                    >
                      {stat.away}
                    </span>
                    <span className="text-xs text-text-tertiary uppercase tracking-wide">
                      {stat.label}
                    </span>
                    <span
                      className={`text-sm font-mono ${
                        !tied && !awayWins ? 'text-success font-bold' : 'text-text-secondary'
                      }`}
                    >
                      {stat.home}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-graphite">
                    <div
                      className={`transition-all ${
                        !tied && awayWins ? 'bg-success' : 'bg-burnt-orange/50'
                      }`}
                      style={{ width: `${awayPct}%` }}
                    />
                    <div
                      className={`transition-all ${
                        !tied && !awayWins ? 'bg-success' : 'bg-burnt-orange/50'
                      }`}
                      style={{ width: `${homePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
