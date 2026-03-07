import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';
import { ogImage } from '@/lib/metadata';
import { websiteJsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | College Baseball Sabermetrics',
  description:
    'Free park-adjusted sabermetrics for D1 college baseball — wOBA, wRC+, FIP, park factors, conference strength. Updated every 6 hours. Plus live scores across MLB, NFL, NBA, and NCAA.',
  openGraph: {
    title: 'Blaze Sports Intel | College Baseball Sabermetrics',
    description:
      'Free park-adjusted sabermetrics for D1 college baseball — wOBA, wRC+, FIP, park factors, conference strength. Updated every 6 hours.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: ogImage('https://blazesportsintel.com/images/og-image.png', 'Blaze Sports Intel — College Baseball Sabermetrics'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel | College Baseball Sabermetrics',
    description:
      'Free park-adjusted sabermetrics for D1 college baseball. wOBA, wRC+, FIP, park factors. Updated every 6 hours.',
    images: ['https://blazesportsintel.com/images/og-image.png'],
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <HomePageClient />
    </>
  );
}
