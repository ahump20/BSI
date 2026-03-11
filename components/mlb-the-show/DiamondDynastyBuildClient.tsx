'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout-ds/Footer';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { fetchBuild, type ShowBuildResponse } from '@/lib/mlb-the-show/client';
import { ShowSurfaceFrame, formatStubValue } from './shared';

export function DiamondDynastyBuildClient() {
  const searchParams = useSearchParams();
  const buildId = searchParams.get('id');
  const [data, setData] = useState<ShowBuildResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchBuild(buildId)
      .then((response) => {
        if (cancelled) return;
        setData(response);
      })
      .catch((responseError: unknown) => {
        if (cancelled) return;
        setError(responseError instanceof Error ? responseError.message : 'Unable to load build.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildId]);

  return (
    <div className="bsi-theme-baseball">
      <ShowSurfaceFrame
        eyebrow="Diamond Dynasty Build"
        title={data?.build.title ?? 'Shared Build'}
        description="Saved builds are public BSI records that store slot assignments, local Parallel assumptions, and summary math. That makes them portable now and embed-friendly later when this feature folds deeper into the MLB section."
        source={data?.meta.source}
        lastUpdated={data?.meta.fetched_at}
        degraded={Boolean(data?.meta.degraded)}
      >
        <DataErrorBoundary name="shared build">
          {!buildId ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">Missing Build Id</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">Open this page with a build id query parameter from the team builder share flow.</p>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="h-80 animate-pulse rounded-xl border border-[var(--border-vintage)] bg-[var(--surface-dugout)]" />
          ) : error || !data ? (
            <Card padding="lg">
              <CardContent className="space-y-3 px-0 pb-0 pt-0">
                <CardTitle size="sm">Build Unavailable</CardTitle>
                <p className="text-sm text-[var(--bsi-dust)]">{error ?? 'This build could not be loaded.'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric label="Total stub cost" value={formatStubValue(data.build.summary.totalStubCost)} />
                <Metric label="Average overall" value={String(data.build.summary.averageOverall)} />
                <Metric label="Captain fit count" value={String(data.build.summary.captainEligibleCount)} />
                <Metric label="Theme teams" value={data.build.summary.themeTeams.join(', ') || 'None'} />
              </section>

              <Card padding="lg">
                <CardTitle size="sm">Slot Assignments</CardTitle>
                <CardContent className="grid gap-3 px-0 pb-0 pt-4 md:grid-cols-2">
                  {data.build.cards.map((card) => (
                    <div key={`${card.slotId}:${card.cardId}`} className="rounded-lg border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{card.slotId}</div>
                      <div className="mt-2 text-sm font-semibold text-[var(--bsi-bone)]">{card.displayName}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--bsi-dust)]">
                        {card.team} • {card.primaryPosition} • P{card.localParallelLevel}
                      </div>
                      <div className="mt-1 text-xs text-[var(--bsi-dust)]">
                        {card.localParallelModLabel ?? 'No Parallel Mod'} • {formatStubValue(card.bestSellNow)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
    <div className="rounded-xl border border-[var(--border-vintage)] bg-[var(--surface-dugout)] px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[var(--bsi-bone)]">{value}</div>
    </div>
  );
}
