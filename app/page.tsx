import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';
import { ogImage } from '@/lib/metadata';
import { websiteJsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Every Athlete Deserves to Be Seen — College Baseball, MLB, NFL, NBA, CFB',
  description:
    'Advanced analytics and live scores across college baseball, MLB, NFL, NBA, and college football — built for the athletes, programs, and fans that mainstream media overlook.',
  openGraph: {
    title: 'Blaze Sports Intel | Every Athlete Deserves to Be Seen',
    description:
      'Advanced analytics and live scores across college baseball, MLB, NFL, NBA, and college football — built for the athletes, programs, and fans that mainstream media overlook.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: ogImage('https://blazesportsintel.com/images/og-image.png', 'Blaze Sports Intel — Live Scores, Analytics & Editorial — College Baseball, MLB, NFL, NBA, CFB'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel | Every Athlete Deserves to Be Seen',
    description:
      'Advanced analytics and live scores across college baseball, MLB, NFL, NBA, and college football — built for the athletes, programs, and fans that mainstream media overlook.',
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
