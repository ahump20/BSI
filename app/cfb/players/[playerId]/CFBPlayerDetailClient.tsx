'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';
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

interface CFBPlayerDetailClientProps {
  playerId: string;
}

export default function CFBPlayerDetailClient({ playerId }: CFBPlayerDetailClientProps) {
  const { data: playerData, loading, error, retry: fetchPlayer, lastUpdated: lastUpdatedDate } = useSportData<PlayerResponse>(
    playerId ? `/api/cfb/players/${playerId}` : null,
  );

  const player = playerData?.player || null;
  const stats = playerData?.seasonStats || null;
  const lastUpdated = lastUpdatedDate ? formatTimestamp(lastUpdatedDate.toISOString()) : formatTimestamp();

  const teamColor = 'var(--bsi-primary)'; // BSI burnt-orange default for CFB

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-[var(--border-vintage)]">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/cfb"
                className="text-[rgba(196,184,165,0.5)] hover:text-[var(--bsi-primary)] transition-colors"
              >
                CFB
              </Link>
              <span className="text-[rgba(196,184,165,0.5)]">/</span>
              <span className="text-[rgba(196,184,165,0.5)]">Players</span>
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
                        style={{ backgroundColor: teamColor, borderColor: 'var(--bsi-primary)', color: '#fff' }}
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
                          className="text-[var(--bsi-dust)] hover:text-[var(--bsi-primary)] transition-colors"
                        >
                          {player.team?.name}
                        </Link>
                      ) : (
                        <span className="text-[var(--bsi-dust)]">{player.team?.name || 'Unknown Team'}</span>
                      )}
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--bsi-bone)]">
                      {player.name}
                    </h1>

                    <div className="flex items-center gap-4 justify-center md:justify-start mt-2">
                      {player.jersey && <Badge variant="primary">#{player.jersey}</Badge>}
                      <span className="text-[var(--bsi-dust)]">
                        {player.positionFull || player.position}
                      </span>
                      {player.year && (
                        <span className="text-[rgba(196,184,165,0.5)]">{player.year}</span>
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
                    <h2 className="font-display text-xl font-bold text-[var(--bsi-bone)] mb-4">
                      Player Information
                    </h2>
                    <dl className="space-y-3">
                      {player.position && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Position</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.positionFull || player.position}</dd>
                        </div>
                      )}
                      {player.height && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Height</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.height}</dd>
                        </div>
                      )}
                      {player.weight && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Weight</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.weight} lbs</dd>
                        </div>
                      )}
                      {player.year && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Class</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.year}</dd>
                        </div>
                      )}
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
                          <dt className="text-[rgba(196,184,165,0.5)]">Hometown</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.birthPlace}</dd>
                        </div>
                      )}
                      {player.hometown && !player.birthPlace && (
                        <div className="flex justify-between">
                          <dt className="text-[rgba(196,184,165,0.5)]">Hometown</dt>
                          <dd className="text-[var(--bsi-bone)]">{player.hometown}</dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                </ScrollReveal>

                {/* Team Info */}
                <ScrollReveal direction="up" delay={100}>
                  <Card variant="default" padding="lg">
                    <h2 className="font-display text-xl font-bold text-[var(--bsi-bone)] mb-4">
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
                          <p className="text-[var(--bsi-bone)] font-semibold text-lg">{player.team.name}</p>
                          <p className="text-[rgba(196,184,165,0.5)]">{player.team.abbreviation}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[var(--bsi-dust)]">Team information unavailable</p>
                    )}
                    {player.team?.id && (
                      <Link
                        href={`/cfb/teams/${player.team.id}`}
                        className="inline-block px-4 py-2 bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)] rounded-sm hover:bg-[var(--bsi-primary)]/30 transition-colors mt-2"
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
                <h2 className="font-display text-2xl font-bold text-[var(--bsi-bone)] mb-6">
                  {stats.season || 'Season'} Stats
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
                  className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
                >
                  {player.team.name} Roster
                </Link>
              )}
              <Link
                href="/cfb/teams"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                All Teams
              </Link>
              <Link
                href="/cfb/scores"
                className="px-6 py-3 bg-[var(--surface-dugout)] rounded-sm text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-all"
              >
                Live Scores
              </Link>
            </div>
          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
