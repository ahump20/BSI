'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp } from '@/lib/utils/timezone';

interface CFBTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color?: string;
  logos?: Array<{ href: string }>;
  record?: string;
  conference?: string;
  division?: string;
}

interface TeamsResponse {
  teams: CFBTeam[];
  meta?: {
    source: string;
    fetched_at: string;
    timezone: string;
  };
}

// Conference grouping for display ordering
const CONFERENCE_ORDER = [
  'SEC',
  'Big Ten',
  'Big 12',
  'ACC',
  'Pac-12',
  'Mountain West',
  'American Athletic',
  'Sun Belt',
  'Conference USA',
  'Mid-American',
  'FBS Independents',
];

function SkeletonTeamCard() {
  return (
    <Card variant="default" padding="md" className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-background-tertiary rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-background-tertiary rounded w-3/4" />
          <div className="h-4 bg-background-tertiary/50 rounded w-1/2" />
        </div>
      </div>
    </Card>
  );
}

function TeamCard({ team }: { team: CFBTeam }) {
  const logoUrl = team.logos?.[0]?.href;
  const teamColor = team.color ? `#${team.color}` : 'var(--bsi-primary)';

  return (
    <Link href={`/cfb/teams/${team.id}`}>
      <Card
        variant="hover"
        padding="md"
        className="h-full transition-all duration-300 hover:scale-[1.02]"
        style={{ borderColor: teamColor, borderLeftWidth: '4px' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${team.displayName} logo`}
                fill
                className="object-contain"
                sizes="56px"
                unoptimized
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: teamColor, color: '#fff' }}
              >
                {team.abbreviation}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-text-primary text-base truncate">
              {team.displayName || team.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {team.record && (
                <span className="text-text-secondary text-sm">{team.record}</span>
              )}
              {team.conference && (
                <span className="text-text-tertiary text-xs">
                  {team.conference}
                </span>
              )}
            </div>
          </div>

          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            {team.abbreviation}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}

export default function CFBTeamsPage() {
  const [teams, setTeams] = useState<CFBTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cfb/teams');
      if (!res.ok) {
        throw new Error(`Failed to fetch teams: ${res.status}`);
      }

      const data: TeamsResponse = await res.json();
      setTeams(data.teams || []);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Group teams by conference
  const teamsByConference = teams.reduce<Record<string, CFBTeam[]>>((acc, team) => {
    const conf = team.conference || 'Other';
    if (!acc[conf]) acc[conf] = [];
    acc[conf].push(team);
    return acc;
  }, {});

  // Get available conferences
  const availableConferences = ['All', ...CONFERENCE_ORDER.filter(c => teamsByConference[c]?.length)];
  // Add any conferences not in our order
  Object.keys(teamsByConference).forEach(c => {
    if (!availableConferences.includes(c)) {
      availableConferences.push(c);
    }
  });

  // Filter teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      searchQuery === '' ||
      (team.displayName || team.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesConference =
      selectedConference === 'All' || team.conference === selectedConference;

    return matchesSearch && matchesConference;
  });

  // Sorted conference keys for grouped display
  const sortedConferences = CONFERENCE_ORDER.filter(c => teamsByConference[c]?.length);
  Object.keys(teamsByConference).forEach(c => {
    if (!sortedConferences.includes(c)) sortedConferences.push(c);
  });

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/cfb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                CFB
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">Teams</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                FBS Teams
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                College Football Teams
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2">
                All FBS programs across every conference. Click any team for roster and details.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Conference Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 max-w-full">
                {availableConferences.slice(0, 6).map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setSelectedConference(conf)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${
                      selectedConference === conf
                        ? 'bg-burnt-orange text-white'
                        : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium'
                    }`}
                  >
                    {conf === 'All' ? 'All Teams' : conf}
                  </button>
                ))}
                {availableConferences.length > 6 && (
                  <select
                    value={
                      availableConferences.slice(6).includes(selectedConference)
                        ? selectedConference
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) setSelectedConference(e.target.value);
                    }}
                    className="px-3 py-2 bg-background-tertiary border border-border-subtle rounded-lg text-text-secondary text-sm focus:outline-none focus:border-burnt-orange"
                  >
                    <option value="">More...</option>
                    {availableConferences.slice(6).map((conf) => (
                      <option key={conf} value={conf}>
                        {conf}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-background-tertiary border border-border-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-burnt-orange transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  >
                    x
                  </button>
                )}
              </div>
            </div>
          </Container>
        </Section>

        {/* Teams Grid */}
        <Section padding="lg" background="charcoal">
          <Container>
            {error && (
              <Card variant="default" padding="lg" className="mb-6 bg-error/10 border-error/30">
                <p className="text-error font-semibold">Error loading teams</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTeams}
                  className="mt-3 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm hover:bg-burnt-orange/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonTeamCard key={i} />
                ))}
              </div>
            ) : selectedConference === 'All' && !searchQuery ? (
              // Show grouped by conference
              <div className="space-y-10">
                {sortedConferences.map((conference) => {
                  const confTeams = teamsByConference[conference] || [];
                  if (confTeams.length === 0) return null;

                  return (
                    <div key={conference}>
                      <ScrollReveal direction="up">
                        <h2 className="font-display text-xl font-bold text-burnt-orange mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-burnt-orange rounded-full" />
                          {conference}
                          <Badge variant="secondary" className="text-xs ml-2">
                            {confTeams.length}
                          </Badge>
                        </h2>
                      </ScrollReveal>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {confTeams
                          .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
                          .map((team, index) => (
                            <ScrollReveal key={team.id} direction="up" delay={(index % 8) * 50}>
                              <TeamCard team={team} />
                            </ScrollReveal>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show filtered grid
              <>
                {filteredTeams.length === 0 ? (
                  <Card variant="default" padding="lg" className="text-center">
                    <p className="text-text-secondary">
                      {searchQuery
                        ? `No teams found matching "${searchQuery}"`
                        : 'No teams found'}
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredTeams
                      .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
                      .map((team, index) => (
                        <ScrollReveal key={team.id} direction="up" delay={(index % 8) * 50}>
                          <TeamCard team={team} />
                        </ScrollReveal>
                      ))}
                  </div>
                )}
              </>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="ESPN CFB API" timestamp={lastUpdated} />
            </div>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/cfb/scores"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-medium transition-all"
              >
                Live Scores
              </Link>
              <Link
                href="/cfb/standings"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-medium transition-all"
              >
                Standings
              </Link>
              <Link
                href="/cfb"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-medium transition-all"
              >
                CFB Home
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
