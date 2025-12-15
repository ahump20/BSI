'use client';

import { useState, useEffect, useCallback } from 'react';
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
  { label: 'Games', href: '/college-baseball/games' },
  { label: 'Standings', href: '/college-baseball/standings' },
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
  };
  contact?: {
    website?: string;
    twitter?: string;
  };
  stats?: {
    wins: number;
    losses: number;
    confWins: number;
    confLosses: number;
    rpi: number;
    streak?: string;
  };
}

const POWER_5 = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

const conferenceOptions = [
  { value: '', label: 'All Conferences' },
  { value: 'SEC', label: 'SEC' },
  { value: 'ACC', label: 'ACC' },
  { value: 'Big 12', label: 'Big 12' },
  { value: 'Big Ten', label: 'Big Ten' },
  { value: 'Pac-12', label: 'Pac-12' },
  { value: 'Sun Belt', label: 'Sun Belt' },
  { value: 'AAC', label: 'American Athletic' },
  { value: 'C-USA', label: 'Conference USA' },
  { value: 'Mountain West', label: 'Mountain West' },
  { value: 'WAC', label: 'WAC' },
];

export default function CollegeBaseballTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConference, setSelectedConference] = useState('');

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedConference) params.append('conference', selectedConference);

      const response = await fetch(`/api/college-baseball/teams?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedConference]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleSearch = () => {
    loadTeams();
  };

  // Stats calculations
  const totalTeams = teams.length;
  const conferenceCount = new Set(teams.map((t) => t.conference).filter(Boolean)).size;
  const power5Teams = teams.filter((t) => POWER_5.some((p5) => t.conference?.includes(p5))).length;
  const midMajorTeams = totalTeams - power5Teams;

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            {/* Breadcrumb & Header */}
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Teams</span>
              </div>

              <div className="mb-8">
                <span className="kicker block mb-2">NCAA Division I Baseball</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Complete <span className="text-gradient-blaze">Team Directory</span>
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  Team rosters, season schedules, game results, and statistical breakdowns for all
                  NCAA Division I baseball programs. From SEC powerhouses to mid-major contenders.
                </p>
              </div>
            </ScrollReveal>

            {/* Search & Filter */}
            <ScrollReveal direction="up" delay={100}>
              <Card padding="lg" className="mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by team name, city, or mascot..."
                      className="flex-1 px-4 py-2 bg-charcoal border border-border-subtle rounded-lg text-white placeholder:text-text-tertiary focus:outline-none focus:border-burnt-orange transition-colors"
                      aria-label="Search teams"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-burnt-orange text-white font-semibold rounded-lg hover:bg-burnt-orange/90 transition-colors"
                      aria-label="Search"
                    >
                      Search
                    </button>
                  </div>
                  <select
                    value={selectedConference}
                    onChange={(e) => setSelectedConference(e.target.value)}
                    className="px-4 py-2 bg-charcoal border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange transition-colors"
                    aria-label="Filter by conference"
                  >
                    {conferenceOptions.map((conf) => (
                      <option key={conf.value} value={conf.value}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            </ScrollReveal>

            {/* Stats Bar */}
            <ScrollReveal direction="up" delay={150}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {totalTeams}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    D1 Teams
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {conferenceCount}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Conferences
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {power5Teams}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Power 5 Teams
                  </div>
                </Card>
                <Card padding="md" className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-burnt-orange">
                    {midMajorTeams}
                  </div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
                    Mid-Major Teams
                  </div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Teams Grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
                <p className="text-text-secondary">Loading teams...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <div className="text-error text-4xl mb-4">!</div>
                <h3 className="text-xl font-semibold text-white mb-2">Error Loading Teams</h3>
                <p className="text-text-secondary">{error}</p>
              </Card>
            ) : teams.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="text-text-tertiary text-4xl mb-4">?</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Teams Found</h3>
                <p className="text-text-secondary">
                  No teams match your search criteria. Try a different search term.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team, index) => (
                  <ScrollReveal key={team.id} direction="up" delay={index * 30}>
                    <Link href={`/college-baseball/teams/${team.id}`} className="block">
                      <Card variant="hover" padding="none" className="h-full">
                        {/* Team Header */}
                        <div className="p-4 flex items-center gap-4 border-b border-border-subtle">
                          <div className="w-16 h-16 rounded-full bg-charcoal flex items-center justify-center overflow-hidden">
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={`${team.name} logo`}
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="font-display text-burnt-orange font-bold text-lg">
                                {team.abbreviation || team.name.substring(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-display text-lg font-bold text-white">
                              {team.name}
                            </h3>
                            <p className="text-text-secondary text-sm">
                              {team.conference || 'Independent'}
                            </p>
                            <p className="text-text-tertiary text-xs flex items-center gap-1 mt-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {team.location?.city && team.location?.state
                                ? `${team.location.city}, ${team.location.state}`
                                : 'Location N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Team Stats */}
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-text-tertiary text-xs uppercase tracking-wider">
                                Division
                              </span>
                              <p className="text-burnt-orange font-semibold">
                                {team.division || 'D1'}
                              </p>
                            </div>
                            <div>
                              <span className="text-text-tertiary text-xs uppercase tracking-wider">
                                Mascot
                              </span>
                              <p className="text-burnt-orange font-semibold truncate">
                                {team.mascot || '-'}
                              </p>
                            </div>
                            {team.stats && (
                              <>
                                <div>
                                  <span className="text-text-tertiary text-xs uppercase tracking-wider">
                                    Record
                                  </span>
                                  <p className="text-white font-semibold">
                                    {team.stats.wins}-{team.stats.losses}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-text-tertiary text-xs uppercase tracking-wider">
                                    RPI
                                  </span>
                                  <p className="text-burnt-orange font-semibold">
                                    #{team.stats.rpi}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {/* External Links */}
                          {(team.contact?.website || team.contact?.twitter) && (
                            <div className="mt-4 pt-4 border-t border-border-subtle flex gap-3">
                              {team.contact.website && (
                                <a
                                  href={team.contact.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-burnt-orange hover:text-burnt-orange/80 transition-colors"
                                  aria-label={`Visit ${team.name} website`}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </a>
                              )}
                              {team.contact.twitter && (
                                <a
                                  href={`https://twitter.com/${team.contact.twitter}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-burnt-orange hover:text-burnt-orange/80 transition-colors"
                                  aria-label={`${team.name} on Twitter`}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Power 5 Badge */}
                        {POWER_5.some((p5) => team.conference?.includes(p5)) && (
                          <div className="px-4 pb-4">
                            <Badge variant="primary">Power 5</Badge>
                          </div>
                        )}
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
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
