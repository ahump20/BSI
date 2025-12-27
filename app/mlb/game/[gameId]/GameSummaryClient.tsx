'use client';

import { useGameData } from './layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BoxScoreTable } from '@/components/box-score';

/**
 * Game Summary Page (default tab)
 *
 * Shows linescore, batting leaders, and pitching summary.
 * This is the main landing page for /mlb/game/[gameId]
 */
export default function GameSummaryClient() {
  const { game, loading, error } = useGameData();

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  // Extract key stats
  const awayBatting = game.boxscore?.away.batting || [];
  const homeBatting = game.boxscore?.home.batting || [];
  const awayPitching = game.boxscore?.away.pitching || [];
  const homePitching = game.boxscore?.home.pitching || [];

  // Find batting leaders (most hits)
  const topAwayHitter = [...awayBatting].sort((a, b) => b.h - a.h)[0];
  const topHomeHitter = [...homeBatting].sort((a, b) => b.h - a.h)[0];

  // Find winning/losing pitchers
  const winningPitcher = [...awayPitching, ...homePitching].find((p) => p.decision === 'W');
  const losingPitcher = [...awayPitching, ...homePitching].find((p) => p.decision === 'L');
  const savePitcher = [...awayPitching, ...homePitching].find((p) => p.decision === 'S');

  return (
    <div className="space-y-6">
      {/* Game Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Winning Pitcher */}
        {winningPitcher && (
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="success">W</Badge>
              <span className="text-text-tertiary text-sm">Winning Pitcher</span>
            </div>
            <p className="text-white font-semibold text-lg">{winningPitcher.player.name}</p>
            <p className="text-text-secondary text-sm mt-1">
              {winningPitcher.ip} IP, {winningPitcher.h} H, {winningPitcher.er} ER, {winningPitcher.so} K
            </p>
          </Card>
        )}

        {/* Losing Pitcher */}
        {losingPitcher && (
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="error">L</Badge>
              <span className="text-text-tertiary text-sm">Losing Pitcher</span>
            </div>
            <p className="text-white font-semibold text-lg">{losingPitcher.player.name}</p>
            <p className="text-text-secondary text-sm mt-1">
              {losingPitcher.ip} IP, {losingPitcher.h} H, {losingPitcher.er} ER, {losingPitcher.so} K
            </p>
          </Card>
        )}

        {/* Save */}
        {savePitcher && (
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="primary">S</Badge>
              <span className="text-text-tertiary text-sm">Save</span>
            </div>
            <p className="text-white font-semibold text-lg">{savePitcher.player.name}</p>
            <p className="text-text-secondary text-sm mt-1">
              {savePitcher.ip} IP, {savePitcher.h} H, {savePitcher.er} ER, {savePitcher.so} K
            </p>
          </Card>
        )}
      </div>

      {/* Batting Leaders */}
      {(topAwayHitter || topHomeHitter) && (
        <Card variant="default" padding="md">
          <h3 className="text-lg font-semibold text-white mb-4">Batting Leaders</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {topAwayHitter && (
              <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange">
                  {game.teams.away.abbreviation}
                </div>
                <div>
                  <p className="font-semibold text-white">{topAwayHitter.player.name}</p>
                  <p className="text-text-secondary text-sm">
                    {topAwayHitter.h}-{topAwayHitter.ab}, {topAwayHitter.rbi} RBI, {topAwayHitter.r} R
                  </p>
                </div>
              </div>
            )}
            {topHomeHitter && (
              <div className="flex items-center gap-4 p-3 bg-graphite rounded-lg">
                <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-sm font-bold text-burnt-orange">
                  {game.teams.home.abbreviation}
                </div>
                <div>
                  <p className="font-semibold text-white">{topHomeHitter.player.name}</p>
                  <p className="text-text-secondary text-sm">
                    {topHomeHitter.h}-{topHomeHitter.ab}, {topHomeHitter.rbi} RBI, {topHomeHitter.r} R
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Box Score Preview */}
      {game.boxscore && (
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
              batting: awayBatting.slice(0, 5).map(b => ({
                player: { id: b.player.id, name: b.player.name, position: b.player.position },
                ab: b.ab, r: b.r, h: b.h, rbi: b.rbi, bb: b.bb, so: b.so, avg: b.avg,
              })),
              pitching: awayPitching.slice(0, 3).map(p => ({
                player: { id: p.player.id, name: p.player.name },
                decision: p.decision, ip: p.ip, h: p.h, r: p.r, er: p.er, bb: p.bb, so: p.so,
                pitches: p.pitches, strikes: p.strikes, era: p.era,
              })),
            },
            home: {
              batting: homeBatting.slice(0, 5).map(b => ({
                player: { id: b.player.id, name: b.player.name, position: b.player.position },
                ab: b.ab, r: b.r, h: b.h, rbi: b.rbi, bb: b.bb, so: b.so, avg: b.avg,
              })),
              pitching: homePitching.slice(0, 3).map(p => ({
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
          variant="compact"
          showLinescore={false}
        />
      )}

      {/* Empty State */}
      {!game.boxscore && (
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
              Box score and play-by-play will appear once the first pitch is thrown
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
