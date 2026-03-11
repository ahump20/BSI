import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';
import { ogImage } from '@/lib/metadata';
import { websiteJsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Live Scores, Analytics, and Editorial Across Five Sports',
  description:
    'Live scores, editorial, and advanced analytics across college baseball, MLB, NFL, NBA, and college football — with park-adjusted sabermetrics at the core.',
  openGraph: {
    title: 'Blaze Sports Intel | Live Scores, Analytics, and Editorial Across Five Sports',
    description:
      'Live scores, editorial, and advanced analytics across college baseball, MLB, NFL, NBA, and college football — with park-adjusted sabermetrics at the core.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: ogImage('https://blazesportsintel.com/images/og-image.png', 'Blaze Sports Intel — Live Scores, Analytics, and Editorial Across Five Sports'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel | Live Scores, Analytics, and Editorial Across Five Sports',
    description:
      'Live scores, editorial, and advanced analytics across college baseball, MLB, NFL, NBA, and college football.',
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
