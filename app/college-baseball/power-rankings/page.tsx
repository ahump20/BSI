import type { Metadata } from 'next';
import PowerRankingsClient from './PowerRankingsClient';

export const metadata: Metadata = {
  title: 'BSI Power Rankings | College Baseball | Blaze Sports Intel',
  description:
    'Weekly college baseball power rankings computed from BSI Savant sabermetrics — wRC+, FIP, and strength of schedule. Not borrowed. Earned.',
  openGraph: {
    title: 'BSI Power Rankings | College Baseball',
    description:
      'BSI computes its own power rankings from proprietary sabermetric data. Updated when the analytics engine recomputes.',
  },
  alternates: { canonical: '/college-baseball/power-rankings' },
};

export default function PowerRankingsPage() {
  return <PowerRankingsClient />;
}
