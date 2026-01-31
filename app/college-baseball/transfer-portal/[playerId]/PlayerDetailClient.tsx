'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { StatusBadge } from '@/components/portal';

interface PlayerApiResponse {
  player?: PlayerProfile;
  data?: PlayerProfile;
}

interface PlayerProfile {
  id: string;
  player_name: string;
  school_from: string;
  school_to: string | null;
  position: string;
  conference: string;
  class_year: string;
  status: 'in_portal' | 'committed' | 'withdrawn';
  portal_date: string;
  engagement_score?: number;
  source?: string;
  verified?: boolean;
  stats?: {
    avg?: number;
    hr?: number;
    rbi?: number;
    era?: number;
    wins?: number;
    losses?: number;
    strikeouts?: number;
    ip?: number;
    games?: number;
    obp?: number;
    slg?: number;
    sb?: number;
  };
  bio?: {
    height?: string;
    weight?: string;
    hometown?: string;
    high_school?: string;
    bats?: string;
    throws?: string;
  };
  timeline?: Array<{
    date: string;
    event: string;
    description?: string;
  }>;
}

// Stat display component
function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center p-4 rounded-lg bg-charcoal-800/50">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p
        className={`text-xl font-display font-bold ${highlight ? 'text-burnt-orange' : 'text-text-primary'}`}
      >
        {value}
      </p>
    </div>
  );
}

export function PlayerDetailClient() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayer() {
      setLoading(true);
      try {
        const response = await fetch(`/api/portal/player/${playerId}`);
        if (!response.ok) {
          throw new Error('Player not found');
        }
        const data = (await response.json()) as PlayerApiResponse;
        setPlayer(data.player || data.data || null);
      } catch {
        // Use mock data for development
        setPlayer(getMockPlayer(playerId));
      } finally {
        setLoading(false);
      }
    }

    if (playerId) {
      loadPlayer();
    }
  }, [playerId]);

  const isPitcher =
    player?.position.includes('P') || player?.position === 'LHP' || player?.position === 'RHP';

  if (loading) {
    return (
      <>
        <main id="main-content" className="min-h-screen bg-midnight">
          <Section className="pt-24 pb-16">
            <Container>
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mb-4" />
                <p className="text-text-secondary">Loading player profile...</p>
              </div>
            </Container>
          </Section>
        </main>
        <Footer />
      </>
    );
  }

  if (!player) {
    return (
      <>
        <main id="main-content" className="min-h-screen bg-midnight">
          <Section className="pt-24 pb-16">
            <Container>
              <EmptyState
                icon="search"
                title="Player Not Found"
                description="This player profile doesn't exist or may have been removed from the transfer portal."
                action={{
                  label: 'Back to Portal Tracker',
                  href: '/college-baseball/transfer-portal',
                }}
                size="lg"
              />
            </Container>
          </Section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Breadcrumb */}
        <Section className="pt-24 pb-4">
          <Container>
            <Breadcrumb
              items={[
                { label: 'College Baseball', href: '/college-baseball' },
                { label: 'Transfer Portal', href: '/college-baseball/transfer-portal' },
                { label: player.player_name },
              ]}
              className="mb-0"
            />
          </Container>
        </Section>

        {/* Player Header */}
        <Section className="pb-8">
          <Container>
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary">
                      {player.player_name}
                    </h1>
                    <StatusBadge status={player.status} size="lg" />
                  </div>
                  <p className="text-xl text-text-secondary">
                    {player.position} • {player.class_year} • {player.conference}
                  </p>
                </div>

                {player.verified && (
                  <Badge variant="success" className="self-start">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </Badge>
                )}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Transfer Path */}
        <Section className="py-8">
          <Container>
            <ScrollReveal delay={0.1}>
              <Card
                padding="lg"
                className="bg-gradient-to-br from-charcoal-800/80 to-charcoal-900/80"
              >
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                  <div className="text-center">
                    <p className="text-sm text-text-muted mb-2">FROM</p>
                    <p className="text-2xl font-display font-bold text-burnt-orange">
                      {player.school_from}
                    </p>
                    <p className="text-sm text-text-tertiary">{player.conference}</p>
                  </div>

                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 text-burnt-orange"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                    </svg>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-text-muted mb-2">TO</p>
                    {player.school_to ? (
                      <>
                        <p className="text-2xl font-display font-bold text-success-light">
                          {player.school_to}
                        </p>
                        <p className="text-sm text-text-tertiary">Committed</p>
                      </>
                    ) : (
                      <p className="text-2xl font-display font-bold text-dust italic">TBD</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border-subtle text-center text-sm text-text-muted">
                  Entered portal on{' '}
                  {new Date(player.portal_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Stats Grid */}
        {player.stats && (
          <Section className="py-8">
            <Container>
              <ScrollReveal delay={0.2}>
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
                  2025 Season Stats
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {isPitcher ? (
                    <>
                      {player.stats.era !== undefined && (
                        <StatItem label="ERA" value={player.stats.era.toFixed(2)} highlight />
                      )}
                      {player.stats.wins !== undefined && (
                        <StatItem label="Wins" value={player.stats.wins} />
                      )}
                      {player.stats.losses !== undefined && (
                        <StatItem label="Losses" value={player.stats.losses} />
                      )}
                      {player.stats.strikeouts !== undefined && (
                        <StatItem label="K" value={player.stats.strikeouts} highlight />
                      )}
                      {player.stats.ip !== undefined && (
                        <StatItem label="IP" value={player.stats.ip.toFixed(1)} />
                      )}
                      {player.stats.games !== undefined && (
                        <StatItem label="Games" value={player.stats.games} />
                      )}
                    </>
                  ) : (
                    <>
                      {player.stats.avg !== undefined && (
                        <StatItem label="AVG" value={player.stats.avg.toFixed(3)} highlight />
                      )}
                      {player.stats.hr !== undefined && (
                        <StatItem label="HR" value={player.stats.hr} />
                      )}
                      {player.stats.rbi !== undefined && (
                        <StatItem label="RBI" value={player.stats.rbi} highlight />
                      )}
                      {player.stats.obp !== undefined && (
                        <StatItem label="OBP" value={player.stats.obp.toFixed(3)} />
                      )}
                      {player.stats.slg !== undefined && (
                        <StatItem label="SLG" value={player.stats.slg.toFixed(3)} />
                      )}
                      {player.stats.sb !== undefined && (
                        <StatItem label="SB" value={player.stats.sb} />
                      )}
                    </>
                  )}
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Bio Section */}
        {player.bio && (
          <Section className="py-8">
            <Container>
              <ScrollReveal delay={0.3}>
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
                  Player Info
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {player.bio.height && (
                    <div className="p-4 rounded-lg bg-charcoal-800/30">
                      <p className="text-xs text-text-muted uppercase mb-1">Height</p>
                      <p className="text-text-primary font-medium">{player.bio.height}</p>
                    </div>
                  )}
                  {player.bio.weight && (
                    <div className="p-4 rounded-lg bg-charcoal-800/30">
                      <p className="text-xs text-text-muted uppercase mb-1">Weight</p>
                      <p className="text-text-primary font-medium">{player.bio.weight}</p>
                    </div>
                  )}
                  {player.bio.bats && (
                    <div className="p-4 rounded-lg bg-charcoal-800/30">
                      <p className="text-xs text-text-muted uppercase mb-1">Bats</p>
                      <p className="text-text-primary font-medium">{player.bio.bats}</p>
                    </div>
                  )}
                  {player.bio.throws && (
                    <div className="p-4 rounded-lg bg-charcoal-800/30">
                      <p className="text-xs text-text-muted uppercase mb-1">Throws</p>
                      <p className="text-text-primary font-medium">{player.bio.throws}</p>
                    </div>
                  )}
                  {player.bio.hometown && (
                    <div className="p-4 rounded-lg bg-charcoal-800/30 col-span-2">
                      <p className="text-xs text-text-muted uppercase mb-1">Hometown</p>
                      <p className="text-text-primary font-medium">{player.bio.hometown}</p>
                    </div>
                  )}
                  {player.bio.high_school && (
                    <div className="p-4 rounded-lg bg-charcoal-800/30 col-span-2">
                      <p className="text-xs text-text-muted uppercase mb-1">High School</p>
                      <p className="text-text-primary font-medium">{player.bio.high_school}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Back Button */}
        <Section className="py-8 pb-16">
          <Container>
            <div className="text-center">
              <Link href="/college-baseball/transfer-portal">
                <Button variant="secondary" size="lg">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                  </svg>
                  Back to Portal Tracker
                </Button>
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}

// Mock player data for development
function getMockPlayer(id: string): PlayerProfile {
  const mockPlayers: Record<string, PlayerProfile> = {
    'sample-player-1': {
      id: 'sample-player-1',
      player_name: 'Jake Wilson',
      school_from: 'Texas A&M',
      school_to: null,
      position: 'RHP',
      conference: 'SEC',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-02',
      engagement_score: 95,
      verified: true,
      stats: {
        era: 2.87,
        wins: 8,
        losses: 2,
        strikeouts: 94,
        ip: 78.2,
        games: 15,
      },
      bio: {
        height: '6\'3"',
        weight: '205 lbs',
        hometown: 'Houston, TX',
        high_school: 'St. Thomas',
        throws: 'Right',
      },
    },
    '2': {
      id: '2',
      player_name: 'Marcus Johnson',
      school_from: 'Florida',
      school_to: 'LSU',
      position: 'SS',
      conference: 'SEC',
      class_year: 'Sr',
      status: 'committed',
      portal_date: '2025-06-02',
      engagement_score: 88,
      verified: true,
      stats: {
        avg: 0.312,
        hr: 14,
        rbi: 52,
        obp: 0.401,
        slg: 0.567,
        sb: 12,
      },
      bio: {
        height: '6\'1"',
        weight: '185 lbs',
        hometown: 'Miami, FL',
        high_school: 'Columbus',
        bats: 'Right',
        throws: 'Right',
      },
    },
  };

  return (
    mockPlayers[id] || {
      id,
      player_name: 'Unknown Player',
      school_from: 'Unknown',
      school_to: null,
      position: 'UTL',
      conference: 'Unknown',
      class_year: 'Jr',
      status: 'in_portal',
      portal_date: '2025-06-02',
      verified: false,
    }
  );
}
