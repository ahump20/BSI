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
import { StatusBadge, type PortalEntry } from '@/components/portal';

interface PlayerApiResponse {
  data?: PortalEntry;
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
  const [player, setPlayer] = useState<PortalEntry | null>(null);
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
        setPlayer(data.data || null);
      } catch {
        setPlayer(null);
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
        {player.baseball_stats && (
          <Section className="py-8">
            <Container>
              <ScrollReveal delay={0.2}>
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
                  2025 Season Stats
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {isPitcher ? (
                    <>
                      {player.baseball_stats.era !== undefined && (
                        <StatItem
                          label="ERA"
                          value={player.baseball_stats.era.toFixed(2)}
                          highlight
                        />
                      )}
                      {player.baseball_stats.wins !== undefined && (
                        <StatItem label="Wins" value={player.baseball_stats.wins} />
                      )}
                      {player.baseball_stats.losses !== undefined && (
                        <StatItem label="Losses" value={player.baseball_stats.losses} />
                      )}
                      {player.baseball_stats.strikeouts !== undefined && (
                        <StatItem label="K" value={player.baseball_stats.strikeouts} highlight />
                      )}
                      {player.baseball_stats.innings !== undefined && (
                        <StatItem label="IP" value={player.baseball_stats.innings.toFixed(1)} />
                      )}
                      {player.baseball_stats.whip !== undefined && (
                        <StatItem label="WHIP" value={player.baseball_stats.whip.toFixed(2)} />
                      )}
                    </>
                  ) : (
                    <>
                      {player.baseball_stats.avg !== undefined && (
                        <StatItem
                          label="AVG"
                          value={player.baseball_stats.avg.toFixed(3)}
                          highlight
                        />
                      )}
                      {player.baseball_stats.hr !== undefined && (
                        <StatItem label="HR" value={player.baseball_stats.hr} />
                      )}
                      {player.baseball_stats.rbi !== undefined && (
                        <StatItem label="RBI" value={player.baseball_stats.rbi} highlight />
                      )}
                      {player.baseball_stats.sb !== undefined && (
                        <StatItem label="SB" value={player.baseball_stats.sb} />
                      )}
                    </>
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
