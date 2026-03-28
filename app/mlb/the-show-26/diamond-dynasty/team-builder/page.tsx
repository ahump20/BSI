import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DiamondDynastyTeamBuilderClient } from '@/components/mlb-the-show/DiamondDynastyTeamBuilderClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Team Builder | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Build a Diamond Dynasty lineup, bench, rotation, bullpen, and captain core with live market costs, theme-team context, and local Parallel Mod assumptions.',
};

export default function DiamondDynastyTeamBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[var(--surface-scoreboard)]" />}>
      <DiamondDynastyTeamBuilderClient />
    </Suspense>
  );
}
