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

interface NBATeam {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  color?: string;
  logos?: Array<{ href: string; width?: number; height?: number }>;
}

interface TeamsResponse {
  timestamp: string;
  teams: NBATeam[];
  meta: {
    dataSource: string;
    lastUpdated: string;
  };
}

// Team divisions for grouping
const divisions: Record<string, Record<string, string[]>> = {
  Eastern: {
    Atlantic: ['BOS', 'BKN', 'NYK', 'PHI', 'TOR'],
    Central: ['CHI', 'CLE', 'DET', 'IND', 'MIL'],
    Southeast: ['ATL', 'CHA', 'MIA', 'ORL', 'WAS'],
  },
  Western: {
    Northwest: ['DEN', 'MIN', 'OKC', 'POR', 'UTA'],
    Pacific: ['GSW', 'LAC', 'LAL', 'PHX', 'SAC'],
    Southwest: ['DAL', 'HOU', 'MEM', 'NOP', 'SAS'],
  },
};


function SkeletonTeamCard() {
  return (
    <Card variant="default" padding="md" className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-background-tertiary rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-background-tertiary rounded w-3/4" />
          <div className="h-4 bg-background-tertiary/50 rounded w-1/2" />
        </div>
      </div>
    </Card>
  );
}

function TeamCard({ team }: { team: NBATeam }) {
  const logoUrl = team.logos?.[0]?.href;
  const teamColor = team.color ? `#${team.color}` : '#BF5700';

  return (
    <Link href={`/nba/teams/${team.id}`}>
      <Card
        variant="hover"
        padding="md"
        className="h-full transition-all duration-300 hover:scale-[1.02]"
        style={{ borderColor: teamColor, borderLeftWidth: '4px' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${team.name} logo`}
                fill
                className="object-contain"
                sizes="64px"
                unoptimized
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: teamColor, color: '#fff' }}
              >
                {team.abbreviation}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-text-primary text-lg truncate">{team.name}</h3>
            <p className="text-text-secondary text-sm">{team.location}</p>
          </div>

          <Badge variant="secondary" className="text-xs">
            {team.abbreviation}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}

export default function NBATeamsPage() {
  const [teams, setTeams] = useState<NBATeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<'All' | 'Eastern' | 'Western'>(
    'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/nba/teams');
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

  // Get teams by conference/division
  const getTeamsByDivision = (conference: string, division: string) => {
    const divisionAbbrs = divisions[conference]?.[division] || [];
    return teams.filter((team) => divisionAbbrs.includes(team.abbreviation));
  };

  // Filter teams based on conference and search
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      searchQuery === '' ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedConference === 'All') return matchesSearch;

    const conferenceAbbrs = Object.values(divisions[selectedConference] || {}).flat();
    return conferenceAbbrs.includes(team.abbreviation) && matchesSearch;
  });

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NBA
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
                2024-25 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                NBA Teams
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2">
                All 30 NBA teams • Click any team for full roster and schedule
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Conference Tabs */}
              <div className="flex gap-2">
                {(['All', 'Eastern', 'Western'] as const).map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setSelectedConference(conf)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      selectedConference === conf
                        ? 'bg-burnt-orange text-white'
                        : 'bg-background-tertiary text-text-secondary hover:bg-surface-light'
                    }`}
                  >
                    {conf === 'All' ? 'All Teams' : `${conf} Conference`}
                  </button>
                ))}
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
                    ✕
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
              // Show by conference and division when viewing all teams without search
              <div className="space-y-12">
                {Object.entries(divisions).map(([conference, divs]) => (
                  <div key={conference}>
                    <ScrollReveal direction="up">
                      <h2 className="font-display text-2xl font-bold text-burnt-orange mb-6">
                        {conference} Conference
                      </h2>
                    </ScrollReveal>

                    <div className="space-y-8">
                      {Object.entries(divs).map(([division], divIndex) => {
                        const divisionTeams = getTeamsByDivision(conference, division);

                        return (
                          <ScrollReveal key={division} direction="up" delay={divIndex * 100}>
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-burnt-orange rounded-full" />
                                {division} Division
                              </h3>

                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                {divisionTeams.map((team) => (
                                  <TeamCard key={team.id} team={team} />
                                ))}
                              </div>
                            </div>
                          </ScrollReveal>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show filtered teams in a grid
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
                    {filteredTeams.map((team, index) => (
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
              <DataSourceBadge source="ESPN NBA API" timestamp={lastUpdated} />
            </div>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/nba/games"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                Live Scores →
              </Link>
              <Link
                href="/nba/standings"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                Standings →
              </Link>
              <Link
                href="/nba/news"
                className="px-6 py-3 bg-background-tertiary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
              >
                Latest News →
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
