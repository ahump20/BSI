'use client';

import { useGameData } from '../layout';
import { BoxScoreTable } from '@/components/box-score';
import { Card } from '@/components/ui/Card';

/**
 * Full Box Score Page
 *
 * Displays complete batting and pitching stats for both teams.
 */
export default function BoxScorePage() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const awayBatting = game.boxscore?.away.batting || [];
  const homeBatting = game.boxscore?.home.batting || [];
  const awayPitching = game.boxscore?.away.pitching || [];
  const homePitching = game.boxscore?.home.pitching || [];

  // No box score available
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
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-text-secondary">Box score data not available yet</p>
          <p className="text-text-tertiary text-sm mt-2">
            The full box score will appear once the game gets underway. Grab some peanuts and Cracker Jacks while you wait.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <BoxScoreTable
      linescore={game.linescore ? {
        innings: game.linescore.innings.map(inn => ({
          away: inn.away ?? null,
          home: inn.home ?? null,
        })),
        totals: game.linescore.totals,
      } : undefined}
      boxscore={{
        away: {
          batting: awayBatting.map(b => ({
            player: { id: b.player.id, name: b.player.name, position: b.player.position },
            ab: b.ab, r: b.r, h: b.h, rbi: b.rbi, bb: b.bb, so: b.so, avg: b.avg,
          })),
          pitching: awayPitching.map(p => ({
            player: { id: p.player.id, name: p.player.name },
            decision: p.decision, ip: p.ip, h: p.h, r: p.r, er: p.er, bb: p.bb, so: p.so,
            pitches: p.pitches, strikes: p.strikes, era: p.era,
          })),
        },
        home: {
          batting: homeBatting.map(b => ({
            player: { id: b.player.id, name: b.player.name, position: b.player.position },
            ab: b.ab, r: b.r, h: b.h, rbi: b.rbi, bb: b.bb, so: b.so, avg: b.avg,
          })),
          pitching: homePitching.map(p => ({
            player: { id: p.player.id, name: p.player.name },
            decision: p.decision, ip: p.ip, h: p.h, r: p.r, er: p.er, bb: p.bb, so: p.so,
            pitches: p.pitches, strikes: p.strikes, era: p.era,
          })),
        },
      }}
      awayTeam={{
        name: game.teams.away.name,
        abbreviation: game.teams.away.abbreviation,
        score: game.teams.away.score,
        isWinner: game.teams.away.isWinner,
      }}
      homeTeam={{
        name: game.teams.home.name,
        abbreviation: game.teams.home.abbreviation,
        score: game.teams.home.score,
        isWinner: game.teams.home.isWinner,
      }}
      variant="full"
      showLinescore={true}
    />
  );
}
