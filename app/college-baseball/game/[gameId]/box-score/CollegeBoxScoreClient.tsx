'use client';

import { useGameData } from '../layout';
import {
  BoxScoreTable,
  BoxScoreShell,
  BoxScoreEmptyState,
} from '@/components/box-score';
import { adaptBaseballBoxscore } from '@/lib/box-score/adapt-baseball';

/**
 * College Baseball Box Score Page
 *
 * Shares the exact shell + table composition used by MLB. Year and ranking
 * pass through to the player cell via the permissive BattingLine.player
 * extensions. Both pages draw from the same adapter so they never drift.
 */
export default function CollegeBoxScoreClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null;
  }

  const adapted = adaptBaseballBoxscore(game.boxscore as Record<string, unknown> | undefined);

  if (!adapted) {
    return <BoxScoreEmptyState />;
  }

  return (
    <BoxScoreShell
      title="Box Score"
      showTeamToggle
      awayAbbreviation={game.teams.away.abbreviation}
      homeAbbreviation={game.teams.home.abbreviation}
    >
      {({ teamFilter }) => (
        <BoxScoreTable
          boxscore={adapted}
          awayTeam={{
            name: game.teams.away.name,
            abbreviation: game.teams.away.abbreviation,
            score: game.teams.away.score,
            isWinner: game.teams.away.isWinner,
            logo: game.teams.away.logo,
          }}
          homeTeam={{
            name: game.teams.home.name,
            abbreviation: game.teams.home.abbreviation,
            score: game.teams.home.score,
            isWinner: game.teams.home.isWinner,
            logo: game.teams.home.logo,
          }}
          variant="full"
          showLinescore={false}
          showLeaders
          sortable
          teamFilter={teamFilter}
        />
      )}
    </BoxScoreShell>
  );
}
