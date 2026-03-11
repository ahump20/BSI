'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout-ds/Footer';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchShowCardDetail, fetchShowWatchEvents, type ShowCardDetailResponse } from '@/lib/mlb-the-show/client';
import type { ShowWatchEvent } from '@/lib/mlb-the-show/types';
import { getWatchlistIds, toggleWatchlistCard } from '@/lib/mlb-the-show/watchlist';
import { ShowSurfaceFrame, WatchlistButton, buildCardHref, formatStubValue } from './shared';

export function DiamondDynastyWatchlistClient() {
  const [ids, setIds] = useState<string[]>([]);
  const [details, setDetails] = useState<ShowCardDetailResponse[]>([]);
  const [events, setEvents] = useState<ShowWatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextIds = getWatchlistIds();
    setIds(nextIds);
    if (nextIds.length === 0) {
      setDetails([]);
      setEvents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all(nextIds.map((id) => fetchShowCardDetail(id).catch(() => null)))
      .then((responses) => {
        if (cancelled) return;
        setDetails(responses.filter((value): value is ShowCardDetailResponse => Boolean(value)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ card_ids: ids.join(','), limit: '12' });
    fetchShowWatchEvents(params)
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
  }, [ids]);

  const latestEventsByCard = useMemo(() => {
    const next = new Map<string, ShowWatchEvent>();
    for (const event of events) {
      if (!next.has(event.cardId)) next.set(event.cardId, event);
    }
    return next;
  }, [events]);

  const meta = details[0]?.meta;
  const note = meta?.degraded
    ? 'Watchlist cards are still being served with stale-safe fallback rules where necessary.'
    : 'Watchlist pulls each saved card through the same source-aware card detail endpoint used across the feature.';

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Diamond Dynasty Watchlist"
        title="Track the Cards You Actually Care About"
        description="The watchlist is local-first right now, which keeps it launchable inside the current BSI stack without adding account auth. The server side still tracks market events and history, so later account-linked alerts can plug into the same data layer."
        source={meta?.source}
        lastUpdated={meta?.fetched_at}
        degraded={Boolean(meta?.degraded)}
        compatibilityNote={note}
      >
        <DataErrorBoundary name="watchlist">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-xl border border-[var(--border-vintage)] bg-[var(--surface-dugout)]" />
              ))}
            </div>
          ) : ids.length === 0 ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">No Tracked Cards Yet</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">
                  Add cards from the <Link href="/mlb/the-show-26/diamond-dynasty/marketplace" className="text-burnt-orange">marketplace board</Link> or individual card pages.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card padding="lg">
                <CardTitle size="sm">Recent Market Activity</CardTitle>
                <CardContent className="space-y-3 px-0 pb-0 pt-4">
                  {events.length ? (
                    events.slice(0, 6).map((event) => (
                      <div key={event.eventId} className="rounded-lg border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-3">
                        <div className="text-sm font-semibold text-[var(--bsi-bone)]">{event.cardName}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-burnt-orange">{event.eventLabel}</div>
                        <div className="mt-1 text-xs text-[var(--bsi-dust)]">
                          {event.deltaValue !== null ? `${event.deltaValue > 0 ? '+' : ''}${event.deltaValue.toLocaleString()} stubs` : 'N/A'} • {new Date(event.triggeredAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--bsi-dust)]">No recent watch events have fired for your tracked cards yet.</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {details.map((detail) => {
                  const latestEvent = latestEventsByCard.get(detail.detail.card.id);
                  return (
                    <Card key={detail.detail.card.id} padding="lg">
                      <CardContent className="space-y-4 px-0 pb-0 pt-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-burnt-orange">
                              {detail.detail.card.rarity} • {detail.detail.card.series}
                            </div>
                            <h2 className="mt-2 text-lg font-semibold text-[var(--bsi-bone)]">{detail.detail.card.name}</h2>
                            <p className="mt-1 text-sm text-[var(--bsi-dust)]">
                              {detail.detail.card.team} • {detail.detail.card.primaryPosition}
                            </p>
                          </div>
                          <div className="font-mono text-2xl text-burnt-orange">{detail.detail.card.overall}</div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <Metric label="Best sell" value={formatStubValue(detail.detail.market?.bestSellNow)} />
                          <Metric label="Best buy" value={formatStubValue(detail.detail.market?.bestBuyNow)} />
                        </div>

                        {latestEvent ? (
                          <div className="rounded-lg border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.18em] text-burnt-orange">{latestEvent.eventLabel}</div>
                            <div className="mt-1 text-sm text-[var(--bsi-dust)]">
                              {latestEvent.deltaValue !== null ? `${latestEvent.deltaValue > 0 ? '+' : ''}${latestEvent.deltaValue.toLocaleString()} stubs` : 'N/A'}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between gap-3">
                          <Link href={buildCardHref(detail.detail.card.id)} className="text-sm font-semibold text-burnt-orange">
                            Open detail
                          </Link>
                          <WatchlistButton
                            active
                            onToggle={() => {
                              const next = toggleWatchlistCard(detail.detail.card.id);
                              setIds(next);
                              setDetails((current) => current.filter((item) => item.detail.card.id !== detail.detail.card.id));
                              setEvents((current) => current.filter((event) => event.cardId !== detail.detail.card.id));
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DataErrorBoundary>
      </ShowSurfaceFrame>
      <Footer />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[var(--bsi-bone)]">{value}</div>
    </div>
  );
}
