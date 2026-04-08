import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

import { Card, CardContent, CardTitle } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'MLB The Show 26 Companion | Blaze Sports Intel',
  description:
    'Standalone Blaze Sports Intel companion routes for MLB The Show 26 with Diamond Dynasty market tracking, roster building, and collection-aware card research.',
};

const SURFACES = [
  {
    href: '/mlb/the-show-26/diamond-dynasty',
    title: 'Diamond Dynasty Command Center',
    description: 'Market overview, captain spotlight, collection routing, and current compatibility-mode data trust notes.',
  },
  {
    href: '/mlb/the-show-26/diamond-dynasty/marketplace',
    title: 'Marketplace Board',
    description: 'Filterable card market search with live buy/sell and spread visibility.',
  },
  {
    href: '/mlb/the-show-26/diamond-dynasty/team-builder',
    title: 'Team Builder',
    description: 'Lineup, bench, rotation, bullpen, captain, and local Parallel assumptions.',
  },
] as const;

export default function MLBTheShow26Page() {
  return (
    <div className="bsi-theme-baseball">
      <section className="border-b border-border-vintage bg-[radial-gradient(circle_at_top,_rgba(191,87,0,0.16),_transparent_55%),linear-gradient(180deg,rgba(13,13,13,0.95),rgba(26,26,26,1))] py-16">
        <Container size="xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-burnt-orange">Standalone Launch Surface</div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-display text-[var(--bsi-bone)] md:text-5xl">
            MLB The Show 26 on Blaze Sports Intel
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--bsi-dust)]">
            This surface is built to launch standalone now and slot deeper into the Blaze Sports Intel MLB ecosystem later without a second architecture pass. Everything here is Cloudflare-first, source-aware, and honest about what official 26 public data is and is not verifiable today.
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container size="xl">
          <div className="grid gap-4 md:grid-cols-3">
            {SURFACES.map((surface) => (
              <Link key={surface.href} href={surface.href} className="block">
                <Card padding="lg" variant="hover" className="h-full">
                  <CardContent className="space-y-3 px-0 pb-0 pt-0">
                    <CardTitle size="sm">{surface.title}</CardTitle>
                    <p className="text-sm leading-relaxed text-[var(--bsi-dust)]">{surface.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
