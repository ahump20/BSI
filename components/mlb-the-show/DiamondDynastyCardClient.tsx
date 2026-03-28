'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Footer } from '@/components/layout-ds/Footer';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchShowCardDetail, fetchShowCardHistory, fetchShowWatchEvents, type ShowCardDetailResponse, type ShowHistoryResponse } from '@/lib/mlb-the-show/client';
import { DD_PARALLEL_LEVELS, DD_PARALLEL_MODS } from '@/lib/mlb-the-show/roster';
import type { ShowWatchEvent } from '@/lib/mlb-the-show/types';
import { hasWatchlistCard, toggleWatchlistCard } from '@/lib/mlb-the-show/watchlist';
import { ShowSurfaceFrame, WatchlistButton, buildCollectionHref, formatStubValue } from './shared';

const HISTORY_RANGES = ['24h', '7d', '30d', 'all'] as const;
const HISTORY_METRICS = [
  { value: 'sell', label: 'Sell' },
  { value: 'buy', label: 'Buy' },
  { value: 'spread', label: 'Spread' },
  { value: 'sale', label: 'Completed sale' },
] as const;

export function DiamondDynastyCardClient() {
  const searchParams = useSearchParams();
  const cardId = searchParams.get('id');
  const [detail, setDetail] = useState<ShowCardDetailResponse | null>(null);
  const [history, setHistory] = useState<ShowHistoryResponse | null>(null);
  const [range, setRange] = useState<(typeof HISTORY_RANGES)[number]>('7d');
  const [metric, setMetric] = useState<(typeof HISTORY_METRICS)[number]['value']>('sell');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ShowWatchEvent[]>([]);
  const [parallelLevel, setParallelLevel] = useState<(typeof DD_PARALLEL_LEVELS)[number]>(0);
  const [parallelMod, setParallelMod] = useState<(typeof DD_PARALLEL_MODS)[number]>('None');
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!cardId) return;
    setTracked(hasWatchlistCard(cardId));
  }, [cardId]);

  useEffect(() => {
    if (!cardId) return;
    let cancelled = false;
    setLoading(true);
    fetchShowCardDetail(cardId)
      .then((response) => {
        if (cancelled) return;
        setDetail(response);
        setError(null);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load card detail.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  useEffect(() => {
    if (!cardId) return;
    let cancelled = false;
    setHistoryLoading(true);
    const params = new URLSearchParams({ range, metric });
    fetchShowCardHistory(cardId, params)
      .then((response) => {
        if (cancelled) return;
        setHistory(response);
      })
      .catch(() => {
        if (!cancelled) setHistory(null);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, metric, range]);

  useEffect(() => {
    if (!cardId) return;
    let cancelled = false;
    const params = new URLSearchParams({ card_id: cardId, limit: '6' });
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
  }, [cardId]);

  const chartData = useMemo(() => {
    return (history?.points ?? []).map((point) => ({
      label: point.label,
      value:
        metric === 'buy'
          ? point.bestBuyNow
          : metric === 'spread'
            ? point.spread
            : metric === 'sale'
              ? point.lastSalePrice
              : point.bestSellNow,
      seriesType: point.seriesType,
    }));
  }, [history?.points, metric]);
  const historySummary = history?.summary;

  if (!cardId) {
    return (
      <div className="bsi-theme-baseball">
        <ShowSurfaceFrame
          eyebrow="Card Detail"
          title="Choose a Card"
          description="This page expects a card id query parameter from the marketplace or watchlist surfaces."
          compatibilityNote="Card detail routing is query-param based right now so it remains static-export-safe inside the existing BSI deployment model."
        >
          <Card padding="lg">
            <CardContent className="space-y-3 px-0 pb-0 pt-0">
              <p className="text-sm text-[var(--bsi-dust)]">
                Start from the <Link href="/mlb/the-show-26/diamond-dynasty/marketplace" className="text-[var(--bsi-primary)]">marketplace board</Link> and open a card from there.
              </p>
            </CardContent>
          </Card>
        </ShowSurfaceFrame>
        <Footer />
      </div>
    );
  }

  const note = detail?.detail.sourceStatus.compatibilityMode
    ? 'Official 26 public item endpoints are not yet verifiably public, so this detail page is sourcing verified official MLB 25 item data in compatibility mode and layering BSI-captured history where available.'
    : 'Official public item and market history sources are configured for this card.';

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Diamond Dynasty Card Detail"
        title={detail?.detail.card.name ?? 'Card Detail'}
        description="Base card truth, market truth, collection context, and local build-side customization are separated on purpose. Nothing on this page pretends your local Parallel state is official marketplace data."
        source={detail?.meta.source}
        lastUpdated={detail?.meta.fetched_at}
        degraded={Boolean(detail?.meta.degraded)}
        compatibilityNote={note}
      >
        <DataErrorBoundary name="card detail">
          {loading ? (
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)]" />
              <div className="h-80 animate-pulse rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)]" />
            </div>
          ) : error || !detail ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">Card Unavailable</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">{error ?? 'This card could not be loaded.'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <Card padding="lg">
                  <CardContent className="grid gap-6 px-0 pb-0 pt-0 md:grid-cols-[160px_1fr]">
                    <div className="overflow-hidden rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)]">
                      {detail.detail.card.imageUrl ? (
                        <img
                          src={detail.detail.card.imageUrl}
                          alt={detail.detail.card.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-[var(--bsi-dust)]">No art</div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-primary)]">
                            {detail.detail.card.rarity} • {detail.detail.card.series}
                          </div>
                          <h2 className="mt-2 font-display text-3xl uppercase tracking-display text-[var(--bsi-bone)]">
                            {detail.detail.card.name}
                          </h2>
                          <p className="mt-2 text-sm text-[var(--bsi-dust)]">
                            {detail.detail.card.team} • {detail.detail.card.primaryPosition}
                            {detail.detail.card.secondaryPositions.length ? ` • ${detail.detail.card.secondaryPositions.join(', ')}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-3xl text-[var(--bsi-primary)]">{detail.detail.card.overall}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Overall</div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Metric label="Best Sell" value={formatStubValue(detail.detail.market?.bestSellNow)} />
                        <Metric label="Best Buy" value={formatStubValue(detail.detail.market?.bestBuyNow)} />
                        <Metric label="Spread" value={detail.detail.market?.spread !== null ? `${detail.detail.market?.spread?.toLocaleString()} stubs` : 'N/A'} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <WatchlistButton
                          active={tracked}
                          onToggle={() => setTracked(Boolean(cardId && toggleWatchlistCard(cardId).includes(cardId)))}
                        />
                        <Link
                          href={`/mlb/the-show-26/diamond-dynasty/team-builder?card=${encodeURIComponent(detail.detail.card.id)}`}
                          className="rounded-sm border border-[var(--border-vintage)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)] transition-colors hover:border-[var(--bsi-primary)]/40 hover:text-[var(--bsi-primary)]"
                        >
                          Add to build
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card padding="lg">
                  <CardTitle size="sm">Build-Side Parallel State</CardTitle>
                  <CardContent className="space-y-4 px-0 pb-0 pt-4">
                    <p className="text-sm leading-relaxed text-[var(--bsi-dust)]">
                      Parallel progression and Parallel Mods are local build assumptions here unless public official 26 account-accessible surfaces expose them directly. They never overwrite the canonical marketplace record.
                    </p>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Parallel level</span>
                      <select
                        value={parallelLevel}
                        onChange={(event) => setParallelLevel(Number(event.target.value) as (typeof DD_PARALLEL_LEVELS)[number])}
                        className="w-full rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-2 text-sm text-[var(--bsi-bone)]"
                      >
                        {DD_PARALLEL_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            P{level}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Parallel Mod</span>
                      <select
                        value={parallelMod}
                        onChange={(event) => setParallelMod(event.target.value as (typeof DD_PARALLEL_MODS)[number])}
                        className="w-full rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-3 py-2 text-sm text-[var(--bsi-bone)]"
                      >
                        {DD_PARALLEL_MODS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-4 text-sm text-[var(--bsi-dust)]">
                      Local build state: P{parallelLevel} • {parallelMod}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Card padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle size="sm">Price History</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {HISTORY_RANGES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setRange(option)}
                          className={`rounded-sm border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            range === option
                              ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/15 text-[var(--bsi-primary)]'
                              : 'border-[var(--border-vintage)] text-[var(--bsi-dust)]'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CardContent className="px-0 pb-0 pt-4">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {HISTORY_METRICS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setMetric(option.value)}
                          className={`rounded-sm border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            metric === option.value
                              ? 'border-[var(--bsi-primary)] bg-[var(--bsi-primary)]/15 text-[var(--bsi-primary)]'
                              : 'border-[var(--border-vintage)] text-[var(--bsi-dust)]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {historyLoading ? (
                      <div className="h-72 animate-pulse rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)]" />
                    ) : chartData.length === 0 ? (
                      <p className="text-sm text-[var(--bsi-dust)]">No history points are available for this card yet.</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <Metric label="Range high" value={formatStubValue(historySummary?.highValue)} />
                          <Metric label="Range low" value={formatStubValue(historySummary?.lowValue)} />
                          <Metric label="Delta" value={historySummary?.deltaValue !== null && historySummary?.deltaValue !== undefined ? `${historySummary.deltaValue.toLocaleString()} stubs` : 'N/A'} />
                          <Metric label="Volatility" value={historySummary?.volatility !== null && historySummary?.volatility !== undefined ? historySummary.volatility.toFixed(1) : 'N/A'} />
                        </div>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid stroke="rgba(245,240,235,0.08)" vertical={false} />
                              <XAxis dataKey="label" tick={{ fill: '#b7a999', fontSize: 11 }} minTickGap={24} />
                              <YAxis tick={{ fill: '#b7a999', fontSize: 11 }} />
                              <Tooltip
                                formatter={(value: number | null) => (value === null ? 'N/A' : `${value.toLocaleString()} stubs`)}
                                contentStyle={{
                                  backgroundColor: '#1A1A1A',
                                  border: '1px solid rgba(191,87,0,0.35)',
                                  color: '#F5F0EB',
                                }}
                              />
                              <Line type="monotone" dataKey="value" stroke="#BF5700" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card padding="lg">
                  <CardTitle size="sm">Acquisition and Collections</CardTitle>
                  <CardContent className="space-y-5 px-0 pb-0 pt-4">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Acquisition paths</div>
                      <div className="flex flex-wrap gap-2">
                        {detail.detail.acquisitionPaths.length ? (
                          detail.detail.acquisitionPaths.map((path) => (
                            <span key={path.label} className="rounded-sm border border-[var(--border-vintage)] px-3 py-1 text-xs text-[var(--bsi-bone)]">
                              {path.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-[var(--bsi-dust)]">No verified acquisition path surfaced by the current source.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Collection relationships</div>
                      <div className="space-y-2">
                        {detail.detail.collections.length ? (
                          detail.detail.collections.map((collection) => (
                            <div key={collection.id} className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-3">
                              <Link href={buildCollectionHref(collection.id)} className="text-sm font-semibold text-[var(--bsi-bone)] transition-colors hover:text-[var(--bsi-primary)]">
                                {collection.name}
                              </Link>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                                {collection.type} • {collection.cardCount} cards • {formatStubValue(collection.lowStubCost)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-[var(--bsi-dust)]">No collection link is stored for this card yet.</span>
                        )}
                      </div>
                    </div>

                    {detail.detail.captain ? (
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Captain ability</div>
                        <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-4">
                          <div className="text-sm font-semibold text-[var(--bsi-bone)]">{detail.detail.captain.abilityName}</div>
                          <p className="mt-2 text-sm text-[var(--bsi-dust)]">{detail.detail.captain.abilityDescription}</p>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Recent market events</div>
                      <div className="space-y-2">
                        {events.length ? (
                          events.map((event) => (
                            <div key={event.eventId} className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-3">
                              <div className="text-sm font-semibold text-[var(--bsi-bone)]">{event.eventLabel}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                                {event.deltaValue !== null ? `${event.deltaValue > 0 ? '+' : ''}${event.deltaValue.toLocaleString()} stubs` : 'N/A'} • {new Date(event.triggeredAt).toLocaleString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-[var(--bsi-dust)]">No watch-event triggers have been recorded for this card yet.</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric label="Contact L" value={String(detail.detail.card.attributes.contactLeft)} />
                <Metric label="Contact R" value={String(detail.detail.card.attributes.contactRight)} />
                <Metric label="Power L" value={String(detail.detail.card.attributes.powerLeft)} />
                <Metric label="Power R" value={String(detail.detail.card.attributes.powerRight)} />
                <Metric label="Fielding" value={String(detail.detail.card.attributes.fieldingAbility)} />
                <Metric label="Arm" value={String(detail.detail.card.attributes.armStrength)} />
                <Metric label="Reaction" value={String(detail.detail.card.attributes.reactionTime)} />
                <Metric label="Speed" value={String(detail.detail.card.attributes.speed)} />
              </section>
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
    <div className="rounded-sm border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{label}</div>
      <div className="mt-2 font-mono text-2xl text-[var(--bsi-primary)]">{value}</div>
    </div>
  );
}
