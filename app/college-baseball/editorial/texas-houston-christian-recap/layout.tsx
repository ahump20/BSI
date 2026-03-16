import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Texas Midweek Recap: Houston Christian & USC Watch | Blaze Sports Intel',
  description:
    'Texas stays unbeaten through their midweek slate. USC and Texas remain the only undefeated Top 25 teams in the country. Full recap with box scores and analysis.',
  openGraph: {
    title: 'Texas Midweek Recap | Blaze Sports Intel',
    description:
      'Texas stays unbeaten. USC and Texas are the last two undefeated Top 25 teams standing.',
    type: 'article',
    images: ogImage('/images/og-college-baseball.png'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
