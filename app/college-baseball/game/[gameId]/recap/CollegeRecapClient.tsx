'use client';

import { useGameData } from '../layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * College Baseball Game Recap Page
 *
 * Narrative summary of the game with key moments and takeaways.
 */
export default function CollegeRecapClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const isFinal = game.status.isFinal;
  const isLive = game.status.isLive;

  // Get scoring plays from plays data
  const scoringPlays = (game.plays || []).filter((p) => p.isScoring);

  // Get key pitching performances
  const allPitching = [
    ...(game.boxscore?.away.pitching || []).map((p) => ({
      ...p,
      team: game.teams.away.abbreviation,
    })),
    ...(game.boxscore?.home.pitching || []).map((p) => ({
      ...p,
      team: game.teams.home.abbreviation,
    })),
  ];

  const winningPitcher = allPitching.find((p) => p.decision === 'W');
  const losingPitcher = allPitching.find((p) => p.decision === 'L');
  const qualityStarts = allPitching.filter(
    (p) => parseFloat(p.ip) >= 6 && p.er <= 3
  );

  // Get batting stars (2+ hits or 2+ RBI)
  const allBatting = [
    ...(game.boxscore?.away.batting || []).map((b) => ({
      ...b,
      team: game.teams.away.abbreviation,
    })),
    ...(game.boxscore?.home.batting || []).map((b) => ({
      ...b,
      team: game.teams.home.abbreviation,
    })),
  ];

  const battingStars = allBatting.filter((b) => b.h >= 2 || b.rbi >= 2);

  // Game not finished
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
          <p className="text-text-secondary">Game recap drops after the final out.</p>
          <p className="text-text-tertiary text-sm mt-2">
            Not some AI-generated summary—actual game context, key moments, and the stuff ESPN won't tell you.
          </p>
        </div>
      </Card>
    );
  }

  // Live game - show in-progress recap
  if (isLive && !isFinal) {
    return (
      <div className="space-y-6">
        <Card variant="default" padding="lg" className="border-success/30 bg-success/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-success font-semibold">Game In Progress</span>
          </div>
          <p className="text-text-secondary">
            Live updates as the game unfolds. Currently in the{' '}
            <span className="text-white font-semibold">
              {game.status.inningState} of the {game.status.inning}
              {game.status.inning === 1 ? 'st' : game.status.inning === 2 ? 'nd' : game.status.inning === 3 ? 'rd' : 'th'}
            </span>.
          </p>
        </Card>

        {/* Scoring Summary */}
        {scoringPlays.length > 0 && (
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Scoring Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scoringPlays.map((play) => (
                  <div
                    key={play.id}
                    className="p-3 bg-graphite rounded-lg border-l-4 border-burnt-orange"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">
                        {play.halfInning === 'top' ? 'Top' : 'Bot'} {play.inning}
                      </Badge>
                      <Badge variant="success" size="sm">
                        +{play.runsScored}
                      </Badge>
                    </div>
                    <p className="text-text-secondary text-sm">{play.description}</p>
                    <p className="text-text-tertiary text-xs mt-1">
                      Score: {game.teams.away.abbreviation} {play.scoreAfter.away} -{' '}
                      {game.teams.home.abbreviation} {play.scoreAfter.home}
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
  const winner = game.teams.away.isWinner ? game.teams.away : game.teams.home;
  const loser = game.teams.away.isWinner ? game.teams.home : game.teams.away;

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card variant="default" padding="lg">
        <h2 className="text-2xl font-display font-bold text-white mb-4">
          {winner.ranking && `#${winner.ranking} `}{winner.name} defeat {loser.ranking && `#${loser.ranking} `}{loser.name}, {winner.score}-{loser.score}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          The {winner.name} came away with the victory over the {loser.name} at {game.venue?.name}.
          {winningPitcher && (
            <> {winningPitcher.player.name} earned the win, going {winningPitcher.ip} innings with {winningPitcher.so} strikeouts.</>
          )}
          {losingPitcher && (
            <> {losingPitcher.player.name} took the loss.</>
          )}
        </p>
        {(winner.conference || loser.conference) && (
          <p className="text-text-tertiary text-sm mt-3">
            {winner.conference === loser.conference
              ? `${winner.conference} conference game`
              : 'Non-conference matchup'}
          </p>
        )}
      </Card>

      {/* Batting Stars */}
      {battingStars.length > 0 && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Stars of the Game</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {battingStars.slice(0, 4).map((player, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                  <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange">
                    {player.team}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {player.player.name}
                      {player.player.year && (
                        <span className="text-text-tertiary text-xs ml-2">({player.player.year})</span>
                      )}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {player.h}-{player.ab}
                      {player.rbi > 0 && `, ${player.rbi} RBI`}
                      {player.r > 0 && `, ${player.r} R`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoring Summary */}
      {scoringPlays.length > 0 && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Scoring Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scoringPlays.map((play) => (
                <div
                  key={play.id}
                  className="p-3 bg-graphite rounded-lg border-l-4 border-burnt-orange"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="primary" size="sm">
                      {play.halfInning === 'top' ? 'Top' : 'Bot'} {play.inning}
                    </Badge>
                    <Badge variant="success" size="sm">
                      +{play.runsScored}
                    </Badge>
                  </div>
                  <p className="text-text-secondary text-sm">{play.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Start */}
      {qualityStarts.length > 0 && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Quality Starts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualityStarts.map((pitcher, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                  <Badge variant="success">QS</Badge>
                  <div>
                    <p className="font-semibold text-white">
                      {pitcher.player.name}
                      {pitcher.player.year && (
                        <span className="text-text-tertiary text-xs ml-2">({pitcher.player.year})</span>
                      )}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {pitcher.ip} IP, {pitcher.h} H, {pitcher.er} ER, {pitcher.so} K
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty scoring plays */}
      {scoringPlays.length === 0 && (
        <Card variant="default" padding="lg">
          <div className="text-center py-4">
            <p className="text-text-secondary">No runs crossed the plate—or the scoring data's still loading.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
