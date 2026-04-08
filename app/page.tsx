import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';
import { ogImage } from '@/lib/metadata';
import { websiteJsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Sports Intelligence, Put Simply — College Baseball, MLB, NFL, NBA, CFB',
  description:
    'The numbers behind what your eyes already tell you. Live scores, advanced analytics, and scouting intel across college baseball, MLB, NFL, NBA, and college football — put simply.',
  openGraph: {
    title: 'Blaze Sports Intel | Sports Intelligence, Put Simply',
    description:
      'The numbers behind what your eyes already tell you. Live scores, advanced analytics, and scouting intel across college baseball, MLB, NFL, NBA, and college football — put simply.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: ogImage('https://blazesportsintel.com/images/og-image.png', 'Blaze Sports Intel — Live Scores, Analytics & Editorial — College Baseball, MLB, NFL, NBA, CFB'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel | Sports Intelligence, Put Simply',
    description:
      'The numbers behind what your eyes already tell you. Live scores, analytics, and scouting intel across college baseball, MLB, NFL, NBA, and college football.',
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
