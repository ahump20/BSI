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
  firstName?: string;
  lastName?: string;
  jersey?: string;
  position: string;
  positionFull?: string;
  height?: string;
  weight?: string;
  age?: number;
  birthDate?: string;
  birthPlace?: string | null;
  experience?: string;
  year?: string;
  hometown?: string;
  headshot?: string | null;
  team?: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string | null;
  };
}

interface SeasonStats {
  season?: string;
  stats?: Array<{
    name: string;
    displayName: string;
    value: string | number;
    displayValue: string;
  }>;
}

interface PlayerResponse {
  timestamp?: string;
  player: PlayerData;
  seasonStats?: SeasonStats;
  meta?: {
    source?: string;
    dataSource?: string;
    lastUpdated?: string;
    fetched_at?: string;
  };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 bg-graphite rounded-lg">
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-text-tertiary uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-48 h-48 bg-graphite rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-graphite rounded w-2/3" />
          <div className="h-6 bg-graphite/50 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-graphite rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CFBPlayerDetailClientProps {
  playerId: string;
}

export default function CFBPlayerDetailClient({ playerId }: CFBPlayerDetailClientProps) {
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
      const res = await fetch(`/api/cfb/players/${playerId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch player: ${res.status}`);
      }

      const data: PlayerResponse = await res.json();
      setPlayer(data.player);
      setStats(data.seasonStats || null);
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

  const teamColor = '#BF5700'; // BSI burnt-orange default for CFB

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/cfb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                CFB
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-tertiary">Players</span>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">
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
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchPlayer}
                  className="mt-3 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm hover:bg-burnt-orange/80 transition-colors"
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
                        className="object-cover rounded-full border-4 border-burnt-orange"
                        sizes="192px"
                        unoptimized
                        priority
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold border-4"
                        style={{ backgroundColor: teamColor, borderColor: '#BF5700', color: '#fff' }}
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
                      {player.team?.id ? (
                        <Link
                          href={`/cfb/teams/${player.team.id}`}
                          className="text-text-secondary hover:text-burnt-orange transition-colors"
                        >
                          {player.team?.name}
                        </Link>
                      ) : (
                        <span className="text-text-secondary">{player.team?.name || 'Unknown Team'}</span>
                      )}
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                      {player.name}
                    </h1>

                    <div className="flex items-center gap-4 justify-center md:justify-start mt-2">
                      {player.jersey && <Badge variant="primary">#{player.jersey}</Badge>}
                      <span className="text-text-secondary">
                        {player.positionFull || player.position}
                      </span>
                      {player.year && (
                        <span className="text-text-tertiary">{player.year}</span>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <StatCard label="Height" value={player.height || 'N/A'} />
                      <StatCard label="Weight" value={player.weight ? `${player.weight} lbs` : 'N/A'} />
                      {player.age ? (
                        <StatCard label="Age" value={player.age} />
                      ) : (
                        <StatCard label="Year" value={player.year || 'N/A'} />
                      )}
                      <StatCard label="Position" value={player.position || 'N/A'} />
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
                    <h2 className="font-display text-xl font-bold text-white mb-4">
                      Player Information
                    </h2>
                    <dl className="space-y-3">
                      {player.position && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary">Position</dt>
                          <dd className="text-white">{player.positionFull || player.position}</dd>
                        </div>
                      )}
                      {player.height && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary">Height</dt>
                          <dd className="text-white">{player.height}</dd>
                        </div>
                      )}
                      {player.weight && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary">Weight</dt>
                          <dd className="text-white">{player.weight} lbs</dd>
                        </div>
                      )}
                      {player.year && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary">Class</dt>
                          <dd className="text-white">{player.year}</dd>
                        </div>
                      )}
                      {player.birthDate && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary">Born</dt>
                          <dd className="text-white">
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
                          <dt className="text-text-tertiary">Hometown</dt>
                          <dd className="text-white">{player.birthPlace}</dd>
                        </div>
                      )}
                      {player.hometown && !player.birthPlace && (
                        <div className="flex justify-between">
                          <dt className="text-text-tertiary">Hometown</dt>
                          <dd className="text-white">{player.hometown}</dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                </ScrollReveal>

                {/* Team Info */}
                <ScrollReveal direction="up" delay={100}>
                  <Card variant="default" padding="lg">
                    <h2 className="font-display text-xl font-bold text-white mb-4">
                      Team
                    </h2>
                    {player.team ? (
                      <div className="flex items-center gap-4 mb-4">
                        {player.team.logo && (
                          <Image
                            src={player.team.logo}
                            alt={player.team.name}
                            width={64}
                            height={64}
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        <div>
                          <p className="text-white font-semibold text-lg">{player.team.name}</p>
                          <p className="text-text-tertiary">{player.team.abbreviation}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-text-secondary">Team information unavailable</p>
                    )}
                    {player.team?.id && (
                      <Link
                        href={`/cfb/teams/${player.team.id}`}
                        className="inline-block px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-lg hover:bg-burnt-orange/30 transition-colors mt-2"
                      >
                        View Full Roster
                      </Link>
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
                <h2 className="font-display text-2xl font-bold text-white mb-6">
                  {stats.season || 'Season'} Stats
                </h2>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={100}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {stats.stats.map((stat) => (
                    <Card key={stat.name} variant="default" padding="md" className="text-center">
                      <p className="text-2xl font-bold text-burnt-orange">{stat.displayValue}</p>
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mt-1">
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
            <DataSourceBadge source="ESPN CFB API" timestamp={lastUpdated} />
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              {player?.team?.id && (
                <Link
                  href={`/cfb/teams/${player.team.id}`}
                  className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                >
                  {player.team.name} Roster
                </Link>
              )}
              <Link
                href="/cfb/teams"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                All Teams
              </Link>
              <Link
                href="/cfb/scores"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Live Scores
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
