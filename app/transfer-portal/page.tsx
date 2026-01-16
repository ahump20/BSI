'use client';

/**
 * BSI Transfer Portal - Unified Hub
 *
 * THE flagship feature of Blaze Sports Intel.
 * Premium transfer portal tracking for College Baseball and CFB.
 *
 * Design: Dark, cinematic, data-dense. No visual noise—pure intel.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PortalCard,
  PortalCardGrid,
  PortalFilters,
  type PortalEntry,
  type FilterState,
} from '@/components/portal';
import { Footer } from '@/components/layout-ds/Footer';
import type { PortalSport } from '@/lib/portal/types';
import {
  formatPortalDate,
  getDaysInPortal,
  computePortalStats,
  getCurrentPortalWindow,
} from '@/lib/portal/utils';

// ============================================================================
// Hero Stats Component
// ============================================================================

function HeroStat({
  label,
  value,
  change,
  pulse,
}: {
  label: string;
  value: number | string;
  change?: string;
  pulse?: boolean;
}) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-4 md:p-6 rounded-xl bg-charcoal-900/60 border border-border-subtle backdrop-blur-sm">
        {pulse && (
          <div className="absolute top-3 right-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
          </div>
        )}
        <p className="text-xs md:text-sm font-medium text-text-tertiary uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-2xl md:text-4xl font-display font-bold text-text-primary tabular-nums">
          {value}
        </p>
        {change && (
          <p
            className={`text-xs mt-1.5 ${change.startsWith('+') ? 'text-success' : 'text-text-muted'}`}
          >
            {change} today
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sport Toggle Component
// ============================================================================

function SportToggle({
  selected,
  onChange,
}: {
  selected: PortalSport;
  onChange: (sport: PortalSport) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-charcoal-900/60 border border-border-subtle p-1">
      <button
        onClick={() => onChange('baseball')}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          selected === 'baseball'
            ? 'bg-burnt-orange text-white shadow-lg'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        ⚾ College Baseball
      </button>
      <button
        onClick={() => onChange('football')}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          selected === 'football'
            ? 'bg-burnt-orange text-white shadow-lg'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        🏈 College Football
      </button>
    </div>
  );
}

// ============================================================================
// Portal Window Banner
// ============================================================================

function PortalWindowBanner({ sport }: { sport: PortalSport }) {
  const window = getCurrentPortalWindow(sport);

  if (!window) return null;

  return (
    <div
      className={`p-4 rounded-xl border ${
        window.active
          ? 'bg-success/10 border-success/30'
          : 'bg-burnt-orange/10 border-burnt-orange/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            window.active ? 'bg-success/20' : 'bg-burnt-orange/20'
          }`}
        >
          {window.active ? (
            <span className="text-success text-lg">●</span>
          ) : (
            <svg
              className="w-5 h-5 text-burnt-orange"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6V12L16 14" />
            </svg>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">
            {window.active ? `${window.name} is OPEN` : `${window.name} Coming Soon`}
          </h3>
          <p className="text-sm text-text-secondary">
            {formatPortalDate(window.start)} — {formatPortalDate(window.end)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Trending Sidebar
// ============================================================================

function TrendingSidebar({ entries }: { entries: PortalEntry[] }) {
  const trending = entries
    .filter((e) => e.status === 'in_portal' && (e.engagement_score || 0) >= 75)
    .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
    .slice(0, 5);

  if (trending.length === 0) return null;

  return (
    <div className="p-5 rounded-xl bg-charcoal-900/60 border border-border-subtle">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="text-burnt-orange">🔥</span> Trending Now
      </h3>
      <div className="space-y-3">
        {trending.map((entry, i) => (
          <Link
            key={entry.id}
            href={`/transfer-portal/${entry.id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface transition-colors group"
          >
            <span className="w-6 h-6 rounded-full bg-burnt-orange/20 text-burnt-orange text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary group-hover:text-burnt-orange truncate transition-colors">
                {entry.player_name}
              </p>
              <p className="text-xs text-text-tertiary">
                {entry.position} • {entry.school_from}
              </p>
            </div>
            <span className="text-xs text-success font-mono">{entry.engagement_score}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Recent Commits Sidebar
// ============================================================================

function RecentCommits({ entries }: { entries: PortalEntry[] }) {
  const commits = entries
    .filter((e) => e.status === 'committed' && e.school_to)
    .sort(
      (a, b) =>
        new Date(b.commitment_date || b.portal_date).getTime() -
        new Date(a.commitment_date || a.portal_date).getTime()
    )
    .slice(0, 5);

  if (commits.length === 0) return null;

  return (
    <div className="p-5 rounded-xl bg-charcoal-900/60 border border-border-subtle">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="text-success">✓</span> Recent Commits
      </h3>
      <div className="space-y-3">
        {commits.map((entry) => (
          <Link
            key={entry.id}
            href={`/transfer-portal/${entry.id}`}
            className="block p-2 -mx-2 rounded-lg hover:bg-surface transition-colors group"
          >
            <p className="text-sm font-medium text-text-primary group-hover:text-burnt-orange truncate transition-colors">
              {entry.player_name}
            </p>
            <p className="text-xs text-text-tertiary flex items-center gap-1.5">
              <span>{entry.school_from}</span>
              <svg
                className="w-3 h-3 text-success"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12H19M19 12L12 5M19 12L12 19" />
              </svg>
              <span className="text-success font-medium">{entry.school_to}</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TransferPortalHub() {
  const [sport, setSport] = useState<PortalSport>('baseball');
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    position: '',
    conference: '',
    status: '',
    search: '',
  });

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ sport });
      if (filters.position) params.set('position', filters.position);
      if (filters.conference) params.set('conference', filters.conference);
      if (filters.status) params.set('status', filters.status);
      params.set('limit', '100');

      const response = await fetch(`/api/portal/v2/entries?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = (await response.json()) as { data?: PortalEntry[] };
      setEntries(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [sport, filters.position, filters.conference, filters.status]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Filter entries client-side for search
  const filteredEntries = useMemo(() => {
    if (!filters.search) return entries;
    const query = filters.search.toLowerCase();
    return entries.filter((e) =>
      [e.player_name, e.school_from, e.school_to, e.position]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  }, [entries, filters.search]);

  // Compute stats
  const stats = useMemo(() => computePortalStats(entries), [entries]);

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Hero Section */}
        <Section className="relative pt-24 pb-16 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/8 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-burnt-orange/5 via-transparent to-transparent" />

          <Container className="relative">
            {/* Badge + Title */}
            <div className="text-center max-w-4xl mx-auto mb-10">
              <Badge variant="primary" className="mb-4">
                Winter 2025 Portal Window
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4 tracking-tight">
                NCAA Transfer Portal
                <span className="block text-burnt-orange mt-1">Intelligence Hub</span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Real-time tracking of every D1 transfer. College baseball and football. Updated
                continuously.{' '}
                <span className="text-burnt-orange font-medium">The coverage fans deserve.</span>
              </p>
            </div>

            {/* Sport Toggle */}
            <div className="flex justify-center mb-10">
              <SportToggle selected={sport} onChange={setSport} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <HeroStat label="Total Entries" value={stats.total} change="+12" pulse />
              <HeroStat label="In Portal" value={stats.in_portal} change="+8" />
              <HeroStat label="Committed" value={stats.committed} change="+3" />
              <HeroStat label="Withdrawn" value={stats.withdrawn} change="+1" />
            </div>

            {/* Portal Window Banner */}
            <PortalWindowBanner sport={sport} />
          </Container>
        </Section>

        {/* Main Content */}
        <Section className="py-8 md:py-12 bg-charcoal/30">
          <Container>
            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              {/* Main Column */}
              <div>
                {/* Filters */}
                <PortalFilters
                  sport={sport}
                  filters={filters}
                  onFiltersChange={setFilters}
                  totalCount={entries.length}
                  filteredCount={filteredEntries.length}
                  className="mb-8"
                />

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
                      <span className="text-sm text-text-tertiary">Loading portal data...</span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-16 px-4 rounded-xl bg-error/10 border border-error/30">
                    <p className="text-error font-medium mb-2">Failed to load entries</p>
                    <p className="text-sm text-text-secondary mb-4">{error}</p>
                    <Button variant="primary" onClick={fetchEntries}>
                      Retry
                    </Button>
                  </div>
                )}

                {/* Entry Grid */}
                {!loading && !error && (
                  <PortalCardGrid>
                    {filteredEntries.map((entry) => (
                      <PortalCard
                        key={entry.id}
                        entry={entry}
                        sport={sport}
                        showStats
                        href={`/transfer-portal/${entry.id}`}
                      />
                    ))}
                  </PortalCardGrid>
                )}

                {/* Empty State */}
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
                    <h3 className="text-lg font-medium text-text-secondary mb-2">
                      No entries found
                    </h3>
                    <p className="text-text-tertiary">Try adjusting your filters or search term</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                <TrendingSidebar entries={entries} />
                <RecentCommits entries={entries} />

                {/* Alert CTA */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-burnt-orange/15 to-burnt-orange/5 border border-burnt-orange/30">
                  <h3 className="font-semibold text-text-primary mb-2">Get Portal Alerts</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Be first to know when players enter or commit. Real-time notifications for Pro
                    members.
                  </p>
                  <Button href="/pricing" variant="primary" className="w-full">
                    Upgrade to Pro
                  </Button>
                </div>

                {/* Source Attribution */}
                <div className="p-4 rounded-lg bg-charcoal-900/40 border border-border-subtle">
                  <p className="text-xs text-text-muted">
                    Data sources: NCAA Official Portal, D1Baseball, On3, 247Sports. Updated every 5
                    minutes during active windows.
                  </p>
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
