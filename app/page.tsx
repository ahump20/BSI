import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';
import { ogImage } from '@/lib/metadata';
import { websiteJsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Live Scores, Sabermetrics, and Original Coverage',
  description:
    'Live scores, park-adjusted sabermetrics, and original editorial across college baseball, MLB, NFL, NBA, and college football. 330 D1 programs covered.',
  openGraph: {
    title: 'Blaze Sports Intel | Live Scores, Sabermetrics, and Original Coverage',
    description:
      'Live scores, park-adjusted sabermetrics, and original editorial across college baseball, MLB, NFL, NBA, and college football. 330 D1 programs covered.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: ogImage('https://blazesportsintel.com/images/og-image.png', 'Blaze Sports Intel — Live Scores, Sabermetrics, and Original Coverage'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel | Live Scores, Sabermetrics, and Original Coverage',
    description:
      'Live scores, park-adjusted sabermetrics, and original editorial across college baseball, MLB, NFL, NBA, and college football.',
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
