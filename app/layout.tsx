import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { Bebas_Neue, Cormorant_Garamond, IBM_Plex_Mono, JetBrains_Mono, Oswald } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PageTransition, MotionProvider } from '@/components/motion';
import { AppSidebar } from '@/components/layout-ds/AppSidebar';
import { AppTopBar } from '@/components/layout-ds/AppTopBar';
import { BottomNavWrapper } from '@/components/layout-ds/BottomNavWrapper';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { BreadcrumbBar } from '@/components/layout-ds/BreadcrumbBar';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
// Lazy-load interaction-triggered components (not visible on initial render)
const CommandPalette = dynamic(() => import('@/components/layout-ds/CommandPalette').then(m => ({ default: m.CommandPalette })));
const KonamiCodeWrapper = dynamic(() => import('@/components/easter-eggs').then(m => ({ default: m.KonamiCodeWrapper })));
const FeedbackButton = dynamic(() => import('@/components/ui/FeedbackModal').then(m => ({ default: m.FeedbackButton })));
const ScrollToTopButton = dynamic(() => import('@/components/ui/ScrollToTopButton').then(m => ({ default: m.ScrollToTopButton })));
const PageTracker = dynamic(() => import('@/components/analytics/PageTracker').then(m => ({ default: m.PageTracker })));
const PostHogProvider = dynamic(() => import('@/components/analytics/PostHogProvider').then(m => ({ default: m.PostHogProvider })));

// 3-font system: Display (Oswald) + Body (Cormorant Garamond) + Mono (JetBrains Mono)
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

export const viewport: Viewport = {
  themeColor: '#bf5700',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | College Baseball Sabermetrics',
  description:
    'Free park-adjusted sabermetrics for D1 college baseball — wOBA, wRC+, FIP, park factors, conference strength. Updated every 6 hours. Plus live scores across MLB, NFL, NBA, and NCAA.',
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
    title: 'Blaze Sports Intel | College Baseball Sabermetrics',
    description:
      'Free park-adjusted sabermetrics for D1 college baseball — wOBA, wRC+, FIP, park factors, conference strength. Updated every 6 hours.',
    type: 'website',
    locale: 'en_US',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blaze Sports Intel - College Baseball Sabermetrics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description: 'Free park-adjusted sabermetrics for D1 college baseball. wOBA, wRC+, FIP, park factors. Updated every 6 hours.',
    images: ['/images/og-image.png'],
  },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/brand/bsi-lettermark-square.png',
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
        'Free park-adjusted sabermetrics for D1 college baseball. wOBA, wRC+, FIP, park factors, conference strength. Plus live scores across MLB, NFL, NBA, and NCAA.',
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
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${cormorant.variable} ${oswald.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable} ${bebasNeue.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://customer-mpdvoybjqct2pzls.cloudflarestream.com" />
        {/* Static JSON-LD for SEO — hardcoded content, no user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdContent }} />
        <BreadcrumbJsonLd />
      </head>
      <body className="bg-midnight text-[#F5F0EB] antialiased min-h-screen">
        <Providers>
          <MotionProvider>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <div className="flex min-h-screen">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <AppTopBar />
                <ScrollProgress />
                <BreadcrumbBar />
                <CommandPalette />
                <KonamiCodeWrapper />
                <PageTracker />
                <PostHogProvider />
                <main id="main-content" className="flex-1 overflow-y-auto pb-20 md:pb-0">
                  <PageTransition>{children}</PageTransition>
                </main>
              </div>
            </div>
            <FeedbackButton />
            <ScrollToTopButton />
            <BottomNavWrapper />
          </MotionProvider>
        </Providers>
      </body>
    </html>
  );
}
