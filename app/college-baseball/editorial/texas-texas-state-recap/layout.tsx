import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Texas 15, Texas State 4: First Road Test, Same Answer | Blaze Sports Intel',
  description:
    'No. 2 Texas (16-0) beat Texas State 15-4 at Bobcat Ballpark in their first true road game of 2026. Casey Borba hit two home runs. Full box score and analysis.',
  alternates: { canonical: '/college-baseball/editorial/texas-texas-state-recap' },
  openGraph: {
    title: 'Texas 15, Texas State 4: Road Recap | Blaze Sports Intel',
    description:
      'Borba homers twice, Pack and Becerra go deep as Texas rolls to 16-0 in their first road test.',
    type: 'article',
    images: ogImage('/images/og/cbb-texas-week-3-recap.png'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
