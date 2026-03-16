'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';

interface ShowSurfaceFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  source?: string;
  lastUpdated?: string;
  degraded?: boolean;
  compatibilityNote?: string | null;
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: '/mlb/the-show-26/diamond-dynasty', label: 'Hub' },
  { href: '/mlb/the-show-26/diamond-dynasty/marketplace', label: 'Marketplace' },
  { href: '/mlb/the-show-26/diamond-dynasty/team-builder', label: 'Team Builder' },
  { href: '/mlb/the-show-26/diamond-dynasty/collections', label: 'Collections' },
  { href: '/mlb/the-show-26/diamond-dynasty/watchlist', label: 'Watchlist' },
] as const;

export function formatStubValue(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toLocaleString()} stubs`;
}

export function formatCompactStub(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function buildCardHref(cardId: string) {
  return `/mlb/the-show-26/diamond-dynasty/card?id=${encodeURIComponent(cardId)}`;
}

export function buildShareHref(buildId: string) {
  return `/mlb/the-show-26/diamond-dynasty/builds?id=${encodeURIComponent(buildId)}`;
}

export function buildCollectionHref(collectionId: string) {
  return `/mlb/the-show-26/diamond-dynasty/collections/view?id=${encodeURIComponent(collectionId)}`;
}

export function WatchlistButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
        active
          ? 'border-burnt-orange bg-burnt-orange/15 text-burnt-orange'
          : 'border-[var(--border-vintage)] bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:border-burnt-orange/40'
      }`}
    >
      <span>{active ? 'Tracked' : 'Track'}</span>
    </button>
  );
}

export function SurfaceNav() {
  return (
    <div className="flex flex-wrap gap-3">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-sm border border-[var(--border-vintage)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bsi-dust)] transition-colors hover:border-burnt-orange/40 hover:text-burnt-orange"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function ShowSurfaceFrame({
  eyebrow,
  title,
  description,
  source,
  lastUpdated,
  degraded = false,
  compatibilityNote,
  children,
}: ShowSurfaceFrameProps) {
  return (
    <>
      <section className="border-b border-[var(--border-vintage)] bg-[radial-gradient(circle_at_top,_rgba(191,87,0,0.16),_transparent_55%),linear-gradient(180deg,rgba(13,13,13,0.95),rgba(26,26,26,1))] py-12">
        <Container size="xl">
          <div className="mb-6 flex items-center gap-3 text-sm text-[var(--bsi-dust)]">
            <Link href="/mlb" className="hover:text-burnt-orange transition-colors">MLB</Link>
            <span>/</span>
            <Link href="/mlb/the-show-26" className="hover:text-burnt-orange transition-colors">The Show 26</Link>
            <span>/</span>
            <span>Diamond Dynasty</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-burnt-orange">{eyebrow}</div>
              <h1 className="font-display text-4xl font-bold uppercase tracking-display text-[var(--bsi-bone)] md:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--bsi-dust)] md:text-lg">{description}</p>
              <div className="mt-6">
                <SurfaceNav />
              </div>
            </div>

            <Card variant="elevated" padding="lg" className="border-burnt-orange/20">
              <CardTitle size="sm">Data Trust</CardTitle>
              <CardContent className="space-y-3 px-0 pb-0 pt-4">
                <DataFreshnessIndicator
                  source={source ?? 'Blaze Sports Intel'}
                  lastUpdated={lastUpdated ? new Date(lastUpdated) : undefined}
                  isCached={degraded}
                />
                <DataAttribution lastUpdated={lastUpdated ?? ''} source={source ?? 'Blaze Sports Intel'} />
                {compatibilityNote ? (
                  <p className="text-sm leading-relaxed text-[var(--bsi-dust)]">{compatibilityNote}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container size="xl">{children}</Container>
      </section>
    </>
  );
}
