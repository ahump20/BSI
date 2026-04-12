import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Cormorant_Garamond, DM_Sans, IBM_Plex_Mono, JetBrains_Mono, Oswald, Syne } from 'next/font/google';
import './globals.css';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { SiteFrame } from '@/components/layout-ds/SiteFrame';
import { Providers } from './providers';

// Heritage v2.1 font system: Display (Oswald/Bebas Neue) + Body (Cormorant Garamond) + Data (IBM Plex Mono) + Code (JetBrains Mono) + Savant (Syne/DM Sans)
const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

const oswald = Oswald({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const syne = Syne({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#bf5700',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Analytics and Editorial for Every Athlete, Every Game',
  description:
    'Live scores, advanced analytics, and independent editorial across college baseball, MLB, NFL, NBA, and college football — built for the athletes and fans that bigger platforms overlook.',
  keywords: [
    'college baseball',
    'college baseball analytics',
    'sabermetrics',
    'wOBA',
    'wRC+',
    'FIP',
    'park factors',
    'D1 baseball',
    'college baseball stats',
    'NCAA baseball',
    'sports analytics',
    'live scores',
  ],
  authors: [{ name: 'Austin Humphrey', url: 'https://blazesportsintel.com' }],
  creator: 'Blaze Sports Intel',
  publisher: 'Blaze Sports Intel',
  metadataBase: new URL('https://blazesportsintel.com'),
  openGraph: {
    title: 'Blaze Sports Intel | Analytics and Editorial for Every Athlete, Every Game',
    description:
      'Live scores, advanced analytics, and independent editorial across college baseball, MLB, NFL, NBA, and college football — built for the athletes and fans that bigger platforms overlook.',
    type: 'website',
    locale: 'en_US',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blaze Sports Intel — Live Scores, Analytics & Editorial — College Baseball, MLB, NFL, NBA, CFB',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description: 'Live scores, advanced analytics, and independent editorial across college baseball, MLB, NFL, NBA, and college football — built for the athletes and fans that bigger platforms overlook.',
    images: ['/images/og-image.png'],
  },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/brand/bsi-mascot-64.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

/**
 * Structured data (JSON-LD) for SEO — Organization + WebSite.
 * Content is hardcoded (no user input) — safe for inline script.
 */
const jsonLdContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Blaze Sports Intel',
      url: 'https://blazesportsintel.com',
      logo: 'https://blazesportsintel.com/images/brand/bsi-mascot-shield.png',
      founder: { '@type': 'Person', name: 'Austin Humphrey' },
      description:
        'Live scores, editorial, and advanced analytics across college baseball, MLB, NFL, NBA, and college football — with park-adjusted sabermetrics at the core.',
    },
    {
      '@type': 'WebSite',
      name: 'Blaze Sports Intel',
      url: 'https://blazesportsintel.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://blazesportsintel.com/scores?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${cormorant.variable} ${oswald.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable} ${bebasNeue.variable} ${syne.variable} ${dmSans.variable}`}
    >
      <head>
        {/* next/font/google self-hosts fonts at build time — no runtime Google Fonts connection needed */}
        <link rel="preconnect" href="https://customer-mpdvoybjqct2pzls.cloudflarestream.com" />
        <link rel="dns-prefetch" href="https://a.espncdn.com" />
        <link rel="dns-prefetch" href="https://site.api.espn.com" />
        <link rel="preload" as="image" href="/images/brand/bsi-mascot-200.png" />
        {/* Static JSON-LD for SEO — hardcoded content, no user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdContent }} />
        <BreadcrumbJsonLd />
      </head>
      <body className="bg-midnight text-bsi-bone antialiased min-h-screen">
        <Providers><SiteFrame>{children}</SiteFrame></Providers>
      </body>
    </html>
  );
}
