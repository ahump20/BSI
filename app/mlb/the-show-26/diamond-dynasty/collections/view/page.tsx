import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DiamondDynastyCollectionDetailClient } from '@/components/mlb-the-show/DiamondDynastyCollectionDetailClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Collection Detail | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Collection drilldown for Diamond Dynasty with card membership, visible market bands, WBC-tagged coverage, and captain-aware filtering inside Blaze Sports Intel.',
};

export default function DiamondDynastyCollectionDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[var(--surface-scoreboard)]" />}>
      <DiamondDynastyCollectionDetailClient />
    </Suspense>
  );
}
