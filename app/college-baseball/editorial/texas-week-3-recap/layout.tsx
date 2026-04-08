import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Texas Week 3 Recap: Swept, Celebrated, Still Perfect | Blaze Sports Intel',
  description:
    'Texas went 3-0 at the BRUCE BOLT College Classic — beating No. 9 Coastal Carolina, Baylor, and Ohio State to move to 11-0. The only undefeated Top 25 team. Full recap and box scores.',
  alternates: { canonical: '/college-baseball/editorial/texas-week-3-recap' },
  openGraph: {
    title: 'Texas Week 3 Recap: Still Perfect at 11-0 | Blaze Sports Intel',
    description:
      'Texas swept the BRUCE BOLT Classic, topping Coastal Carolina 8-1, Baylor 5-2, Ohio State 10-3.',
    type: 'article',
    images: ogImage('/images/og/cbb-texas-week-3-recap.png'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
