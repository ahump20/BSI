'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// Import shared portal components
import {
  PortalCard,
  PortalCardGrid,
  PortalFilters,
  type PortalEntry,
  type FilterState,
} from '@/components/portal';

// Sample CFB portal data with star ratings
const MOCK_ENTRIES: PortalEntry[] = [
  {
    id: 'cfb-2025-001',
    player_name: 'Jaylen Carter',
    school_from: 'Georgia',
    school_to: null,
    position: 'QB',
    conference: 'SEC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-09',
    engagement_score: 98,
    stars: 4,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-09T00:00:00Z',
    updated_at: '2025-12-09T00:00:00Z',
  },
  {
    id: 'cfb-2025-002',
    player_name: 'Marcus Williams',
    school_from: 'Ohio State',
    school_to: 'Texas',
    position: 'WR',
    conference: 'Big Ten',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-12-09',
    engagement_score: 94,
    stars: 5,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-09T00:00:00Z',
    updated_at: '2025-12-09T00:00:00Z',
  },
  {
    id: 'cfb-2025-003',
    player_name: 'Darius Jackson',
    school_from: 'Alabama',
    school_to: null,
    position: 'RB',
    conference: 'SEC',
    class_year: 'So',
    status: 'in_portal',
    portal_date: '2025-12-10',
    engagement_score: 87,
    stars: 4,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-10T00:00:00Z',
    updated_at: '2025-12-10T00:00:00Z',
  },
  {
    id: 'cfb-2025-004',
    player_name: 'Tyler Henderson',
    school_from: 'USC',
    school_to: 'Colorado',
    position: 'DB',
    conference: 'Big 12',
    class_year: 'Jr',
    status: 'committed',
    portal_date: '2025-12-09',
    engagement_score: 82,
    stars: 3,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-09T00:00:00Z',
    updated_at: '2025-12-09T00:00:00Z',
  },
  {
    id: 'cfb-2025-005',
    player_name: 'Jordan Mitchell',
    school_from: 'Michigan',
    school_to: null,
    position: 'LB',
    conference: 'Big Ten',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-11',
    engagement_score: 79,
    stars: 4,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-11T00:00:00Z',
    updated_at: '2025-12-11T00:00:00Z',
  },
  {
    id: 'cfb-2025-006',
    player_name: 'Brandon Thomas',
    school_from: 'Oklahoma',
    school_to: null,
    position: 'OL',
    conference: 'SEC',
    class_year: 'Sr',
    status: 'withdrawn',
    portal_date: '2025-12-09',
    engagement_score: 55,
    stars: 3,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-09T00:00:00Z',
    updated_at: '2025-12-09T00:00:00Z',
  },
  {
    id: 'cfb-2025-007',
    player_name: 'Chris Davis',
    school_from: 'Clemson',
    school_to: null,
    position: 'DL',
    conference: 'ACC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-12',
    engagement_score: 91,
    stars: 5,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-12T00:00:00Z',
    updated_at: '2025-12-12T00:00:00Z',
  },
  {
    id: 'cfb-2025-008',
    player_name: 'DeShawn Brown',
    school_from: 'Oregon',
    school_to: 'Tennessee',
    position: 'QB',
    conference: 'Big Ten',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-12-10',
    engagement_score: 96,
    stars: 4,
    sport: 'football',
    verified: true,
    source: 'BSI Mock Data',
    created_at: '2025-12-10T00:00:00Z',
    updated_at: '2025-12-10T00:00:00Z',
  },
];

// Stats card component (page-specific)
function StatCard({
  label,
  value,
  change,
  isLive,
}: {
  label: string;
  value: string | number;
  change?: string;
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
      {change && (
        <p
          className={`text-xs mt-1 ${change.startsWith('+') ? 'text-success-light' : 'text-text-muted'}`}
        >
          {change} today
        </p>
      )}
    </div>
  );
}

export default function CFBTransferPortalPage() {
  const [entries] = useState<PortalEntry[]>(MOCK_ENTRIES);
  const [filters, setFilters] = useState<FilterState>({
    position: '',
    conference: '',
    status: '',
    search: '',
  });

  // Filter entries locally
  const filteredEntries = entries.filter((entry) => {
    if (filters.position && entry.position !== filters.position) return false;
    if (filters.conference && entry.conference !== filters.conference) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.search && !entry.player_name.toLowerCase().includes(filters.search.toLowerCase()))
      return false;
    return true;
  });

  // Stats calculations
  const stats = {
    total: entries.length,
    inPortal: entries.filter((e) => e.status === 'in_portal').length,
    committed: entries.filter((e) => e.status === 'committed').length,
    powerFour: entries.filter((e) => ['SEC', 'Big Ten', 'Big 12', 'ACC'].includes(e.conference))
      .length,
  };

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Hero section */}
        <Section className="relative pt-24 pb-16 overflow-hidden">
          {/* Background gradient - football brown tones */}
          <div className="absolute inset-0 bg-gradient-radial from-football/10 via-transparent to-transparent opacity-50" />
          <div className="absolute inset-0 bg-[url('/images/grain.png')] opacity-[0.02]" />

          <Container className="relative">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto">
                <Badge variant="primary" className="mb-6">
                  2025 Transfer Portal
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                  College Football
                  <span className="block text-burnt-orange">Transfer Portal Tracker</span>
                </h1>
                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
                  Real-time tracking of every FBS player entering, committing, or withdrawing from
                  the transfer portal. Includes recruiting star ratings and commitment intel.
                </p>
              </div>
            </ScrollReveal>

            {/* Stats grid */}
            <ScrollReveal delay={0.1}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <StatCard label="Total Entries" value={stats.total} change="+47" isLive />
                <StatCard label="In Portal" value={stats.inPortal} change="+32" />
                <StatCard label="Committed" value={stats.committed} change="+12" />
                <StatCard label="Power 4" value={stats.powerFour} change="+28" />
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters and list */}
        <Section className="py-8 md:py-12">
          <Container>
            {/* Shared PortalFilters component - with sport="football" */}
            <ScrollReveal>
              <PortalFilters
                sport="football"
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={entries.length}
                filteredCount={filteredEntries.length}
                className="mb-8"
              />
            </ScrollReveal>

            {/* Entry grid using shared components */}
            <PortalCardGrid>
              {filteredEntries.map((entry, index) => (
                <ScrollReveal key={entry.id} delay={index * 0.05}>
                  <PortalCard
                    entry={entry}
                    sport="football"
                    showStats={false}
                    href={`/cfb/transfer-portal/${entry.id}`}
                  />
                </ScrollReveal>
              ))}
            </PortalCardGrid>

            {/* Empty state */}
            {filteredEntries.length === 0 && (
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

            {/* Portal window info */}
            <ScrollReveal>
              <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-football/10 to-transparent border border-football/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-football/20 flex items-center justify-center">
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
                      2025 Portal Windows
                    </h3>
                    <p className="text-text-secondary mb-3">
                      The winter transfer window opens{' '}
                      <strong className="text-burnt-orange">December 9, 2025</strong> for 30 days.
                      Players must declare within 7 days of entering and have 30 days to find a new
                      school.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Winter Window:</span>
                        <span className="ml-2 text-text-primary">Dec 9 - Jan 8, 2026</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Spring Window:</span>
                        <span className="ml-2 text-text-primary">Apr 15 - Apr 30, 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* CTA section */}
        <Section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-charcoal-900/50">
          <Container>
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  Never Miss a Transfer
                </h2>
                <p className="text-text-secondary mb-8">
                  Get instant alerts when players from your favorite schools or conferences enter
                  the portal. Pro subscribers get star ratings, NIL valuations, and exclusive
                  commitment intel.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button href="/pricing" variant="primary" size="lg">
                    Get Pro Alerts
                  </Button>
                  <Button href="/cfb" variant="ghost" size="lg">
                    Back to College Football
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
