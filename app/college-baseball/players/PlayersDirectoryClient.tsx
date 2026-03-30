'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';
import { ScrollReveal } from '@/components/cinematic';
import { fmt1, fmt2, fmt3 } from '@/lib/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerRow {
  player_id: string;
  player_name: string;
  team: string;
  conference: string;
  position: string;
  class_year: string;
  playerType: 'batter' | 'pitcher';
  percentiles?: Record<string, number>;
  // Batting
  g?: number;
  ab?: number;
  pa?: number;
  h?: number;
  hr?: number;
  bb?: number;
  so?: number;
  avg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  k_pct?: number;
  bb_pct?: number;
  iso?: number;
  babip?: number;
  woba?: number;
  wrc_plus?: number;
  ops_plus?: number;
  // Pitching
  gs?: number;
  w?: number;
  l?: number;
  sv?: number;
  ip?: number;
  er?: number;
  hbp?: number;
  era?: number;
  whip?: number;
  k_9?: number;
  bb_9?: number;
  hr_9?: number;
  fip?: number;
  x_fip?: number;
  era_minus?: number;
  k_bb?: number;
}

interface DirectoryResponse {
  players: PlayerRow[];
  total: number;
  page: number;
  totalPages: number;
  conferences: string[];
  type: string;
  tier: string;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  format?: (v: number | null | undefined) => string;
  lowerIsBetter?: boolean;
  className?: string;
}

const battingColumns: Column[] = [
  { key: 'player_name', label: 'Name', sortable: true, className: 'text-left min-w-[140px]' },
  { key: 'team', label: 'Team', sortable: true, className: 'text-left min-w-[100px]' },
  { key: 'conference', label: 'Conf', sortable: false, className: 'text-left hidden md:table-cell' },
  { key: 'position', label: 'Pos', sortable: false, className: 'text-center' },
  { key: 'class_year', label: 'Yr', sortable: false, className: 'text-center hidden sm:table-cell' },
  { key: 'avg', label: 'AVG', sortable: true, format: (v) => fmt3(v ?? 0) },
  { key: 'woba', label: 'wOBA', sortable: true, format: (v) => fmt3(v ?? 0) },
  { key: 'wrc_plus', label: 'wRC+', sortable: true, format: (v) => Math.round(v ?? 0).toString() },
  { key: 'ops', label: 'OPS', sortable: true, format: (v) => fmt3(v ?? 0), className: 'hidden lg:table-cell' },
  { key: 'iso', label: 'ISO', sortable: true, format: (v) => fmt3(v ?? 0), className: 'hidden lg:table-cell' },
  { key: 'k_pct', label: 'K%', sortable: true, format: (v) => fmt1(v ?? 0), lowerIsBetter: true },
  { key: 'bb_pct', label: 'BB%', sortable: true, format: (v) => fmt1(v ?? 0) },
  { key: 'hr', label: 'HR', sortable: true, format: (v) => (v ?? 0).toString(), className: 'hidden md:table-cell' },
  { key: 'pa', label: 'PA', sortable: true, format: (v) => (v ?? 0).toString(), className: 'hidden md:table-cell' },
];

const pitchingColumns: Column[] = [
  { key: 'player_name', label: 'Name', sortable: true, className: 'text-left min-w-[140px]' },
  { key: 'team', label: 'Team', sortable: true, className: 'text-left min-w-[100px]' },
  { key: 'conference', label: 'Conf', sortable: false, className: 'text-left hidden md:table-cell' },
  { key: 'position', label: 'Pos', sortable: false, className: 'text-center' },
  { key: 'class_year', label: 'Yr', sortable: false, className: 'text-center hidden sm:table-cell' },
  { key: 'era', label: 'ERA', sortable: true, format: (v) => fmt2(v ?? 0), lowerIsBetter: true },
  { key: 'fip', label: 'FIP', sortable: true, format: (v) => fmt2(v ?? 0), lowerIsBetter: true },
  { key: 'era_minus', label: 'ERA-', sortable: true, format: (v) => Math.round(v ?? 0).toString(), lowerIsBetter: true },
  { key: 'whip', label: 'WHIP', sortable: true, format: (v) => fmt2(v ?? 0), lowerIsBetter: true, className: 'hidden lg:table-cell' },
  { key: 'k_9', label: 'K/9', sortable: true, format: (v) => fmt1(v ?? 0) },
  { key: 'bb_9', label: 'BB/9', sortable: true, format: (v) => fmt1(v ?? 0), lowerIsBetter: true },
  { key: 'k_bb', label: 'K:BB', sortable: true, format: (v) => fmt2(v ?? 0), className: 'hidden lg:table-cell' },
  { key: 'ip', label: 'IP', sortable: true, format: (v) => fmt1(v ?? 0), className: 'hidden md:table-cell' },
  { key: 'gs', label: 'GS', sortable: true, format: (v) => (v ?? 0).toString(), className: 'hidden md:table-cell' },
];

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

const positionOptions = [
  { value: '', label: 'All Positions' },
  { value: 'C', label: 'Catcher' },
  { value: 'IF', label: 'Infield' },
  { value: 'OF', label: 'Outfield' },
  { value: 'DH', label: 'DH' },
];

const pitchingPositionOptions = [
  { value: '', label: 'All' },
  { value: 'SP', label: 'Starters' },
  { value: 'RP', label: 'Relievers' },
];

const classOptions = [
  { value: '', label: 'All Classes' },
  { value: 'Fr', label: 'Freshman' },
  { value: 'So', label: 'Sophomore' },
  { value: 'Jr', label: 'Junior' },
  { value: 'Sr', label: 'Senior' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function percentileColor(pctl: number | undefined, lowerIsBetter?: boolean): string {
  if (pctl == null) return '';
  // For lower-is-better stats, invert the percentile for color purposes
  const effective = lowerIsBetter ? 100 - pctl : pctl;
  if (effective >= 90) return 'text-[var(--bsi-primary)] font-semibold';
  if (effective <= 10) return 'text-[var(--bsi-error)]';
  return '';
}

function generatePlayerSlug(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return slug || id;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayersDirectoryClient() {
  const searchParams = useSearchParams();

  // Read initial state from URL
  const [tab, setTab] = useState<'batting' | 'pitching'>(
    searchParams.get('tab') === 'pitching' ? 'pitching' : 'batting'
  );
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [conference, setConference] = useState(searchParams.get('conference') || '');
  const [position, setPosition] = useState(searchParams.get('position') || '');
  const [classYear, setClassYear] = useState(searchParams.get('class') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');
  const [sortDir, setSortDir] = useState(searchParams.get('dir') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10) || 1);

  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = tab === 'batting' ? battingColumns : pitchingColumns;

  // --- URL state sync ---
  const updateUrl = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    // Clean defaults
    if (url.searchParams.get('tab') === 'batting') url.searchParams.delete('tab');
    if (url.searchParams.get('page') === '1') url.searchParams.delete('page');
    window.history.replaceState(null, '', url.toString());
  }, []);

  // --- Fetch data ---
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('type', tab);
    if (search) params.set('search', search);
    if (conference) params.set('conference', conference);
    if (position) params.set('position', position);
    if (classYear) params.set('class', classYear);
    if (sortBy) params.set('sort', sortBy);
    if (sortDir) params.set('dir', sortDir);
    params.set('page', page.toString());
    params.set('limit', '50');

    try {
      const res = await fetch(`/api/savant/directory?${params}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DirectoryResponse;
      setData(json);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [tab, search, conference, position, classYear, sortBy, sortDir, page]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    updateUrl({ tab, search, conference, position, class: classYear, sort: sortBy, dir: sortDir, page: page.toString() });
    return () => controller.abort();
  }, [fetchData, updateUrl, tab, search, conference, position, classYear, sortBy, sortDir, page]);

  // --- Event handlers ---
  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('');
    }
    setPage(1);
  };

  const handleTabChange = (newTab: 'batting' | 'pitching') => {
    setTab(newTab);
    setSortBy('');
    setSortDir('');
    setPosition('');
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setConference('');
    setPosition('');
    setClassYear('');
    setSortBy('');
    setSortDir('');
    setPage(1);
  };

  const hasActiveFilters = search || conference || position || classYear;

  // Sort indicator
  const sortIndicator = (key: string) => {
    if (key !== sortBy) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            {/* Header */}
            <ScrollReveal direction="up">
              <Breadcrumb
                className="mb-4"
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'College Baseball', href: '/college-baseball' },
                  { label: 'Players' },
                ]}
              />
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="heritage-stamp">
                      {data ? data.total.toLocaleString() : '...'} Players Tracked
                    </span>
                  </div>
                  <h1 className="font-hero text-3xl md:text-4xl font-bold uppercase tracking-wide">
                    Player Directory
                  </h1>
                  <p className="text-[var(--bsi-dust)] mt-1 text-sm">
                    Advanced metrics across all D1 programs
                    {' \u00B7 '}
                    <Link href="/college-baseball/savant" className="text-[var(--heritage-columbia-blue)] hover:underline">
                      View Leaderboard
                    </Link>
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Tabs */}
            <div className="flex gap-0 mb-4 border-b border-[var(--border-vintage)]">
              <button
                onClick={() => handleTabChange('batting')}
                className={`px-6 py-2.5 text-sm font-display uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                  tab === 'batting'
                    ? 'border-[var(--bsi-primary)] text-[var(--bsi-bone)]'
                    : 'border-transparent text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)]'
                }`}
              >
                Batting
              </button>
              <button
                onClick={() => handleTabChange('pitching')}
                className={`px-6 py-2.5 text-sm font-display uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                  tab === 'pitching'
                    ? 'border-[var(--bsi-primary)] text-[var(--bsi-bone)]'
                    : 'border-transparent text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)]'
                }`}
              >
                Pitching
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4">
              {/* Mobile toggle */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="sm:hidden w-full flex items-center justify-between px-4 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-sm text-[var(--bsi-dust)]"
              >
                <span>Filters {hasActiveFilters ? '(active)' : ''}</span>
                <span>{filtersOpen ? '\u25B2' : '\u25BC'}</span>
              </button>

              <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block mt-2 sm:mt-0`}>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Search */}
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      placeholder="Search by name or team..."
                      className="flex-1 px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] placeholder:text-[var(--bsi-text-dim)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                      aria-label="Search players"
                    />
                    <button
                      onClick={handleSearchSubmit}
                      className="px-4 py-2 bg-[var(--bsi-primary)] text-white text-sm font-semibold rounded-sm hover:bg-[var(--bsi-primary-light)] transition-colors"
                    >
                      Search
                    </button>
                  </div>

                  {/* Conference */}
                  <select
                    value={conference}
                    onChange={(e) => { setConference(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Filter by conference"
                  >
                    <option value="">All Conferences</option>
                    {(data?.conferences || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Position */}
                  <select
                    value={position}
                    onChange={(e) => { setPosition(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Filter by position"
                  >
                    {(tab === 'pitching' ? pitchingPositionOptions : positionOptions).map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>

                  {/* Class year */}
                  <select
                    value={classYear}
                    onChange={(e) => { setClassYear(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] text-sm focus:outline-none focus:border-[var(--bsi-primary)] transition-colors"
                    aria-label="Filter by class year"
                  >
                    {classOptions.map((y) => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-[var(--bsi-dust)] text-sm hover:text-[var(--bsi-bone)] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-[var(--bsi-primary)]/30 border-t-[var(--bsi-primary)] rounded-full animate-spin mb-4" />
                <p className="text-[var(--bsi-dust)]">Loading players...</p>
              </div>
            ) : error ? (
              <Card padding="lg" className="text-center">
                <p className="text-[var(--bsi-error)] mb-2">Failed to load player data</p>
                <p className="text-[var(--bsi-dust)] text-sm">{error}</p>
              </Card>
            ) : data && data.players.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="text-[var(--bsi-bone)] mb-2">No players match your filters</p>
                <button onClick={clearFilters} className="text-[var(--heritage-columbia-blue)] text-sm hover:underline">
                  Clear all filters
                </button>
              </Card>
            ) : data ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="stat-table w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface-press-box)] border-b-2 border-[var(--bsi-primary)]">
                      <th className="px-2 py-2 text-center text-[9px] uppercase tracking-[0.15em] text-[var(--bsi-dust)] font-normal w-8">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-2 py-2 text-[9px] uppercase tracking-[0.15em] text-[var(--bsi-dust)] font-normal ${
                            col.sortable ? 'cursor-pointer hover:text-[var(--bsi-bone)] select-none' : ''
                          } ${col.className || 'text-right'}`}
                          onClick={() => col.sortable && handleSort(col.key)}
                        >
                          {col.label}{col.sortable ? sortIndicator(col.key) : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {data.players.map((player, idx) => {
                      const rank = (data.page - 1) * 50 + idx + 1;
                      const slug = generatePlayerSlug(player.player_name, player.player_id);
                      return (
                        <tr
                          key={player.player_id}
                          className="border-b border-[rgba(140,98,57,0.12)] hover:bg-[rgba(191,87,0,0.04)] transition-colors"
                        >
                          <td className="px-2 py-1.5 text-center text-[var(--bsi-text-dim)]">
                            {rank}
                          </td>
                          {columns.map((col) => {
                            if (col.key === 'player_name') {
                              return (
                                <td key={col.key} className={`px-2 py-1.5 ${col.className || ''}`}>
                                  <Link
                                    href={`/college-baseball/savant/player/${slug}-${player.player_id}`}
                                    className="text-[var(--heritage-columbia-blue)] hover:underline font-medium whitespace-nowrap"
                                  >
                                    {player.player_name}
                                  </Link>
                                </td>
                              );
                            }

                            if (col.key === 'team' || col.key === 'conference' || col.key === 'position' || col.key === 'class_year') {
                              const value = player[col.key as keyof PlayerRow] as string || '';
                              return (
                                <td key={col.key} className={`px-2 py-1.5 text-[var(--bsi-bone)] ${col.className || ''}`}>
                                  <span className="whitespace-nowrap">{value}</span>
                                </td>
                              );
                            }

                            // Numeric metric
                            const rawValue = player[col.key as keyof PlayerRow] as number | null | undefined;
                            const formatted = col.format ? col.format(rawValue) : String(rawValue ?? '');
                            const pctl = player.percentiles?.[col.key];
                            const colorClass = percentileColor(pctl, col.lowerIsBetter);

                            return (
                              <td
                                key={col.key}
                                className={`px-2 py-1.5 text-right text-[var(--bsi-bone)] ${colorClass} ${col.className || ''}`}
                              >
                                {formatted}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-[var(--bsi-dust)]">
                  Showing {((data.page - 1) * 50) + 1}–{Math.min(data.page * 50, data.total)} of {data.total.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--bsi-primary)] transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 text-[var(--bsi-dust)]">
                    {data.page} / {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    disabled={page >= data.totalPages}
                    className="px-3 py-1 bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm text-[var(--bsi-bone)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--bsi-primary)] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Attribution */}
            {data?.meta && (
              <div className="mt-6 text-center text-[9px] text-[var(--bsi-text-dim)] uppercase tracking-wider">
                Source: {data.meta.source} &middot; Updated: {new Date(data.meta.fetched_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
              </div>
            )}

          </Container>
        </Section>
      </div>

      <Footer />
    </>
  );
}
