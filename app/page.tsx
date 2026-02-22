import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Independent Sports Analytics',
  description:
    'Real-time MLB, NFL, NBA, and NCAA analytics built by a fan who got tired of waiting. Live scores, deep editorial, and data-driven coverage the big networks skip.',
  openGraph: {
    title: 'Blaze Sports Intel',
    description:
      'Independent sports analytics — live scores, editorial depth, and real data across 6 sports.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description:
      'Independent sports analytics — live scores, editorial depth, and real data across 6 sports.',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
