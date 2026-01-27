'use client';

/**
 * NBA Teams Page
 *
 * Browse all 30 NBA teams with conference filtering.
 *
 * Last Updated: 2025-01-26
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { TeamLogo } from '@/components/ui/TeamLogo';

const ScrollReveal = dynamic(
  () => import('@/components/cinematic/ScrollReveal').then((mod) => mod.ScrollReveal),
  { ssr: false }
);

interface NBATeam {
  id: string;
  name: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  primaryColor: string;
  wins?: number;
  losses?: number;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

// All 30 NBA teams with their divisions
const NBA_TEAMS: NBATeam[] = [
  // Eastern Conference - Atlantic
  {
    id: 'bos',
    name: 'Boston Celtics',
    abbreviation: 'BOS',
    conference: 'Eastern',
    division: 'Atlantic',
    primaryColor: '#007A33',
  },
  {
    id: 'bkn',
    name: 'Brooklyn Nets',
    abbreviation: 'BKN',
    conference: 'Eastern',
    division: 'Atlantic',
    primaryColor: '#000000',
  },
  {
    id: 'nyk',
    name: 'New York Knicks',
    abbreviation: 'NYK',
    conference: 'Eastern',
    division: 'Atlantic',
    primaryColor: '#006BB6',
  },
  {
    id: 'phi',
    name: 'Philadelphia 76ers',
    abbreviation: 'PHI',
    conference: 'Eastern',
    division: 'Atlantic',
    primaryColor: '#006BB6',
  },
  {
    id: 'tor',
    name: 'Toronto Raptors',
    abbreviation: 'TOR',
    conference: 'Eastern',
    division: 'Atlantic',
    primaryColor: '#CE1141',
  },
  // Eastern Conference - Central
  {
    id: 'chi',
    name: 'Chicago Bulls',
    abbreviation: 'CHI',
    conference: 'Eastern',
    division: 'Central',
    primaryColor: '#CE1141',
  },
  {
    id: 'cle',
    name: 'Cleveland Cavaliers',
    abbreviation: 'CLE',
    conference: 'Eastern',
    division: 'Central',
    primaryColor: '#860038',
  },
  {
    id: 'det',
    name: 'Detroit Pistons',
    abbreviation: 'DET',
    conference: 'Eastern',
    division: 'Central',
    primaryColor: '#C8102E',
  },
  {
    id: 'ind',
    name: 'Indiana Pacers',
    abbreviation: 'IND',
    conference: 'Eastern',
    division: 'Central',
    primaryColor: '#002D62',
  },
  {
    id: 'mil',
    name: 'Milwaukee Bucks',
    abbreviation: 'MIL',
    conference: 'Eastern',
    division: 'Central',
    primaryColor: '#00471B',
  },
  // Eastern Conference - Southeast
  {
    id: 'atl',
    name: 'Atlanta Hawks',
    abbreviation: 'ATL',
    conference: 'Eastern',
    division: 'Southeast',
    primaryColor: '#E03A3E',
  },
  {
    id: 'cha',
    name: 'Charlotte Hornets',
    abbreviation: 'CHA',
    conference: 'Eastern',
    division: 'Southeast',
    primaryColor: '#1D1160',
  },
  {
    id: 'mia',
    name: 'Miami Heat',
    abbreviation: 'MIA',
    conference: 'Eastern',
    division: 'Southeast',
    primaryColor: '#98002E',
  },
  {
    id: 'orl',
    name: 'Orlando Magic',
    abbreviation: 'ORL',
    conference: 'Eastern',
    division: 'Southeast',
    primaryColor: '#0077C0',
  },
  {
    id: 'was',
    name: 'Washington Wizards',
    abbreviation: 'WAS',
    conference: 'Eastern',
    division: 'Southeast',
    primaryColor: '#002B5C',
  },
  // Western Conference - Northwest
  {
    id: 'den',
    name: 'Denver Nuggets',
    abbreviation: 'DEN',
    conference: 'Western',
    division: 'Northwest',
    primaryColor: '#0E2240',
  },
  {
    id: 'min',
    name: 'Minnesota Timberwolves',
    abbreviation: 'MIN',
    conference: 'Western',
    division: 'Northwest',
    primaryColor: '#0C2340',
  },
  {
    id: 'okc',
    name: 'Oklahoma City Thunder',
    abbreviation: 'OKC',
    conference: 'Western',
    division: 'Northwest',
    primaryColor: '#007AC1',
  },
  {
    id: 'por',
    name: 'Portland Trail Blazers',
    abbreviation: 'POR',
    conference: 'Western',
    division: 'Northwest',
    primaryColor: '#E03A3E',
  },
  {
    id: 'uta',
    name: 'Utah Jazz',
    abbreviation: 'UTA',
    conference: 'Western',
    division: 'Northwest',
    primaryColor: '#002B5C',
  },
  // Western Conference - Pacific
  {
    id: 'gsw',
    name: 'Golden State Warriors',
    abbreviation: 'GSW',
    conference: 'Western',
    division: 'Pacific',
    primaryColor: '#1D428A',
  },
  {
    id: 'lac',
    name: 'Los Angeles Clippers',
    abbreviation: 'LAC',
    conference: 'Western',
    division: 'Pacific',
    primaryColor: '#C8102E',
  },
  {
    id: 'lal',
    name: 'Los Angeles Lakers',
    abbreviation: 'LAL',
    conference: 'Western',
    division: 'Pacific',
    primaryColor: '#552583',
  },
  {
    id: 'phx',
    name: 'Phoenix Suns',
    abbreviation: 'PHX',
    conference: 'Western',
    division: 'Pacific',
    primaryColor: '#1D1160',
  },
  {
    id: 'sac',
    name: 'Sacramento Kings',
    abbreviation: 'SAC',
    conference: 'Western',
    division: 'Pacific',
    primaryColor: '#5A2D81',
  },
  // Western Conference - Southwest
  {
    id: 'dal',
    name: 'Dallas Mavericks',
    abbreviation: 'DAL',
    conference: 'Western',
    division: 'Southwest',
    primaryColor: '#00538C',
  },
  {
    id: 'hou',
    name: 'Houston Rockets',
    abbreviation: 'HOU',
    conference: 'Western',
    division: 'Southwest',
    primaryColor: '#CE1141',
  },
  {
    id: 'mem',
    name: 'Memphis Grizzlies',
    abbreviation: 'MEM',
    conference: 'Western',
    division: 'Southwest',
    primaryColor: '#5D76A9',
  },
  {
    id: 'nop',
    name: 'New Orleans Pelicans',
    abbreviation: 'NOP',
    conference: 'Western',
    division: 'Southwest',
    primaryColor: '#0C2340',
  },
  {
    id: 'sas',
    name: 'San Antonio Spurs',
    abbreviation: 'SAS',
    conference: 'Western',
    division: 'Southwest',
    primaryColor: '#C4CED4',
  },
];

const DIVISION_ORDER = [
  'Eastern Atlantic',
  'Eastern Central',
  'Eastern Southeast',
  'Western Northwest',
  'Western Pacific',
  'Western Southwest',
];

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

export default function NBATeamsPage() {
  const [teams, setTeams] = useState<NBATeam[]>(NBA_TEAMS);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [selectedConference, setSelectedConference] = useState<'all' | 'Eastern' | 'Western'>(
    'all'
  );

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch('/api/nba/standings');
        if (res.ok) {
          const data = (await res.json()) as {
            standings?: Array<{
              name: string;
              teams: Array<{ abbreviation: string; wins: number; losses: number }>;
            }>;
            meta?: DataMeta;
          };
          if (data.standings) {
            const teamRecords: Record<string, { wins: number; losses: number }> = {};
            data.standings.forEach((conf) => {
              conf.teams.forEach((t) => {
                teamRecords[t.abbreviation] = { wins: t.wins, losses: t.losses };
              });
            });
            setTeams((prev) =>
              prev.map((team) => {
                const record = teamRecords[team.abbreviation];
                if (record) {
                  return { ...team, wins: record.wins, losses: record.losses };
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
        // Silently fail
      }
    }
    fetchRecords();
  }, []);

  const filteredTeams =
    selectedConference === 'all' ? teams : teams.filter((t) => t.conference === selectedConference);

  const teamsByDivision: Record<string, NBATeam[]> = {};
  filteredTeams.forEach((team) => {
    const key = `${team.conference} ${team.division}`;
    if (!teamsByDivision[key]) teamsByDivision[key] = [];
    teamsByDivision[key].push(team);
  });

  const divisionOrder =
    selectedConference === 'Western'
      ? DIVISION_ORDER.filter((d) => d.startsWith('Western'))
      : selectedConference === 'Eastern'
        ? DIVISION_ORDER.filter((d) => d.startsWith('Eastern'))
        : DIVISION_ORDER;

  const TeamCard = ({ team }: { team: NBATeam }) => (
    <Link href={`/nba/teams/${team.id}`} className="block group">
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          <TeamLogo abbreviation={team.abbreviation} sport="nba" size="lg" />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white group-hover:text-burnt-orange transition-colors truncate">
              {team.name}
            </p>
            <p className="text-xs text-text-tertiary">
              {team.conference} - {team.division}
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
              <span className="text-white font-medium">Teams</span>
            </nav>
          </Container>
        </Section>

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
                NBA Teams
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Browse all 30 NBA teams. View rosters, schedules, statistics, and team news.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-8">
              {(['all', 'Eastern', 'Western'] as const).map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    selectedConference === conf
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {conf === 'all'
                    ? 'All Teams'
                    : conf === 'Eastern'
                      ? 'Eastern Conference'
                      : 'Western Conference'}
                </button>
              ))}
            </div>

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

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source={meta?.dataSource || 'NBA.com / ESPN'}
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
