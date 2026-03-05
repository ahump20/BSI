'use client';

import { useMemo } from 'react';
import { useGameData } from '../layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getTeamLogo } from '@/lib/utils/game-helpers';

/**
 * Team Stats Page
 *
 * Team comparison stats using the statistics arrays from competitors.
 * Shows comparison bars following the MLB TeamStats pattern.
 */

// Stat display config: which stats to show, labels, and whether lower is better
const STAT_CONFIG: Array<{ name: string; label: string; inverse?: boolean }> = [
  { name: 'fieldGoalPct', label: 'FG%' },
  { name: 'fieldGoalsMade-fieldGoalsAttempted', label: 'FG Made/Att' },
  { name: 'threePointFieldGoalPct', label: '3PT%' },
  { name: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', label: '3PT Made/Att' },
  { name: 'freeThrowPct', label: 'FT%' },
  { name: 'freeThrowsMade-freeThrowsAttempted', label: 'FT Made/Att' },
  { name: 'totalRebounds', label: 'Total Rebounds' },
  { name: 'offensiveRebounds', label: 'Offensive Rebounds' },
  { name: 'defensiveRebounds', label: 'Defensive Rebounds' },
  { name: 'assists', label: 'Assists' },
  { name: 'steals', label: 'Steals' },
  { name: 'blocks', label: 'Blocks' },
  { name: 'turnovers', label: 'Turnovers', inverse: true },
  { name: 'teamTurnovers', label: 'Team Turnovers', inverse: true },
  { name: 'totalTechnicalFouls', label: 'Technical Fouls', inverse: true },
  { name: 'flagrantFouls', label: 'Flagrant Fouls', inverse: true },
  { name: 'fastBreakPoints', label: 'Fast Break Points' },
  { name: 'pointsInPaint', label: 'Points in Paint' },
  { name: 'pointsOffTurnovers', label: 'Points off Turnovers' },
  { name: 'largestLead', label: 'Largest Lead' },
];

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
            Head-to-head team stats show up once tipoff happens. Who's got the edge? You'll know soon.
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
              <div className="w-12 h-12 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden">
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
                <p className="font-semibold text-text-primary">
                  {awayTeam?.team?.displayName || 'Away'}
                </p>
                <p className="text-text-tertiary text-sm">
                  {awayTeam?.records?.[0]?.summary || ''}
                </p>
              </div>
            </div>
            <span className="text-text-tertiary text-sm font-semibold">VS</span>
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-12 h-12 bg-background-secondary rounded-full flex items-center justify-center overflow-hidden">
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
                <p className="font-semibold text-text-primary">
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
              const awayNum = parseFloat(stat.away) || 0;
              const homeNum = parseFloat(stat.home) || 0;
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
                  <div className="flex h-2 rounded-full overflow-hidden bg-background-tertiary">
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
