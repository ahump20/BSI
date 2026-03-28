import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DiamondDynastyCardClient } from '@/components/mlb-the-show/DiamondDynastyCardClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Card Detail | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Card-level Diamond Dynasty detail with base attributes, official daily history when sourceable, BSI intraday market tracking, acquisition paths, and collection relationships.',
};

export default function DiamondDynastyCardPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[var(--surface-scoreboard)]" />}>
      <DiamondDynastyCardClient />
    </Suspense>
  );
}
