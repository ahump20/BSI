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

interface Player {
  id: string;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamColor?: string;
  teamLogo?: string;
  headshot?: string;
}

interface NBATeam {
  id: string;
  name: string;
  abbreviation: string;
  color?: string;
  logos?: Array<{ href: string }>;
}

interface TeamRosterResponse {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    color?: string;
    logos?: Array<{ href: string }>;
  };
  roster: Array<{
    id: string;
    name: string;
    jersey: string;
    position: string;
    height: string;
    weight: string;
  }>;
}

interface TeamsResponse {
  teams: NBATeam[];
}

const positions = ['All', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'];

function formatTimestamp(): string {
  const date = new Date();
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
  const teamColor = player.teamColor ? `#${player.teamColor}` : '#BF5700';

  return (
    <Link href={`/nba/players/${player.id}`}>
      <Card
        variant="hover"
        padding="md"
        className="h-full transition-all duration-300 hover:scale-[1.02] group"
        style={{ borderColor: teamColor, borderLeftWidth: '4px' }}
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
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: teamColor, color: '#fff' }}
              >
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
              {player.teamLogo && (
                <Image
                  src={player.teamLogo}
                  alt={player.teamName}
                  width={16}
                  height={16}
                  className="object-contain"
                  unoptimized
                />
              )}
              <span className="text-xs text-text-tertiary">{player.teamName}</span>
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

export default function NBAPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [teams, setTeams] = useState<NBATeam[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, get all teams
      const teamsRes = await fetch('/api/nba/teams');
      if (!teamsRes.ok) {
        throw new Error(`Failed to fetch teams: ${teamsRes.status}`);
      }
      const teamsData: TeamsResponse = await teamsRes.json();
      setTeams(teamsData.teams || []);

      // Then fetch rosters for each team in parallel (batch of 5 at a time to avoid rate limiting)
      const allPlayers: Player[] = [];
      const teamBatches = [];
      for (let i = 0; i < teamsData.teams.length; i += 5) {
        teamBatches.push(teamsData.teams.slice(i, i + 5));
      }

      for (const batch of teamBatches) {
        const rosterPromises = batch.map(async (team) => {
          try {
            const res = await fetch(`/api/nba/teams/${team.id}`);
            if (!res.ok) return [];
            const data: TeamRosterResponse = await res.json();
            return (data.roster || []).map((p) => ({
              ...p,
              teamId: team.id,
              teamName: team.name,
              teamAbbreviation: team.abbreviation,
              teamColor: team.color,
              teamLogo: team.logos?.[0]?.href,
            }));
          } catch {
            return [];
          }
        });

        const results = await Promise.all(rosterPromises);
        results.forEach((roster) => allPlayers.push(...roster));
      }

      setPlayers(allPlayers);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        const matchesSearch =
          searchQuery === '' ||
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.teamName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPosition =
          selectedPosition === 'All' || player.position === selectedPosition;

        const matchesTeam =
          selectedTeam === 'All' || player.teamId === selectedTeam;

        return matchesSearch && matchesPosition && matchesTeam;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, searchQuery, selectedPosition, selectedTeam]);

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
              <span className="text-white font-medium">Players</span>
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
                NBA Players
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2">
                Browse and search all NBA players • Click any player for full profile
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
                  {teams
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
                  onClick={fetchPlayers}
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
                  <div className="text-6xl mb-4">🏀</div>
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
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Live Scores →
              </Link>
              <Link
                href="/nba/standings"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Standings →
              </Link>
              <Link
                href="/nba/teams"
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
