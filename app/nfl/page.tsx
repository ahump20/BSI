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
  id: string;
  name: string;
  abbreviation?: string;
  conference?: string;
  division?: string;
  color?: string;
  logos?: { href: string }[];
  venue?: string;
}

interface Game {
  id: string;
  date: string;
  status?: {
    type?: string;
    detail?: string;
    completed?: boolean;
  };
  teams?: {
    homeAway: string;
    team: { displayName: string };
    score?: number;
    winner?: boolean;
  }[];
}

type TabType = 'standings' | 'teams' | 'players' | 'schedule';

export default function NFLPage() {
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'teams' && teams.length === 0) {
      fetchTeams();
    } else if (activeTab === 'schedule' && schedule.length === 0) {
      fetchSchedule();
    }
  }, [activeTab, teams.length, schedule.length]);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nfl/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data.teams || []);
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
      const response = await fetch('/api/nfl/scoreboard?week=1');
      if (!response.ok) throw new Error('Failed to fetch schedule');
      const data = await response.json();
      setSchedule(data.games || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTimestamp = () =>
    new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) + ' CDT';

  // Group teams by division
  const divisions: Record<string, Team[]> = {
    'AFC East': [],
    'AFC North': [],
    'AFC South': [],
    'AFC West': [],
    'NFC East': [],
    'NFC North': [],
    'NFC South': [],
    'NFC West': [],
  };
  teams.forEach((team) => {
    const divName = `${team.conference || 'AFC'} ${team.division || 'East'}`;
    if (divisions[divName]) {
      divisions[divName].push(team);
    }
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
                NFL Intelligence
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-display text-gradient-blaze mb-4">
                Practice to Play.
                <br />
                Blaze Data Wins the Day.
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
                    NFL Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-6">
                    NFL standings will be available during the regular season
                  </p>
                  <div className="bg-graphite rounded-lg p-8 text-center">
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
                    <p className="text-text-secondary">
                      Real-time standings and playoff picture coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-tertiary mt-4">Loading NFL teams...</p>
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                    <p className="text-error font-semibold">Data Unavailable</p>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                  </Card>
                ) : (
                  <>
                    {Object.keys(divisions).map(
                      (division) =>
                        divisions[division].length > 0 && (
                          <ScrollReveal key={division}>
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
                                  {division}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {divisions[division]
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((team) => (
                                      <div
                                        key={team.id}
                                        className="bg-graphite rounded-lg p-5 border border-border-subtle hover:border-burnt-orange transition-colors cursor-pointer"
                                        style={{
                                          background: team.color
                                            ? `linear-gradient(135deg, #${team.color}22 0%, var(--graphite) 100%)`
                                            : undefined,
                                        }}
                                      >
                                        {team.logos && team.logos[0] && (
                                          <img
                                            src={team.logos[0].href}
                                            alt={team.name}
                                            className="w-14 h-14 mb-3 object-contain"
                                          />
                                        )}
                                        <div className="font-semibold text-white">{team.name}</div>
                                        <div className="text-xs text-text-tertiary mt-1">
                                          {team.abbreviation}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </CardContent>
                            </Card>
                          </ScrollReveal>
                        )
                    )}
                    <Card variant="default" padding="md">
                      <div className="text-xs text-text-tertiary">
                        Data Source: ESPN NFL API via blazesportsintel.com/api | Last Updated:{' '}
                        {getTimestamp()}
                      </div>
                    </Card>
                  </>
                )}
              </>
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
                  <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-tertiary mt-4">Loading NFL schedule...</p>
                  </div>
                ) : error ? (
                  <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                    <p className="text-error font-semibold">Data Unavailable</p>
                    <p className="text-text-secondary text-sm mt-1">{error}</p>
                  </Card>
                ) : (
                  <ScrollReveal>
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
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Week 1 Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {schedule.length === 0 ? (
                          <div className="bg-graphite rounded-lg p-8 text-center">
                            <p className="text-text-secondary">
                              Schedule data will be available when the season begins
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {schedule.map((game, idx) => {
                              const isComplete = game.status?.completed;
                              const isLive = game.status?.type === 'STATUS_IN_PROGRESS';
                              const homeTeam = game.teams?.find((t) => t.homeAway === 'home');
                              const awayTeam = game.teams?.find((t) => t.homeAway === 'away');

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
                                        {awayTeam?.team?.displayName || 'TBD'}
                                      </span>
                                      {isComplete && awayTeam?.winner && (
                                        <svg
                                          viewBox="0 0 24 24"
                                          className="w-4 h-4 text-success"
                                          fill="currentColor"
                                        >
                                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                      )}
                                      <span className="ml-auto text-burnt-orange font-bold">
                                        {awayTeam?.score ?? '-'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">
                                        {homeTeam?.team?.displayName || 'TBD'}
                                      </span>
                                      {isComplete && homeTeam?.winner && (
                                        <svg
                                          viewBox="0 0 24 24"
                                          className="w-4 h-4 text-success"
                                          fill="currentColor"
                                        >
                                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                      )}
                                      <span className="ml-auto text-burnt-orange font-bold">
                                        {homeTeam?.score ?? '-'}
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
                                      {game.status?.detail || 'Scheduled'}
                                    </div>
                                    <div className="text-xs text-text-tertiary mt-1">
                                      {new Date(game.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        timeZone: 'America/Chicago',
                                      })}{' '}
                                      CDT
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-border-subtle text-xs text-text-tertiary">
                          Data Source: ESPN NFL API via blazesportsintel.com/api | Last Updated:{' '}
                          {getTimestamp()}
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
