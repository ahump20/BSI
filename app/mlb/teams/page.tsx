'use client';

/**
 * MLB Teams Page
 *
 * Browse all 30 MLB teams with league filtering.
 * Uses centralized team data utility and user timezone preferences.
 *
 * Last Updated: 2025-01-07
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useUserSettings } from '@/lib/hooks';
import {
  MLB_TEAMS,
  getTeamsGroupedByDivision,
  DIVISION_ORDER,
  type MLBTeamInfo,
} from '@/lib/utils/mlb-teams';

interface TeamWithRecord extends MLBTeamInfo {
  wins?: number;
  losses?: number;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

export default function MLBTeamsPage() {
  const [teams, setTeams] = useState<TeamWithRecord[]>(MLB_TEAMS);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<'all' | 'AL' | 'NL'>('all');

  // User timezone for formatting
  const { formatDateTime, isLoaded: timezoneLoaded } = useUserSettings();

  // Format timestamp with user's timezone or fallback
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
            standings?: Array<{ teamName: string; wins?: number; losses?: number }>;
            meta?: DataMeta;
          };
          if (data.standings) {
            setTeams((prev) =>
              prev.map((team) => {
                const standing = data.standings?.find(
                  (s) =>
                    s.teamName.toLowerCase().includes(team.shortName.toLowerCase()) ||
                    team.name.toLowerCase().includes(s.teamName.toLowerCase())
                );
                if (standing) {
                  return {
                    ...team,
                    wins: standing.wins,
                    losses: standing.losses,
                  };
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
        // Silently fail, records are optional enhancement
      }
    }
    fetchRecords();
  }, []);

  const filteredTeams =
    selectedLeague === 'all' ? teams : teams.filter((t) => t.league === selectedLeague);

  // Group by division
  const teamsByDivision: Record<string, TeamWithRecord[]> = {};
  filteredTeams.forEach((team) => {
    const key = `${team.league} ${team.division}`;
    if (!teamsByDivision[key]) teamsByDivision[key] = [];
    teamsByDivision[key].push(team);
  });

  // Filter division order based on selected league
  const divisionOrder =
    selectedLeague === 'NL'
      ? DIVISION_ORDER.filter((d) => d.startsWith('NL'))
      : selectedLeague === 'AL'
        ? DIVISION_ORDER.filter((d) => d.startsWith('AL'))
        : DIVISION_ORDER;

  const TeamCard = ({ team }: { team: TeamWithRecord }) => (
    <Link href={`/mlb/teams/${team.slug}`} className="block group">
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          {/* Team Logo Placeholder with primary color */}
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-white group-hover:scale-105 transition-transform"
            style={{ backgroundColor: team.primaryColor }}
          >
            {team.abbrev}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white group-hover:text-burnt-orange transition-colors truncate">
              {team.name}
            </p>
            <p className="text-xs text-text-tertiary">
              {team.league} {team.division}
            </p>
            {team.wins !== undefined && (
              <p className="text-sm text-text-secondary mt-1 font-mono">
                {team.wins}-{team.losses}
              </p>
            )}
          </div>

          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-text-tertiary group-hover:text-burnt-orange transition-colors"
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

  return (
    <>
      <main id="main-content">
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
              <span className="text-white font-medium">Teams</span>
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

        {/* League Filter & Teams Grid */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {/* League Filter */}
            <div className="flex gap-2 mb-8">
              {(['all', 'AL', 'NL'] as const).map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    selectedLeague === league
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
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

            {/* Teams by Division */}
            {divisionOrder.map((division) => {
              const divTeams = teamsByDivision[division];
              if (!divTeams?.length) return null;

              return (
                <div key={division} className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
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
            })}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'MLB Stats API'}
                timestamp={displayTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
