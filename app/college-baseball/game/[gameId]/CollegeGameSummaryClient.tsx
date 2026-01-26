'use client';

import { useGameData } from './layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * College Baseball Game Summary Page
 *
 * Quick overview of the game with key stats and highlights.
 */
export default function CollegeGameSummaryClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const awayBatting = game.boxscore?.away.batting || [];
  const homeBatting = game.boxscore?.home.batting || [];
  const awayPitching = game.boxscore?.away.pitching || [];
  const homePitching = game.boxscore?.home.pitching || [];

  // Find top performers
  const topHitters = [...awayBatting, ...homeBatting]
    .filter((b) => b.h >= 2 || b.rbi >= 2)
    .sort((a, b) => b.h + b.rbi - (a.h + a.rbi))
    .slice(0, 3);

  const winningPitcher = [...awayPitching, ...homePitching].find((p) => p.decision === 'W');
  const losingPitcher = [...awayPitching, ...homePitching].find((p) => p.decision === 'L');
  const savePitcher = [...awayPitching, ...homePitching].find((p) => p.decision === 'S');

  // Scoring plays
  const scoringPlays = (game.plays || []).filter((p) => p.isScoring).slice(0, 5);

  // Game not started
  if (!game.boxscore && !game.status.isLive && !game.status.isFinal) {
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          <p className="text-text-secondary">First pitch hasn't happened yet.</p>
          <p className="text-text-tertiary text-sm mt-2">
            Come back when the game gets going. We'll have every stat, every play.
          </p>
          <p className="text-burnt-orange text-sm mt-4 font-semibold">
            {game.status.detailedState}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Status */}
      {game.status.isLive && (
        <Card variant="default" padding="md" className="border-success/30 bg-success/5">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-success font-semibold">Game In Progress</span>
            <span className="text-text-secondary text-sm">
              — {game.status.inningState} of the {game.status.inning}
              {game.status.inning === 1
                ? 'st'
                : game.status.inning === 2
                  ? 'nd'
                  : game.status.inning === 3
                    ? 'rd'
                    : 'th'}
            </span>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Key Performers */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Key Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {topHitters.length > 0 || winningPitcher || losingPitcher ? (
              <div className="space-y-4">
                {/* Top Hitters */}
                {topHitters.map((hitter, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                    <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                      {hitter.player.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {hitter.player.name}
                        {hitter.player.year && (
                          <span className="text-text-tertiary text-xs ml-2">
                            ({hitter.player.year})
                          </span>
                        )}
                      </p>
                      <p className="text-text-secondary text-sm">
                        {hitter.h}-{hitter.ab}
                        {hitter.rbi > 0 && `, ${hitter.rbi} RBI`}
                        {hitter.r > 0 && `, ${hitter.r} R`}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Pitching Decisions */}
                {winningPitcher && (
                  <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                    <Badge variant="success">W</Badge>
                    <div>
                      <p className="font-semibold text-white">{winningPitcher.player.name}</p>
                      <p className="text-text-secondary text-sm">
                        {winningPitcher.ip} IP, {winningPitcher.so} K, {winningPitcher.er} ER
                      </p>
                    </div>
                  </div>
                )}
                {losingPitcher && (
                  <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                    <Badge variant="error">L</Badge>
                    <div>
                      <p className="font-semibold text-white">{losingPitcher.player.name}</p>
                      <p className="text-text-secondary text-sm">
                        {losingPitcher.ip} IP, {losingPitcher.so} K, {losingPitcher.er} ER
                      </p>
                    </div>
                  </div>
                )}
                {savePitcher && (
                  <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                    <Badge variant="secondary">SV</Badge>
                    <div>
                      <p className="font-semibold text-white">{savePitcher.player.name}</p>
                      <p className="text-text-secondary text-sm">
                        {savePitcher.ip} IP, {savePitcher.so} K
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-tertiary text-sm py-4 text-center">
                Performance data shows up as the game progresses.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Scoring Plays */}
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Scoring Plays</CardTitle>
          </CardHeader>
          <CardContent>
            {scoringPlays.length > 0 ? (
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
            ) : (
              <p className="text-text-tertiary text-sm py-4 text-center">
                No runs across yet. College baseball's best pitching duels happen when you least
                expect them.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      {game.linescore && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Game Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-graphite rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Total Runs</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {game.linescore.totals.away.runs + game.linescore.totals.home.runs}
                </p>
              </div>
              <div className="text-center p-4 bg-graphite rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Total Hits</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {game.linescore.totals.away.hits + game.linescore.totals.home.hits}
                </p>
              </div>
              <div className="text-center p-4 bg-graphite rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Errors</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {game.linescore.totals.away.errors + game.linescore.totals.home.errors}
                </p>
              </div>
              <div className="text-center p-4 bg-graphite rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Innings</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {game.linescore.innings.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue Info */}
      <Card variant="default" padding="sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-tertiary">
            {game.venue?.name}
            {game.venue?.city && game.venue?.state && ` — ${game.venue.city}, ${game.venue.state}`}
          </span>
          {(game.teams.away.conference || game.teams.home.conference) && (
            <span className="text-text-tertiary">
              {game.teams.away.conference === game.teams.home.conference
                ? `${game.teams.away.conference} Conference Game`
                : 'Non-Conference'}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
