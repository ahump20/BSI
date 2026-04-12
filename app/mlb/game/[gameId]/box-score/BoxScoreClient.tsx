'use client';

import { useGameData } from '../layout';
import {
  BoxScoreTable,
  BoxScoreShell,
  BoxScoreEmptyState,
} from '@/components/box-score';
import { adaptBaseballBoxscore } from '@/lib/box-score/adapt-baseball';

/**
 * Full Box Score Page — MLB
 *
 * Heritage-framed shell wraps a single BoxScoreTable. The page-level
 * scoreboard already shows R/H/E, so the linescore is suppressed here.
 */
export default function BoxScoreClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
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
          }}
          homeTeam={{
            name: game.teams.home.name,
            abbreviation: game.teams.home.abbreviation,
            score: game.teams.home.score,
            isWinner: game.teams.home.isWinner,
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
