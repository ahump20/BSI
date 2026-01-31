'use client';

/**
 * BSI Transfer Portal - Unified Hub
 *
 * Phase 1 complete: D1-backed data, freshness indicator,
 * 30s auto-refresh with delta fetches, recent changes strip,
 * failure banners. Zero placeholder strings.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import type { PortalSport, PortalChangeEvent, PortalFreshnessResponse } from '@/lib/portal/types';
import {
  formatPortalDate,
  formatTimeAgo,
  computePortalStats,
  getCurrentPortalWindow,
} from '@/lib/portal/utils';

const REFRESH_INTERVAL_MS = 30_000;
const FETCH_TIMEOUT_MS = 8_000;

// ============================================================================
// Hero Stats Component
// ============================================================================

function HeroStat({
  label,
  value,
  pulse,
}: {
  label: string;
  value: number | string;
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
// Freshness Indicator
// ============================================================================

function FreshnessIndicator({
  lastUpdated,
  status,
}: {
  lastUpdated: string | null;
  status: 'live' | 'delayed' | 'stale';
}) {
  const [timeAgo, setTimeAgo] = useState(lastUpdated ? formatTimeAgo(lastUpdated) : 'unknown');

  useEffect(() => {
    if (!lastUpdated) return;
    setTimeAgo(formatTimeAgo(lastUpdated));
    const interval = setInterval(() => setTimeAgo(formatTimeAgo(lastUpdated)), 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const statusConfig = {
    live: { dot: 'bg-success', text: 'text-success', label: 'Live' },
    delayed: { dot: 'bg-warning', text: 'text-warning', label: 'Delayed' },
    stale: { dot: 'bg-text-muted', text: 'text-text-muted', label: 'Stale' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-2 w-2">
        {status === 'live' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span className={config.text}>Updated {timeAgo}</span>
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
            <span className="text-success text-lg">&#9679;</span>
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
            {formatPortalDate(window.start)} &mdash; {formatPortalDate(window.end)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Recent Changes Strip (Phase 1B)
// ============================================================================

function RecentChangesStrip({ changes }: { changes: PortalChangeEvent[] }) {
  if (changes.length === 0) return null;

  const typeStyles: Record<string, string> = {
    entered: 'text-warning',
    committed: 'text-success',
    signed: 'text-burnt-orange',
    withdrawn: 'text-error',
    updated: 'text-text-secondary',
  };

  return (
    <div className="p-5 rounded-xl bg-charcoal-900/60 border border-border-subtle">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
        Recent Activity
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {changes.map((change) => (
          <div
            key={change.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface/50 transition-colors"
          >
            <span
              className={`text-xs font-semibold uppercase mt-0.5 w-20 shrink-0 ${typeStyles[change.change_type] || 'text-text-muted'}`}
            >
              {change.change_type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{change.description}</p>
              <p className="text-xs text-text-muted">{formatTimeAgo(change.event_timestamp)}</p>
            </div>
          </div>
        ))}
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
                {entry.position} &bull; {entry.school_from}
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
        <span className="text-success">&#10003;</span> Recent Commits
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
// Failure Banner (Phase 1B — non-alarming)
// ============================================================================

// ============================================================================
// View Toggle Component
// ============================================================================

type ViewMode = 'cards' | 'table';

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-charcoal-900/60 border border-border-subtle p-0.5">
      <button
        onClick={() => onChange('cards')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === 'cards'
            ? 'bg-burnt-orange text-white'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="Card view"
      >
        Cards
      </button>
      <button
        onClick={() => onChange('table')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          mode === 'table'
            ? 'bg-burnt-orange text-white'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="Table view"
      >
        Table
      </button>
    </div>
  );
}

// ============================================================================
// Table View Component
// ============================================================================

type SortField =
  | 'player_name'
  | 'position'
  | 'school_from'
  | 'school_to'
  | 'status'
  | 'portal_date';
type SortOrder = 'asc' | 'desc';

function PortalTable({
  entries,
  sort,
  order,
  onSort,
}: {
  entries: PortalEntry[];
  sort: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const arrow = (field: SortField) => (sort === field ? (order === 'asc' ? ' ↑' : ' ↓') : '');

  const headerClass =
    'px-3 py-2 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors select-none';

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full text-sm">
        <thead className="bg-charcoal-900/80">
          <tr>
            <th className={headerClass} onClick={() => onSort('player_name')}>
              Player{arrow('player_name')}
            </th>
            <th className={headerClass} onClick={() => onSort('position')}>
              Pos{arrow('position')}
            </th>
            <th className={headerClass} onClick={() => onSort('school_from')}>
              From{arrow('school_from')}
            </th>
            <th className={headerClass} onClick={() => onSort('school_to')}>
              To{arrow('school_to')}
            </th>
            <th className={headerClass} onClick={() => onSort('status')}>
              Status{arrow('status')}
            </th>
            <th className={headerClass} onClick={() => onSort('portal_date')}>
              Date{arrow('portal_date')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-charcoal-900/40 transition-colors">
              <td className="px-3 py-2.5">
                <Link
                  href={`/transfer-portal/${entry.id}`}
                  className="font-medium text-text-primary hover:text-burnt-orange transition-colors"
                >
                  {entry.player_name}
                </Link>
                {entry.stars && entry.stars > 0 && (
                  <span className="ml-1.5 text-xs text-burnt-orange">
                    {'★'.repeat(entry.stars)}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 text-text-secondary">{entry.position}</td>
              <td className="px-3 py-2.5 text-text-secondary">{entry.school_from}</td>
              <td className="px-3 py-2.5 text-text-secondary">{entry.school_to || '—'}</td>
              <td className="px-3 py-2.5">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    entry.status === 'committed'
                      ? 'bg-success/20 text-success'
                      : entry.status === 'in_portal'
                        ? 'bg-warning/20 text-warning'
                        : entry.status === 'withdrawn'
                          ? 'bg-text-muted/20 text-text-muted'
                          : entry.status === 'signed'
                            ? 'bg-burnt-orange/20 text-burnt-orange'
                            : 'bg-charcoal-800 text-text-secondary'
                  }`}
                >
                  {entry.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-3 py-2.5 text-text-tertiary text-xs">
                {formatPortalDate(entry.portal_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Failure Banner (Phase 1B — non-alarming)
// ============================================================================

function FailureBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-warning"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span className="text-sm text-warning">Update delayed, retrying automatically</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry Now
      </Button>
    </div>
  );
}

// ============================================================================
// Wire Ticker Component (Phase 3 — live feed)
// ============================================================================

interface WireEvent {
  id: string;
  portal_entry_id: string;
  change_type: string;
  description: string;
  event_timestamp: string;
  player_name?: string;
  sport?: string;
  school_from?: string;
  school_to?: string;
  position?: string;
}

function WireTicker({ sport }: { sport: PortalSport }) {
  const [events, setEvents] = useState<WireEvent[]>([]);
  const wireTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastChecked = useRef<string | null>(null);

  const fetchWire = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sport, limit: '15' });
      if (lastChecked.current) params.set('since', lastChecked.current);
      const res = await fetch(`/api/portal/wire?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { events: WireEvent[]; last_checked: string };
      if (data.events.length > 0) {
        setEvents((prev) => {
          const ids = new Set(prev.map((e) => e.id));
          const fresh = data.events.filter((e) => !ids.has(e.id));
          return [...fresh, ...prev].slice(0, 30);
        });
      }
      lastChecked.current = data.last_checked;
    } catch {
      // Non-critical
    }
  }, [sport]);

  useEffect(() => {
    lastChecked.current = null;
    setEvents([]);
    fetchWire();
  }, [fetchWire]);

  useEffect(() => {
    if (wireTimer.current) clearInterval(wireTimer.current);
    wireTimer.current = setInterval(fetchWire, 30_000);
    return () => {
      if (wireTimer.current) clearInterval(wireTimer.current);
    };
  }, [fetchWire]);

  if (events.length === 0) return null;

  const typeIcon: Record<string, string> = {
    entered: '→',
    committed: '✓',
    signed: '✎',
    withdrawn: '←',
    updated: '↻',
  };
  const typeColor: Record<string, string> = {
    entered: 'text-warning',
    committed: 'text-success',
    signed: 'text-burnt-orange',
    withdrawn: 'text-error',
    updated: 'text-text-secondary',
  };

  return (
    <div className="mb-6 rounded-xl bg-charcoal-900/60 border border-border-subtle overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-charcoal-900/80">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-ember" />
        </span>
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          Live Wire
        </span>
      </div>
      <div className="max-h-[200px] overflow-y-auto divide-y divide-border-subtle">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`/transfer-portal/${ev.portal_entry_id}`}
            className="flex items-center gap-3 px-4 py-2 hover:bg-surface/50 transition-colors"
          >
            <span className={`text-sm font-bold ${typeColor[ev.change_type] || 'text-text-muted'}`}>
              {typeIcon[ev.change_type] || '•'}
            </span>
            <span className="flex-1 text-sm text-text-primary truncate">
              {ev.player_name ? (
                <>
                  <span className="font-medium">{ev.player_name}</span>
                  {ev.position && (
                    <span className="text-text-tertiary"> ({ev.position})</span>
                  )} — {ev.description}
                </>
              ) : (
                ev.description
              )}
            </span>
            <span className="text-xs text-text-muted shrink-0">
              {formatTimeAgo(ev.event_timestamp)}
            </span>
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
  const [entries, setEntries] = useState<PortalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [freshness, setFreshness] = useState<PortalFreshnessResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortField, setSortField] = useState<SortField>('portal_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const lastFetchedAt = useRef<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(EXPLAINER_KEY)) setShowExplainer(true);
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    position: '',
    conference: '',
    status: '',
    search: '',
  });

  // Fetch entries from D1-backed API
  const fetchEntries = useCallback(
    async (delta = false) => {
      if (!delta) setLoading(true);
      setFetchFailed(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const params = new URLSearchParams({ sport });
        if (filters.position) params.set('position', filters.position);
        if (filters.conference) params.set('conference', filters.conference);
        if (filters.status) params.set('status', filters.status);
        params.set('limit', '200');
        params.set('sort', 'date');
        params.set('order', 'desc');
        if (delta && lastFetchedAt.current) {
          params.set('since', lastFetchedAt.current);
        }

        const response = await fetch(`/api/portal/v2/entries?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as {
          data?: PortalEntry[];
          meta?: { last_updated?: string };
        };
        const apiEntries = data.data || [];

        if (delta && lastFetchedAt.current && apiEntries.length > 0) {
          // Merge delta into existing entries
          setEntries((prev) => {
            const map = new Map(prev.map((e) => [e.id, e]));
            for (const entry of apiEntries) {
              map.set(entry.id, entry);
            }
            return Array.from(map.values());
          });
        } else if (!delta) {
          setEntries(apiEntries);
        }

        lastFetchedAt.current = data.meta?.last_updated || new Date().toISOString();
      } catch {
        clearTimeout(timeoutId);
        setFetchFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [sport, filters.position, filters.conference, filters.status]
  );

  // Fetch freshness info
  const fetchFreshnessInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/portal/freshness?sport=${sport}&limit=20`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as PortalFreshnessResponse;
        setFreshness(data);
      }
    } catch {
      // Non-critical — freshness display degrades gracefully
    }
  }, [sport]);

  // Initial fetch
  useEffect(() => {
    lastFetchedAt.current = null;
    fetchEntries(false);
    fetchFreshnessInfo();
  }, [fetchEntries, fetchFreshnessInfo]);

  // 30-second auto-refresh with delta fetches
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      fetchEntries(true);
      fetchFreshnessInfo();
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchEntries, fetchFreshnessInfo]);

  // Client-side search filter
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

  // Sort entries for table view
  const sortedEntries = useMemo(() => {
    if (viewMode !== 'table') return filteredEntries;
    return [...filteredEntries].sort((a, b) => {
      const aVal = (a[sortField] as string) || '';
      const bVal = (b[sortField] as string) || '';
      const cmp = aVal.localeCompare(bVal);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredEntries, viewMode, sortField, sortOrder]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Hero Section */}
        <Section className="relative pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/8 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-burnt-orange/5 via-transparent to-transparent" />

          <Container className="relative">
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

              {/* Freshness Indicator — always visible */}
              <div className="flex justify-center mt-4">
                <FreshnessIndicator
                  lastUpdated={freshness?.last_updated || lastFetchedAt.current}
                  status={freshness?.status || 'stale'}
                />
              </div>
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
                  transfer schools &mdash; think of it like free agency for college sports.
                </p>
              </div>
            )}

            {/* Sport Toggle */}
            <div className="flex justify-center mb-10">
              <SportToggle selected={sport} onChange={setSport} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <HeroStat
                label="Total Entries"
                value={stats.total}
                pulse={freshness?.status === 'live'}
              />
              <HeroStat label="In Portal" value={stats.in_portal} />
              <HeroStat label="Committed" value={stats.committed} />
              <HeroStat label="Withdrawn" value={stats.withdrawn} />
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
                {/* Live Wire Ticker */}
                <WireTicker sport={sport} />

                {/* Filters + View Toggle */}
                <div className="flex items-end justify-between gap-4 mb-8">
                  <PortalFilters
                    sport={sport}
                    filters={filters}
                    onFiltersChange={setFilters}
                    totalCount={entries.length}
                    filteredCount={filteredEntries.length}
                    className="flex-1"
                  />
                  <ViewToggle mode={viewMode} onChange={setViewMode} />
                </div>

                {/* Loading Indicator - Non-blocking */}
                {loading && entries.length === 0 && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-burnt-orange/10 border border-burnt-orange/20">
                    <div className="w-4 h-4 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
                    <span className="text-sm text-text-secondary">Loading portal data...</span>
                  </div>
                )}

                {/* Failure Banner — non-alarming, spec requirement */}
                {fetchFailed && <FailureBanner onRetry={() => fetchEntries(false)} />}

                {/* Entry Grid / Table */}
                {filteredEntries.length > 0 && viewMode === 'cards' && (
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

                {filteredEntries.length > 0 && viewMode === 'table' && (
                  <PortalTable
                    entries={sortedEntries}
                    sort={sortField}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                )}

                {/* Empty State */}
                {filteredEntries.length === 0 && !loading && (
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
                {/* Recent Changes Strip — Phase 1B */}
                <RecentChangesStrip changes={freshness?.recent_changes || []} />

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
                    Data powered by Highlightly Pro API via RapidAPI. Supplemented by NCAA Official
                    Portal, D1Baseball, On3, 247Sports. Auto-refreshes every 30 seconds.
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
