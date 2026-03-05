import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Old-School Instinct, New-School Metrics',
  description:
    'The gap between interest in the game and access to meaningful analytics is the product. College baseball, MLB, NFL, NBA, and college football — covered like it matters.',
  openGraph: {
    title: 'Blaze Sports Intel',
    description:
      'Old-school scouting instinct fused with new-school sabermetrics. Five sports, live scores, real analytics.',
    type: 'website',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: [{ url: 'https://blazesportsintel.com/images/og-image.png', width: 1200, height: 630, alt: 'Blaze Sports Intel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description:
      'Old-school scouting instinct fused with new-school sabermetrics. Five sports, live scores, real analytics.',
    images: ['https://blazesportsintel.com/images/og-image.png'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
