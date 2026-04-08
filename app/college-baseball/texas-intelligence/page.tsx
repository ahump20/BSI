import type { Metadata } from 'next';
import TexasIntelHubClient from './TexasIntelHubClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Longhorns Baseball Intelligence Hub | BSI',
  description:
    'Live sabermetrics, SEC positioning, film room, social signals, NIL intelligence, and program history for Texas Longhorns baseball — all in one place.',
  alternates: { canonical: '/college-baseball/texas-intelligence' },
  openGraph: {
    title: 'Texas Longhorns Baseball Intelligence Hub',
    description:
      'The most complete Texas Longhorns baseball intelligence destination. Live stats, film room, social signals, and deep program history.',
    type: 'website',
    images: [
      {
        url: '/images/og/texas-intelligence-hub.png',
        width: 1200,
        height: 630,
        alt: 'Texas Longhorns Baseball Intelligence Hub — Blaze Sports Intel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Texas Longhorns Baseball Intelligence Hub | BSI',
    description: 'The most complete Texas Longhorns baseball intelligence destination.',
    images: ['/images/og/texas-intelligence-hub.png'],
  },
};

export default function TexasIntelligenceHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Texas Longhorns Baseball Intelligence Hub',
            description:
              'Live sabermetrics, SEC positioning, film room, social signals, and program history for Texas Longhorns baseball.',
            publisher: {
              '@type': 'Organization',
              name: 'Blaze Sports Intel',
              url: 'https://blazesportsintel.com',
            },
            about: {
              '@type': 'SportsTeam',
              name: 'Texas Longhorns Baseball',
              sport: 'Baseball',
              memberOf: {
                '@type': 'SportsOrganization',
                name: 'SEC',
              },
            },
          }),
        }}
      />
      <TexasIntelHubClient />
    </>
  );
}
