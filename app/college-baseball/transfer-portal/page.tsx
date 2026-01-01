'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

// Import shared portal components
import {
  PortalCard,
  PortalCardGrid,
  PortalFilters,
  type PortalEntry,
  type FilterState,
} from '@/components/portal';
import { collegeBaseballNavItems } from '@/lib/navigation';

// Mock data for UI development (will be replaced by API)
const MOCK_ENTRIES: PortalEntry[] = [
  {
    id: '1',
    player_name: 'Jake Wilson',
    school_from: 'Texas A&M',
    school_to: null,
    position: 'RHP',
    conference: 'SEC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-06-02',
    engagement_score: 95,
    stats: { era: 2.87, wins: 8, losses: 2, strikeouts: 94 },
  },
  {
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
    stats: { avg: 0.312, hr: 14, rbi: 52 },
  },
  {
    id: '3',
    player_name: 'Tyler Roberts',
    school_from: 'Oregon State',
    school_to: null,
    position: 'OF',
    conference: 'Pac-12',
    class_year: 'So',
    status: 'in_portal',
    portal_date: '2025-06-03',
    engagement_score: 72,
    stats: { avg: 0.289, hr: 8, rbi: 38 },
  },
  {
    id: '4',
    player_name: 'Chris Martinez',
    school_from: 'Miami',
    school_to: 'Texas',
    position: 'LHP',
    conference: 'ACC',
    class_year: 'Jr',
    status: 'committed',
    portal_date: '2025-06-02',
    engagement_score: 91,
    stats: { era: 3.24, wins: 6, losses: 3, strikeouts: 78 },
  },
  {
    id: '5',
    player_name: 'Brandon Lee',
    school_from: 'Stanford',
    school_to: null,
    position: 'C',
    conference: 'Pac-12',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-06-04',
    engagement_score: 65,
    stats: { avg: 0.275, hr: 6, rbi: 29 },
  },
  {
    id: '6',
    player_name: 'David Thompson',
    school_from: 'Tennessee',
    school_to: null,
    position: '1B',
    conference: 'SEC',
    class_year: 'So',
    status: 'withdrawn',
    portal_date: '2025-06-02',
    engagement_score: 45,
    stats: { avg: 0.301, hr: 11, rbi: 44 },
  },
  {
    id: '7',
    player_name: 'Ryan Garcia',
    school_from: 'Texas',
    school_to: null,
    position: 'RHP',
    conference: 'SEC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-06-02',
    engagement_score: 89,
    stats: { era: 3.56, wins: 7, losses: 4, strikeouts: 82 },
  },
  {
    id: '8',
    player_name: 'Austin Miller',
    school_from: 'Arkansas',
    school_to: 'Vanderbilt',
    position: '2B',
    conference: 'SEC',
    class_year: 'Sr',
    status: 'committed',
    portal_date: '2025-06-03',
    engagement_score: 77,
    stats: { avg: 0.267, hr: 5, rbi: 31 },
  },
  {
    id: '9',
    player_name: 'Derek Williams',
    school_from: 'Wake Forest',
    school_to: null,
    position: 'OF',
    conference: 'ACC',
    class_year: 'Jr',
    status: 'in_portal',
    portal_date: '2025-06-05',
    engagement_score: 68,
    stats: { avg: 0.295, hr: 9, rbi: 41 },
  },
];

// Alert subscription component (page-specific)
function AlertSubscription() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/portal/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscription_type: 'free' }),
      });

      if (response.ok) {
        setSubscribed(true);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="p-6 rounded-xl bg-success/10 border border-success/30 text-center">
        <div className="text-success text-3xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">You're on the list!</h3>
        <p className="text-text-secondary text-sm">We'll notify you when new players enter the portal.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-burnt-orange/10 to-transparent border border-burnt-orange/30">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Get Portal Alerts</h3>
        <p className="text-text-secondary text-sm">Be first to know when players enter the portal. Free alerts for your favorite schools.</p>
      </div>
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 bg-midnight border border-border-subtle rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-burnt-orange transition-colors"
          required
        />
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? '...' : 'Subscribe'}
        </Button>
      </form>
      <p className="text-text-muted text-xs mt-3 text-center">
        Free tier: Delayed alerts. <Link href="/pricing" className="text-burnt-orange hover:underline">Upgrade to Pro</Link> for real-time.
      </p>
    </div>
  );
}

// Stats card component (page-specific)
function StatCard({ label, value, change, isLive }: { label: string; value: string | number; change?: string; isLive?: boolean }) {
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
      <p className="text-xs md:text-sm font-medium text-text-tertiary uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl md:text-3xl font-display font-bold text-text-primary">{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-success-light' : 'text-text-muted'}`}>
          {change} today
        </p>
      )}
    </div>
  );
}

export default function TransferPortalPage() {
  const [entries, setEntries] = useState<PortalEntry[]>(MOCK_ENTRIES);
  const [filters, setFilters] = useState<FilterState>({
    position: '',
    conference: '',
    status: '',
    search: '',
  });
  const [_loading, setLoading] = useState(false);

  // Fetch portal entries from API
  const loadEntries = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.position) params.set('position', filters.position);
      if (filters.conference) params.set('conference', filters.conference);
      if (filters.status) params.set('status', filters.status);
      params.set('limit', '100');

      const response = await fetch(`/api/portal/entries?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const entries = data.data || data.entries || [];
      if (entries.length > 0) {
        setEntries(entries);
      }
    } catch (err) {
      console.error('Error loading portal entries:', err);
      // Keep mock data on error for development
    } finally {
      setLoading(false);
    }
  }, [filters.position, filters.conference, filters.status]);

  // Load entries on mount and when filters change
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Filter entries locally (for search and client-side filtering)
  const filteredEntries = entries.filter((entry) => {
    if (filters.position && !entry.position.includes(filters.position)) return false;
    if (filters.conference && entry.conference !== filters.conference) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.search && !entry.player_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Stats calculations
  const stats = {
    total: entries.length,
    inPortal: entries.filter(e => e.status === 'in_portal').length,
    committed: entries.filter(e => e.status === 'committed').length,
    withdrawn: entries.filter(e => e.status === 'withdrawn').length,
  };

  return (
    <main className="min-h-screen bg-midnight">
      <Navbar items={collegeBaseballNavItems} variant="sticky" />

      {/* Hero section */}
      <Section className="relative pt-24 pb-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[url('/images/grain.png')] opacity-[0.02]" />

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
                Real-time tracking of every D1 baseball player entering, committing, or withdrawing from the transfer portal.
                Updated continuously throughout the portal window.
              </p>
            </div>
          </ScrollReveal>

          {/* Stats grid */}
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <StatCard label="Total Entries" value={stats.total} change="+12" isLive />
              <StatCard label="In Portal" value={stats.inPortal} change="+8" />
              <StatCard label="Committed" value={stats.committed} change="+3" />
              <StatCard label="Withdrawn" value={stats.withdrawn} change="+1" />
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Filters and list */}
      <Section className="py-8 md:py-12">
        <Container>
          {/* Shared PortalFilters component */}
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

          {/* Entry grid using shared components */}
          <PortalCardGrid>
            {filteredEntries.map((entry, index) => (
              <ScrollReveal key={entry.id} delay={index * 0.05}>
                <PortalCard
                  entry={entry}
                  sport="baseball"
                  showStats={true}
                  href={`/college-baseball/transfer-portal/${entry.id}`}
                />
              </ScrollReveal>
            ))}
          </PortalCardGrid>

          {/* Empty state */}
          {filteredEntries.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21L16.65 16.65" />
              </svg>
              <h3 className="text-lg font-medium text-text-secondary mb-2">No entries found</h3>
              <p className="text-text-tertiary">Try adjusting your filters or search term</p>
            </div>
          )}

          {/* Portal window info */}
          <ScrollReveal>
            <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-burnt-orange/10 to-transparent border border-burnt-orange/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-burnt-orange/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-burnt-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6V12L16 14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">2025 Portal Window</h3>
                  <p className="text-text-secondary mb-3">
                    The primary transfer window opens <strong className="text-burnt-orange">June 2, 2025</strong> and runs through August 1st.
                    Players have 30 days to enter after their season ends.
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
        </Container>
      </Section>

      {/* Alert Subscription Section */}
      <Section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-charcoal-900/50">
        <Container>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <ScrollReveal direction="left">
              <div>
                <Badge variant="primary" className="mb-4">Real-Time Alerts</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  Never Miss a Transfer
                </h2>
                <p className="text-text-secondary mb-6">
                  Be the first to know when a player from your favorite school enters the portal.
                  Set up custom watchlists for positions, conferences, or specific programs.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <svg className="w-5 h-5 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Email alerts
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <svg className="w-5 h-5 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Push notifications
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <svg className="w-5 h-5 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Daily digests
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.1}>
              <AlertSubscription />
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* Pricing Tiers */}
      <Section className="py-16 md:py-24 bg-charcoal-900/30">
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Pricing</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Choose Your Plan
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                D1Baseball charges $145.99/year for editorial coverage—not a real database.
                We built what should exist.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Free tier */}
              <div className="p-6 rounded-xl bg-charcoal-800/50 border border-border-subtle text-center">
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Free</h3>
                <div className="font-display text-3xl font-bold text-text-primary mb-4">$0</div>
                <ul className="text-text-secondary text-sm space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Basic tracker access
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    24-hour delayed alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Limited search filters
                  </li>
                </ul>
                <Button variant="ghost" size="sm" className="w-full">
                  Current Plan
                </Button>
              </div>

              {/* Pro tier */}
              <div className="p-6 rounded-xl bg-burnt-orange/5 border-2 border-burnt-orange/50 text-center relative">
                <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Popular
                </Badge>
                <h3 className="font-display text-lg font-bold text-burnt-orange mb-2">Pro</h3>
                <div className="font-display text-3xl font-bold text-text-primary mb-1">
                  $9.99<span className="text-lg font-normal text-text-tertiary">/mo</span>
                </div>
                <p className="text-text-muted text-xs mb-4">or $79/year (save 34%)</p>
                <ul className="text-text-secondary text-sm space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-burnt-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-primary font-medium">Real-time alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-burnt-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-primary font-medium">Full database access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-burnt-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-primary font-medium">Player profiles & stats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-burnt-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-primary font-medium">Custom watchlists</span>
                  </li>
                </ul>
                <Button href="/pricing" variant="primary" size="sm" className="w-full">
                  Upgrade to Pro
                </Button>
              </div>

              {/* Enterprise tier */}
              <div className="p-6 rounded-xl bg-charcoal-800/50 border border-border-subtle text-center">
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Enterprise</h3>
                <div className="font-display text-3xl font-bold text-text-primary mb-4">
                  $199<span className="text-lg font-normal text-text-tertiary">/mo</span>
                </div>
                <ul className="text-text-secondary text-sm space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    API access
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom data exports
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    White-label options
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>
                <Button href="/contact" variant="secondary" size="sm" className="w-full">
                  Contact Sales
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* Back link */}
          <div className="text-center mt-12">
            <Link href="/college-baseball" className="text-burnt-orange hover:text-burnt-orange-400 transition-colors inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" />
              </svg>
              Back to College Baseball
            </Link>
          </div>
        </Container>
      </Section>

      {/* Data Attribution Footer */}
      <Section className="py-8 border-t border-border-subtle">
        <Container>
          <div className="text-center text-sm text-text-muted">
            <p className="mb-2">
              <strong className="text-text-secondary">2026 Portal Window:</strong> June 2, 2026 – July 1, 2026 (Primary)
            </p>
            <p>
              Data sourced from official NCAA portal filings, D1Baseball, and verified social media.
              Updated every 5 minutes during active windows.
            </p>
            <p className="mt-2 text-xs">
              Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
            </p>
          </div>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
