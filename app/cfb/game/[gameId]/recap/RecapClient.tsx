'use client';

import { useMemo } from 'react';
import { useGameData, type Play } from '../layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Game Recap Page
 *
 * Narrative summary of the game with different states for scheduled, live, and final games.
 * CFB version — leaders are passing, rushing, receiving instead of NBA's points/rebounds/assists.
 */

function getPeriodShortLabel(num: number): string {
  if (num <= 4) return `Q${num}`;
  return `OT${num - 4}`;
}

export default function RecapClient() {
  const { game, loading, error } = useGameData();

  const plays = useMemo(() => (game?.plays || []) as Play[], [game?.plays]);
  const scoringPlays = useMemo(() => plays.filter((p) => p.scoringPlay), [plays]);

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const homeTeam = game.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game.competitors?.find((c) => c.homeAway === 'away');

  const isFinal = game.status?.type?.completed === true;
  const isLive = game.status?.type?.state === 'in';

  // Extract leaders (CFB: passing, rushing, receiving)
  const leaders = game.leaders || [];
  const passingLeader = (leaders.find((l) => l.name === 'passingLeader') || leaders.find((l) => l.name === 'passing'))?.leaders?.[0];
  const rushingLeader = (leaders.find((l) => l.name === 'rushingLeader') || leaders.find((l) => l.name === 'rushing'))?.leaders?.[0];
  const receivingLeader = (leaders.find((l) => l.name === 'receivingLeader') || leaders.find((l) => l.name === 'receiving'))?.leaders?.[0];

  // Game not started
  if (!isFinal && !isLive) {
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
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-text-secondary">Game recap will be available after the final whistle</p>
          <p className="text-text-tertiary text-sm mt-2">
            Check back once the game is complete for a full summary
          </p>
        </div>
      </Card>
    );
  }

  // Live game
  if (isLive && !isFinal) {
    return (
      <div className="space-y-6">
        <Card variant="default" padding="lg" className="border-success/30 bg-success/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-success font-semibold">Game In Progress</span>
          </div>
          <p className="text-text-secondary">
            Live recap updates as the game unfolds. Currently in{' '}
            <span className="text-white font-semibold">
              Q{game.status?.period || '?'} {game.status?.displayClock || ''}
            </span>
            .
          </p>
        </Card>

        {/* Live Scoring Summary */}
        {scoringPlays.length > 0 && (
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Scoring Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scoringPlays.slice(-10).map((play, idx) => (
                  <div
                    key={play.id || idx}
                    className="p-3 bg-graphite rounded-lg border-l-4 border-burnt-orange"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">
                        {getPeriodShortLabel(play.period?.number || 1)}
                      </Badge>
                      {play.scoreValue && (
                        <Badge variant="success" size="sm">
                          +{play.scoreValue}
                        </Badge>
                      )}
                      {play.clock?.displayValue && (
                        <span className="text-text-tertiary text-xs font-mono">
                          {play.clock.displayValue}
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">
                      {play.text || play.shortText || 'Scoring play'}
                    </p>
                    <p className="text-text-tertiary text-xs mt-1">
                      Score: {awayTeam?.team?.abbreviation} {play.awayScore} -{' '}
                      {homeTeam?.team?.abbreviation} {play.homeScore}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Final game - full recap
  const awayScore = parseInt(awayTeam?.score || '0', 10);
  const homeScore = parseInt(homeTeam?.score || '0', 10);
  const winner = awayScore > homeScore ? awayTeam : homeTeam;
  const loser = awayScore > homeScore ? homeTeam : awayTeam;
  const winnerScore = Math.max(awayScore, homeScore);
  const loserScore = Math.min(awayScore, homeScore);

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card variant="default" padding="lg">
        <h2 className="text-2xl font-display font-bold text-white mb-4">
          {winner?.team?.displayName || 'Winner'} defeat{' '}
          {loser?.team?.displayName || 'Loser'}, {winnerScore}-{loserScore}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          The {winner?.team?.displayName || 'winners'} came away with the victory over the{' '}
          {loser?.team?.displayName || 'opponents'}.
          {passingLeader && (
            <>
              {' '}
              {passingLeader.athlete?.displayName} led the passing attack with{' '}
              {passingLeader.displayValue}.
            </>
          )}
          {rushingLeader && (
            <>
              {' '}
              {rushingLeader.athlete?.displayName} paced the ground game with{' '}
              {rushingLeader.displayValue}.
            </>
          )}
        </p>
      </Card>

      {/* Game Leaders */}
      {(passingLeader || rushingLeader || receivingLeader) && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Stars of the Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {passingLeader && (
                <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                  <Badge variant="primary">PASS</Badge>
                  <div>
                    <p className="font-semibold text-white">
                      {passingLeader.athlete?.displayName}
                    </p>
                    <p className="text-text-secondary text-sm">{passingLeader.displayValue}</p>
                  </div>
                </div>
              )}
              {rushingLeader && (
                <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                  <Badge variant="success">RUSH</Badge>
                  <div>
                    <p className="font-semibold text-white">
                      {rushingLeader.athlete?.displayName}
                    </p>
                    <p className="text-text-secondary text-sm">{rushingLeader.displayValue}</p>
                  </div>
                </div>
              )}
              {receivingLeader && (
                <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                  <Badge variant="secondary">REC</Badge>
                  <div>
                    <p className="font-semibold text-white">
                      {receivingLeader.athlete?.displayName}
                    </p>
                    <p className="text-text-secondary text-sm">{receivingLeader.displayValue}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoring Summary */}
      {scoringPlays.length > 0 && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Key Scoring Plays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scoringPlays
                .filter((p) => (p.scoreValue || 0) >= 6)
                .slice(0, 10)
                .map((play, idx) => (
                  <div
                    key={play.id || idx}
                    className="p-3 bg-graphite rounded-lg border-l-4 border-burnt-orange"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">
                        {getPeriodShortLabel(play.period?.number || 1)}
                      </Badge>
                      {play.scoreValue && (
                        <Badge variant="success" size="sm">
                          +{play.scoreValue}
                        </Badge>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm">
                      {play.text || play.shortText || 'Scoring play'}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quarter Scoring Breakdown */}
      {(homeTeam?.linescores?.length || awayTeam?.linescores?.length) && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Scoring by Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Away */}
              <div className="p-4 bg-graphite rounded-lg">
                <p className="text-white font-semibold mb-3">
                  {awayTeam?.team?.displayName || 'Away'}
                </p>
                <div className="flex gap-3">
                  {awayTeam?.linescores?.map((ls, i) => (
                    <div key={i} className="text-center">
                      <span className="text-text-tertiary text-xs block mb-1">
                        {getPeriodShortLabel(i + 1)}
                      </span>
                      <span className="text-white font-mono font-bold">{ls.value ?? '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Home */}
              <div className="p-4 bg-graphite rounded-lg">
                <p className="text-white font-semibold mb-3">
                  {homeTeam?.team?.displayName || 'Home'}
                </p>
                <div className="flex gap-3">
                  {homeTeam?.linescores?.map((ls, i) => (
                    <div key={i} className="text-center">
                      <span className="text-text-tertiary text-xs block mb-1">
                        {getPeriodShortLabel(i + 1)}
                      </span>
                      <span className="text-white font-mono font-bold">{ls.value ?? '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty scoring plays */}
      {scoringPlays.length === 0 && (
        <Card variant="default" padding="lg">
          <div className="text-center py-4">
            <p className="text-text-secondary">
              Scoring play data not available for this game
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
