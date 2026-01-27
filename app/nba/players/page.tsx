'use client';

/**
 * NBA Players Directory
 *
 * Browse and search NBA players with stat filters.
 *
 * Last Updated: 2025-01-26
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { Skeleton } from '@/components/ui/Skeleton';

const ScrollReveal = dynamic(
  () => import('@/components/cinematic/ScrollReveal').then((mod) => mod.ScrollReveal),
  { ssr: false }
);

interface NBAPlayer {
  id: string;
  name: string;
  team: string;
  teamAbbr: string;
  position: string;
  ppg: number;
  rpg: number;
  apg: number;
  jersey?: string;
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type SortOption = 'ppg' | 'rpg' | 'apg' | 'name';

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

// Placeholder players for display
const PLACEHOLDER_PLAYERS: NBAPlayer[] = [
  {
    id: '1',
    name: 'Luka Doncic',
    team: 'Dallas Mavericks',
    teamAbbr: 'DAL',
    position: 'PG',
    ppg: 33.9,
    rpg: 9.2,
    apg: 9.8,
    jersey: '77',
  },
  {
    id: '2',
    name: 'Giannis Antetokounmpo',
    team: 'Milwaukee Bucks',
    teamAbbr: 'MIL',
    position: 'PF',
    ppg: 31.1,
    rpg: 11.6,
    apg: 5.8,
    jersey: '34',
  },
  {
    id: '3',
    name: 'Shai Gilgeous-Alexander',
    team: 'Oklahoma City Thunder',
    teamAbbr: 'OKC',
    position: 'SG',
    ppg: 30.8,
    rpg: 5.5,
    apg: 6.2,
    jersey: '2',
  },
  {
    id: '4',
    name: 'Joel Embiid',
    team: 'Philadelphia 76ers',
    teamAbbr: 'PHI',
    position: 'C',
    ppg: 29.5,
    rpg: 11.0,
    apg: 5.2,
    jersey: '21',
  },
  {
    id: '5',
    name: 'Kevin Durant',
    team: 'Phoenix Suns',
    teamAbbr: 'PHX',
    position: 'SF',
    ppg: 28.3,
    rpg: 6.5,
    apg: 5.1,
    jersey: '35',
  },
  {
    id: '6',
    name: 'Jayson Tatum',
    team: 'Boston Celtics',
    teamAbbr: 'BOS',
    position: 'SF',
    ppg: 27.8,
    rpg: 8.4,
    apg: 4.6,
    jersey: '0',
  },
  {
    id: '7',
    name: 'Anthony Edwards',
    team: 'Minnesota Timberwolves',
    teamAbbr: 'MIN',
    position: 'SG',
    ppg: 27.2,
    rpg: 5.8,
    apg: 5.4,
    jersey: '5',
  },
  {
    id: '8',
    name: 'Donovan Mitchell',
    team: 'Cleveland Cavaliers',
    teamAbbr: 'CLE',
    position: 'SG',
    ppg: 26.5,
    rpg: 4.2,
    apg: 5.8,
    jersey: '45',
  },
  {
    id: '9',
    name: "De'Aaron Fox",
    team: 'Sacramento Kings',
    teamAbbr: 'SAC',
    position: 'PG',
    ppg: 26.1,
    rpg: 4.6,
    apg: 6.1,
    jersey: '5',
  },
  {
    id: '10',
    name: 'Ja Morant',
    team: 'Memphis Grizzlies',
    teamAbbr: 'MEM',
    position: 'PG',
    ppg: 25.9,
    rpg: 5.6,
    apg: 8.1,
    jersey: '12',
  },
  {
    id: '11',
    name: 'LeBron James',
    team: 'Los Angeles Lakers',
    teamAbbr: 'LAL',
    position: 'SF',
    ppg: 25.7,
    rpg: 7.3,
    apg: 8.3,
    jersey: '23',
  },
  {
    id: '12',
    name: 'Stephen Curry',
    team: 'Golden State Warriors',
    teamAbbr: 'GSW',
    position: 'PG',
    ppg: 25.4,
    rpg: 4.5,
    apg: 5.1,
    jersey: '30',
  },
  {
    id: '13',
    name: 'Tyrese Haliburton',
    team: 'Indiana Pacers',
    teamAbbr: 'IND',
    position: 'PG',
    ppg: 23.8,
    rpg: 3.9,
    apg: 10.9,
    jersey: '0',
  },
  {
    id: '14',
    name: 'Kawhi Leonard',
    team: 'Los Angeles Clippers',
    teamAbbr: 'LAC',
    position: 'SF',
    ppg: 23.7,
    rpg: 6.1,
    apg: 3.6,
    jersey: '2',
  },
  {
    id: '15',
    name: 'Nikola Jokic',
    team: 'Denver Nuggets',
    teamAbbr: 'DEN',
    position: 'C',
    ppg: 26.4,
    rpg: 12.4,
    apg: 9.0,
    jersey: '15',
  },
  {
    id: '16',
    name: 'Devin Booker',
    team: 'Phoenix Suns',
    teamAbbr: 'PHX',
    position: 'SG',
    ppg: 27.1,
    rpg: 4.5,
    apg: 6.9,
    jersey: '1',
  },
  {
    id: '17',
    name: 'Trae Young',
    team: 'Atlanta Hawks',
    teamAbbr: 'ATL',
    position: 'PG',
    ppg: 25.3,
    rpg: 2.8,
    apg: 10.8,
    jersey: '11',
  },
  {
    id: '18',
    name: 'Jimmy Butler',
    team: 'Miami Heat',
    teamAbbr: 'MIA',
    position: 'SF',
    ppg: 20.8,
    rpg: 5.3,
    apg: 5.0,
    jersey: '22',
  },
  {
    id: '19',
    name: 'Jalen Brunson',
    team: 'New York Knicks',
    teamAbbr: 'NYK',
    position: 'PG',
    ppg: 28.7,
    rpg: 3.6,
    apg: 6.7,
    jersey: '11',
  },
  {
    id: '20',
    name: 'Paolo Banchero',
    team: 'Orlando Magic',
    teamAbbr: 'ORL',
    position: 'PF',
    ppg: 22.6,
    rpg: 6.9,
    apg: 5.4,
    jersey: '5',
  },
];

const POSITIONS = ['All', 'PG', 'SG', 'SF', 'PF', 'C'];

export default function NBAPlayersPage() {
  const [players, setPlayers] = useState<NBAPlayer[]>(PLACEHOLDER_PLAYERS);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('ppg');
  const [positionFilter, setPositionFilter] = useState('All');
  const [usingPlaceholder, setUsingPlaceholder] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      try {
        const res = await fetch('/api/nba/players');
        if (res.ok) {
          const data = (await res.json()) as { players?: NBAPlayer[]; meta?: DataMeta };
          if (data.players && data.players.length > 0) {
            setPlayers(data.players);
            setUsingPlaceholder(false);
          }
          if (data.meta) {
            setMeta(data.meta);
          }
        }
      } catch {
        // Use placeholder data
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q) ||
          p.teamAbbr.toLowerCase().includes(q)
      );
    }

    // Position filter
    if (positionFilter !== 'All') {
      result = result.filter((p) => p.position === positionFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b[sortBy] - a[sortBy];
    });

    return result;
  }, [players, search, sortBy, positionFilter]);

  const PlayerCard = ({ player }: { player: NBAPlayer }) => (
    <Link href={`/nba/players/${player.id}`} className="block group">
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          <TeamLogo abbreviation={player.teamAbbr} sport="nba" size="md" />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white group-hover:text-burnt-orange transition-colors truncate">
              {player.name}
            </p>
            <p className="text-xs text-text-tertiary">
              {player.team} • {player.position}
              {player.jersey && ` • #${player.jersey}`}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-burnt-orange font-mono">{player.ppg.toFixed(1)}</p>
            <p className="text-xs text-text-tertiary">PPG</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between text-sm">
          <div className="text-center">
            <p className="font-mono text-white">{player.rpg.toFixed(1)}</p>
            <p className="text-xs text-text-tertiary">RPG</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-white">{player.apg.toFixed(1)}</p>
            <p className="text-xs text-text-tertiary">APG</p>
          </div>
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
              <span className="text-white font-medium">Players</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                2024-25 Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                NBA Players
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Browse NBA players by stats, position, and team. Updated throughout the season.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {usingPlaceholder && (
              <Card variant="default" padding="md" className="mb-6 bg-info/10 border-info/30">
                <p className="text-info font-semibold">Sample Data</p>
                <p className="text-text-secondary text-sm mt-1">
                  Showing representative player data. Live stats update during the active NBA
                  season.
                </p>
              </Card>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21L16.65 16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search players or teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-graphite border border-border-subtle rounded-lg text-white placeholder:text-text-tertiary focus:outline-none focus:border-burnt-orange"
                  />
                </div>
              </div>

              {/* Position Filter */}
              <div className="flex gap-2 flex-wrap">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      positionFilter === pos
                        ? 'bg-burnt-orange text-white'
                        : 'bg-graphite text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-3 bg-graphite border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange"
              >
                <option value="ppg">Sort by PPG</option>
                <option value="rpg">Sort by RPG</option>
                <option value="apg">Sort by APG</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            {/* Results count */}
            <p className="text-text-tertiary text-sm mb-4">
              Showing {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
            </p>

            {/* Players Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} variant="default" padding="md">
                    <div className="flex items-center gap-4">
                      <Skeleton variant="rect" width={48} height={48} className="rounded-lg" />
                      <div className="flex-1">
                        <Skeleton variant="text" width={150} height={18} />
                        <Skeleton variant="text" width={100} height={14} className="mt-1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21L16.65 16.65" />
                </svg>
                <p className="text-text-secondary">No players found matching your search</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setPositionFilter('All');
                  }}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Clear Filters
                </button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.map((player) => (
                  <ScrollReveal key={player.id}>
                    <PlayerCard player={player} />
                  </ScrollReveal>
                ))}
              </div>
            )}

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
