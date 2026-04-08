import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Texas Midweek Recap: Houston Christian & USC Watch | Blaze Sports Intel',
  description:
    'Texas stays unbeaten through their midweek slate. USC and Texas remain the only undefeated Top 25 teams in the country. Full recap with box scores and analysis.',
  alternates: { canonical: '/college-baseball/editorial/texas-houston-christian-recap' },
  openGraph: {
    title: 'Texas Midweek Recap | Blaze Sports Intel',
    description:
      'Texas stays unbeaten. USC and Texas are the last two undefeated Top 25 teams standing.',
    type: 'article',
    images: ogImage('/images/og/cbb-texas-houston-christian-preview.png'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
