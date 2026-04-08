'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardTitle, StatCard } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchShowCollectionDetail, type ShowCollectionDetailResponse } from '@/lib/mlb-the-show/client';
import { ShowSurfaceFrame, WatchlistButton, buildCardHref, formatCompactStub, formatStubValue } from './shared';
import { getWatchlistIds, toggleWatchlistCard } from '@/lib/mlb-the-show/watchlist';

function isWbcCard(fields: string[]) {
  const haystack = fields.join(' ').toUpperCase();
  return haystack.includes('WBC') || haystack.includes('WORLD BASEBALL CLASSIC');
}

function isRedDiamond(rarity: string) {
  return rarity.trim().toUpperCase() === 'RED DIAMOND';
}

export function DiamondDynastyCollectionDetailClient() {
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('id');
  const [detail, setDetail] = useState<ShowCollectionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    setWatchlist(getWatchlistIds());
  }, []);

  useEffect(() => {
    if (!collectionId) return;
    let cancelled = false;
    setLoading(true);
    fetchShowCollectionDetail(collectionId)
      .then((response) => {
        if (cancelled) return;
        setDetail(response);
        setError(null);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load collection detail.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const collectionCards = detail?.detail.cards ?? [];
  const summary = useMemo(() => {
    return {
      redDiamondCount: collectionCards.filter((card) => isRedDiamond(card.rarity)).length,
      wbcCount: collectionCards.filter((card) => isWbcCard([card.series, card.setName ?? '', ...card.locations])).length,
      captainCount: collectionCards.filter((card) => card.isCaptain).length,
      trackedCount: collectionCards.filter((card) => watchlist.includes(card.id)).length,
    };
  }, [collectionCards, watchlist]);

  if (!collectionId) {
    return (
      <div className="bsi-theme-baseball">
        <ShowSurfaceFrame
          eyebrow="Collection Detail"
          title="Choose a Collection"
          description="Collection drilldown is query-param based so it stays static-export-safe in the current BSI deployment model."
          compatibilityNote="Open a collection from the collections board or a card detail relationship panel."
        >
          <Card padding="lg">
            <CardContent className="space-y-3 px-0 pb-0 pt-0">
              <p className="text-sm text-[var(--bsi-dust)]">
                Start from the <Link href="/mlb/the-show-26/diamond-dynasty/collections" className="text-burnt-orange">collections board</Link>.
              </p>
            </CardContent>
          </Card>
        </ShowSurfaceFrame>
      </div>
    );
  }

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Collection Detail"
        title={detail?.detail.collection.name ?? 'Collection Detail'}
        description="This drilldown turns the collection surface from a summary board into an actionable roster and market view. It separates collection membership from live sell-now state so unlock-path browsing stays honest."
        source={detail?.meta.source}
        lastUpdated={detail?.meta.fetched_at}
        degraded={Boolean(detail?.meta.degraded)}
        compatibilityNote="Collection membership is only shown when it is sourceable from public card metadata or BSI-derived collection grouping logic. Hidden unlock rules are intentionally not inferred."
      >
        <DataErrorBoundary name="collection detail">
          {loading ? (
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
              <div className="h-96 animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
            </div>
          ) : error || !detail ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">Collection Unavailable</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">{error ?? 'This collection could not be loaded.'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Cards" value={detail.detail.totalCards.toLocaleString()} helperText="Current cards surfaced in this collection." />
                <StatCard label="Low band" value={formatCompactStub(detail.detail.collection.lowStubCost)} helperText="Lowest visible sell-now cost." />
                <StatCard label="High band" value={formatCompactStub(detail.detail.collection.highStubCost)} helperText="Highest visible sell-now cost." />
                <StatCard label="Tracked" value={summary.trackedCount} helperText="Cards from this collection already on your local watchlist." />
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <InfoChip label="WBC tagged" value={summary.wbcCount} />
                <InfoChip label="Red Diamond" value={summary.redDiamondCount} />
                <InfoChip label="Captains" value={summary.captainCount} />
              </section>

              <Card padding="lg">
                <CardTitle size="sm">Collection Card Board</CardTitle>
                <CardContent className="px-0 pb-0 pt-4">
                  {detail.detail.cards.length === 0 ? (
                    <p className="text-sm text-[var(--bsi-dust)]">No cards are stored for this collection yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px]">
                        <thead>
                          <tr className="border-b border-burnt-orange/35 text-left text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                            <th className="px-3 py-3">Card</th>
                            <th className="px-3 py-3">Team</th>
                            <th className="px-3 py-3">Series</th>
                            <th className="px-3 py-3">Pos</th>
                            <th className="px-3 py-3">OVR</th>
                            <th className="px-3 py-3">Sell</th>
                            <th className="px-3 py-3">Captain</th>
                            <th className="px-3 py-3">Track</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.detail.cards.map((card) => {
                            const active = watchlist.includes(card.id);
                            return (
                              <tr key={card.id} className="border-b border-border-vintage text-sm text-[var(--bsi-bone)]">
                                <td className="px-3 py-3">
                                  <Link href={buildCardHref(card.id)} className="block transition-colors hover:text-burnt-orange">
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
                                <td className="px-3 py-3">{card.isCaptain ? 'Yes' : 'No'}</td>
                                <td className="px-3 py-3">
                                  <WatchlistButton active={active} onToggle={() => setWatchlist(toggleWatchlistCard(card.id))} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DataErrorBoundary>
      </ShowSurfaceFrame>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border-vintage bg-surface-dugout px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{label}</div>
      <div className="mt-2 font-mono text-2xl text-burnt-orange">{value.toLocaleString()}</div>
    </div>
  );
}
