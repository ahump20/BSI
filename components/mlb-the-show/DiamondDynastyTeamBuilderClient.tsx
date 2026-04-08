'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardTitle, StatCard } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import {
  fetchShowCards,
  fetchShowCardDetail,
  fetchTeamBuilderReference,
  saveBuild,
  type ShowBuildResponse,
  type ShowCardsResponse,
} from '@/lib/mlb-the-show/client';
import { DD_PARALLEL_LEVELS, DD_PARALLEL_MODS, summarizeBuild } from '@/lib/mlb-the-show/roster';
import type { DDBuildCardSelection, ShowCardSummary, ShowMarketCurrent } from '@/lib/mlb-the-show/types';
import { ShowSurfaceFrame, buildCardHref, buildShareHref, formatCompactStub } from './shared';

type BuilderReference = Awaited<ReturnType<typeof fetchTeamBuilderReference>>;

export function DiamondDynastyTeamBuilderClient() {
  const searchParams = useSearchParams();
  const seedCardId = searchParams.get('card');
  const [reference, setReference] = useState<BuilderReference | null>(null);
  const [results, setResults] = useState<ShowCardsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [builderCollection, setBuilderCollection] = useState('');
  const [builderWbcOnly, setBuilderWbcOnly] = useState(false);
  const [builderCaptainOnly, setBuilderCaptainOnly] = useState(false);
  const [title, setTitle] = useState('BSI Diamond Dynasty Build');
  const [activeSlot, setActiveSlot] = useState<string>('captain');
  const [cardsBySlot, setCardsBySlot] = useState<Record<string, DDBuildCardSelection>>({});
  const [savedBuild, setSavedBuild] = useState<ShowBuildResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTeamBuilderReference()
      .then((response) => {
        if (cancelled) return;
        setReference(response);
        setActiveSlot(response.slots[0]?.key ?? 'captain');
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load team builder reference.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!reference) return;
    const slot = reference.slots.find((entry) => entry.key === activeSlot);
    const params = new URLSearchParams({ limit: '20', sort: 'sell_desc' });
    if (search) params.set('search', search);
    if (builderCollection) params.set('collection', builderCollection);
    if (builderWbcOnly) params.set('wbc_only', 'true');
    if (builderCaptainOnly) params.set('captain', 'true');
    if (slot && slot.accepts[0] !== 'ANY') params.set('position', slot.accepts[0]);

    let cancelled = false;
    setSearchLoading(true);

    fetchShowCards(params)
      .then((response) => {
        if (cancelled) return;
        setResults(response);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load builder search results.');
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSlot, builderCaptainOnly, builderCollection, builderWbcOnly, reference, search]);

  useEffect(() => {
    if (!seedCardId || !reference) return;
    fetchShowCardDetail(seedCardId)
      .then((response) => {
        const defaultSlot = response.detail.card.primaryPosition.toLowerCase();
        const matchingSlot = reference.slots.find((slot) => slot.key === defaultSlot || slot.accepts.includes(response.detail.card.primaryPosition));
        const slotKey = matchingSlot?.key ?? 'bench-1';
        assignCard(slotKey, response.detail.card, response.detail.market);
      })
      .catch(() => {
        // Ignore seed-card hydration failures.
      });
  }, [reference, seedCardId]);

  const selections = useMemo(() => Object.values(cardsBySlot), [cardsBySlot]);
  const summary = useMemo(() => summarizeBuild(selections), [selections]);
  const captainCard = useMemo(() => {
    const captainId = cardsBySlot.captain?.cardId;
    if (!captainId) return null;
    return reference?.captains.find((captain) => captain.id === captainId) ?? null;
  }, [cardsBySlot.captain?.cardId, reference?.captains]);
  const buildDiagnostics = useMemo(() => {
    const wbcCards = selections.filter((card) => {
      const fields = [card.series, card.themeTag ?? ''].join(' ').toUpperCase();
      return fields.includes('WBC') || fields.includes('WORLD BASEBALL CLASSIC');
    }).length;
    const redDiamondCards = selections.filter((card) => card.rarity.trim().toUpperCase() === 'RED DIAMOND').length;
    const handedness = summary.hitterHandedness;
    return {
      wbcCards,
      redDiamondCards,
      handednessLabel: `L ${handedness.left} • R ${handedness.right} • S ${handedness.switch}`,
    };
  }, [selections, summary.hitterHandedness]);

  function assignCard(slotId: string, card: ShowCardSummary, market: ShowMarketCurrent | null = null) {
    setCardsBySlot((current) => ({
      ...current,
      [slotId]: {
        slotId,
        cardId: card.id,
        displayName: card.name,
        team: card.team,
        primaryPosition: card.primaryPosition,
        secondaryPositions: card.secondaryPositions,
        overall: card.overall,
        bats: card.bats,
        bestSellNow: market?.bestSellNow ?? null,
        rarity: card.rarity,
        series: card.series,
        themeTag: card.team || null,
        localParallelLevel: current[slotId]?.localParallelLevel ?? 0,
        localParallelModLabel: current[slotId]?.localParallelModLabel ?? null,
      },
    }));
  }

  function updateSelection(slotId: string, patch: Partial<DDBuildCardSelection>) {
    setCardsBySlot((current) => {
      const existing = current[slotId];
      if (!existing) return current;
      return {
        ...current,
        [slotId]: {
          ...existing,
          ...patch,
        },
      };
    });
  }

  async function handleSaveBuild() {
    if (selections.length === 0) return;
    setSaving(true);
    try {
      const response = await saveBuild({
        title,
        captainCardId: cardsBySlot.captain?.cardId ?? null,
        cards: selections,
      });
      setSavedBuild(response);
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : 'Build could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  const note = reference?.meta.degraded
    ? 'Builder reference is in compatibility mode until official 26 public endpoints are verifiable. Local Parallel and watchlist state is still fully functional.'
    : 'Builder reference data is sourced from the BSI DD catalog and public The Show endpoints.';

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Diamond Dynasty Team Builder"
        title="Lineup, Rotation, Bullpen, Captain"
        description="Construct a full Diamond Dynasty roster with real card costs, captain fit, team-stack visibility, and local Parallel/Mod assumptions. Saved builds are public BSI records so they can be embedded later across the MLB ecosystem."
        source={reference?.meta.source}
        lastUpdated={reference?.meta.fetched_at}
        degraded={Boolean(reference?.meta.degraded)}
        compatibilityNote={note}
      >
        <DataErrorBoundary name="team builder">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-[0.66fr_0.34fr]">
              <div className="h-[680px] animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
              <div className="h-[680px] animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
            </div>
          ) : reference ? (
            <div className="grid gap-4 lg:grid-cols-[0.66fr_0.34fr]">
              <Card padding="lg">
                <CardTitle size="sm">Roster Board</CardTitle>
                <CardContent className="space-y-6 px-0 pb-0 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Build title</span>
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="w-full rounded-sm border border-border-vintage bg-surface-dugout px-3 py-2 text-sm text-[var(--bsi-bone)]"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSaveBuild}
                        disabled={saving || selections.length === 0}
                        className="rounded-sm border border-burnt-orange bg-burnt-orange/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-burnt-orange disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save public build'}
                      </button>
                    </div>
                  </div>

                  {savedBuild ? (
                    <div className="rounded-sm border border-burnt-orange/35 bg-burnt-orange/10 px-4 py-4 text-sm text-[var(--bsi-bone)]">
                      Build saved. Open the share view at{' '}
                      <Link className="text-burnt-orange" href={buildShareHref(savedBuild.build.buildId)}>
                        {buildShareHref(savedBuild.build.buildId)}
                      </Link>
                    </div>
                  ) : null}

                  <div className="space-y-6">
                    {groupSlots(reference.slots).map(([group, slots]) => (
                      <div key={group}>
                        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{group}</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {slots.map((slot) => {
                            const selection = cardsBySlot[slot.key];
                            const active = activeSlot === slot.key;
                            return (
                              <button
                                key={slot.key}
                                type="button"
                                onClick={() => setActiveSlot(slot.key)}
                                className={`rounded-sm border px-4 py-4 text-left transition-colors ${
                                  active
                                    ? 'border-burnt-orange bg-burnt-orange/10'
                                    : 'border-border-vintage bg-surface-dugout'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{slot.label}</div>
                                    <div className="mt-2 text-sm font-semibold text-[var(--bsi-bone)]">
                                      {selection ? selection.displayName : 'Open slot'}
                                    </div>
                                  </div>
                                  <div className="font-mono text-lg text-burnt-orange">{selection?.overall ?? '--'}</div>
                                </div>
                                {selection ? (
                                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <select
                                      value={selection.localParallelLevel}
                                      onChange={(event) => updateSelection(slot.key, {
                                        localParallelLevel: Number(event.target.value),
                                      })}
                                      className="rounded-sm border border-border-vintage bg-surface-scoreboard px-3 py-2 text-xs text-[var(--bsi-bone)]"
                                    >
                                      {DD_PARALLEL_LEVELS.map((level) => (
                                        <option key={level} value={level}>
                                          P{level}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={selection.localParallelModLabel ?? 'None'}
                                      onChange={(event) => updateSelection(slot.key, {
                                        localParallelModLabel: event.target.value === 'None' ? null : event.target.value,
                                      })}
                                      className="rounded-sm border border-border-vintage bg-surface-scoreboard px-3 py-2 text-xs text-[var(--bsi-bone)]"
                                    >
                                      {DD_PARALLEL_MODS.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="mt-3 text-xs text-[var(--bsi-dust)]">
                                    Accepts {slot.accepts.join(', ')}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card padding="lg">
                  <CardTitle size="sm">Build Summary</CardTitle>
                  <CardContent className="space-y-4 px-0 pb-0 pt-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                      <StatCard label="Total stub cost" value={formatCompactStub(summary.totalStubCost)} helperText="Based on best sell-now where available." />
                      <StatCard label="Average OVR" value={summary.averageOverall} helperText="Across all currently assigned cards." />
                      <StatCard label="Captain fit count" value={summary.captainEligibleCount} helperText="Cards with a current theme tag in the build." />
                      <StatCard label="Theme teams" value={summary.themeTeams.length ? summary.themeTeams.join(', ') : 'None'} helperText="Top team stacks in the build." />
                      <StatCard label="Handedness" value={buildDiagnostics.handednessLabel} helperText="Current hitter-side balance in the active build." />
                      <StatCard label="WBC cards" value={buildDiagnostics.wbcCards} helperText="Build slots whose stored tags explicitly reference WBC." />
                      <StatCard label="Red Diamond" value={buildDiagnostics.redDiamondCards} helperText="Current build count of Red Diamond rarity cards." />
                    </div>
                    {captainCard ? (
                      <div className="rounded-sm border border-border-vintage bg-surface-dugout px-4 py-4 text-sm text-[var(--bsi-dust)]">
                        <div className="font-semibold text-[var(--bsi-bone)]">{captainCard.name}</div>
                        <p className="mt-2">{captainCard.abilityDescription}</p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card padding="lg">
                  <CardTitle size="sm">Card Search</CardTitle>
                  <CardContent className="space-y-4 px-0 pb-0 pt-4">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search for cards"
                      className="w-full rounded-sm border border-border-vintage bg-surface-dugout px-3 py-2 text-sm text-[var(--bsi-bone)]"
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">Collection</span>
                        <select
                          value={builderCollection}
                          onChange={(event) => setBuilderCollection(event.target.value)}
                          className="w-full rounded-sm border border-border-vintage bg-surface-dugout px-3 py-2 text-sm text-[var(--bsi-bone)]"
                        >
                          <option value="">All</option>
                          {reference.collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="grid gap-3">
                        <label className="flex items-center gap-3 rounded-sm border border-border-vintage bg-surface-dugout px-3 py-3 text-sm text-[var(--bsi-bone)]">
                          <input type="checkbox" checked={builderWbcOnly} onChange={(event) => setBuilderWbcOnly(event.target.checked)} />
                          WBC-tagged only
                        </label>
                        <label className="flex items-center gap-3 rounded-sm border border-border-vintage bg-surface-dugout px-3 py-3 text-sm text-[var(--bsi-bone)]">
                          <input type="checkbox" checked={builderCaptainOnly} onChange={(event) => setBuilderCaptainOnly(event.target.checked)} />
                          Captain cards only
                        </label>
                      </div>
                    </div>

                    {searchLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="h-16 animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
                        ))}
                      </div>
                    ) : results?.cards.length ? (
                      <div className="space-y-3">
                        {results.cards.map((card) => (
                          <div
                            key={card.id}
                            className="rounded-sm border border-border-vintage bg-surface-dugout px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-sm font-semibold text-[var(--bsi-bone)]">{card.name}</div>
                                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                                  {card.rarity} • {card.team} • {card.primaryPosition}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-lg text-burnt-orange">{card.overall}</div>
                                <div className="text-xs text-[var(--bsi-dust)]">{formatCompactStub(card.market?.bestSellNow)}</div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-[var(--bsi-dust)]">
                              <span>Assign to {reference.slots.find((slot) => slot.key === activeSlot)?.label ?? activeSlot}</span>
                              <Link href={buildCardHref(card.id)} className="text-burnt-orange">
                                Detail
                              </Link>
                            </div>
                            <button
                              type="button"
                              onClick={() => assignCard(activeSlot, card, card.market)}
                              className="mt-3 rounded-sm border border-burnt-orange bg-burnt-orange/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-burnt-orange"
                            >
                              Assign card
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--bsi-dust)]">No cards matched the current slot and search term.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">Builder Unavailable</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">{error ?? 'Builder reference could not be loaded.'}</p>
              </CardContent>
            </Card>
          )}
        </DataErrorBoundary>
      </ShowSurfaceFrame>
    </div>
  );
}

function groupSlots(slots: BuilderReference['slots']) {
  const order = ['captain', 'lineup', 'bench', 'rotation', 'bullpen'] as const;
  const grouped = new Map<string, BuilderReference['slots']>();
  for (const slot of slots) {
    const existing = grouped.get(slot.group) ?? [];
    existing.push(slot);
    grouped.set(slot.group, existing);
  }
  return order.map((group) => [group, grouped.get(group) ?? []] as const);
}
