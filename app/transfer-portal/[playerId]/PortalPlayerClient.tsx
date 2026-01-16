'use client';

/**
 * Transfer Portal Player Detail Client Component
 *
 * In-depth view of a single portal entry with:
 * - Full stats breakdown
 * - Timeline of portal activity
 * - Recruitment predictions
 * - Social engagement metrics
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Footer } from '@/components/layout-ds/Footer';
import { StatusBadge, StarRating, PositionIconContainer } from '@/components/portal';
import type { PortalEntry } from '@/lib/portal/types';
import { formatPortalDate, getDaysInPortal, formatBaseballStat } from '@/lib/portal/utils';

// ============================================================================
// Stat Block Component
// ============================================================================

function StatBlock({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-charcoal-900/60 border border-border-subtle text-center">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-text-primary">{value}</p>
      {subtext && <p className="text-xs text-text-tertiary mt-0.5">{subtext}</p>}
    </div>
  );
}

// ============================================================================
// Timeline Component
// ============================================================================

function PortalTimeline({ entry }: { entry: PortalEntry }) {
  const events = [
    {
      date: entry.portal_date,
      title: 'Entered Portal',
      description: `Left ${entry.school_from}`,
      icon: '🚪',
      active: true,
    },
  ];

  if (entry.commitment_date && entry.school_to) {
    events.push({
      date: entry.commitment_date,
      title: 'Committed',
      description: `Joining ${entry.school_to}`,
      icon: '✅',
      active: true,
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
        Portal Timeline
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border-subtle" />

        <div className="space-y-6">
          {events.map((event, i) => (
            <div key={i} className="relative pl-10">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-burnt-orange/20 flex items-center justify-center text-sm">
                {event.icon}
              </div>
              <div>
                <p className="text-xs text-text-muted">{formatPortalDate(event.date)}</p>
                <p className="font-medium text-text-primary">{event.title}</p>
                <p className="text-sm text-text-secondary">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Baseball Stats Component
// ============================================================================

function BaseballStats({
  stats,
  position,
}: {
  stats: PortalEntry['baseball_stats'];
  position: string;
}) {
  if (!stats) return null;

  const isPitcher = position.includes('P') || position === 'LHP' || position === 'RHP';

  if (isPitcher) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="ERA" value={formatBaseballStat(stats.era, 'era')} />
        <StatBlock label="W-L" value={`${stats.wins || 0}-${stats.losses || 0}`} />
        <StatBlock label="K" value={stats.strikeouts || 0} />
        <StatBlock label="IP" value={formatBaseballStat(stats.innings, 'ip')} />
        {stats.whip && <StatBlock label="WHIP" value={stats.whip.toFixed(2)} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatBlock label="AVG" value={formatBaseballStat(stats.avg, 'avg')} />
      <StatBlock label="HR" value={stats.hr || 0} />
      <StatBlock label="RBI" value={stats.rbi || 0} />
      {stats.sb !== undefined && <StatBlock label="SB" value={stats.sb} />}
    </div>
  );
}

// ============================================================================
// Football Stats Component
// ============================================================================

function FootballStats({
  stats,
  position,
}: {
  stats: PortalEntry['football_stats'];
  position: string;
}) {
  if (!stats) return null;

  if (position === 'QB') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="Pass Yds" value={stats.pass_yards?.toLocaleString() || 0} />
        <StatBlock label="Pass TD" value={stats.pass_td || 0} />
        <StatBlock label="Rush Yds" value={stats.rush_yards || 0} />
        <StatBlock label="Rush TD" value={stats.rush_td || 0} />
      </div>
    );
  }

  if (position === 'RB') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="Rush Yds" value={stats.rush_yards?.toLocaleString() || 0} />
        <StatBlock label="Rush TD" value={stats.rush_td || 0} />
        <StatBlock label="Rec Yds" value={stats.rec_yards || 0} />
        <StatBlock label="Rec TD" value={stats.rec_td || 0} />
      </div>
    );
  }

  if (position === 'WR' || position === 'TE') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatBlock label="Rec Yds" value={stats.rec_yards?.toLocaleString() || 0} />
        <StatBlock label="Rec TD" value={stats.rec_td || 0} />
        {stats.rush_yards && <StatBlock label="Rush Yds" value={stats.rush_yards} />}
      </div>
    );
  }

  // Defense
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatBlock label="Tackles" value={stats.tackles || 0} />
      {stats.sacks && <StatBlock label="Sacks" value={stats.sacks} />}
      {stats.interceptions && <StatBlock label="INT" value={stats.interceptions} />}
    </div>
  );
}

// ============================================================================
// Props
// ============================================================================

interface PortalPlayerClientProps {
  playerId: string;
}

// ============================================================================
// Main Client Component
// ============================================================================

interface PlayerAPIResponse {
  success: boolean;
  data: PortalEntry;
}

export default function PortalPlayerClient({ playerId }: PortalPlayerClientProps) {
  const [entry, setEntry] = useState<PortalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const response = await fetch(`/api/portal/player/${playerId}`);
        if (!response.ok) throw new Error('Player not found');
        const data: PlayerAPIResponse = await response.json();
        setEntry(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player');
      } finally {
        setLoading(false);
      }
    }

    if (playerId) fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
          <span className="text-sm text-text-tertiary">Loading player...</span>
        </div>
      </main>
    );
  }

  if (error || !entry) {
    return (
      <main className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Player Not Found</h1>
          <p className="text-text-secondary mb-4">{error || 'This player could not be found.'}</p>
          <Button href="/transfer-portal" variant="primary">
            Back to Portal
          </Button>
        </div>
      </main>
    );
  }

  const daysInPortal = getDaysInPortal(entry.portal_date);

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Breadcrumb */}
        <Section className="pt-20 pb-4">
          <Container>
            <nav className="text-sm text-text-tertiary">
              <Link href="/transfer-portal" className="hover:text-burnt-orange transition-colors">
                Transfer Portal
              </Link>
              <span className="mx-2">/</span>
              <span className="text-text-secondary">{entry.player_name}</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section className="pb-12">
          <Container>
            <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
              {/* Player Avatar */}
              <div className="flex flex-col items-center">
                <PositionIconContainer position={entry.position} sport={entry.sport} size="lg" />
                {entry.stars && entry.stars > 0 && (
                  <div className="mt-3">
                    <StarRating stars={entry.stars} />
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
                    {entry.player_name}
                  </h1>
                  <StatusBadge status={entry.status} />
                </div>

                <div className="flex flex-wrap gap-4 text-text-secondary mb-6">
                  <span className="font-medium">{entry.position}</span>
                  <span>•</span>
                  <span>{entry.class_year}</span>
                  <span>•</span>
                  <span>{entry.conference}</span>
                </div>

                {/* Transfer Info */}
                <div className="flex items-center gap-2 p-4 rounded-lg bg-charcoal-900/60 border border-border-subtle mb-6">
                  <span className="text-text-primary font-medium">{entry.school_from}</span>
                  {entry.school_to ? (
                    <>
                      <svg
                        className="w-5 h-5 text-success"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                      </svg>
                      <span className="text-success font-medium">{entry.school_to}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 text-warning"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                      </svg>
                      <span className="text-warning font-medium">Undecided</span>
                    </>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatBlock label="Days in Portal" value={daysInPortal} />
                  <StatBlock label="Entered" value={formatPortalDate(entry.portal_date)} />
                  <StatBlock
                    label="Engagement"
                    value={entry.engagement_score || '—'}
                    subtext={
                      entry.engagement_score && entry.engagement_score >= 85 ? '🔥 Hot' : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Stats Section */}
        <Section className="py-10 bg-charcoal/30">
          <Container>
            <h2 className="text-xl font-bold text-text-primary mb-6">Season Statistics</h2>
            {entry.sport === 'baseball' && entry.baseball_stats && (
              <BaseballStats stats={entry.baseball_stats} position={entry.position} />
            )}
            {entry.sport === 'football' && entry.football_stats && (
              <FootballStats stats={entry.football_stats} position={entry.position} />
            )}
            {!entry.baseball_stats && !entry.football_stats && (
              <p className="text-text-secondary">No statistics available.</p>
            )}
          </Container>
        </Section>

        {/* Timeline & Activity */}
        <Section className="py-10">
          <Container>
            <div className="grid md:grid-cols-2 gap-8">
              <Card padding="lg">
                <PortalTimeline entry={entry} />
              </Card>

              <Card padding="lg">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                  Source Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Source</span>
                    <span className="text-text-primary">{entry.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Verified</span>
                    <span className={entry.verified ? 'text-success' : 'text-warning'}>
                      {entry.verified ? '✓ Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Last Updated</span>
                    <span className="text-text-primary">{formatPortalDate(entry.updated_at)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Back CTA */}
        <Section className="py-10">
          <Container>
            <div className="text-center">
              <Button href="/transfer-portal" variant="outline">
                ← Back to Transfer Portal
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
