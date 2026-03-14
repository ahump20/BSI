'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout-ds/Footer';
import { Card, CardContent, CardTitle, StatCard } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchShowCards, fetchShowCollections, type ShowCardsResponse } from '@/lib/mlb-the-show/client';
import type { ShowCollectionSummary } from '@/lib/mlb-the-show/types';
import { getWatchlistIds, toggleWatchlistCard } from '@/lib/mlb-the-show/watchlist';
import { ShowSurfaceFrame, WatchlistButton, buildCardHref, formatCompactStub } from './shared';

const SORT_OPTIONS = [
  { value: 'sell_desc', label: 'Sell price' },
  { value: 'buy_desc', label: 'Buy price' },
  { value: 'ovr_desc', label: 'Overall' },
  { value: 'name_asc', label: 'Name' },
  { value: 'newest', label: 'Newest' },
] as const;

export function DiamondDynastyMarketplaceClient() {
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('');
  const [rarity, setRarity] = useState('');
  const [series, setSeries] = useState('');
  const [position, setPosition] = useState('');
  const [bats, setBats] = useState('');
  const [collection, setCollection] = useState('');
  const [marketStatus, setMarketStatus] = useState('');
  const [captainOnly, setCaptainOnly] = useState(false);
  const [wbcOnly, setWbcOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('sell_desc');
  const [data, setData] = useState<ShowCardsResponse | null>(null);
  const [collections, setCollections] = useState<ShowCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    setWatchlist(getWatchlistIds());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchShowCollections()
      .then((response) => {
        if (cancelled) return;
        setCollections(response.collections);
      })
      .catch(() => {
        if (!cancelled) setCollections([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (team) params.set('team', team);
    if (rarity) params.set('rarity', rarity);
    if (series) params.set('series', series);
    if (position) params.set('position', position);
    if (bats) params.set('bats', bats);
    if (collection) params.set('collection', collection);
    if (marketStatus) params.set('market_status', marketStatus);
    if (captainOnly) params.set('captain', 'true');
    if (wbcOnly) params.set('wbc_only', 'true');
    params.set('page', String(page));
    params.set('sort', sort);

    let cancelled = false;
    setLoading(true);

    fetchShowCards(params)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setError(null);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load marketplace.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bats, captainOnly, collection, marketStatus, page, position, rarity, search, series, sort, team, wbcOnly]);

  useEffect(() => {
    setPage(1);
  }, [bats, captainOnly, collection, marketStatus, position, rarity, search, series, sort, team, wbcOnly]);

  const options = useMemo(() => {
    const cards = data?.cards ?? [];
    return {
      teams: [...new Set(cards.map((card) => card.team).filter(Boolean))].sort(),
      rarities: [...new Set(cards.map((card) => card.rarity).filter(Boolean))].sort(),
      series: [...new Set(cards.map((card) => card.series).filter(Boolean))].sort(),
      positions: [...new Set(cards.flatMap((card) => [card.primaryPosition, ...card.secondaryPositions]).filter(Boolean))].sort(),
      bats: [...new Set(cards.map((card) => card.bats).filter(Boolean))].sort(),
    };
  }, [data?.cards]);

  const pageCards = data?.cards ?? [];
  const redDiamondCount = pageCards.filter((card) => card.rarity.trim().toUpperCase() === 'RED DIAMOND').length;
  const wbcCount = pageCards.filter((card) => {
    const fields = [card.series, card.setName ?? '', ...card.locations].join(' ').toUpperCase();
    return fields.includes('WBC') || fields.includes('WORLD BASEBALL CLASSIC');
  }).length;
  const trackedOnPage = pageCards.filter((card) => watchlist.includes(card.id)).length;

  const note = data?.meta.source_status.compatibilityMode
    ? 'This marketplace is live in compatibility mode against the official MLB 25 public The Show catalog until official 26 public endpoints are verifiable.'
    : 'Marketplace data is sourced from official public The Show resources plus BSI-owned history capture.';

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Diamond Dynasty Marketplace"
        title="Card Board, Spread, and Roster Cost"
        description="Search the live card pool by rarity, team, position, WBC tags, and market status. Every row keeps source freshness and links into a full card page with official daily history plus BSI intraday tracking when available."
        source={data?.meta.source}
        lastUpdated={data?.meta.fetched_at}
        degraded={Boolean(data?.meta.degraded)}
        compatibilityNote={note}
      >
        <DataErrorBoundary name="Diamond Dynasty marketplace">
          <section className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Results" value={data?.totalCards ?? 0} helperText="Cards matching the current filter stack." />
            <StatCard label="Page" value={`${data?.page ?? 1}/${data?.totalPages ?? 1}`} helperText="Worker-backed paging across the DD market board." />
            <StatCard label="WBC tagged" value={wbcCount} helperText="Cards on this page with explicit WBC metadata." />
            <StatCard label="Red Diamond" value={redDiamondCount} helperText="Current page count of Red Diamond cards." />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.34fr_0.66fr]">
            <Card padding="lg" className="h-fit">
              <CardTitle size="sm">Filters</CardTitle>
              <CardContent className="space-y-4 px-0 pb-0 pt-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Search</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Aaron Judge, Yankees, Live Series..."
                    className="w-full rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-2 text-sm text-[var(--bsi-bone)] outline-none transition-colors focus:border-burnt-orange/45"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <Select label="Team" value={team} onChange={setTeam} options={options.teams} />
                  <Select label="Rarity" value={rarity} onChange={setRarity} options={options.rarities} />
                  <Select label="Series" value={series} onChange={setSeries} options={options.series} />
                  <Select label="Position" value={position} onChange={setPosition} options={options.positions} />
                  <Select label="Bats" value={bats} onChange={setBats} options={options.bats} />
                  <Select
                    label="Collection"
                    value={collection}
                    onChange={setCollection}
                    options={collections.map((entry) => entry.id)}
                    labelMap={Object.fromEntries(collections.map((entry) => [entry.id, entry.name]))}
                  />
                  <Select label="Market status" value={marketStatus} onChange={setMarketStatus} options={['listed', 'sellable', 'non_sellable']} />
                  <Select label="Sort" value={sort} onChange={(value) => setSort(value as (typeof SORT_OPTIONS)[number]['value'])} options={SORT_OPTIONS.map((option) => option.value)} />
                </div>

                <label className="flex items-center gap-3 rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-3 text-sm text-[var(--bsi-bone)]">
                  <input type="checkbox" checked={captainOnly} onChange={(event) => setCaptainOnly(event.target.checked)} />
                  Captain cards only
                </label>

                <label className="flex items-center gap-3 rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-3 text-sm text-[var(--bsi-bone)]">
                  <input type="checkbox" checked={wbcOnly} onChange={(event) => setWbcOnly(event.target.checked)} />
                  WBC-tagged only
                </label>

                <p className="text-sm leading-relaxed text-[var(--bsi-dust)]">
                  WBC filtering is source-bound: only cards whose official/public series, set, or acquisition metadata explicitly includes WBC or World Baseball Classic will appear.
                </p>

                <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-3 text-sm text-[var(--bsi-dust)]">
                  Tracked on this page: <span className="font-semibold text-[var(--bsi-bone)]">{trackedOnPage}</span>
                </div>
              </CardContent>
            </Card>

            <Card padding="lg">
              <CardTitle size="sm">Marketplace Board</CardTitle>
              <CardContent className="px-0 pb-0 pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)]" />
                    ))}
                  </div>
                ) : error ? (
                  <p className="text-sm text-[var(--bsi-dust)]">{error}</p>
                ) : !data || data.cards.length === 0 ? (
                  <p className="text-sm text-[var(--bsi-dust)]">No cards matched the current marketplace filters.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-burnt-orange/35 text-left text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                          <th className="px-3 py-3">Card</th>
                          <th className="px-3 py-3">Team</th>
                          <th className="px-3 py-3">Series</th>
                          <th className="px-3 py-3">Pos</th>
                          <th className="px-3 py-3">OVR</th>
                          <th className="px-3 py-3">Sell</th>
                          <th className="px-3 py-3">Buy</th>
                          <th className="px-3 py-3">Spread</th>
                          <th className="px-3 py-3">Track</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.cards.map((card) => {
                          const active = watchlist.includes(card.id);
                          return (
                            <tr key={card.id} className="border-b border-[var(--border-vintage)] text-sm text-[var(--bsi-bone)]">
                              <td className="px-3 py-3">
                                <Link href={buildCardHref(card.id)} className="block hover:text-burnt-orange transition-colors">
                                  <div className="font-semibold">{card.name}</div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                                    {card.rarity} • {card.setName ?? 'No set label'}
                                  </div>
                                </Link>
                              </td>
                              <td className="px-3 py-3">{card.team}</td>
                              <td className="px-3 py-3">{card.series}</td>
                              <td className="px-3 py-3">{card.primaryPosition}</td>
                              <td className="px-3 py-3 font-mono text-burnt-orange">{card.overall}</td>
                              <td className="px-3 py-3 font-mono">{formatCompactStub(card.market?.bestSellNow)}</td>
                              <td className="px-3 py-3 font-mono">{formatCompactStub(card.market?.bestBuyNow)}</td>
                              <td className="px-3 py-3 font-mono">{card.market?.spread !== null ? card.market?.spread?.toLocaleString() : 'N/A'}</td>
                              <td className="px-3 py-3">
                                <WatchlistButton
                                  active={active}
                                  onToggle={() => setWatchlist(toggleWatchlistCard(card.id))}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {!loading && data && data.totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--border-vintage)] pt-4">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      disabled={page <= 1}
                      className="rounded-full border border-[var(--border-vintage)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                      Page {data.page} of {data.totalPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(current + 1, data.totalPages))}
                      disabled={page >= data.totalPages}
                      className="rounded-full border border-[var(--border-vintage)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </DataErrorBoundary>
      </ShowSurfaceFrame>
      <Footer />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labelMap,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labelMap?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-2 text-sm text-[var(--bsi-bone)] outline-none transition-colors focus:border-burnt-orange/45"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelMap?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
