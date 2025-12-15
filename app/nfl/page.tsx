'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
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

interface StandingsTeam {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  Ties: number;
  Percentage: number;
  PointsFor: number;
  PointsAgainst: number;
  NetPoints: number;
  Conference: string;
  Division: string;
  HomeWins: number;
  HomeLosses: number;
  AwayWins: number;
  AwayLosses: number;
  Streak: number;
}

interface Game {
  GameKey: string;
  Season: number;
  Week: number;
  Date: string;
  AwayTeam: string;
  HomeTeam: string;
  Status: string;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: string;
  TimeRemaining?: string;
  Channel?: string;
}

interface DataMeta {
  dataProvider: string;
  timezone: string;
  cached: boolean;
  totalTeams?: number;
  totalGames?: number;
  liveGames?: number;
}

interface StandingsResponse {
  success: boolean;
  season: number;
  standings: {
    afc: Record<string, StandingsTeam[]>;
    nfc: Record<string, StandingsTeam[]>;
  };
  rawData: StandingsTeam[];
  source: {
    provider: string;
    retrievedAt: string;
    cacheHit: boolean;
  };
  meta: DataMeta;
}

interface ScoresResponse {
  success: boolean;
  season: number;
  week: number;
  games: {
    live: Game[];
    final: Game[];
    scheduled: Game[];
  };
  rawData: Game[];
  source: {
    provider: string;
    retrievedAt: string;
    cacheHit: boolean;
  };
  meta: DataMeta;
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

export default function NFLPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [scores, setScores] = useState<ScoresResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLiveGames, setHasLiveGames] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nfl/standings');
      if (!response.ok) throw new Error('Failed to fetch standings');
      const data: StandingsResponse = await response.json();
      if (data.success) {
        setStandings(data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nfl/scores');
      if (!response.ok) throw new Error('Failed to fetch scores');
      const data: ScoresResponse = await response.json();
      if (data.success) {
        setScores(data);
        setHasLiveGames((data.meta?.liveGames || 0) > 0);
      } else {
        throw new Error('API returned unsuccessful response');
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
      fetchScores();
    }
  }, [activeTab, fetchStandings, fetchScores]);

  // Auto-refresh for live games (every 30 seconds)
  useEffect(() => {
    if (activeTab === 'schedule' && hasLiveGames) {
      const interval = setInterval(fetchScores, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, hasLiveGames, fetchScores]);

  // Division display order
  const divisionOrder = ['East', 'North', 'South', 'West'];

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
              <Badge variant="primary" className="mb-4">
                NFL Intelligence
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display text-gradient-blaze mb-4">
                NFL Intelligence
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="text-text-secondary text-center max-w-2xl mx-auto">
                Real-time NFL standings, team statistics, and advanced analytics. Championship
                intelligence for coaches who decide faster. ALL 272 regular season games.
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
                  <div className="space-y-6">
                    {['AFC', 'NFC'].map((conf) => (
                      <Card key={conf} variant="default" padding="lg">
                        <CardHeader>
                          <Skeleton variant="text" width={150} height={24} />
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-burnt-orange">
                                  {['Team', 'W', 'L', 'T', 'PCT', 'PF', 'PA', 'DIFF', 'STRK'].map(
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
                                {[1, 2, 3, 4].map((j) => (
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
                ) : !standings?.rawData?.length ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-16 h-16 text-burnt-orange mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <ellipse cx="12" cy="12" rx="9" ry="5" />
                        <path d="M12 7v10M7 12h10" />
                      </svg>
                      <p className="text-text-secondary">No standings data available</p>
                      <p className="text-text-tertiary text-sm mt-2">
                        Standings will be available when the 2025 NFL season begins
                      </p>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* AFC Standings */}
                    {standings.standings.afc && Object.keys(standings.standings.afc).length > 0 && (
                      <ScrollReveal>
                        <Card variant="default" padding="lg" className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                              <svg
                                viewBox="0 0 24 24"
                                className="w-6 h-6 text-burnt-orange"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <ellipse cx="12" cy="12" rx="9" ry="5" />
                                <path d="M12 7v10M7 12h10" />
                              </svg>
                              AFC Standings
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {divisionOrder.map((div) => {
                              const teams = standings.standings.afc[div.toLowerCase()];
                              if (!teams?.length) return null;
                              return (
                                <div key={div} className="mb-6 last:mb-0">
                                  <h4 className="text-gold font-semibold mb-3">AFC {div}</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b border-burnt-orange/50">
                                          <th className="text-left p-2 text-copper font-semibold text-sm">
                                            Team
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            W
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            L
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            T
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            PCT
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            PF
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            PA
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            DIFF
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            STRK
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {teams.map((team, idx) => (
                                          <tr
                                            key={team.TeamID}
                                            className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                                          >
                                            <td className="p-2">
                                              <span className="text-burnt-orange font-bold mr-2">
                                                {idx + 1}
                                              </span>
                                              <span className="font-semibold text-white">
                                                {team.Name}
                                              </span>
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Wins}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Losses}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Ties}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Percentage.toFixed(3).replace('0.', '.')}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.PointsFor}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.PointsAgainst}
                                            </td>
                                            <td
                                              className={`text-center p-2 ${team.NetPoints > 0 ? 'text-success' : team.NetPoints < 0 ? 'text-error' : 'text-text-secondary'}`}
                                            >
                                              {team.NetPoints > 0 ? '+' : ''}
                                              {team.NetPoints}
                                            </td>
                                            <td
                                              className={`text-center p-2 ${team.Streak > 0 ? 'text-success' : team.Streak < 0 ? 'text-error' : 'text-text-secondary'}`}
                                            >
                                              {team.Streak > 0
                                                ? `W${team.Streak}`
                                                : team.Streak < 0
                                                  ? `L${Math.abs(team.Streak)}`
                                                  : '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    )}

                    {/* NFC Standings */}
                    {standings.standings.nfc && Object.keys(standings.standings.nfc).length > 0 && (
                      <ScrollReveal>
                        <Card variant="default" padding="lg" className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                              <svg
                                viewBox="0 0 24 24"
                                className="w-6 h-6 text-burnt-orange"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <ellipse cx="12" cy="12" rx="9" ry="5" />
                                <path d="M12 7v10M7 12h10" />
                              </svg>
                              NFC Standings
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {divisionOrder.map((div) => {
                              const teams = standings.standings.nfc[div.toLowerCase()];
                              if (!teams?.length) return null;
                              return (
                                <div key={div} className="mb-6 last:mb-0">
                                  <h4 className="text-gold font-semibold mb-3">NFC {div}</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b border-burnt-orange/50">
                                          <th className="text-left p-2 text-copper font-semibold text-sm">
                                            Team
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            W
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            L
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            T
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            PCT
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            PF
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            PA
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            DIFF
                                          </th>
                                          <th className="text-center p-2 text-copper font-semibold text-sm">
                                            STRK
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {teams.map((team, idx) => (
                                          <tr
                                            key={team.TeamID}
                                            className="border-b border-border-subtle hover:bg-white/5 transition-colors"
                                          >
                                            <td className="p-2">
                                              <span className="text-burnt-orange font-bold mr-2">
                                                {idx + 1}
                                              </span>
                                              <span className="font-semibold text-white">
                                                {team.Name}
                                              </span>
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Wins}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Losses}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Ties}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.Percentage.toFixed(3).replace('0.', '.')}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.PointsFor}
                                            </td>
                                            <td className="text-center p-2 text-text-secondary">
                                              {team.PointsAgainst}
                                            </td>
                                            <td
                                              className={`text-center p-2 ${team.NetPoints > 0 ? 'text-success' : team.NetPoints < 0 ? 'text-error' : 'text-text-secondary'}`}
                                            >
                                              {team.NetPoints > 0 ? '+' : ''}
                                              {team.NetPoints}
                                            </td>
                                            <td
                                              className={`text-center p-2 ${team.Streak > 0 ? 'text-success' : team.Streak < 0 ? 'text-error' : 'text-text-secondary'}`}
                                            >
                                              {team.Streak > 0
                                                ? `W${team.Streak}`
                                                : team.Streak < 0
                                                  ? `L${Math.abs(team.Streak)}`
                                                  : '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    )}

                    {/* Data Source Citation */}
                    <Card variant="default" padding="md">
                      <DataSourceBadge
                        source={standings.meta?.dataProvider || 'SportsDataIO'}
                        timestamp={formatTimestamp(standings.source?.retrievedAt)}
                      />
                    </Card>
                  </>
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
                      strokeWidth="1.5"
                    >
                      <ellipse cx="12" cy="12" rx="9" ry="5" />
                      <path d="M12 7v10M7 12h10" />
                    </svg>
                    NFL Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-6">
                    Team rosters, depth charts, and injury reports
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
                      Full team information available during the season
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
                    NFL player statistics and advanced metrics coming soon
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
                      QB ratings, receiver metrics, defensive stats, and more
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
                      onClick={fetchScores}
                      className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                    >
                      Retry
                    </button>
                  </Card>
                ) : !scores?.rawData?.length ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-16 h-16 text-burnt-orange mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <p className="text-text-secondary">No games scheduled</p>
                      <p className="text-text-tertiary text-sm mt-2">
                        Games will appear here during the NFL season
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
                            Week {scores.week} Games
                          </div>
                          {hasLiveGames && <LiveBadge />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Live Games */}
                        {scores.games.live.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-success font-semibold mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                              Live Games
                            </h4>
                            <div className="space-y-3">
                              {scores.games.live.map((game) => (
                                <div
                                  key={game.GameKey}
                                  className="bg-graphite rounded-lg p-4 flex justify-between items-center border border-success"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-semibold text-white">
                                        {game.AwayTeam}
                                      </span>
                                      <span className="ml-auto text-burnt-orange font-bold text-lg">
                                        {game.AwayScore ?? 0}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">
                                        {game.HomeTeam}
                                      </span>
                                      <span className="ml-auto text-burnt-orange font-bold text-lg">
                                        {game.HomeScore ?? 0}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-6 text-right min-w-[80px]">
                                    <div className="text-success font-semibold text-sm">
                                      {game.Quarter} {game.TimeRemaining}
                                    </div>
                                    {game.Channel && (
                                      <div className="text-xs text-text-tertiary mt-1">
                                        {game.Channel}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Final Games */}
                        {scores.games.final.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-text-tertiary font-semibold mb-3">Final</h4>
                            <div className="space-y-3">
                              {scores.games.final.map((game) => {
                                const awayWins = (game.AwayScore ?? 0) > (game.HomeScore ?? 0);
                                const homeWins = (game.HomeScore ?? 0) > (game.AwayScore ?? 0);
                                return (
                                  <div
                                    key={game.GameKey}
                                    className="bg-graphite rounded-lg p-4 flex justify-between items-center border border-border-subtle"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span
                                          className={`font-semibold ${awayWins ? 'text-white' : 'text-text-secondary'}`}
                                        >
                                          {game.AwayTeam}
                                        </span>
                                        {awayWins && (
                                          <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-success"
                                            fill="currentColor"
                                          >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                          </svg>
                                        )}
                                        <span
                                          className={`ml-auto font-bold text-lg ${awayWins ? 'text-burnt-orange' : 'text-text-secondary'}`}
                                        >
                                          {game.AwayScore ?? 0}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`font-semibold ${homeWins ? 'text-white' : 'text-text-secondary'}`}
                                        >
                                          {game.HomeTeam}
                                        </span>
                                        {homeWins && (
                                          <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-success"
                                            fill="currentColor"
                                          >
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                          </svg>
                                        )}
                                        <span
                                          className={`ml-auto font-bold text-lg ${homeWins ? 'text-burnt-orange' : 'text-text-secondary'}`}
                                        >
                                          {game.HomeScore ?? 0}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-6 text-right min-w-[60px]">
                                      <div className="text-text-tertiary font-semibold text-sm">
                                        Final
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Scheduled Games */}
                        {scores.games.scheduled.length > 0 && (
                          <div>
                            <h4 className="text-burnt-orange font-semibold mb-3">Upcoming</h4>
                            <div className="space-y-3">
                              {scores.games.scheduled.map((game) => (
                                <div
                                  key={game.GameKey}
                                  className="bg-graphite rounded-lg p-4 flex justify-between items-center border border-border-subtle"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-semibold text-white">
                                        {game.AwayTeam}
                                      </span>
                                      <span className="ml-auto text-text-secondary">-</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">
                                        {game.HomeTeam}
                                      </span>
                                      <span className="ml-auto text-text-secondary">-</span>
                                    </div>
                                  </div>
                                  <div className="ml-6 text-right min-w-[100px]">
                                    <div className="text-burnt-orange font-semibold text-sm">
                                      {new Date(game.Date).toLocaleString('en-US', {
                                        weekday: 'short',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'America/Chicago',
                                      })}{' '}
                                      CT
                                    </div>
                                    {game.Channel && (
                                      <div className="text-xs text-text-tertiary mt-1">
                                        {game.Channel}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-border-subtle">
                          <DataSourceBadge
                            source={scores.meta?.dataProvider || 'SportsDataIO'}
                            timestamp={formatTimestamp(scores.source?.retrievedAt)}
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
