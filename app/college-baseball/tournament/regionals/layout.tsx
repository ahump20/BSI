import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'NCAA Regional Projected Hosts | BSI',
  description:
    'Live projected regional hosts for NCAA D1 baseball based on current national rankings. Top 16 seeds host regionals.',
  openGraph: {
    title: 'NCAA Regional Projected Hosts | BSI',
    description:
      'Live projected regional hosts for NCAA D1 baseball based on current national rankings.',
    images: ogImage('/images/og-college-baseball.png'),
  },
};

export default function RegionalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
