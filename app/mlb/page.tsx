'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton, SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'Dashboard', href: '/dashboard' },
];

const mlbFeatures = [
  {
    href: '/mlb/scores',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Live Scores',
    description:
      'Real-time scores and game updates for all 30 MLB teams. Box scores, line scores, and play-by-play.',
    badge: 'Live Now',
    badgeVariant: 'success' as const,
    isLive: true,
  },
  {
    href: '/mlb/standings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: 'Division Standings',
    description:
      'Complete AL and NL standings with win percentage, games back, run differential, and streak data.',
    badge: 'Updated Daily',
    badgeVariant: 'primary' as const,
  },
  {
    href: '/mlb/teams',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Team Profiles',
    description:
      'Rosters, schedules, and statistics for all 30 MLB teams across the American and National Leagues.',
    badge: '30 Teams',
    badgeVariant: 'warning' as const,
  },
  {
    href: '/mlb/stats',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-burnt-orange fill-none stroke-[1.5]">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Statcast Analytics',
    description:
      'Advanced metrics including exit velocity, launch angle, sprint speed, and pitch movement data.',
    badge: 'Pro-Level',
    badgeVariant: 'warning' as const,
  },
];

// Division data for future use in expanded team profiles
const _divisions = [
  { name: 'AL East', teams: ['Yankees', 'Red Sox', 'Blue Jays', 'Rays', 'Orioles'] },
  { name: 'AL Central', teams: ['Guardians', 'Twins', 'Tigers', 'White Sox', 'Royals'] },
  { name: 'AL West', teams: ['Astros', 'Rangers', 'Mariners', 'Angels', 'Athletics'] },
  { name: 'NL East', teams: ['Braves', 'Phillies', 'Mets', 'Marlins', 'Nationals'] },
  { name: 'NL Central', teams: ['Cubs', 'Cardinals', 'Brewers', 'Reds', 'Pirates'] },
  { name: 'NL West', teams: ['Dodgers', 'Padres', 'Giants', 'D-backs', 'Rockies'] },
];

interface Team {
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number;
  division: string;
  league: string;
  runsScored: number;
  runsAllowed: number;
  streakCode: string;
}

interface Game {
  id: number;
  date: string;
  status: {
    state: string;
    detailedState: string;
    inning?: number;
    inningState?: string;
    isLive: boolean;
    isFinal: boolean;
  };
  teams: {
    away: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      hits: number;
      errors: number;
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      hits: number;
      errors: number;
    };
  };
  venue: { name: string };
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type TabType = 'standings' | 'teams' | 'players' | 'schedule';

/**
 * Format timestamp in America/Chicago timezone
 */
function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

export default function MLBPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [standings, setStandings] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mlb/standings');
      if (!res.ok) throw new Error('Failed to fetch standings');
      const data = await res.json();

      if (data.standings) {
        setStandings(data.standings);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch today's games
      const res = await fetch('/api/mlb/scores');
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = await res.json();

      if (data.games) {
        setSchedule(data.games);
        setHasLiveGames(data.live || false);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'standings') {
      fetchStandings();
    } else if (activeTab === 'schedule') {
      fetchSchedule();
    }
  }, [activeTab, fetchStandings, fetchSchedule]);

  // Auto-refresh for live games (every 30 seconds)
  useEffect(() => {
    if (activeTab === 'schedule' && hasLiveGames) {
      const interval = setInterval(fetchSchedule, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, fetchSchedule]);

  // Group standings by league and division
  const standingsByDivision: Record<string, Team[]> = {};
  standings.forEach((team) => {
    const divKey = `${team.league} ${team.division}`;
    if (!standingsByDivision[divKey]) standingsByDivision[divKey] = [];
    standingsByDivision[divKey].push(team);
  });

  // Sort teams within each division by wins
  Object.keys(standingsByDivision).forEach((div) => {
    standingsByDivision[div].sort((a, b) => b.wins - a.wins);
  });

  // Division display order
  const divisionOrder = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'standings',
      label: 'Standings',
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3v18h18M8 17V9m4 8V5m4 12v-6" />
        </svg>
      ),
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'players',
      label: 'Players',
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
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
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse mr-2" />
                Major League Baseball
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display mb-4">
                MLB <span className="text-gradient-blaze">Intelligence</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-gold font-semibold text-lg tracking-wide text-center mb-4">
                Real-Time Data. Complete Coverage.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8">
                Live scores, division standings, Statcast analytics, and advanced metrics for all 30
                MLB teams. Professional-grade baseball intelligence powered by MLB Stats API.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/mlb/scores">
                  <Button variant="primary" size="lg">
                    View Live Scores
                  </Button>
                </Link>
                <Link href="/mlb/standings">
                  <Button variant="secondary" size="lg">
                    Division Standings
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            {/* Stats Bar */}
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 glass-card rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">30</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    MLB Teams
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">162</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Games/Season
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">Live</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Real-Time Scores
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">Statcast</div>
                  <div className="text-xs uppercase tracking-wider text-text-tertiary mt-1">
                    Advanced Data
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Features Section */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="kicker">Complete MLB Coverage</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display mt-2">
                  Professional Baseball <span className="text-gradient-blaze">Intelligence</span>
                </h2>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Live scores, standings, team profiles, and Statcast analytics for every MLB game.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {mlbFeatures.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 100}>
                  <Link href={feature.href} className="block group">
                    <Card variant="hover" padding="lg" className="h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-burnt-orange to-ember opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="w-12 h-12 mb-5 bg-burnt-orange/15 rounded-xl flex items-center justify-center">
                        {feature.icon}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-text-tertiary text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                        {feature.isLive ? (
                          <LiveBadge />
                        ) : (
                          <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                        )}
                        <span className="text-burnt-orange text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                          View
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
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
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} variant="default" padding="lg">
                        <CardHeader>
                          <Skeleton variant="text" width={200} height={24} />
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-burnt-orange">
                                  {['Rank', 'Team', 'W', 'L', 'PCT', 'GB', 'RS', 'RA', 'STRK'].map(
                                    (h) => (
                                      <th
                                        key={h}
                                        className="text-left p-3 text-copper font-semibold"
                                      >
                                        {h}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {[1, 2, 3, 4, 5].map((j) => (
                                  <SkeletonTableRow key={j} columns={9} />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                    <p className="text-error font-semibold">Data Unavailable</p>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                    <button
                      onClick={fetchStandings}
                      className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                    >
                      Retry
                    </button>
                  </Card>
                ) : standings.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-text-secondary">No standings data available</p>
                      <p className="text-text-tertiary text-sm mt-2">
                        Standings will be available when the 2025 season begins
                      </p>
                    </div>
                  </Card>
                ) : (
                  divisionOrder
                    .filter((div) => standingsByDivision[div]?.length > 0)
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
                                    <th className="text-left p-3 text-copper font-semibold">
                                      Rank
                                    </th>
                                    <th className="text-left p-3 text-copper font-semibold">
                                      Team
                                    </th>
                                    <th className="text-left p-3 text-copper font-semibold">W</th>
                                    <th className="text-left p-3 text-copper font-semibold">L</th>
                                    <th className="text-left p-3 text-copper font-semibold">PCT</th>
                                    <th className="text-left p-3 text-copper font-semibold">GB</th>
                                    <th className="text-left p-3 text-copper font-semibold">RS</th>
                                    <th className="text-left p-3 text-copper font-semibold">RA</th>
                                    <th className="text-left p-3 text-copper font-semibold">
                                      STRK
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standingsByDivision[division].map((team, idx) => (
                                    <tr
                                      key={team.teamName}
                                      className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                                    >
                                      <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                      <td className="p-3 font-semibold text-white">
                                        {team.teamName}
                                      </td>
                                      <td className="p-3 text-text-secondary">{team.wins}</td>
                                      <td className="p-3 text-text-secondary">{team.losses}</td>
                                      <td className="p-3 text-text-secondary">
                                        {team.winPercentage.toFixed(3).replace('0.', '.')}
                                      </td>
                                      <td className="p-3 text-text-secondary">
                                        {team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}
                                      </td>
                                      <td className="p-3 text-text-secondary">{team.runsScored}</td>
                                      <td className="p-3 text-text-secondary">
                                        {team.runsAllowed}
                                      </td>
                                      <td className="p-3 text-text-secondary">{team.streakCode}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border-subtle">
                              <DataSourceBadge
                                source={meta?.dataSource || 'MLB Stats API'}
                                timestamp={formatTimestamp(meta?.lastUpdated)}
                              />
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
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <SkeletonScoreCard key={i} />
                    ))}
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                    <p className="text-error font-semibold">Data Unavailable</p>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                    <button
                      onClick={fetchSchedule}
                      className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                    >
                      Retry
                    </button>
                  </Card>
                ) : schedule.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <p className="text-text-secondary">No games scheduled for today</p>
                      <p className="text-text-tertiary text-sm mt-2">
                        Check back during the MLB season for live scores
                      </p>
                    </div>
                  </Card>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
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
                            Today&apos;s Games
                          </div>
                          {hasLiveGames && <LiveBadge />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {schedule.map((game) => {
                            const isComplete = game.status.isFinal;
                            const isLive = game.status.isLive;

                            return (
                              <div
                                key={game.id}
                                className={`bg-graphite rounded-lg p-4 flex justify-between items-center border ${
                                  isLive ? 'border-success' : 'border-border-subtle'
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-white">
                                      {game.teams.away.name}
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
                                    <span className="ml-auto text-burnt-orange font-bold text-lg">
                                      {game.teams.away.score}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">
                                      {game.teams.home.name}
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
                                    <span className="ml-auto text-burnt-orange font-bold text-lg">
                                      {game.teams.home.score}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-6 text-right min-w-[100px]">
                                  {isLive ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                      <span className="text-success font-semibold text-sm">
                                        {game.status.inningState} {game.status.inning}
                                      </span>
                                    </div>
                                  ) : (
                                    <div
                                      className={`font-semibold text-sm ${
                                        isComplete ? 'text-text-tertiary' : 'text-burnt-orange'
                                      }`}
                                    >
                                      {game.status.detailedState}
                                    </div>
                                  )}
                                  <div className="text-xs text-text-tertiary mt-1">
                                    {game.venue?.name || 'TBD'}
                                  </div>
                                  {(isComplete || isLive) && (
                                    <div className="text-xs text-text-tertiary mt-1">
                                      H: {game.teams.away.hits}-{game.teams.home.hits} | E:{' '}
                                      {game.teams.away.errors}-{game.teams.home.errors}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border-subtle">
                          <DataSourceBadge
                            source={meta?.dataSource || 'MLB Stats API'}
                            timestamp={formatTimestamp(meta?.lastUpdated)}
                          />
                          {hasLiveGames && (
                            <span className="text-xs text-text-tertiary ml-4">
                              Auto-refreshing every 30 seconds
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
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
