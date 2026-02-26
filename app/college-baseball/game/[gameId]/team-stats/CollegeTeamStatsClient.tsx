'use client';

import { useGameData } from '../layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

/**
 * College Baseball Team Stats Page
 *
 * Displays team comparison stats and game insights.
 */
export default function CollegeTeamStatsClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const awayBatting = game.boxscore?.away.batting || [];
  const homeBatting = game.boxscore?.home.batting || [];
  const awayPitching = game.boxscore?.away.pitching || [];
  const homePitching = game.boxscore?.home.pitching || [];

  // Calculate team batting totals
  const awayBattingTotals = awayBatting.reduce(
    (acc, b) => ({
      ab: acc.ab + b.ab,
      r: acc.r + b.r,
      h: acc.h + b.h,
      rbi: acc.rbi + b.rbi,
      bb: acc.bb + b.bb,
      so: acc.so + b.so,
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0 }
  );

  const homeBattingTotals = homeBatting.reduce(
    (acc, b) => ({
      ab: acc.ab + b.ab,
      r: acc.r + b.r,
      h: acc.h + b.h,
      rbi: acc.rbi + b.rbi,
      bb: acc.bb + b.bb,
      so: acc.so + b.so,
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0 }
  );

  // Calculate pitching totals
  const awayPitchingTotals = awayPitching.reduce(
    (acc, p) => ({
      h: acc.h + p.h,
      r: acc.r + p.r,
      er: acc.er + p.er,
      bb: acc.bb + p.bb,
      so: acc.so + p.so,
      pitches: acc.pitches + (p.pitches || 0),
    }),
    { h: 0, r: 0, er: 0, bb: 0, so: 0, pitches: 0 }
  );

  const homePitchingTotals = homePitching.reduce(
    (acc, p) => ({
      h: acc.h + p.h,
      r: acc.r + p.r,
      er: acc.er + p.er,
      bb: acc.bb + p.bb,
      so: acc.so + p.so,
      pitches: acc.pitches + (p.pitches || 0),
    }),
    { h: 0, r: 0, er: 0, bb: 0, so: 0, pitches: 0 }
  );

  // Calculate batting average
  const awayAvg =
    awayBattingTotals.ab > 0 ? (awayBattingTotals.h / awayBattingTotals.ab).toFixed(3) : '.000';
  const homeAvg =
    homeBattingTotals.ab > 0 ? (homeBattingTotals.h / homeBattingTotals.ab).toFixed(3) : '.000';

  // Stats comparison data
  const comparisonStats = [
    { label: 'Hits', away: awayBattingTotals.h, home: homeBattingTotals.h },
    { label: 'Runs', away: awayBattingTotals.r, home: homeBattingTotals.r },
    { label: 'RBI', away: awayBattingTotals.rbi, home: homeBattingTotals.rbi },
    { label: 'Walks', away: awayBattingTotals.bb, home: homeBattingTotals.bb },
    { label: 'Strikeouts', away: awayBattingTotals.so, home: homeBattingTotals.so },
    { label: 'Batting Avg', away: awayAvg, home: homeAvg, isAvg: true },
    {
      label: 'Hits Allowed',
      away: awayPitchingTotals.h,
      home: homePitchingTotals.h,
      inverse: true,
    },
    {
      label: 'Walks Allowed',
      away: awayPitchingTotals.bb,
      home: homePitchingTotals.bb,
      inverse: true,
    },
    { label: 'Strikeouts (P)', away: awayPitchingTotals.so, home: homePitchingTotals.so },
    { label: 'Total Pitches', away: awayPitchingTotals.pitches, home: homePitchingTotals.pitches },
  ];

  if (!game.boxscore) {
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
          <p className="text-text-secondary">Game hasn't started yet.</p>
          <p className="text-text-tertiary text-sm mt-2">
            Team comparisons show up once first pitch flies. Who's got the edge? You'll know
            soon—and it won't be buried in a ticker.
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
              <div className="w-12 h-12 bg-background-secondary rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange relative">
                {game.teams.away.abbreviation}
                {game.teams.away.ranking && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {game.teams.away.ranking}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{game.teams.away.name}</p>
                <p className="text-text-tertiary text-sm">{game.teams.away.record}</p>
              </div>
            </div>
            <span className="text-text-tertiary text-sm font-semibold">VS</span>
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-12 h-12 bg-background-secondary rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange relative">
                {game.teams.home.abbreviation}
                {game.teams.home.ranking && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-burnt-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {game.teams.home.ranking}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-text-primary">{game.teams.home.name}</p>
                <p className="text-text-tertiary text-sm">{game.teams.home.record}</p>
              </div>
            </div>
          </div>

          {/* Stats Bars */}
          <div className="space-y-4">
            {comparisonStats.map((stat) => {
              const awayVal = typeof stat.away === 'string' ? parseFloat(stat.away) : stat.away;
              const homeVal = typeof stat.home === 'string' ? parseFloat(stat.home) : stat.home;
              const total = awayVal + homeVal || 1;
              const awayPct = (awayVal / total) * 100;
              const homePct = (homeVal / total) * 100;

              // Determine which team is "winning" this stat
              let awayWins = awayVal > homeVal;
              if (stat.inverse) awayWins = awayVal < homeVal;

              return (
                <div key={stat.label} className="px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-mono ${awayWins && awayVal !== homeVal ? 'text-success font-bold' : 'text-text-secondary'}`}
                    >
                      {stat.away}
                    </span>
                    <span className="text-xs text-text-tertiary uppercase tracking-wide">
                      {stat.label}
                    </span>
                    <span
                      className={`text-sm font-mono ${!awayWins && awayVal !== homeVal ? 'text-success font-bold' : 'text-text-secondary'}`}
                    >
                      {stat.home}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-background-tertiary">
                    <div
                      className={`transition-all ${awayWins && awayVal !== homeVal ? 'bg-success' : 'bg-burnt-orange/50'}`}
                      style={{ width: `${awayPct}%` }}
                    />
                    <div
                      className={`transition-all ${!awayWins && awayVal !== homeVal ? 'bg-success' : 'bg-burnt-orange/50'}`}
                      style={{ width: `${homePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Game Insights */}
      <Card variant="default" padding="md">
        <CardHeader>
          <CardTitle>Game Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* LOB */}
            {game.linescore && (
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Left on Base</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <span className="text-text-tertiary text-xs">
                      {game.teams.away.abbreviation}
                    </span>
                    <p className="text-text-primary font-bold text-lg">
                      {awayBattingTotals.h + awayBattingTotals.bb - awayBattingTotals.r}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-text-tertiary text-xs">
                      {game.teams.home.abbreviation}
                    </span>
                    <p className="text-text-primary font-bold text-lg">
                      {homeBattingTotals.h + homeBattingTotals.bb - homeBattingTotals.r}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Conference Context */}
            {(game.teams.away.conference || game.teams.home.conference) && (
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-2">Conference Context</p>
                <p className="text-text-secondary text-sm">
                  {game.teams.away.conference === game.teams.home.conference
                    ? `${game.teams.away.conference} conference matchup`
                    : `Non-conference: ${game.teams.away.conference || 'Independent'} vs ${game.teams.home.conference || 'Independent'}`}
                </p>
              </div>
            )}

            {/* Situational Stats Placeholder */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-2">Hits with RISP</p>
                <p className="text-text-secondary text-xs">
                  Situational hitting data tracked during live games.
                </p>
              </div>
              <div className="p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-2">Two-Out RBI</p>
                <p className="text-text-secondary text-xs">
                  Clutch hitting metrics updated as the game progresses.
                </p>
              </div>
            </div>

            {/* Note */}
            <p className="text-text-tertiary text-xs text-center pt-4 border-t border-border-subtle">
              College baseball doesn't have Statcast—but we track everything that matters.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
