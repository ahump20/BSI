'use client';

import { useState, useEffect } from 'react';
import { useGameData } from './layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LiveGameWidget } from '@/components/LiveGameWidget';
import { MatchupIntelCard } from '@/components/intel/MatchupIntelCard';
import { IntelStreamCard } from '@/components/intel/IntelStreamCard';

// ─── Savant stat shapes (internal to this component) ──────────────────────────

interface TeamStats {
  batting: { wrcPlus: number; obp: number; slg: number };
  pitching: { fip: number; eraMinus: number; kPct: number; bbPct: number };
}

interface SavantBatterRow {
  team: string;
  wrc_plus: number | null;
  obp: number | null;
  slg: number | null;
}

interface SavantPitcherRow {
  team: string;
  fip: number | null;
  era_minus: number | null;
  k_pct: number | null;
  bb_pct: number | null;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Fuzzy team name match — handles "Texas" vs "Texas Longhorns" etc. */
function matchesTeam(rowTeam: string, gameName: string): boolean {
  const a = rowTeam.toLowerCase();
  const b = gameName.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function buildTeamStats(
  batters: SavantBatterRow[],
  pitchers: SavantPitcherRow[],
  teamName: string
): TeamStats | undefined {
  const tb = batters.filter((r) => matchesTeam(r.team, teamName));
  const tp = pitchers.filter((r) => matchesTeam(r.team, teamName));
  if (tb.length === 0 && tp.length === 0) return undefined;

  return {
    batting: {
      wrcPlus: Math.round(avg(tb.map((r) => r.wrc_plus ?? 100))),
      obp: parseFloat(avg(tb.map((r) => r.obp ?? 0)).toFixed(3)),
      slg: parseFloat(avg(tb.map((r) => r.slg ?? 0)).toFixed(3)),
    },
    pitching: {
      fip: parseFloat(avg(tp.map((r) => r.fip ?? 4.0)).toFixed(2)),
      eraMinus: Math.round(avg(tp.map((r) => r.era_minus ?? 100))),
      kPct: parseFloat(avg(tp.map((r) => r.k_pct ?? 0)).toFixed(1)),
      bbPct: parseFloat(avg(tp.map((r) => r.bb_pct ?? 0)).toFixed(1)),
    },
  };
}

// ─── Series context types & helpers ─────────────────────────────────────────

interface SeriesGame {
  id: string;
  date: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
}

function getSeriesWeekend(dateStr: string): string[] {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
  let friday: Date;
  if (day === 5) friday = new Date(d);
  else if (day === 6) { friday = new Date(d); friday.setDate(d.getDate() - 1); }
  else if (day === 0) { friday = new Date(d); friday.setDate(d.getDate() - 2); }
  else { friday = new Date(d); friday.setDate(d.getDate() - (day - 5 + 7) % 7); }

  const sat = new Date(friday); sat.setDate(friday.getDate() + 1);
  const sun = new Date(friday); sun.setDate(friday.getDate() + 2);

  return [friday, sat, sun].map(dt => dt.toISOString().split('T')[0]);
}

function SeriesStrip({ games, currentGameId }: { games: SeriesGame[]; currentGameId: string }) {
  if (games.length <= 1) return null;

  return (
    <Card variant="default" padding="md" className="border-burnt-orange/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-burnt-orange">
          Weekend Series
        </span>
        <span className="text-xs text-text-tertiary">
          {games.length}-Game Series
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {games.map((g, i) => {
          const isCurrent = g.id === currentGameId;
          const isFinal = g.status === 'final';
          return (
            <div
              key={g.id}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm ${
                isCurrent
                  ? 'bg-burnt-orange/15 border border-burnt-orange/30'
                  : 'bg-background-tertiary'
              }`}
            >
              <div className="text-[10px] text-text-tertiary mb-1">
                Game {i + 1}
              </div>
              {isFinal ? (
                <div className="font-mono text-text-primary">
                  {g.awayScore} - {g.homeScore}
                </div>
              ) : g.status === 'live' ? (
                <div className="text-success text-xs font-semibold">Live</div>
              ) : (
                <div className="text-text-tertiary text-xs">Scheduled</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * College Baseball Game Summary Page
 *
 * Quick overview of the game with key stats and highlights.
 */
export default function CollegeGameSummaryClient() {
  const { game, loading, error } = useGameData();
  const [homeStats, setHomeStats] = useState<TeamStats | undefined>(undefined);
  const [awayStats, setAwayStats] = useState<TeamStats | undefined>(undefined);
  const [seriesGames, setSeriesGames] = useState<SeriesGame[]>([]);

  // Fetch savant team stats only for pregame — skip once a boxscore exists
  useEffect(() => {
    if (!game || game.boxscore || game.status.isLive || game.status.isFinal) return;

    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') ?? '' : '';
    const headers: HeadersInit = apiKey ? { 'X-BSI-Key': apiKey } : {};

    Promise.all([
      fetch('/api/savant/batting/leaderboard?limit=100&min_pa=5', { headers }).then((r) => r.json()),
      fetch('/api/savant/pitching/leaderboard?limit=100&min_ip=5', { headers }).then((r) => r.json()),
    ])
      .then(([battingResp, pitchingResp]) => {
        const batters: SavantBatterRow[] = (battingResp as { data?: SavantBatterRow[] })?.data ?? [];
        const pitchers: SavantPitcherRow[] = (pitchingResp as { data?: SavantPitcherRow[] })?.data ?? [];
        setHomeStats(buildTeamStats(batters, pitchers, game.teams.home.name));
        setAwayStats(buildTeamStats(batters, pitchers, game.teams.away.name));
      })
      .catch(() => {
        // Stats unavailable — card falls back to contextual analysis
      });
  }, [game?.id]);

  // Fetch series context — find games between the same two teams on Fri/Sat/Sun
  useEffect(() => {
    if (!game) return;
    const dates = getSeriesWeekend(game.date);
    const homeTeam = game.teams.home.name.toLowerCase();
    const awayTeam = game.teams.away.name.toLowerCase();

    Promise.all(
      dates.map(date =>
        fetch(`/api/college-baseball/scores?date=${date}`)
          .then(r => r.json())
          .then((resp: { data?: any[]; games?: any[] }) => {
            const games = resp?.data || resp?.games || [];
            return games.filter((g: any) => {
              const h = (g.homeTeam?.name || '').toLowerCase();
              const a = (g.awayTeam?.name || '').toLowerCase();
              return (h.includes(homeTeam) || homeTeam.includes(h) || h.includes(awayTeam) || awayTeam.includes(h)) &&
                     (a.includes(homeTeam) || homeTeam.includes(a) || a.includes(awayTeam) || awayTeam.includes(a));
            }).map((g: any) => ({
              id: g.id,
              date: g.date || date,
              status: g.status,
              homeTeam: g.homeTeam?.name || g.homeTeam?.shortName || '',
              awayTeam: g.awayTeam?.name || g.awayTeam?.shortName || '',
              homeScore: g.homeTeam?.score,
              awayScore: g.awayTeam?.score,
            }));
          })
          .catch(() => [])
      )
    ).then(results => {
      const allGames = results.flat();
      if (allGames.length > 1) setSeriesGames(allGames);
    });
  }, [game?.id, game?.date]);

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
      <div className="space-y-4">
        {seriesGames.length > 1 && <SeriesStrip games={seriesGames} currentGameId={game.id} />}
        <MatchupIntelCard
          homeTeam={game.teams.home.name}
          awayTeam={game.teams.away.name}
          gameId={game.id}
          gameTime={`Game on ${game.date}`}
          sport="college-baseball"
          homeStats={homeStats}
          awayStats={awayStats}
        />
        <IntelStreamCard
          homeTeam={game.teams.home.name}
          awayTeam={game.teams.away.name}
          sport="college-baseball"
          gameId={game.id}
          analysisType="pregame"
        />
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
              Come back when the game gets going. This is what ESPN ignores—but we'll have every stat.
            </p>
            <p className="text-burnt-orange text-sm mt-4 font-semibold">
              {game.status.detailedState}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {seriesGames.length > 1 && <SeriesStrip games={seriesGames} currentGameId={game.id} />}
      {/* Live Game Widget - embedded for live games */}
      {game.status.isLive && (
        <div className="mb-6">
          <LiveGameWidget gameId={game.id} />
        </div>
      )}

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

      {/* Live Intel — streams current-situation analysis */}
      {game.status.isLive && (
        <IntelStreamCard
          homeTeam={game.teams.home.name}
          awayTeam={game.teams.away.name}
          sport="college-baseball"
          gameId={game.id}
          analysisType="live"
          score={`${game.linescore?.totals.away.runs ?? 0}-${game.linescore?.totals.home.runs ?? 0}`}
          inning={`${game.status.inningState} ${game.status.inning}`}
        />
      )}

      {/* Postgame Intel — streams game-deciding analysis */}
      {game.status.isFinal && (
        <IntelStreamCard
          homeTeam={game.teams.home.name}
          awayTeam={game.teams.away.name}
          sport="college-baseball"
          gameId={game.id}
          analysisType="postgame"
          score={`${game.linescore?.totals.away.runs ?? 0}-${game.linescore?.totals.home.runs ?? 0}`}
        />
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
                  <div key={idx} className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg">
                    <div className="w-10 h-10 bg-background-secondary rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
                      {hitter.player.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">
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
                  <div className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg">
                    <Badge variant="success">W</Badge>
                    <div>
                      <p className="font-semibold text-text-primary">{winningPitcher.player.name}</p>
                      <p className="text-text-secondary text-sm">
                        {winningPitcher.ip} IP, {winningPitcher.so} K, {winningPitcher.er} ER
                      </p>
                    </div>
                  </div>
                )}
                {losingPitcher && (
                  <div className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg">
                    <Badge variant="error">L</Badge>
                    <div>
                      <p className="font-semibold text-text-primary">{losingPitcher.player.name}</p>
                      <p className="text-text-secondary text-sm">
                        {losingPitcher.ip} IP, {losingPitcher.so} K, {losingPitcher.er} ER
                      </p>
                    </div>
                  </div>
                )}
                {savePitcher && (
                  <div className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg">
                    <Badge variant="secondary">SV</Badge>
                    <div>
                      <p className="font-semibold text-text-primary">{savePitcher.player.name}</p>
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
                    className="p-3 bg-background-tertiary rounded-lg border-l-4 border-burnt-orange"
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
              <div className="text-center p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Total Runs</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {game.linescore.totals.away.runs + game.linescore.totals.home.runs}
                </p>
              </div>
              <div className="text-center p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Total Hits</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {game.linescore.totals.away.hits + game.linescore.totals.home.hits}
                </p>
              </div>
              <div className="text-center p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Errors</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {game.linescore.totals.away.errors + game.linescore.totals.home.errors}
                </p>
              </div>
              <div className="text-center p-4 bg-background-tertiary rounded-lg">
                <p className="text-text-tertiary text-sm mb-1">Innings</p>
                <p className="text-2xl font-bold text-text-primary font-mono">
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
