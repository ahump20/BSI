'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardTitle, StatCard } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchShowOverview, fetchShowWatchEvents, type ShowMarketOverviewResponse } from '@/lib/mlb-the-show/client';
import type { ShowWatchEvent } from '@/lib/mlb-the-show/types';
import { ShowSurfaceFrame, buildCardHref, buildCollectionHref, formatCompactStub, formatStubValue } from './shared';

const FEATURE_LINKS = [
  {
    href: '/mlb/the-show-26/diamond-dynasty/marketplace',
    title: 'Marketplace Tracker',
    description: 'Live compatibility-mode buy/sell board, WBC filters, collection tags, and spread visibility.',
  },
  {
    href: '/mlb/the-show-26/diamond-dynasty/team-builder',
    title: 'Team Builder',
    description: 'Lineup, bench, rotation, bullpen, captain slot, local Parallel Mods, and stub-cost planning.',
  },
  {
    href: '/mlb/the-show-26/diamond-dynasty/collections',
    title: 'Collections',
    description: 'Series, set, and acquisition-path surfaces derived from sourceable card metadata and market cost.',
  },
  {
    href: '/mlb/the-show-26/diamond-dynasty/watchlist',
    title: 'Watchlist',
    description: 'Local watchlist backed by live card detail pulls so you can monitor price movement without account auth.',
  },
] as const;

export function DiamondDynastyHubClient() {
  const [data, setData] = useState<ShowMarketOverviewResponse | null>(null);
  const [events, setEvents] = useState<ShowWatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShowOverview()
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setError(null);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load Diamond Dynasty market overview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchShowWatchEvents(new URLSearchParams({ limit: '6' }))
      .then((response) => {
        if (cancelled) return;
        setEvents(response.events);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hubStats = useMemo(() => {
    const overviewCards = [...(data?.overview.topSellNow ?? []), ...(data?.overview.topBuyNow ?? []), ...(data?.overview.newlyTracked ?? [])];
    const redDiamondCards = overviewCards.filter((card) => card.rarity.trim().toUpperCase() === 'RED DIAMOND').length;
    const wbcCards = overviewCards.filter((card) => {
      const fields = [card.series, card.setName ?? '', ...card.locations].join(' ').toUpperCase();
      return fields.includes('WBC') || fields.includes('WORLD BASEBALL CLASSIC');
    }).length;
    return { redDiamondCards, wbcCards };
  }, [data?.overview.newlyTracked, data?.overview.topBuyNow, data?.overview.topSellNow]);

  const note = data?.meta.source_status.compatibilityMode
    ? 'Official MLB The Show 26 public endpoints are not verifiably public yet. This surface is live against the official MLB 25 public The Show endpoints in compatibility mode until 26 endpoints are confirmed.'
    : 'Official The Show public data is configured for this surface.';

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="MLB The Show 26"
        title="Diamond Dynasty Command Center"
        description="A Blaze Sports Intel companion surface for Diamond Dynasty roster construction, market tracking, collection routing, and card-level acquisition context. Built on Cloudflare-first primitives so it can slide into the main MLB ecosystem later without a rewrite."
        source={data?.meta.source}
        lastUpdated={data?.meta.fetched_at}
        degraded={Boolean(data?.meta.degraded)}
        compatibilityNote={note}
      >
        <DataErrorBoundary name="Diamond Dynasty hub">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
              ))}
            </div>
          ) : error ? (
            <Card padding="lg">
              <CardContent className="space-y-3">
                <CardTitle size="sm">Hub Unavailable</CardTitle>
                <p className="text-sm text-bsi-dust">{error}</p>
              </CardContent>
            </Card>
          ) : data ? (
            <div className="space-y-10">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tracked Cards" value={data.overview.totalCards.toLocaleString()} helperText="Cards currently indexed in D1 or fallback catalog." />
                <StatCard label="Sellable Cards" value={data.overview.sellableCards.toLocaleString()} helperText="Cards with market eligibility based on current source data." />
                <StatCard label="Collections" value={data.collections.length.toLocaleString()} helperText="Series, set, and location-derived collection surfaces." />
                <StatCard label="Recent Events" value={events.length} helperText="Newest watch-event triggers recorded from market movement." />
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Compatibility Mode" value={data.overview.compatibilityMode ? 'On' : 'Off'} helperText="Uses official MLB 25 endpoints until official 26 host is verifiable." />
                <StatCard label="Red Diamond Signal" value={hubStats.redDiamondCards} helperText="Visible Red Diamond cards inside current overview slices." />
                <StatCard label="WBC Signal" value={hubStats.wbcCards} helperText="Visible WBC-tagged cards inside current overview slices." />
                <StatCard label="Captain Spotlight" value={data.captains.length} helperText="Captain cards currently surfaced on the hub." />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <Card padding="lg">
                  <CardTitle size="sm">Most Expensive Sell Orders</CardTitle>
                  <CardContent className="space-y-3 px-0 pb-0 pt-4">
                    {data.overview.topSellNow.slice(0, 6).map((card) => (
                      <Link
                        key={card.id}
                        href={buildCardHref(card.id)}
                        className="flex items-center justify-between rounded-sm border border-border-vintage bg-surface-dugout px-4 py-3 transition-colors hover:border-burnt-orange/35"
                      >
                        <div>
                          <div className="text-sm font-semibold text-bsi-bone">{card.name}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-bsi-dust">
                            {card.rarity} • {card.team} • {card.primaryPosition}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg text-burnt-orange">{formatCompactStub(card.market?.bestSellNow)}</div>
                          <div className="text-xs text-bsi-dust">{card.market?.spread !== null ? `Spread ${card.market?.spread?.toLocaleString()}` : 'Spread N/A'}</div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card padding="lg">
                  <CardTitle size="sm">Captain Spotlight</CardTitle>
                  <CardContent className="space-y-3 px-0 pb-0 pt-4">
                    {data.captains.slice(0, 6).map((captain) => (
                      <div
                        key={captain.id}
                        className="rounded-sm border border-border-vintage bg-surface-dugout px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-bsi-bone">{captain.name}</div>
                            <div className="text-xs uppercase tracking-[0.18em] text-bsi-dust">
                              {captain.team} • {captain.position}
                            </div>
                          </div>
                          <div className="font-mono text-lg text-burnt-orange">{captain.overall}</div>
                        </div>
                        <p className="mt-2 text-sm text-bsi-dust">{captain.abilityDescription}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <Card padding="lg">
                  <CardTitle size="sm">Collection Surface</CardTitle>
                  <CardContent className="space-y-3 px-0 pb-0 pt-4">
                    {data.collections.slice(0, 8).map((collection) => (
                      <Link
                        key={collection.id}
                        href={buildCollectionHref(collection.id)}
                        className="flex items-center justify-between rounded-sm border border-border-vintage bg-surface-dugout px-4 py-3 transition-colors hover:border-burnt-orange/35"
                      >
                        <div>
                          <div className="text-sm font-semibold text-bsi-bone">{collection.name}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-bsi-dust">
                            {collection.type} • {collection.cardCount} cards
                          </div>
                        </div>
                        <div className="text-right text-xs text-bsi-dust">
                          <div>{formatStubValue(collection.lowStubCost)}</div>
                          <div>{formatStubValue(collection.highStubCost)}</div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <Card padding="lg">
                  <CardTitle size="sm">Recent Market Triggers</CardTitle>
                  <CardContent className="space-y-3 px-0 pb-0 pt-4">
                    {events.length ? (
                      events.map((event) => (
                        <Link
                          key={event.eventId}
                          href={buildCardHref(event.cardId)}
                          className="block rounded-sm border border-border-vintage bg-surface-dugout px-4 py-3 transition-colors hover:border-burnt-orange/35"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold text-bsi-bone">{event.cardName}</div>
                              <div className="text-xs uppercase tracking-[0.18em] text-burnt-orange">{event.eventLabel}</div>
                            </div>
                            <div className="text-right text-xs text-bsi-dust">
                              <div>{event.deltaValue !== null ? `${event.deltaValue > 0 ? '+' : ''}${event.deltaValue.toLocaleString()} stubs` : 'N/A'}</div>
                              <div>{new Date(event.triggeredAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-bsi-dust">No watch-event triggers have been recorded yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card padding="lg">
                  <CardTitle size="sm">What This Surface Handles Now</CardTitle>
                  <CardContent className="grid gap-3 px-0 pb-0 pt-4 md:grid-cols-2">
                    {FEATURE_LINKS.map((feature) => (
                      <Link
                        key={feature.href}
                        href={feature.href}
                        className="rounded-sm border border-border-vintage bg-surface-dugout px-4 py-4 transition-colors hover:border-burnt-orange/35"
                      >
                        <div className="text-sm font-semibold text-bsi-bone">{feature.title}</div>
                        <p className="mt-2 text-sm leading-relaxed text-bsi-dust">{feature.description}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          ) : null}
        </DataErrorBoundary>
      </ShowSurfaceFrame>
    </div>
  );
}
