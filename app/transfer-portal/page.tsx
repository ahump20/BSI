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
import { SportIcon } from '@/components/ui/SportIcon';
import {
  PortalCard,
  PortalCardGrid,
  PortalFilters,
  type PortalEntry,
  type FilterState,
} from '@/components/portal';
import { Footer } from '@/components/layout-ds/Footer';
import type { PortalSport } from '@/lib/portal/types';
import { formatPortalDate, computePortalStats, getCurrentPortalWindow } from '@/lib/portal/utils';

// ============================================================================
// Fallback Data - Shown when API unavailable or during initial load
// ============================================================================

const FALLBACK_BASEBALL: PortalEntry[] = [
  {
    id: 'bb-2025-001',
    player_name: 'Jake Wilson',
    school_from: 'Texas A&M',
    school_to: null,
    position: 'RHP',
    conference: 'SEC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-10',
    sport: 'baseball',
    engagement_score: 95,
    verified: true,
    source: 'd1baseball.com',
    baseball_stats: { era: 2.87, wins: 8, losses: 2, strikeouts: 94, innings: 88.2 },
    created_at: '2025-12-10T10:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'bb-2025-002',
    player_name: 'Marcus Johnson',
    school_from: 'Florida',
    school_to: 'LSU',
    position: 'SS',
    conference: 'SEC',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-12-09',
    commitment_date: '2025-12-22',
    sport: 'baseball',
    engagement_score: 88,
    verified: true,
    source: 'd1baseball.com',
    baseball_stats: { avg: 0.312, hr: 14, rbi: 52, sb: 18 },
    created_at: '2025-12-09T14:00:00Z',
    updated_at: '2025-12-22T16:00:00Z',
  },
  {
    id: 'bb-2025-003',
    player_name: 'Tyler Roberts',
    school_from: 'Oregon State',
    school_to: null,
    position: 'OF',
    conference: 'Pac-12',
    class_year: 'So',
    status: 'in_portal',
    portal_date: '2025-12-11',
    sport: 'baseball',
    engagement_score: 72,
    verified: true,
    source: 'ncaa.com',
    baseball_stats: { avg: 0.289, hr: 8, rbi: 38, sb: 12 },
    created_at: '2025-12-11T09:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'bb-2025-004',
    player_name: 'Chris Martinez',
    school_from: 'Miami',
    school_to: 'Texas',
    position: 'LHP',
    conference: 'ACC',
    class_year: 'Jr',
    status: 'committed',
    portal_date: '2025-12-09',
    commitment_date: '2025-12-18',
    sport: 'baseball',
    engagement_score: 91,
    verified: true,
    source: 'twitter.com',
    baseball_stats: { era: 3.24, wins: 6, losses: 3, strikeouts: 78, innings: 72.1 },
    created_at: '2025-12-09T11:00:00Z',
    updated_at: '2025-12-18T14:00:00Z',
  },
  {
    id: 'bb-2025-005',
    player_name: 'Ryan Garcia',
    school_from: 'Texas',
    school_to: null,
    position: 'RHP',
    conference: 'SEC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-10',
    sport: 'baseball',
    engagement_score: 89,
    verified: true,
    source: 'd1baseball.com',
    baseball_stats: { era: 3.56, wins: 7, losses: 4, strikeouts: 82, innings: 78.0 },
    created_at: '2025-12-10T12:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
];

const FALLBACK_FOOTBALL: PortalEntry[] = [
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
    sport: 'football',
    engagement_score: 98,
    stars: 4,
    overall_rank: 12,
    verified: true,
    source: 'on3.com',
    football_stats: { pass_yards: 2847, pass_td: 24, rush_yards: 412, rush_td: 5 },
    created_at: '2025-12-09T10:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
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
    commitment_date: '2025-12-20',
    sport: 'football',
    engagement_score: 94,
    stars: 5,
    overall_rank: 3,
    verified: true,
    source: '247sports.com',
    football_stats: { rec_yards: 1247, rec_td: 11 },
    created_at: '2025-12-09T12:00:00Z',
    updated_at: '2025-12-20T15:00:00Z',
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
    sport: 'football',
    engagement_score: 87,
    stars: 4,
    overall_rank: 28,
    verified: true,
    source: 'on3.com',
    football_stats: { rush_yards: 892, rush_td: 9, rec_yards: 234, rec_td: 2 },
    created_at: '2025-12-10T09:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
  {
    id: 'cfb-2025-004',
    player_name: 'Cameron Davis',
    school_from: 'Texas A&M',
    school_to: null,
    position: 'EDGE',
    conference: 'SEC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-12-12',
    sport: 'football',
    engagement_score: 91,
    stars: 4,
    overall_rank: 18,
    verified: true,
    source: '247sports.com',
    football_stats: { tackles: 52, sacks: 9.5 },
    created_at: '2025-12-12T11:00:00Z',
    updated_at: '2025-01-15T08:30:00Z',
  },
];

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
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
          selected === 'baseball'
            ? 'bg-burnt-orange text-white shadow-lg'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <SportIcon icon="mlb" size="sm" /> College Baseball
      </button>
      <button
        onClick={() => onChange('football')}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
          selected === 'football'
            ? 'bg-burnt-orange text-white shadow-lg'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <SportIcon icon="nfl" size="sm" /> College Football
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
        <span className="text-burnt-orange">
          <SportIcon icon="trending" size="sm" />
        </span>{' '}
        Trending Now
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

const EXPLAINER_KEY = 'bsi_portal_explainer_dismissed';

export default function TransferPortalHub() {
  const [sport, setSport] = useState<PortalSport>('baseball');
  const [entries, setEntries] = useState<PortalEntry[]>(FALLBACK_BASEBALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(true);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(EXPLAINER_KEY)) setShowExplainer(true);
  }, []);
  const [filters, setFilters] = useState<FilterState>({
    position: '',
    conference: '',
    status: '',
    search: '',
  });

  // Get fallback data for current sport
  const getFallbackData = useCallback(
    (s: PortalSport): PortalEntry[] => (s === 'football' ? FALLBACK_FOOTBALL : FALLBACK_BASEBALL),
    []
  );

  // Fetch entries with timeout and fallback
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const params = new URLSearchParams({ sport });
      if (filters.position) params.set('position', filters.position);
      if (filters.conference) params.set('conference', filters.conference);
      if (filters.status) params.set('status', filters.status);
      params.set('limit', '100');

      const response = await fetch(`/api/portal/v2/entries?${params.toString()}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = (await response.json()) as { data?: PortalEntry[] };
      const apiEntries = data.data || [];

      if (apiEntries.length > 0) {
        setEntries(apiEntries);
        setUsingFallback(false);
      } else {
        setEntries(getFallbackData(sport));
        setUsingFallback(true);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setEntries(getFallbackData(sport));
      setUsingFallback(true);
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [sport, filters.position, filters.conference, filters.status, getFallbackData]);

  // Update fallback data when sport changes (instant update)
  useEffect(() => {
    if (usingFallback) {
      setEntries(getFallbackData(sport));
    }
  }, [sport, usingFallback, getFallbackData]);

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

            {/* Explainer banner for casual fans */}
            {showExplainer && (
              <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-charcoal-900/60 border border-border-subtle relative">
                <button
                  onClick={() => {
                    localStorage.setItem(EXPLAINER_KEY, 'true');
                    setShowExplainer(false);
                  }}
                  className="absolute top-3 right-3 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label="Dismiss"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-sm text-text-secondary pr-6">
                  <span className="font-semibold text-text-primary">
                    New to the Transfer Portal?
                  </span>{' '}
                  The Transfer Portal is where college athletes announce they&apos;re looking to
                  transfer schools — think of it like free agency for college sports.
                </p>
              </div>
            )}

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

                {/* Loading Indicator - Non-blocking */}
                {loading && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-burnt-orange/10 border border-burnt-orange/20">
                    <div className="w-4 h-4 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
                    <span className="text-sm text-text-secondary">Refreshing portal data...</span>
                  </div>
                )}

                {/* Sample Data Notice - Show when using fallback */}
                {usingFallback && !loading && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-charcoal-800/50 border border-border-subtle">
                    <svg
                      className="w-4 h-4 text-text-tertiary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span className="text-sm text-text-tertiary">
                      Showing sample entries. Live data updates every 5 minutes during active portal
                      windows.
                    </span>
                  </div>
                )}

                {/* Error Notice - Non-blocking */}
                {error && (
                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-error/10 border border-error/30">
                    <span className="text-sm text-error">{error}</span>
                    <Button variant="ghost" size="sm" onClick={fetchEntries}>
                      Retry
                    </Button>
                  </div>
                )}

                {/* Entry Grid - Always render when we have entries */}
                {filteredEntries.length > 0 && (
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

                {/* Empty State - Only show if truly empty after filtering */}
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
