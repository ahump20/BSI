'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
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
        <div className="w-16 h-16 bg-[var(--surface-dugout)] rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-[var(--surface-dugout)] rounded-sm w-3/4" />
          <div className="h-4 bg-[var(--surface-dugout)]/50 rounded-sm w-1/2" />
        </div>
      </div>
    </Card>
  );
}

function TeamCard({ team }: { team: NBATeam }) {
  const logoUrl = team.logos?.[0]?.href;
  const teamColor = team.color ? `#${team.color}` : 'var(--bsi-primary)';

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
            <h3 className="font-display font-bold text-[var(--bsi-bone)] text-lg truncate">{team.name}</h3>
            <p className="text-[var(--bsi-dust)] text-sm">{team.location}</p>
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
  const [selectedConference, setSelectedConference] = useState<'All' | 'Eastern' | 'Western'>(
    'All'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data: teamsData, loading, error, retry: fetchTeams, lastUpdated } =
    useSportData<TeamsResponse>('/api/nba/teams');

  const teams = teamsData?.teams || [];
  const lastUpdatedStr = lastUpdated ? formatTimestamp(lastUpdated.toISOString()) : formatTimestamp();

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
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                NBA
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">Teams</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                2025-26 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-[var(--bsi-primary)]">
                NBA Teams
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-[var(--bsi-dust)] mt-2">
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
                    className={`px-4 py-2 rounded-sm font-semibold transition-all text-sm ${
                      selectedConference === conf
                        ? 'bg-[var(--bsi-primary)] text-white'
                        : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)]'
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
                  className="w-full px-4 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] placeholder-[rgba(196,184,165,0.5)] focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-bone)]"
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
                <p className="text-[var(--bsi-dust)] text-sm mt-1">{error}</p>
                <button
                  onClick={fetchTeams}
                  className="mt-3 px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm text-sm hover:bg-[var(--bsi-primary)]/80 transition-colors"
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
                      <h2 className="font-display text-2xl font-bold text-[var(--bsi-primary)] mb-6">
                        {conference} Conference
                      </h2>
                    </ScrollReveal>

                    <div className="space-y-8">
                      {Object.entries(divs).map(([division], divIndex) => {
                        const divisionTeams = getTeamsByDivision(conference, division);

                        return (
                          <ScrollReveal key={division} direction="up" delay={divIndex * 100}>
                            <div>
                              <h3 className="text-lg font-semibold text-[var(--bsi-bone)] mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-[var(--bsi-primary)] rounded-full" />
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
                    <p className="text-[var(--bsi-dust)]">
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
            <div className="mt-8 pt-4 border-t border-[var(--border-vintage)]">
              <DataSourceBadge source="ESPN NBA API" timestamp={lastUpdatedStr} />
            </div>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/nba/games"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Live Scores →
              </Link>
              <Link
                href="/nba/standings"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Standings →
              </Link>
              <Link
                href="/nba/news"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Latest News →
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
