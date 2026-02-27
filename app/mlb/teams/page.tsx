'use client';

/**
 * MLB Teams Page
 *
 * Browse all 30 MLB teams with league filtering and search.
 * Uses centralized team data utility, ESPN CDN logos, and user timezone preferences.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useUserSettings } from '@/lib/hooks';
import { MLB_TEAMS, DIVISION_ORDER, type MLBTeamInfo } from '@/lib/utils/mlb-teams';

interface TeamWithRecord extends MLBTeamInfo {
  wins?: number;
  losses?: number;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

/** ESPN CDN logo URL for a given MLB team abbreviation */
function getLogoUrl(abbreviation: string): string {
  // ESPN uses lowercase abbreviation for logo paths
  return `https://a.espncdn.com/i/teamlogos/mlb/500/${abbreviation.toLowerCase()}.png`;
}

export default function MLBTeamsPage() {
  const [teams, setTeams] = useState<TeamWithRecord[]>(MLB_TEAMS);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<'all' | 'AL' | 'NL'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { formatDateTime, isLoaded: timezoneLoaded } = useUserSettings();

  const displayTimestamp = (isoString?: string): string => {
    const date = isoString ? new Date(isoString) : new Date();
    if (timezoneLoaded) {
      return formatDateTime(date);
    }
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
  };

  // Fetch team records from standings API
  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch('/api/mlb/standings');
        if (res.ok) {
          const data = (await res.json()) as {
            standings?: Array<{
              teamName: string;
              teamAbbreviation?: string;
              wins?: number;
              losses?: number;
            }>;
            meta?: DataMeta;
          };
          if (data.standings) {
            setTeams((prev) =>
              prev.map((team) => {
                // Match by abbreviation first (reliable), fall back to name
                const standing = data.standings?.find(
                  (s) =>
                    s.teamAbbreviation?.toUpperCase() === team.abbreviation ||
                    s.teamName.toLowerCase() === team.name.toLowerCase() ||
                    s.teamName.toLowerCase() === team.shortName.toLowerCase()
                );
                if (standing) {
                  return { ...team, wins: standing.wins, losses: standing.losses };
                }
                return team;
              })
            );
          }
          if (data.meta) {
            setMeta(data.meta);
          }
        }
      } catch {
        // Records are optional enhancement
      }
    }
    fetchRecords();
  }, []);

  // Apply league filter and search
  const query = searchQuery.toLowerCase().trim();
  const filteredTeams = teams.filter((t) => {
    if (selectedLeague !== 'all' && t.league !== selectedLeague) return false;
    if (query) {
      return (
        t.name.toLowerCase().includes(query) ||
        t.city.toLowerCase().includes(query) ||
        t.abbreviation.toLowerCase().includes(query) ||
        t.shortName.toLowerCase().includes(query) ||
        t.venue.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group by division
  const teamsByDivision: Record<string, TeamWithRecord[]> = {};
  filteredTeams.forEach((team) => {
    const key = `${team.league} ${team.division}`;
    if (!teamsByDivision[key]) teamsByDivision[key] = [];
    teamsByDivision[key].push(team);
  });

  const divisionOrder =
    selectedLeague === 'NL'
      ? DIVISION_ORDER.filter((d) => d.startsWith('NL'))
      : selectedLeague === 'AL'
        ? DIVISION_ORDER.filter((d) => d.startsWith('AL'))
        : DIVISION_ORDER;

  const hasResults = filteredTeams.length > 0;

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                MLB
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
                30 Teams
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                MLB Teams
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Browse all 30 Major League Baseball teams. View rosters, schedules, statistics, and
                depth charts.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* League Filter, Search & Teams Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* Search + League Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <svg
                  viewBox="0 0 24 24"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams, cities, venues..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-tertiary border border-border-subtle text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-burnt-orange transition-colors"
                />
              </div>

              {/* League Filter */}
              <div className="flex gap-2">
                {(['all', 'AL', 'NL'] as const).map((league) => (
                  <button
                    key={league}
                    onClick={() => setSelectedLeague(league)}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      selectedLeague === league
                        ? 'bg-burnt-orange text-white'
                        : 'bg-background-tertiary text-text-secondary hover:bg-surface-light hover:text-text-primary'
                    }`}
                  >
                    {league === 'all'
                      ? 'All Teams'
                      : league === 'AL'
                        ? 'American League'
                        : 'National League'}
                  </button>
                ))}
              </div>
            </div>

            {/* Teams by Division */}
            {hasResults ? (
              divisionOrder.map((division) => {
                const divTeams = teamsByDivision[division];
                if (!divTeams?.length) return null;

                return (
                  <div key={division} className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-burnt-orange"
                        fill="currentColor"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      {division}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {divTeams.map((team) => (
                        <ScrollReveal key={team.id}>
                          <TeamCard team={team} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 mx-auto text-text-tertiary mb-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <p className="text-text-secondary text-lg mb-2">No teams found</p>
                <p className="text-text-tertiary text-sm">
                  Try a different search term or clear your filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLeague('all');
                  }}
                  className="mt-4 px-4 py-2 text-sm text-burnt-orange hover:text-text-primary transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'MLB Stats API'}
                timestamp={displayTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}

// ── TeamCard ────────────────────────────────────────────────────────────────

function TeamCard({ team }: { team: TeamWithRecord }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <Link href={`/mlb/teams/${team.slug}`} className="block group">
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          {/* Team Logo */}
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform"
            style={{ backgroundColor: team.primaryColor }}
          >
            {logoError ? (
              <span className="text-xl font-bold text-white">{team.abbreviation}</span>
            ) : (
              <Image
                src={getLogoUrl(team.abbreviation)}
                alt={`${team.city} ${team.name} logo`}
                width={56}
                height={56}
                className="object-contain p-1"
                onError={() => setLogoError(true)}
                unoptimized
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary group-hover:text-burnt-orange transition-colors truncate">
              {team.city} {team.name}
            </p>
            <p className="text-xs text-text-tertiary">
              {team.league} {team.division}
              {team.venue && <span className="ml-1 text-text-tertiary/60">&middot; {team.venue}</span>}
            </p>
            {team.wins !== undefined && (
              <p className="text-sm text-text-secondary mt-1 font-mono">
                {team.wins}-{team.losses}
              </p>
            )}
          </div>

          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-text-tertiary group-hover:text-burnt-orange transition-colors flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
