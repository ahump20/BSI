'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { HomeLiveScores } from '@/components/home';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { useLiveScoresMeta, type LiveScoresMeta } from '@/lib/hooks';

const DEFAULT_META: LiveScoresMeta = {
  source: 'SportsDataIO + ESPN fallback',
  fetched_at: '',
  timezone: 'America/Chicago',
  note: 'Live score feeds refresh every 30 seconds when games are in progress.',
};

export default function LiveScoreboardsPage() {
  const { meta: liveScoresMeta } = useLiveScoresMeta(30000);
  const meta: LiveScoresMeta = { ...DEFAULT_META, ...(liveScoresMeta || {}) };

  const updatedLabel = useMemo(() => {
    const stamp = meta.fetched_at || meta.lastUpdated;
    if (!stamp) return 'Now';

    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: meta.timezone || 'America/Chicago',
      }).format(new Date(stamp));
    } catch {
      return stamp;
    }
  }, [meta.fetched_at, meta.lastUpdated, meta.timezone]);

  const sourceLabel = meta.source || meta.dataSource || DEFAULT_META.source;

  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-28">
          <Container>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display text-white">
                  Live <span className="text-gradient-blaze">Scoreboards</span>
                </h1>
                <p className="mt-2 text-text-secondary max-w-3xl">
                  Real-time scoreboards across MLB, NFL, NBA, and College Baseball with continuous
                  updates and clean game-state visibility.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard" className="btn-secondary px-4 py-2 rounded-lg">
                  Back to Dashboard
                </Link>
                <Badge variant="primary">Live Data</Badge>
              </div>
            </div>

            <Card padding="md" className="mb-6">
              <p className="text-sm text-text-secondary">
                Source: <span className="text-white font-medium">{sourceLabel}</span>
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Last updated: <span className="text-white font-medium">{updatedLabel}</span>
                <span className="text-text-tertiary"> ({meta.timezone || 'America/Chicago'})</span>
              </p>
              <p className="text-xs text-text-tertiary mt-2">{meta.note || DEFAULT_META.note}</p>
            </Card>

            <HomeLiveScores />
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
