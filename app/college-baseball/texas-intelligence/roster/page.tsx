import type { Metadata } from 'next';
import TexasRosterClient from './TexasRosterClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Longhorns Roster — Advanced Metrics | BSI',
  description:
    'Full Texas Longhorns baseball roster with player-level sabermetrics: wOBA, wRC+, FIP, K/BB, and position group breakdowns.',
};

export default function TexasRosterPage() {
  return <TexasRosterClient />;
}
