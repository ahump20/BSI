import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, JetBrains_Mono, Oswald } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { KonamiCodeWrapper } from '@/components/easter-eggs';
import { PageTransition, MotionProvider } from '@/components/motion';
import { AppSidebar } from '@/components/layout-ds/AppSidebar';
import { AppTopBar } from '@/components/layout-ds/AppTopBar';
import { BottomNavWrapper } from '@/components/layout-ds/BottomNavWrapper';
import { FeedbackButton } from '@/components/ui/FeedbackModal';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { BreadcrumbBar } from '@/components/layout-ds/BreadcrumbBar';
import { CommandPalette } from '@/components/layout-ds/CommandPalette';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { PageTracker } from '@/components/analytics/PageTracker';

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
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${cormorant.variable} ${oswald.variable} ${jetbrainsMono.variable}`}
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
