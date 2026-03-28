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

interface PlayerData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  positionFull: string;
  height: string;
  weight: string;
  age: number;
  birthDate: string;
  birthPlace: string | null;
  college: string | null;
  draft: {
    year: number;
    round: number;
    pick: number;
    team: string;
  } | null;
  experience: string;
  headshot: string | null;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string | null;
  };
}

interface SeasonStats {
  season: string;
  stats: Array<{
    name: string;
    displayName: string;
    value: string | number;
    displayValue: string;
  }>;
}

interface PlayerResponse {
  timestamp: string;
  player: PlayerData;
  seasonStats: SeasonStats;
  meta: {
    dataSource: string;
    lastUpdated: string;
  };
}


function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 bg-[var(--surface-dugout)] rounded-sm">
      <p className="text-2xl md:text-3xl font-bold text-[var(--bsi-bone)]">{value}</p>
      <p className="text-xs text-[rgba(196,184,165,0.5)] uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-48 h-48 bg-[var(--surface-dugout)] rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-[var(--surface-dugout)] rounded-sm w-2/3" />
          <div className="h-6 bg-[var(--surface-dugout)]/50 rounded-sm w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-[var(--surface-dugout)] rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlayerProfileClientProps {
  playerId: string;
}

export default function PlayerProfileClient({ playerId }: PlayerProfileClientProps) {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/nba/players/${playerId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch player: ${res.status}`);
      }

      const data: PlayerResponse = await res.json();
      setPlayer(data.player);
      setStats(data.seasonStats);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load player');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  const teamColor = 'var(--bsi-primary)'; // Default to burnt orange, could use team color if available

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
              <Link
                href="/nba/players"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                Players
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[var(--bsi-bone)] font-medium">
                {loading ? 'Loading...' : player?.name || 'Player'}
              </span>
            </nav>
          </Container>
        </Section>

        {/* Player Profile */}
        <Section padding="lg" className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${teamColor} 0%, transparent 50%)`,
            }}
          />

          <Container>
            {error && (
              <Card variant="default" padding="lg" className="mb-6 bg-error/10 border-error/30">
                <p className="text-error font-semibold">Error loading player</p>
                <p className="text-[var(--bsi-dust)] text-sm mt-1">{error}</p>
                <button
                  onClick={fetchPlayer}
                  className="mt-3 px-4 py-2 bg-[var(--bsi-primary)] text-white rounded-sm text-sm hover:bg-[var(--bsi-primary)]/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {loading ? (
              <SkeletonProfile />
            ) : player ? (
              <ScrollReveal direction="up">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Player Image */}
                  <div className="relative w-48 h-48 flex-shrink-0 mx-auto md:mx-0">
                    {player.headshot ? (
                      <Image
                        src={player.headshot}
                        alt={player.name}
                        fill
                        className="object-cover rounded-full border-4 border-[var(--bsi-primary)]"
                        sizes="192px"
                        unoptimized
                        priority
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold border-4"
                        style={{ backgroundColor: teamColor, borderColor: teamColor, color: '#fff' }}
                      >
                        #{player.jersey || '?'}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                      {player.team?.logo && (
                        <Image
                          src={player.team.logo}
                          alt={player.team.name}
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      )}
                      <Link
                        href={`/nba/teams/${player.team?.id}`}
                        className="text-[var(--bsi-dust)] hover:text-[var(--bsi-primary)] transition-colors"
                      >
                        {player.team?.name}
                      </Link>
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--bsi-bone)]">
                      {player.name}
                    </h1>

                    <div className="flex items-center gap-4 justify-center md:justify-start mt-2">
                      <Badge variant="primary">#{player.jersey}</Badge>
                      <span className="text-[var(--bsi-dust)]">{player.positionFull}</span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <StatCard label="Height" value={player.height || 'N/A'} />
                      <StatCard label="Weight" value={player.weight ? `${player.weight} lbs` : 'N/A'} />
                      <StatCard label="Age" value={player.age || 'N/A'} />
                      <StatCard label="Experience" value={player.experience || 'Rookie'} />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ) : null}
          </Container>
        </Section>

        {/* Bio & Details */}
        {player && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Personal Info */}
                <ScrollReveal direction="up">
                  <Card variant="default" padding="lg">
                    <h2 className="font-display text-xl font-bold text-[var(--bsi-bone)] mb-4">
                      Personal Information
                    </h2>
                    <dl className="space-y-3">
                      {player.birthDate && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Born</dt>
                          <dd className="text-[var(--bsi-bone)]">
                            {new Date(player.birthDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </dd>
                        </div>
                      )}
                      {player.birthPlace && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Birthplace</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.birthPlace}</dd>
                        </div>
                      )}
                      {player.college && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">College</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.college}</dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                </ScrollReveal>

                {/* Draft Info */}
                <ScrollReveal direction="up" delay={100}>
                  <Card variant="default" padding="lg">
                    <h2 className="font-display text-xl font-bold text-[var(--bsi-bone)] mb-4">
                      Draft Information
                    </h2>
                    {player.draft ? (
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Year</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.draft.year}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Round</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.draft.round}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Pick</dt>
                          <dd className="text-[var(--bsi-bone)]">#{player.draft.pick}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Team</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.draft.team}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="text-[var(--bsi-dust)]">Undrafted</p>
                    )}
                  </Card>
                </ScrollReveal>
              </div>
            </Container>
          </Section>
        )}

        {/* Season Stats */}
        {stats && stats.stats && stats.stats.length > 0 && (
          <Section padding="lg" background="midnight">
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl font-bold text-[var(--bsi-bone)] mb-6">
                  {stats.season} Season Stats
                </h2>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={100}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {stats.stats.map((stat) => (
                    <Card key={stat.name} variant="default" padding="md" className="text-center">
                      <p className="text-2xl font-bold text-[var(--bsi-primary)]">{stat.displayValue}</p>
                      <p className="text-xs text-[rgba(196,184,165,0.5)] uppercase tracking-wider mt-1">
                        {stat.displayName}
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Data Source */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <DataSourceBadge source="ESPN NBA API" timestamp={lastUpdated} />
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/nba/players"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                ← All Players
              </Link>
              {player?.team?.id && (
                <Link
                  href={`/nba/teams/${player.team.id}`}
                  className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
                >
                  {player.team.name} Roster →
                </Link>
              )}
              <Link
                href="/nba/games"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Live Scores →
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
