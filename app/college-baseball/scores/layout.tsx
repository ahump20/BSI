import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball Scores | Blaze Sports Intel',
  description: 'Live NCAA Division I baseball scores with real-time updates, box scores, and line scores across all D1 conferences.',
  alternates: { canonical: '/college-baseball/scores' },
  openGraph: {
    title: 'College Baseball Scores | Blaze Sports Intel',
    description: 'Live NCAA baseball scores with real-time updates.',
   images: ogImage('/images/og-college-baseball.png') },
};

export default function CollegeBaseballScoresLayout({ children }: { children: ReactNode }) {
  return children;
}
