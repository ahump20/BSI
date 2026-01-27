import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Archivo_Black, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { KonamiCodeWrapper } from '@/components/easter-eggs';
import { NoiseOverlay } from '../components/cinematic';
import { PageTransition, MotionProvider } from '@/components/motion';
import { SmartNavbar } from '@/components/layout-ds/SmartNavbar';
import { BottomNav } from '@/components/sports';
import { mainNavItems } from '@/lib/navigation';

// Typography system: Archivo Black (display), Plus Jakarta Sans (body), Fraunces (serif), JetBrains Mono (mono)
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#bf5700',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description:
    'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics. Live scores, predictions, and data-driven insights.',
  keywords: [
    'sports analytics',
    'MLB',
    'NFL',
    'NBA',
    'NCAA',
    'real-time data',
    'sports intelligence',
    'live stats',
    'college baseball',
  ],
  authors: [{ name: 'Austin Humphrey', url: 'https://blazesportsintel.com' }],
  creator: 'Blaze Intelligence',
  publisher: 'Blaze Sports Intel',
  metadataBase: new URL('https://blazesportsintel.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Blaze Sports Intel | Real-Time Sports Analytics',
    description: 'Enterprise sports intelligence platform with real MLB, NFL, NBA data',
    type: 'website',
    locale: 'en_US',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Blaze Sports Intel - Real-Time Sports Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description: 'Real-time sports analytics for MLB, NFL, NBA, and NCAA',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/logo/blaze-logo.png',
    apple: '/images/logo/blaze-logo.png',
  },
  manifest: '/manifest.json',
};

// Schema.org structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://blazesportsintel.com/#organization',
      name: 'Blaze Sports Intel',
      url: 'https://blazesportsintel.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://blazesportsintel.com/images/logo/blaze-logo.png',
      },
      sameAs: ['https://twitter.com/blazesportsintel'],
      description:
        'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://blazesportsintel.com/#website',
      url: 'https://blazesportsintel.com',
      name: 'Blaze Sports Intel',
      publisher: { '@id': 'https://blazesportsintel.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://blazesportsintel.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SportsOrganization',
      '@id': 'https://blazesportsintel.com/#sportsorg',
      name: 'Blaze Sports Intel',
      sport: ['Baseball', 'Football', 'Basketball'],
      url: 'https://blazesportsintel.com',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakarta.variable} ${archivoBlack.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-midnight text-white antialiased min-h-screen font-sans pb-20 md:pb-0">
        <NoiseOverlay cssOnly />
        <Providers>
          <MotionProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <SmartNavbar items={mainNavItems} />
            <KonamiCodeWrapper />
            <PageTransition>{children}</PageTransition>
            {/* Mobile Bottom Navigation - auto-detects sport context from route */}
            <BottomNav className="md:hidden" />
          </MotionProvider>
        </Providers>
      </body>
    </html>
  );
}
