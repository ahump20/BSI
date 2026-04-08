'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchShowCollections } from '@/lib/mlb-the-show/client';
import type { ShowCollectionSummary } from '@/lib/mlb-the-show/types';
import { ShowSurfaceFrame, buildCollectionHref, formatStubValue } from './shared';

export function DiamondDynastyCollectionsClient() {
  const [collections, setCollections] = useState<ShowCollectionSummary[]>([]);
  const [meta, setMeta] = useState<{ source?: string; fetched_at?: string; degraded?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShowCollections()
      .then((response) => {
        if (cancelled) return;
        setCollections(response.collections);
        setMeta(response.meta);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load collections.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Diamond Dynasty Collections"
        title="Progress Routes and Cost Bands"
        description="Collection awareness matters because DD players navigate by unlock path, not just by individual card lookup. This page groups the current card pool into series, sets, and sourceable acquisition-location surfaces so you can see where cost clusters are forming."
        source={meta?.source}
        lastUpdated={meta?.fetched_at}
        degraded={Boolean(meta?.degraded)}
        compatibilityNote="Collection groupings here are only built from sourceable public metadata. If an unlock path is not public or not machine-readable, it is intentionally not invented."
      >
        <DataErrorBoundary name="collections">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-sm border border-border-vintage bg-surface-dugout" />
              ))}
            </div>
          ) : error ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">Collections Unavailable</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">{error}</p>
              </CardContent>
            </Card>
          ) : collections.length === 0 ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">No Collections Yet</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">Collection data is still being ingested. The sync worker builds collection groupings from the card catalog — check back shortly.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection) => (
                <Card key={collection.id} padding="lg" className="h-full">
                  <CardContent className="space-y-4 px-0 pb-0 pt-0">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-burnt-orange">{collection.type}</div>
                      <h2 className="mt-2 font-display text-2xl uppercase tracking-display text-[var(--bsi-bone)]">{collection.name}</h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Metric label="Cards" value={collection.cardCount.toLocaleString()} />
                      <Metric label="Low cost" value={formatStubValue(collection.lowStubCost)} />
                    </div>
                    <p className="text-sm text-[var(--bsi-dust)]">
                      High-end cost band: {formatStubValue(collection.highStubCost)}.
                    </p>
                    <Link
                      href={buildCollectionHref(collection.id)}
                      className="inline-flex rounded-sm border border-border-vintage px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)] transition-colors hover:border-burnt-orange/40 hover:text-burnt-orange"
                    >
                      Open collection
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DataErrorBoundary>
      </ShowSurfaceFrame>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border-vintage bg-surface-dugout px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[var(--bsi-bone)]">{value}</div>
    </div>
  );
}
