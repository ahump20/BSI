'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

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
  abbreviation: string;
  division: string;
  league: string;
  wins?: number;
  losses?: number;
  venue?: string;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

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

// MLB Teams data (static, doesn't need API call)
const mlbTeams: Team[] = [
  // AL East
  { id: 'bal', name: 'Baltimore Orioles', abbreviation: 'BAL', division: 'East', league: 'AL' },
  { id: 'bos', name: 'Boston Red Sox', abbreviation: 'BOS', division: 'East', league: 'AL' },
  { id: 'nyy', name: 'New York Yankees', abbreviation: 'NYY', division: 'East', league: 'AL' },
  { id: 'tb', name: 'Tampa Bay Rays', abbreviation: 'TB', division: 'East', league: 'AL' },
  { id: 'tor', name: 'Toronto Blue Jays', abbreviation: 'TOR', division: 'East', league: 'AL' },
  // AL Central
  { id: 'cws', name: 'Chicago White Sox', abbreviation: 'CWS', division: 'Central', league: 'AL' },
  {
    id: 'cle',
    name: 'Cleveland Guardians',
    abbreviation: 'CLE',
    division: 'Central',
    league: 'AL',
  },
  { id: 'det', name: 'Detroit Tigers', abbreviation: 'DET', division: 'Central', league: 'AL' },
  { id: 'kc', name: 'Kansas City Royals', abbreviation: 'KC', division: 'Central', league: 'AL' },
  { id: 'min', name: 'Minnesota Twins', abbreviation: 'MIN', division: 'Central', league: 'AL' },
  // AL West
  { id: 'hou', name: 'Houston Astros', abbreviation: 'HOU', division: 'West', league: 'AL' },
  { id: 'laa', name: 'Los Angeles Angels', abbreviation: 'LAA', division: 'West', league: 'AL' },
  { id: 'oak', name: 'Oakland Athletics', abbreviation: 'OAK', division: 'West', league: 'AL' },
  { id: 'sea', name: 'Seattle Mariners', abbreviation: 'SEA', division: 'West', league: 'AL' },
  { id: 'tex', name: 'Texas Rangers', abbreviation: 'TEX', division: 'West', league: 'AL' },
  // NL East
  { id: 'atl', name: 'Atlanta Braves', abbreviation: 'ATL', division: 'East', league: 'NL' },
  { id: 'mia', name: 'Miami Marlins', abbreviation: 'MIA', division: 'East', league: 'NL' },
  { id: 'nym', name: 'New York Mets', abbreviation: 'NYM', division: 'East', league: 'NL' },
  { id: 'phi', name: 'Philadelphia Phillies', abbreviation: 'PHI', division: 'East', league: 'NL' },
  { id: 'wsh', name: 'Washington Nationals', abbreviation: 'WSH', division: 'East', league: 'NL' },
  // NL Central
  { id: 'chc', name: 'Chicago Cubs', abbreviation: 'CHC', division: 'Central', league: 'NL' },
  { id: 'cin', name: 'Cincinnati Reds', abbreviation: 'CIN', division: 'Central', league: 'NL' },
  { id: 'mil', name: 'Milwaukee Brewers', abbreviation: 'MIL', division: 'Central', league: 'NL' },
  { id: 'pit', name: 'Pittsburgh Pirates', abbreviation: 'PIT', division: 'Central', league: 'NL' },
  {
    id: 'stl',
    name: 'St. Louis Cardinals',
    abbreviation: 'STL',
    division: 'Central',
    league: 'NL',
  },
  // NL West
  { id: 'ari', name: 'Arizona Diamondbacks', abbreviation: 'ARI', division: 'West', league: 'NL' },
  { id: 'col', name: 'Colorado Rockies', abbreviation: 'COL', division: 'West', league: 'NL' },
  { id: 'lad', name: 'Los Angeles Dodgers', abbreviation: 'LAD', division: 'West', league: 'NL' },
  { id: 'sd', name: 'San Diego Padres', abbreviation: 'SD', division: 'West', league: 'NL' },
  { id: 'sf', name: 'San Francisco Giants', abbreviation: 'SF', division: 'West', league: 'NL' },
];

export default function MLBTeamsPage() {
  const [teams, setTeams] = useState<Team[]>(mlbTeams);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<'all' | 'AL' | 'NL'>('all');

  // Optionally fetch team records
  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch('/api/mlb/standings');
        if (res.ok) {
          const data = await res.json();
          if (data.standings) {
            // Merge records into teams
            setTeams((prev) =>
              prev.map((team) => {
                const standing = data.standings.find((s: { teamName: string }) =>
                  s.teamName.includes(team.name.split(' ').pop() || '')
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
        // Silently fail, records are optional
      }
    }
    fetchRecords();
  }, []);

  const filteredTeams =
    selectedLeague === 'all' ? teams : teams.filter((t) => t.league === selectedLeague);

  // Group by division
  const teamsByDivision: Record<string, Team[]> = {};
  filteredTeams.forEach((team) => {
    const key = `${team.league} ${team.division}`;
    if (!teamsByDivision[key]) teamsByDivision[key] = [];
    teamsByDivision[key].push(team);
  });

  const divisionOrder =
    selectedLeague === 'NL'
      ? ['NL East', 'NL Central', 'NL West']
      : selectedLeague === 'AL'
        ? ['AL East', 'AL Central', 'AL West']
        : ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

  const TeamCard = ({ team }: { team: Team }) => (
    <Link href={`/mlb/teams/${team.id}`} className="block group">
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          {/* Team Logo Placeholder */}
          <div className="w-16 h-16 bg-charcoal rounded-lg flex items-center justify-center text-xl font-bold text-burnt-orange group-hover:bg-burnt-orange/10 transition-colors">
            {team.abbreviation}
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
      <Navbar items={navItems} />

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
                timestamp={formatTimestamp(meta?.lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
