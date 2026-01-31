'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GameHeader } from '@/components/game-detail/GameHeader';
import { WinProbabilityChart } from '@/components/game-detail/WinProbabilityChart';
import { PredictionCard } from '@/components/predictions';
import { useGameData, type Sport } from '@/lib/hooks/useGameData';
import type { SupportedSport } from '@/lib/prediction/types';

interface GameDetailClientProps {
  sport: string;
  gameId: string;
}

type TabType = 'summary' | 'boxscore' | 'playbyplay' | 'stats' | 'probability';

export function GameDetailClient({ sport, gameId }: GameDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const { game, isLoading, error, lastUpdated } = useGameData(sport as Sport, gameId);

  // Loading state
  if (isLoading) {
    return (
      <main id="main-content" className="min-h-screen bg-bg-primary">
        <Section padding="lg">
          <Container>
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-burnt-orange border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-text-secondary">Loading game data...</p>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  // Error state
  if (error || !game) {
    return (
      <main id="main-content" className="min-h-screen bg-bg-primary">
        <Section padding="lg">
          <Container>
            <Card variant="default" padding="lg">
              <CardContent>
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white mb-2">Game Not Found</h2>
                  <p className="text-text-secondary mb-6">
                    {error?.message || `Unable to load game ${gameId}`}
                  </p>
                  <Link
                    href={`/${sport}`}
                    className="inline-flex px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
                  >
                    Back to {sport.toUpperCase()} Games
                  </Link>
                </div>
              </CardContent>
            </Card>
          </Container>
        </Section>
      </main>
    );
  }

  // Transform game data for components
  const gameForHeader = {
    awayTeam: {
      id: game.awayTeam.id || 'away',
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
      score: game.awayTeam.score,
      record: game.awayTeam.record,
    },
    homeTeam: {
      id: game.homeTeam.id || 'home',
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
      score: game.homeTeam.score,
      record: game.homeTeam.record,
    },
    status: {
      state: game.status.isFinal
        ? ('post' as const)
        : game.status.isLive
          ? ('in' as const)
          : ('pre' as const),
      detail: game.status.detail || (game.status.isFinal ? 'Final' : 'Scheduled'),
      shortDetail: game.status.shortDetail || game.status.detail,
    },
    venue: game.venue || { name: 'TBD' },
    broadcast: game.broadcast || '',
  };

  const winProbData = game.winProbability || [];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'boxscore', label: 'Box Score' },
    { id: 'playbyplay', label: 'Play-by-Play' },
    { id: 'stats', label: 'Team Stats' },
    { id: 'probability', label: 'Win Probability' },
  ];

  // Use real linescore data if available, otherwise generate placeholder
  const linescoreData =
    game.linescore ||
    (sport === 'cfb' || sport === 'nfl'
      ? [
          { period: '1st', away: 0, home: 0 },
          { period: '2nd', away: 0, home: 0 },
          { period: '3rd', away: 0, home: 0 },
          { period: '4th', away: 0, home: 0 },
        ]
      : [
          { period: '1', away: 0, home: 0 },
          { period: '2', away: 0, home: 0 },
          { period: '3', away: 0, home: 0 },
          { period: '4', away: 0, home: 0 },
          { period: '5', away: 0, home: 0 },
          { period: '6', away: 0, home: 0 },
          { period: '7', away: 0, home: 0 },
          { period: '8', away: 0, home: 0 },
          { period: '9', away: 0, home: 0 },
        ]);

  // Extract top performers from leaders
  const topPerformers = game.leaders
    ? [
        game.leaders.passing && {
          name: game.leaders.passing.name,
          team: game.homeTeam.abbreviation,
          stat: game.leaders.passing.stats,
          position: 'QB',
        },
        game.leaders.rushing && {
          name: game.leaders.rushing.name,
          team: game.homeTeam.abbreviation,
          stat: game.leaders.rushing.stats,
          position: 'RB',
        },
        game.leaders.receiving && {
          name: game.leaders.receiving.name,
          team: game.homeTeam.abbreviation,
          stat: game.leaders.receiving.stats,
          position: 'WR',
        },
      ].filter(Boolean)
    : [];

  // Use real boxscore stats if available
  const boxscoreStats = game.boxscore || [];

  return (
    <main id="main-content">
      {/* Game Header */}
      <GameHeader
        awayTeam={gameForHeader.awayTeam}
        homeTeam={gameForHeader.homeTeam}
        status={gameForHeader.status}
        venue={gameForHeader.venue}
        broadcast={gameForHeader.broadcast}
        sport={sport}
      />

      {/* Tab Navigation */}
      <Section
        padding="none"
        className="sticky top-0 z-40 bg-bg-primary border-b border-border-subtle"
      >
        <Container>
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-burnt-orange text-white'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      {/* Tab Content */}
      <Section padding="md">
        <Container>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Linescore */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Scoring Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-subtle">
                            <th className="text-left py-2 px-2 text-text-tertiary font-medium">
                              Team
                            </th>
                            {linescoreData.map((p) => (
                              <th
                                key={p.period}
                                className="text-center py-2 px-2 text-text-tertiary font-medium w-10"
                              >
                                {p.period}
                              </th>
                            ))}
                            <th className="text-center py-2 px-2 text-text-tertiary font-medium w-12">
                              T
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border-subtle">
                            <td className="py-3 px-2 font-medium text-white">
                              {game.awayTeam.abbreviation}
                            </td>
                            {linescoreData.map((p) => (
                              <td
                                key={p.period}
                                className="text-center py-3 px-2 text-text-secondary"
                              >
                                {p.away}
                              </td>
                            ))}
                            <td className="text-center py-3 px-2 font-bold text-white">
                              {game.awayTeam.score}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 font-medium text-white">
                              {game.homeTeam.abbreviation}
                            </td>
                            {linescoreData.map((p) => (
                              <td
                                key={p.period}
                                className="text-center py-3 px-2 text-text-secondary"
                              >
                                {p.home}
                              </td>
                            ))}
                            <td className="text-center py-3 px-2 font-bold text-white">
                              {game.homeTeam.score}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Recap */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Game Recap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary leading-relaxed">
                      In a thrilling SEC Championship showdown, Texas edged out Georgia 28-24 at
                      Mercedes-Benz Stadium. The Longhorns&apos; defense stepped up in the final
                      minutes, holding the Bulldogs to a crucial 4th down stop with under two
                      minutes remaining. Quinn Ewers threw for 287 yards and 3 touchdowns in the
                      victory.
                    </p>
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <p className="text-xs text-text-tertiary">
                        Source: BSI Game Analysis &bull; Generated at {new Date().toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                {topPerformers.length > 0 && (
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle>Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {topPerformers.map((player, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg"
                          >
                            <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-tertiary">
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white">{player?.name}</p>
                              <p className="text-xs text-text-tertiary">
                                {player?.team} &bull; {player?.position}
                              </p>
                            </div>
                            <p className="text-sm text-burnt-orange font-semibold">
                              {player?.stat}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* BSI Prediction */}
                <PredictionCard
                  gameId={gameId}
                  sport={sport as SupportedSport}
                  homeTeam={{ name: game.homeTeam.name, abbreviation: game.homeTeam.abbreviation }}
                  awayTeam={{ name: game.awayTeam.name, abbreviation: game.awayTeam.abbreviation }}
                  tier="free"
                />

                <WinProbabilityChart
                  data={winProbData}
                  homeTeam={game.homeTeam.abbreviation}
                  awayTeam={game.awayTeam.abbreviation}
                  sport={sport}
                />

                {/* Game Info */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Game Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-text-tertiary text-sm">Game ID</dt>
                        <dd className="text-white text-sm font-mono">{gameId}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-tertiary text-sm">Sport</dt>
                        <dd className="text-white text-sm">{sport.toUpperCase()}</dd>
                      </div>
                      {game.venue && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary text-sm">Venue</dt>
                          <dd className="text-white text-sm text-right">{game.venue.name}</dd>
                        </div>
                      )}
                      {game.broadcast && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary text-sm">Broadcast</dt>
                          <dd className="text-white text-sm">{game.broadcast}</dd>
                        </div>
                      )}
                      {lastUpdated && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary text-sm">Updated</dt>
                          <dd className="text-white text-sm">{lastUpdated.toLocaleTimeString()}</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Related Content */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Related</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link
                        href={`/${sport}`}
                        className="block p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                      >
                        <p className="text-sm text-white">View All {sport.toUpperCase()} Games</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Scores &amp; Schedules</p>
                      </Link>
                      <Link
                        href="/win-probability"
                        className="block p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                      >
                        <p className="text-sm text-white">Win Probability Calculator</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Simulate any scenario</p>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Box Score Tab */}
          {activeTab === 'boxscore' && (
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Box Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary text-center py-12">
                  Detailed box score coming soon. Connect to live API for real data.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Play-by-Play Tab */}
          {activeTab === 'playbyplay' && (
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Play-by-Play</CardTitle>
              </CardHeader>
              <CardContent>
                {game.plays && game.plays.length > 0 ? (
                  <div className="space-y-3">
                    {game.plays.slice(0, 20).map((play, idx) => (
                      <div
                        key={play.id || idx}
                        className="flex gap-4 p-3 bg-bg-secondary rounded-lg"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-text-tertiary">{play.period}</span>
                          <span className="text-sm text-gold font-mono">{play.time}</span>
                        </div>
                        <div className="flex-1">
                          {play.team && (
                            <span className="text-xs text-burnt-orange font-semibold mr-2">
                              {play.team}
                            </span>
                          )}
                          <span className="text-sm text-text-secondary">{play.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-center py-12">
                    Play-by-play data not available for this game.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Stats Tab */}
          {activeTab === 'stats' && (
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Team Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {boxscoreStats.length > 0 ? (
                  <div className="space-y-4">
                    {boxscoreStats.map((stat, idx) => {
                      const awayNum =
                        typeof stat.away === 'number'
                          ? stat.away
                          : parseFloat(String(stat.away)) || 0;
                      const homeNum =
                        typeof stat.home === 'number'
                          ? stat.home
                          : parseFloat(String(stat.home)) || 0;
                      return (
                        <div key={idx} className="grid grid-cols-3 items-center gap-4">
                          <div className="text-right">
                            <span
                              className={`text-lg font-semibold ${
                                awayNum > homeNum ? 'text-burnt-orange' : 'text-text-secondary'
                              }`}
                            >
                              {stat.away}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-sm text-text-tertiary">{stat.label}</span>
                          </div>
                          <div className="text-left">
                            <span
                              className={`text-lg font-semibold ${
                                homeNum > awayNum ? 'text-gold' : 'text-text-secondary'
                              }`}
                            >
                              {stat.home}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-text-secondary text-center py-12">
                    Team stats not available for this game.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Win Probability Tab */}
          {activeTab === 'probability' && (
            <div className="max-w-4xl mx-auto">
              <WinProbabilityChart
                data={winProbData}
                homeTeam={game.homeTeam.abbreviation}
                awayTeam={game.awayTeam.abbreviation}
                sport={sport}
              />
            </div>
          )}
        </Container>
      </Section>

      {/* CTA */}
      <Section padding="md" background="charcoal" borderTop>
        <Container>
          <div className="text-center">
            <p className="text-text-secondary mb-4">
              Want live win probability and advanced stats during games?
            </p>
            <Link
              href="/pricing"
              className="inline-flex px-6 py-3 bg-burnt-orange text-white rounded-lg font-semibold hover:bg-burnt-orange/90 transition-colors"
            >
              Upgrade to BSI Pro
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
