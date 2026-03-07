import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball News | Blaze Sports Intel',
  description: 'Latest NCAA Division I baseball news, headlines, coaching changes, and recruiting updates across all D1 conferences.',
  alternates: { canonical: '/college-baseball/news' },
  openGraph: {
    title: 'College Baseball News | Blaze Sports Intel',
    description: 'NCAA D1 baseball news and headlines.',
   images: ogImage('/images/og-college-baseball.png') },
};

export default function CollegeBaseballNewsLayout({ children }: { children: ReactNode }) {
  return children;
}
