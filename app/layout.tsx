import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Oswald, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { KonamiCodeWrapper } from '@/components/easter-eggs';
import { NoiseOverlay, CustomCursor } from '../components/cinematic';
import { PageTransition, MotionProvider } from '@/components/motion';
import { NavbarWrapper } from '@/components/layout-ds/NavbarWrapper';
import { BottomNavWrapper } from '@/components/layout-ds/BottomNavWrapper';
import { FeedbackButton } from '@/components/ui/FeedbackModal';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { StickyLeagueBar } from '@/components/sports/StickyLeagueBar';
import { BreadcrumbBar } from '@/components/layout-ds/BreadcrumbBar';
import { CommandPalette } from '@/components/layout-ds/CommandPalette';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

// 3-font system: Display (Oswald) + Body (Inter) + Mono (JetBrains Mono)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
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
  alternates: { canonical: '/' },
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

/** Structured data (JSON-LD) for SEO -- Organization + WebSite */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Blaze Sports Intel',
      url: 'https://blazesportsintel.com',
      logo: 'https://blazesportsintel.com/images/logo/blaze-logo.png',
      founder: { '@type': 'Person', name: 'Austin Humphrey' },
      description:
        'Professional sports intelligence platform delivering real-time MLB, NFL, NBA, and NCAA analytics.',
    },
    {
      '@type': 'WebSite',
      name: 'Blaze Sports Intel',
      url: 'https://blazesportsintel.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://blazesportsintel.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${oswald.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <head>
        {/* Preconnect to Cloudflare Stream for hero video poster/playback */}
        <link rel="preconnect" href="https://customer-mpdvoybjqct2pzls.cloudflarestream.com" />
        {/* Static JSON-LD for SEO -- safe: hardcoded content, no user input */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BreadcrumbJsonLd />
      </head>
      <body className="bg-midnight text-white antialiased min-h-screen font-sans pb-20 md:pb-0">
        <NoiseOverlay cssOnly />
        <CustomCursor />
        <Providers>
          <MotionProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <NavbarWrapper />
            <ScrollProgress />
            <StickyLeagueBar />
            <BreadcrumbBar />
            <CommandPalette />
            <KonamiCodeWrapper />
            <PageTransition>{children}</PageTransition>
            <FeedbackButton />
            <ScrollToTopButton />
            {/* Mobile Bottom Navigation - hidden on desktop */}
            <BottomNavWrapper />
          </MotionProvider>
        </Providers>
      </body>
    </html>
  );
}
