'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp } from '@/lib/utils/timezone';

interface Player {
  id: string;
  name: string;
  jersey: string;
  position: string;
  positionFull?: string;
  height: string;
  weight: string;
  experience?: string;
  college?: string;
  headshot?: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
}

interface PlayersResponse {
  timestamp: string;
  players: Player[];
  meta: {
    dataSource: string;
    lastUpdated: string;
    totalPlayers: number;
  };
}

interface RosterResponse {
  timestamp: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  players: Player[];
  meta: {
    dataSource: string;
    lastUpdated: string;
    totalPlayers: number;
  };
}

// NFL position groups
const positions = ['All', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];

// All 32 NFL teams
const nflTeams = [
  { id: '22', name: 'Arizona Cardinals', abbreviation: 'ARI' },
  { id: '1', name: 'Atlanta Falcons', abbreviation: 'ATL' },
  { id: '33', name: 'Baltimore Ravens', abbreviation: 'BAL' },
  { id: '2', name: 'Buffalo Bills', abbreviation: 'BUF' },
  { id: '29', name: 'Carolina Panthers', abbreviation: 'CAR' },
  { id: '3', name: 'Chicago Bears', abbreviation: 'CHI' },
  { id: '4', name: 'Cincinnati Bengals', abbreviation: 'CIN' },
  { id: '5', name: 'Cleveland Browns', abbreviation: 'CLE' },
  { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL' },
  { id: '7', name: 'Denver Broncos', abbreviation: 'DEN' },
  { id: '8', name: 'Detroit Lions', abbreviation: 'DET' },
  { id: '9', name: 'Green Bay Packers', abbreviation: 'GB' },
  { id: '34', name: 'Houston Texans', abbreviation: 'HOU' },
  { id: '11', name: 'Indianapolis Colts', abbreviation: 'IND' },
  { id: '30', name: 'Jacksonville Jaguars', abbreviation: 'JAX' },
  { id: '12', name: 'Kansas City Chiefs', abbreviation: 'KC' },
  { id: '13', name: 'Las Vegas Raiders', abbreviation: 'LV' },
  { id: '24', name: 'Los Angeles Chargers', abbreviation: 'LAC' },
  { id: '14', name: 'Los Angeles Rams', abbreviation: 'LAR' },
  { id: '15', name: 'Miami Dolphins', abbreviation: 'MIA' },
  { id: '16', name: 'Minnesota Vikings', abbreviation: 'MIN' },
  { id: '17', name: 'New England Patriots', abbreviation: 'NE' },
  { id: '18', name: 'New Orleans Saints', abbreviation: 'NO' },
  { id: '19', name: 'New York Giants', abbreviation: 'NYG' },
  { id: '20', name: 'New York Jets', abbreviation: 'NYJ' },
  { id: '21', name: 'Philadelphia Eagles', abbreviation: 'PHI' },
  { id: '23', name: 'Pittsburgh Steelers', abbreviation: 'PIT' },
  { id: '25', name: 'San Francisco 49ers', abbreviation: 'SF' },
  { id: '26', name: 'Seattle Seahawks', abbreviation: 'SEA' },
  { id: '27', name: 'Tampa Bay Buccaneers', abbreviation: 'TB' },
  { id: '10', name: 'Tennessee Titans', abbreviation: 'TEN' },
  { id: '28', name: 'Washington Commanders', abbreviation: 'WSH' },
];


function SkeletonPlayerCard() {
  return (
    <Card variant="default" padding="md" className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-graphite rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-graphite rounded w-3/4" />
          <div className="h-4 bg-graphite/50 rounded w-1/2" />
          <div className="h-3 bg-graphite/30 rounded w-1/3" />
        </div>
      </div>
    </Card>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <Link href={`/nfl/players/${player.id}`}>
      <Card
        variant="hover"
        padding="md"
        className="h-full transition-all duration-300 hover:scale-[1.02] group"
        style={{ borderColor: '#013369', borderLeftWidth: '4px' }}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            {player.headshot ? (
              <Image
                src={player.headshot}
                alt={player.name}
                fill
                className="object-cover rounded-full"
                sizes="64px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold bg-[#013369] text-white">
                #{player.jersey || '?'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-lg truncate group-hover:text-burnt-orange transition-colors">
              {player.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>#{player.jersey}</span>
              <span>•</span>
              <span>{player.position}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {player.team?.logo && (
                <Image
                  src={player.team.logo}
                  alt={player.team.name}
                  width={16}
                  height={16}
                  className="object-contain"
                  unoptimized
                />
              )}
              <span className="text-xs text-text-tertiary">{player.team?.name}</span>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-text-secondary text-sm">{player.height}</p>
            <p className="text-text-tertiary text-xs">{player.weight} lbs</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// NFL season spans Sep–Feb; in Jan/Feb it's still the prior year's season
const nflSeasonYear = new Date().getMonth() <= 1 ? new Date().getFullYear() - 1 : new Date().getFullYear();

export default function NFLPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch players from our API (which fetches from multiple teams)
      const res = await fetch('/api/nfl/players?limit=200');
      if (!res.ok) {
        throw new Error(`Failed to fetch players: ${res.status}`);
      }
      const data: PlayersResponse = await res.json();
      setPlayers(data.players || []);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamRoster = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nfl/players?teamId=${teamId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch roster: ${res.status}`);
      }
      const data: RosterResponse = await res.json();
      // Transform to match Player interface with team info
      const playersWithTeam = data.players.map((p) => ({
        ...p,
        team: data.team,
      }));
      setPlayers(playersWithTeam);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTeam === 'All') {
      fetchPlayers();
    } else {
      fetchTeamRoster(selectedTeam);
    }
  }, [selectedTeam, fetchPlayers, fetchTeamRoster]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        const matchesSearch =
          searchQuery === '' ||
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.team?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        // Handle position groups
        let matchesPosition = selectedPosition === 'All';
        if (!matchesPosition) {
          if (selectedPosition === 'OL') {
            matchesPosition = ['T', 'G', 'C', 'OT', 'OG', 'OL'].includes(player.position);
          } else if (selectedPosition === 'DL') {
            matchesPosition = ['DE', 'DT', 'NT', 'DL'].includes(player.position);
          } else if (selectedPosition === 'S') {
            matchesPosition = ['S', 'SS', 'FS'].includes(player.position);
          } else {
            matchesPosition = player.position === selectedPosition;
          }
        }

        return matchesSearch && matchesPosition;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, searchQuery, selectedPosition]);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Players</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-[#013369]/20 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                {nflSeasonYear} Season
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                NFL Players
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2">
                Browse and search NFL players • Click any player for full profile
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <input
                  type="text"
                  placeholder="Search players or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:border-burnt-orange transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Position Filter */}
                <div className="flex gap-2 flex-wrap">
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setSelectedPosition(pos)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                        selectedPosition === pos
                          ? 'bg-burnt-orange text-white'
                          : 'bg-graphite text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                {/* Team Filter */}
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-4 py-2 bg-graphite border border-border-subtle rounded-lg text-white focus:outline-none focus:border-burnt-orange transition-colors"
                >
                  <option value="All">All Teams</option>
                  {nflTeams
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </Container>
        </Section>

        {/* Players Grid */}
        <Section padding="lg" background="charcoal">
          <Container>
            {error && (
              <Card variant="default" padding="lg" className="mb-6 bg-error/10 border-error/30">
                <p className="text-error font-semibold">Error loading players</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={() =>
                    selectedTeam === 'All' ? fetchPlayers() : fetchTeamRoster(selectedTeam)
                  }
                  className="mt-3 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm hover:bg-burnt-orange/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {/* Results count */}
            {!loading && !error && (
              <p className="text-text-tertiary text-sm mb-4">
                {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
              </p>
            )}

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonPlayerCard key={i} />
                ))}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center">
                <div className="py-8">
                  <div className="text-6xl mb-4">🏈</div>
                  <p className="text-text-secondary text-lg">
                    {searchQuery || selectedPosition !== 'All' || selectedTeam !== 'All'
                      ? 'No players match your filters'
                      : 'No players found'}
                  </p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.map((player, index) => (
                  <ScrollReveal key={player.id} direction="up" delay={(index % 9) * 30}>
                    <PlayerCard player={player} />
                  </ScrollReveal>
                ))}
              </div>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="ESPN NFL API" timestamp={lastUpdated} />
            </div>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/nfl/games"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Live Scores →
              </Link>
              <Link
                href="/nfl/standings"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Standings →
              </Link>
              <Link
                href="/nfl/teams"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                All Teams →
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
