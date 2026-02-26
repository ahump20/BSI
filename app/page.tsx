import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | College Baseball Intelligence & Multi-Sport Analytics',
  description:
    'College baseball roster-market intelligence, transfer portal tracking, and pro projections — plus live analytics across MLB, NFL, NBA, and college football. The depth ESPN doesn\u2019t build.',
  openGraph: {
    title: 'Blaze Sports Intel',
    description:
      'College baseball intelligence — roster-market data, transfer portal tracking, pro projections, and live multi-sport analytics.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description:
      'College baseball intelligence — roster-market data, transfer portal tracking, pro projections, and live multi-sport analytics.',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
