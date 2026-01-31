'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { fetchPortalEntries } from '@/lib/portal/api';

import {
  PortalCard,
  PortalCardGrid,
  PortalFilters,
  StatusLegend,
  type PortalEntry,
  type FilterState,
} from '@/components/portal';

function StatCard({
  label,
  value,
  isLive,
}: {
  label: string;
  value: string | number;
  isLive?: boolean;
}) {
  return (
    <div className="relative p-4 md:p-6 rounded-xl bg-gradient-to-br from-charcoal-800/80 to-charcoal-900/80 border border-border-subtle">
      {isLive && (
        <div className="absolute top-3 right-3">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
        </div>
      )}
      <p className="text-xs md:text-sm font-medium text-text-tertiary uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-display font-bold text-text-primary">{value}</p>
    </div>
  );
}

export default function TransferPortalPage() {
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    position: '',
    conference: '',
    status: '',
    search: '',
  });
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchPortalEntries(
        'baseball',
        {
          position: filters.position || undefined,
          conference: filters.conference || undefined,
          status:
            (filters.status as 'in_portal' | 'committed' | 'withdrawn' | 'signed') || undefined,
        },
        { limit: 100 }
      );

      setEntries(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal entries');
    } finally {
      setLoading(false);
    }
  }, [filters.position, filters.conference, filters.status]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = entries.filter((entry) => {
    if (filters.search && !entry.player_name.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    return true;
  });

  const stats = {
    total: entries.length,
    inPortal: entries.filter((e) => e.status === 'in_portal').length,
    committed: entries.filter((e) => e.status === 'committed').length,
    withdrawn: entries.filter((e) => e.status === 'withdrawn').length,
  };

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        <Section className="relative pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent opacity-50" />
          <Container className="relative">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto">
                <Badge variant="primary" className="mb-6">
                  2025 Transfer Portal
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                  College Baseball
                  <span className="block text-burnt-orange">Transfer Portal Tracker</span>
                </h1>
                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
                  Real-time tracking of every D1 baseball player entering, committing, or
                  withdrawing from the transfer portal. Updated every 5 minutes during active
                  windows.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <StatCard label="Total Entries" value={stats.total} isLive />
                <StatCard label="In Portal" value={stats.inPortal} />
                <StatCard label="Committed" value={stats.committed} />
                <StatCard label="Withdrawn" value={stats.withdrawn} />
              </div>
              <div className="mt-6">
                <StatusLegend variant="compact" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        <Section className="py-8 md:py-12">
          <Container>
            <ScrollReveal>
              <PortalFilters
                sport="baseball"
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={entries.length}
                filteredCount={filteredEntries.length}
                className="mb-8"
              />
            </ScrollReveal>

            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
                Failed to load portal data: {error}
                <button
                  onClick={loadEntries}
                  className="ml-4 underline hover:text-red-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {loading && entries.length === 0 && (
              <div className="text-center py-16">
                <div className="animate-pulse text-text-muted">Loading portal entries...</div>
              </div>
            )}

            <PortalCardGrid>
              {filteredEntries.map((entry, index) => (
                <ScrollReveal key={entry.id} delay={index * 0.05}>
                  <PortalCard
                    entry={entry}
                    sport="baseball"
                    showStats={true}
                    href={`/transfer-portal/player?id=${entry.id}`}
                  />
                </ScrollReveal>
              ))}
            </PortalCardGrid>

            {!loading && !error && filteredEntries.length === 0 && (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21L16.65 16.65" />
                </svg>
                <h3 className="text-lg font-medium text-text-secondary mb-2">No entries found</h3>
                <p className="text-text-tertiary">Try adjusting your filters or search term</p>
              </div>
            )}

            <ScrollReveal>
              <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-burnt-orange/10 to-transparent border border-burnt-orange/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-burnt-orange/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-burnt-orange"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6V12L16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      2025 Portal Window
                    </h3>
                    <p className="text-text-secondary mb-3">
                      The primary transfer window opens{' '}
                      <strong className="text-burnt-orange">June 2, 2025</strong> and runs through
                      August 1st. Players have 30 days to enter after their season ends.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Spring Window:</span>
                        <span className="ml-2 text-text-primary">May 1 - May 15, 2025</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Main Window:</span>
                        <span className="ml-2 text-text-primary">June 2 - Aug 1, 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <div className="text-center mt-12">
              <Link
                href="/college-baseball"
                className="text-burnt-orange hover:text-burnt-orange-400 transition-colors inline-flex items-center gap-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" />
                </svg>
                Back to College Baseball
              </Link>
            </div>
          </Container>
        </Section>

        <Section className="py-8 border-t border-border-subtle">
          <Container>
            <div className="text-center text-sm text-text-muted">
              <p>
                Data sourced from Highlightly API and verified social media. Updated every 5 minutes
                during active windows.
              </p>
              <p className="mt-2 text-xs">
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
