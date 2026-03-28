import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DiamondDynastyBuildClient } from '@/components/mlb-the-show/DiamondDynastyBuildClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Shared Build | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Open a shared Diamond Dynasty build created inside Blaze Sports Intel, with slot assignments, team summary, and local Parallel assumptions preserved.',
};

export default function DiamondDynastyBuildPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[var(--surface-scoreboard)]" />}>
      <DiamondDynastyBuildClient />
    </Suspense>
  );
}
