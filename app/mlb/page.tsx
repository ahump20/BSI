'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'Dashboard', href: '/dashboard' },
];

interface Team {
  TeamID?: number;
  City?: string;
  Name?: string;
  Division?: string;
  Wins?: number;
  Losses?: number;
  Percentage?: number;
  GamesBack?: string;
  HomeWins?: number;
  HomeLosses?: number;
  AwayWins?: number;
  AwayLosses?: number;
  Last10Wins?: number;
  Last10Losses?: number;
  Streak?: string;
}

interface Game {
  id: string;
  date: string;
  gameDate: string;
  status?: {
    abstractGameState?: string;
    detailedState?: string;
  };
  teams: {
    away: {
      team: { name: string };
      score?: number;
      isWinner?: boolean;
    };
    home: {
      team: { name: string };
      score?: number;
      isWinner?: boolean;
    };
  };
  venue?: { name: string };
}

type TabType = 'standings' | 'teams' | 'players' | 'schedule';

export default function MLBPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [standings, setStandings] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'standings') {
      fetchStandings();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    }
  }, [activeTab]);

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mlb/standings?season=2025');
      if (!res.ok) throw new Error('Failed to fetch standings');
      const data = await res.json();

      const teams: Team[] = [];
      if (data.records) {
        data.records.forEach((record: any) => {
          if (record.teams) {
            record.teams.forEach((teamData: any) => {
              teams.push({
                TeamID: teamData.team?.id,
                City: teamData.team?.name?.split(' ').slice(0, -1).join(' ') || '',
                Name: teamData.team?.name?.split(' ').slice(-1)[0] || teamData.team?.name,
                Division: record.division?.name || 'Unknown',
                Wins: teamData.wins || 0,
                Losses: teamData.losses || 0,
                Percentage: parseFloat(teamData.winningPercentage) || 0,
                GamesBack: teamData.gamesBack || '-',
                HomeWins: teamData.records?.splitRecords?.find((r: any) => r.type === 'home')?.wins || 0,
                HomeLosses: teamData.records?.splitRecords?.find((r: any) => r.type === 'home')?.losses || 0,
                AwayWins: teamData.records?.splitRecords?.find((r: any) => r.type === 'away')?.wins || 0,
                AwayLosses: teamData.records?.splitRecords?.find((r: any) => r.type === 'away')?.losses || 0,
                Last10Wins: teamData.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.wins || 0,
                Last10Losses: teamData.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.losses || 0,
                Streak: teamData.streak?.streakCode || '-',
              });
            });
          }
        });
      }
      setStandings(teams);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const dates = [];
      for (let i = -3; i <= 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const responses = await Promise.all(
        dates.map((date) => fetch(`/api/mlb/scoreboard?date=${date}`).then((r) => r.json()))
      );

      const allGames: Game[] = [];
      responses.forEach((data) => {
        if (data.games) {
          allGames.push(...data.games.map((game: any) => ({ ...game, date: data.date })));
        }
      });

      allGames.sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());
      setSchedule(allGames);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTimestamp = () =>
    new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) + ' CDT';

  // Group standings by division
  const standingsByDivision: Record<string, Team[]> = {};
  standings.forEach((team) => {
    const div = team.Division || 'Unknown';
    if (!standingsByDivision[div]) standingsByDivision[div] = [];
    standingsByDivision[div].push(team);
  });
  Object.keys(standingsByDivision).forEach((div) => {
    standingsByDivision[div].sort((a, b) => (b.Wins || 0) - (a.Wins || 0));
  });

  // Group schedule by date
  const scheduleByDate: Record<string, Game[]> = {};
  schedule.forEach((game) => {
    if (!scheduleByDate[game.date]) scheduleByDate[game.date] = [];
    scheduleByDate[game.date].push(game);
  });

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'standings',
      label: 'Standings',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" />
        </svg>
      ),
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'players',
      label: 'Players',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Hero Section */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                MLB Intelligence
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display text-gradient-blaze mb-4">
                MLB Intelligence
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-gold font-semibold text-lg tracking-wide text-center mb-4">
                Practice to Play. Blaze Data Wins the Day.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                Real-time MLB standings, player statistics, and advanced analytics powered by MLB
                Stats API.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs and Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-border-subtle overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-burnt-orange border-burnt-orange'
                      : 'text-text-tertiary border-transparent hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-tertiary mt-4">Loading MLB standings...</p>
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                    <p className="text-error font-semibold">Data Unavailable</p>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                  </Card>
                ) : (
                  Object.keys(standingsByDivision)
                    .sort()
                    .map((division) => (
                      <ScrollReveal key={division}>
                        <Card variant="default" padding="lg" className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                              <svg
                                viewBox="0 0 24 24"
                                className="w-6 h-6 text-burnt-orange"
                                fill="currentColor"
                              >
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                              </svg>
                              {division}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b-2 border-burnt-orange">
                                    <th className="text-left p-3 text-copper font-semibold">Rank</th>
                                    <th className="text-left p-3 text-copper font-semibold">Team</th>
                                    <th className="text-left p-3 text-copper font-semibold">W</th>
                                    <th className="text-left p-3 text-copper font-semibold">L</th>
                                    <th className="text-left p-3 text-copper font-semibold">PCT</th>
                                    <th className="text-left p-3 text-copper font-semibold">GB</th>
                                    <th className="text-left p-3 text-copper font-semibold">Home</th>
                                    <th className="text-left p-3 text-copper font-semibold">Away</th>
                                    <th className="text-left p-3 text-copper font-semibold">L10</th>
                                    <th className="text-left p-3 text-copper font-semibold">Streak</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standingsByDivision[division].map((team, idx) => (
                                    <tr
                                      key={team.TeamID || idx}
                                      className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                                    >
                                      <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                      <td className="p-3 font-semibold text-white">
                                        {team.City} {team.Name}
                                      </td>
                                      <td className="p-3 text-text-secondary">{team.Wins || 0}</td>
                                      <td className="p-3 text-text-secondary">{team.Losses || 0}</td>
                                      <td className="p-3 text-text-secondary">
                                        {team.Percentage ? team.Percentage.toFixed(3) : '.000'}
                                      </td>
                                      <td className="p-3 text-text-secondary">{team.GamesBack || '-'}</td>
                                      <td className="p-3 text-text-secondary">
                                        {team.HomeWins || 0}-{team.HomeLosses || 0}
                                      </td>
                                      <td className="p-3 text-text-secondary">
                                        {team.AwayWins || 0}-{team.AwayLosses || 0}
                                      </td>
                                      <td className="p-3 text-text-secondary">
                                        {team.Last10Wins || 0}-{team.Last10Losses || 0}
                                      </td>
                                      <td className="p-3 text-text-secondary">{team.Streak || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border-subtle text-xs text-text-tertiary">
                              Data Source: MLB Stats API via blazesportsintel.com/api | Last Updated:{' '}
                              {getTimestamp()}
                            </div>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    ))
                )}
              </>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-burnt-orange"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    MLB Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-6">
                    Browse all 30 MLB teams with rosters, schedules, and statistics.
                  </p>
                  <div className="bg-graphite rounded-lg p-8 text-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-16 h-16 text-burnt-orange mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                    <p className="text-text-secondary">
                      Team rosters and detailed statistics available in the Standings tab
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-burnt-orange"
                      fill="currentColor"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    Player Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-6">
                    View player rosters by clicking on teams in the Teams tab
                  </p>
                  <div className="bg-graphite rounded-lg p-8 text-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-16 h-16 text-burnt-orange mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p className="text-text-secondary">
                      Advanced player statistics and performance metrics coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-tertiary mt-4">Loading MLB schedule...</p>
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                    <p className="text-error font-semibold">Data Unavailable</p>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                  </Card>
                ) : (
                  Object.keys(scheduleByDate)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map((date) => (
                      <ScrollReveal key={date}>
                        <Card variant="default" padding="lg" className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                              <svg
                                viewBox="0 0 24 24"
                                className="w-6 h-6 text-burnt-orange"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'UTC',
                              })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {scheduleByDate[date].map((game, idx) => {
                                const isComplete = game.status?.abstractGameState === 'Final';
                                const isLive = game.status?.abstractGameState === 'Live';

                                return (
                                  <div
                                    key={game.id || idx}
                                    className={`bg-graphite rounded-lg p-4 flex justify-between items-center border ${
                                      isLive ? 'border-success' : 'border-border-subtle'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-white">
                                          {game.teams.away.team.name}
                                        </span>
                                        {isComplete && game.teams.away.isWinner && (
                                          <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-success"
                                            fill="currentColor"
                                          >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                          </svg>
                                        )}
                                        <span className="ml-auto text-burnt-orange font-bold">
                                          {game.teams.away.score ?? '-'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">
                                          {game.teams.home.team.name}
                                        </span>
                                        {isComplete && game.teams.home.isWinner && (
                                          <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-success"
                                            fill="currentColor"
                                          >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                          </svg>
                                        )}
                                        <span className="ml-auto text-burnt-orange font-bold">
                                          {game.teams.home.score ?? '-'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-6 text-right">
                                      <div
                                        className={`font-semibold text-sm ${
                                          isLive
                                            ? 'text-success'
                                            : isComplete
                                              ? 'text-text-tertiary'
                                              : 'text-burnt-orange'
                                        }`}
                                      >
                                        {game.status?.detailedState || 'Scheduled'}
                                      </div>
                                      <div className="text-xs text-text-tertiary mt-1">
                                        {game.venue?.name || 'TBD'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border-subtle text-xs text-text-tertiary">
                              Data Source: MLB Stats API via blazesportsintel.com/api | Last Updated:{' '}
                              {getTimestamp()}
                            </div>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    ))
                )}
              </>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
