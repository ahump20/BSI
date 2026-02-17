import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Baseball Rankings | Blaze Sports Intel',
  description: 'D1 college baseball top-25 rankings with records, movement, and conference context from trusted polling sources.',
  alternates: { canonical: '/college-baseball/rankings' },
};

export default function CollegeBaseballRankingsLayout({ children }: { children: ReactNode }) {
  return children;
}
