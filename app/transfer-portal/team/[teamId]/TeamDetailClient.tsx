'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';
import { PortalCard, PortalCardGrid, StatusBadge } from '@/components/portal';
import type { PortalEntry } from '@/lib/portal/types';

interface TeamAPIResponse {
  team: string;
  team_slug: string;
  incoming: PortalEntry[];
  outgoing: PortalEntry[];
  net: number;
}

function StatBlock({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: 'positive' | 'negative' | 'neutral';
}) {
  const color =
    variant === 'positive'
      ? 'text-success'
      : variant === 'negative'
        ? 'text-red-400'
        : 'text-text-primary';
  return (
    <div className="p-4 rounded-lg bg-charcoal-900/60 border border-border-subtle text-center">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function TeamDetailClient({ teamId }: { teamId: string }) {
  const [data, setData] = useState<TeamAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'outgoing' | 'incoming'>('outgoing');

  useEffect(() => {
    async function fetchTeam() {
      try {
        const response = await fetch(`/api/portal/team/${teamId}`);
        if (!response.ok) throw new Error('Team not found');
        const result: TeamAPIResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team');
      } finally {
        setLoading(false);
      }
    }

    if (teamId) fetchTeam();
  }, [teamId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
          <span className="text-sm text-text-tertiary">Loading team...</span>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Team Not Found</h1>
          <p className="text-text-secondary mb-4">
            {error || 'No portal activity found for this team.'}
          </p>
          <Button href="/transfer-portal" variant="primary">
            Back to Portal
          </Button>
        </div>
      </main>
    );
  }

  const activeList = tab === 'outgoing' ? data.outgoing : data.incoming;
  const netVariant =
    data.net > 0
      ? ('positive' as const)
      : data.net < 0
        ? ('negative' as const)
        : ('neutral' as const);
  const netDisplay = data.net > 0 ? `+${data.net}` : String(data.net);

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        <Section className="pt-20 pb-4">
          <Container>
            <nav className="text-sm text-text-tertiary">
              <Link href="/transfer-portal" className="hover:text-burnt-orange transition-colors">
                Transfer Portal
              </Link>
              <span className="mx-2">/</span>
              <span className="text-text-secondary">{data.team}</span>
            </nav>
          </Container>
        </Section>

        <Section className="pb-12">
          <Container>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-8">
              {data.team}
              <span className="block text-lg font-normal text-text-secondary mt-1">
                Portal Activity
              </span>
            </h1>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <StatBlock label="Outgoing" value={data.outgoing.length} />
              <StatBlock label="Incoming" value={data.incoming.length} />
              <StatBlock label="Net" value={netDisplay} variant={netVariant} />
            </div>

            {/* Tab toggle */}
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setTab('outgoing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'outgoing'
                    ? 'bg-burnt-orange text-white'
                    : 'bg-charcoal-800 text-text-secondary hover:text-text-primary'
                }`}
              >
                Outgoing ({data.outgoing.length})
              </button>
              <button
                onClick={() => setTab('incoming')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'incoming'
                    ? 'bg-burnt-orange text-white'
                    : 'bg-charcoal-800 text-text-secondary hover:text-text-primary'
                }`}
              >
                Incoming ({data.incoming.length})
              </button>
            </div>

            {activeList.length > 0 ? (
              <PortalCardGrid>
                {activeList.map((entry) => (
                  <PortalCard
                    key={entry.id}
                    entry={entry}
                    sport={entry.sport}
                    showStats={true}
                    href={`/transfer-portal/${entry.id}`}
                  />
                ))}
              </PortalCardGrid>
            ) : (
              <div className="text-center py-16">
                <p className="text-text-secondary">
                  No {tab} transfers found for {data.team}.
                </p>
              </div>
            )}

            <div className="text-center mt-12">
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
