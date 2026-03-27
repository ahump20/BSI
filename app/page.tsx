import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';
import { ogImage } from '@/lib/metadata';
import { websiteJsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | College Baseball Sabermetrics, Live Scores, and Editorial',
  description:
    'Park-adjusted sabermetrics, live scores, and original editorial for 330 D1 college baseball programs. Updated every 6 hours.',
  openGraph: {
    title: 'Blaze Sports Intel | College Baseball Sabermetrics, Live Scores, and Editorial',
    description:
      'Park-adjusted sabermetrics, live scores, and original editorial for 330 D1 college baseball programs. Updated every 6 hours.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: ogImage('https://blazesportsintel.com/images/og-image.png', 'Blaze Sports Intel — College Baseball Sabermetrics, Live Scores, and Editorial'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel | College Baseball Sabermetrics, Live Scores, and Editorial',
    description:
      'Park-adjusted sabermetrics, live scores, and original editorial for 330 D1 college baseball programs.',
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
