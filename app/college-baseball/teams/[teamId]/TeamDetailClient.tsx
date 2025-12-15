'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Teams', href: '/college-baseball/teams' },
];

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  mascot: string;
  conference: string;
  division: string;
  logo?: string;
  location: {
    city: string;
    state: string;
    stadium?: string;
    capacity?: number;
  };
  contact?: {
    website?: string;
    twitter?: string;
    phone?: string;
  };
  colors?: {
    primary: string;
    secondary: string;
  };
  stats?: {
    wins: number;
    losses: number;
    confWins: number;
    confLosses: number;
    rpi: number;
    streak?: string;
    runsScored: number;
    runsAllowed: number;
    battingAvg: number;
    era: number;
  };
  schedule?: Game[];
  roster?: Player[];
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  location: 'home' | 'away' | 'neutral';
  result?: {
    score: string;
    won: boolean;
  };
  time?: string;
}

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
  year: string;
  stats?: {
    avg?: number;
    hr?: number;
    rbi?: number;
    era?: number;
    wins?: number;
    so?: number;
  };
}

interface TeamDetailClientProps {
  teamId: string;
}

export default function TeamDetailClient({ teamId }: TeamDetailClientProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'schedule'>('overview');

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/college-baseball/teams/${teamId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Team not found');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setTeam(data.team || data);
      } catch (err) {
        console.error('Error loading team:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  if (loading) {
    return (
      <>
        <Navbar items={navItems} />
        <main className="min-h-screen pt-24">
          <Container>
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
              <p className="text-text-secondary">Loading team information...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !team) {
    return (
      <>
        <Navbar items={navItems} />
        <main className="min-h-screen pt-24">
          <Container>
            <Card padding="lg" className="text-center">
              <div className="text-error text-4xl mb-4">!</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {error === 'Team not found' ? 'Team Not Found' : 'Error Loading Team'}
              </h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <Link
                href="/college-baseball/teams"
                className="inline-block px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
              >
                Back to Teams
              </Link>
            </Card>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const POWER_5 = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];
  const isPower5 = POWER_5.some((p5) => team.conference?.includes(p5));

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Hero Section */}
        <Section padding="lg" className="pt-24 bg-gradient-to-b from-charcoal to-midnight">
          <Container>
            <ScrollReveal direction="up">
              {/* Breadcrumb */}
              <div className="flex items-center gap-3 mb-6">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <Link
                  href="/college-baseball/teams"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  Teams
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">{team.name}</span>
              </div>

              {/* Team Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-charcoal flex items-center justify-center overflow-hidden border-4 border-burnt-orange/30">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={`${team.name} logo`}
                      className="w-20 h-20 md:w-24 md:h-24 object-contain"
                    />
                  ) : (
                    <span className="font-display text-burnt-orange font-bold text-3xl md:text-4xl">
                      {team.abbreviation || team.name.substring(0, 2)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                      {team.name}
                    </h1>
                    {isPower5 && <Badge variant="primary">Power 5</Badge>}
                  </div>

                  <p className="text-text-secondary text-lg mb-3">
                    {team.mascot} - {team.conference || 'Independent'}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-text-tertiary">
                    {team.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {team.location.city}, {team.location.state}
                      </span>
                    )}
                    {team.location?.stadium && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        {team.location.stadium}
                      </span>
                    )}
                  </div>

                  {/* External Links */}
                  {(team.contact?.website || team.contact?.twitter) && (
                    <div className="flex gap-4 mt-4">
                      {team.contact.website && (
                        <a
                          href={team.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-burnt-orange hover:text-burnt-orange/80 transition-colors text-sm flex items-center gap-1"
                        >
                          Official Website
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      {team.contact.twitter && (
                        <a
                          href={`https://twitter.com/${team.contact.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-burnt-orange hover:text-burnt-orange/80 transition-colors text-sm flex items-center gap-1"
                        >
                          @{team.contact.twitter}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Season Stats Summary */}
                {team.stats && (
                  <div className="flex flex-wrap gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="font-display text-3xl md:text-4xl font-bold text-burnt-orange">
                        {team.stats.wins}-{team.stats.losses}
                      </div>
                      <div className="text-text-tertiary text-xs uppercase tracking-wider">
                        Overall
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-3xl md:text-4xl font-bold text-white">
                        {team.stats.confWins}-{team.stats.confLosses}
                      </div>
                      <div className="text-text-tertiary text-xs uppercase tracking-wider">
                        Conference
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-3xl md:text-4xl font-bold text-success">
                        #{team.stats.rpi}
                      </div>
                      <div className="text-text-tertiary text-xs uppercase tracking-wider">
                        RPI
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tabs Navigation */}
        <Section padding="none" className="bg-charcoal border-b border-border-subtle sticky top-16 z-30">
          <Container>
            <div className="flex gap-1">
              {(['overview', 'roster', 'schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? 'text-burnt-orange border-b-2 border-burnt-orange'
                      : 'text-text-tertiary hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Tab Content */}
        <Section padding="lg">
          <Container>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Stats */}
                <ScrollReveal direction="up">
                  <Card padding="lg">
                    <h2 className="font-display text-xl font-bold text-white mb-6">
                      Season Statistics
                    </h2>
                    {team.stats ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className="text-text-tertiary text-xs uppercase tracking-wider">
                            Runs Scored
                          </span>
                          <p className="font-display text-2xl font-bold text-burnt-orange">
                            {team.stats.runsScored}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary text-xs uppercase tracking-wider">
                            Runs Allowed
                          </span>
                          <p className="font-display text-2xl font-bold text-white">
                            {team.stats.runsAllowed}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary text-xs uppercase tracking-wider">
                            Team AVG
                          </span>
                          <p className="font-display text-2xl font-bold text-burnt-orange">
                            {team.stats.battingAvg.toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <span className="text-text-tertiary text-xs uppercase tracking-wider">
                            Team ERA
                          </span>
                          <p className="font-display text-2xl font-bold text-white">
                            {team.stats.era.toFixed(2)}
                          </p>
                        </div>
                        {team.stats.streak && (
                          <div className="col-span-2">
                            <span className="text-text-tertiary text-xs uppercase tracking-wider">
                              Current Streak
                            </span>
                            <p className="font-display text-2xl font-bold text-success">
                              {team.stats.streak}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-text-tertiary">Statistics not available</p>
                    )}
                  </Card>
                </ScrollReveal>

                {/* Quick Info */}
                <ScrollReveal direction="up" delay={100}>
                  <Card padding="lg">
                    <h2 className="font-display text-xl font-bold text-white mb-6">
                      Team Information
                    </h2>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Conference</span>
                        <span className="text-white font-semibold">
                          {team.conference || 'Independent'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">Division</span>
                        <span className="text-white font-semibold">{team.division || 'D1'}</span>
                      </div>
                      {team.location?.stadium && (
                        <div className="flex justify-between">
                          <span className="text-text-tertiary">Stadium</span>
                          <span className="text-white font-semibold">{team.location.stadium}</span>
                        </div>
                      )}
                      {team.location?.capacity && (
                        <div className="flex justify-between">
                          <span className="text-text-tertiary">Capacity</span>
                          <span className="text-white font-semibold">
                            {team.location.capacity.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </ScrollReveal>
              </div>
            )}

            {activeTab === 'roster' && (
              <ScrollReveal direction="up">
                <Card padding="none" className="overflow-hidden">
                  {team.roster && team.roster.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-charcoal border-b border-border-subtle">
                            <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              #
                            </th>
                            <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Name
                            </th>
                            <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Pos
                            </th>
                            <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Year
                            </th>
                            <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              AVG/ERA
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.roster.map((player) => (
                            <tr
                              key={player.id}
                              className="border-b border-border-subtle hover:bg-charcoal/50 transition-colors"
                            >
                              <td className="py-4 px-4 font-semibold text-burnt-orange">
                                {player.number}
                              </td>
                              <td className="py-4 px-4 font-semibold text-white">{player.name}</td>
                              <td className="py-4 px-4 text-text-secondary">{player.position}</td>
                              <td className="py-4 px-4 text-text-secondary">{player.year}</td>
                              <td className="py-4 px-4 text-center font-mono text-burnt-orange">
                                {player.stats?.avg
                                  ? player.stats.avg.toFixed(3)
                                  : player.stats?.era
                                    ? player.stats.era.toFixed(2)
                                    : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-tertiary">
                      Roster information not available
                    </div>
                  )}
                </Card>
              </ScrollReveal>
            )}

            {activeTab === 'schedule' && (
              <ScrollReveal direction="up">
                <Card padding="none" className="overflow-hidden">
                  {team.schedule && team.schedule.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {team.schedule.map((game) => (
                        <div
                          key={game.id}
                          className="p-4 flex items-center justify-between hover:bg-charcoal/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center w-16">
                              <div className="text-xs text-text-tertiary uppercase">
                                {new Date(game.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                })}
                              </div>
                              <div className="font-display text-2xl font-bold text-white">
                                {new Date(game.date).getDate()}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-white">
                                {game.location === 'home' ? 'vs' : '@'} {game.opponent}
                              </div>
                              <div className="text-xs text-text-tertiary">
                                {game.location === 'home'
                                  ? 'Home'
                                  : game.location === 'away'
                                    ? 'Away'
                                    : 'Neutral'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {game.result ? (
                              <div
                                className={`font-display text-xl font-bold ${game.result.won ? 'text-success' : 'text-error'}`}
                              >
                                {game.result.won ? 'W' : 'L'} {game.result.score}
                              </div>
                            ) : (
                              <div className="text-text-secondary">{game.time || 'TBD'}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-tertiary">
                      Schedule information not available
                    </div>
                  )}
                </Card>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-12 text-center text-xs text-text-tertiary">
              <p>Team data sourced from official NCAA statistics.</p>
              <p className="mt-1">
                Last updated:{' '}
                {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
