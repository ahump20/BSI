import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ObservabilityProvider from './observability-provider';
import Footer from '../components/Footer';
import { WebVitalsTracker } from '../components/WebVitalsTracker';
import { AppProviders } from './providers';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  metadataBase: new URL('https://blazesportsintel.com'),
  title: 'Blaze Sports Intel — Sports Data Analytics & Intelligence Platform',
  description:
    'Blaze Sports Intel delivers professional sports data analytics, real-time scores, and compliance-ready intelligence for Baseball, Football, Basketball, and Track & Field.',
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Blaze Intel',
  },
  openGraph: {
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    title: 'Blaze Sports Intel — Sports Analytics Platform',
    description:
      'Professional sports intelligence covering MLB, NFL, NCAA, and high school sports across Texas and the Deep South.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel — Sports Analytics Platform',
    description:
      'Professional sports intelligence covering MLB, NFL, NCAA, and high school sports across Texas and the Deep South.'
  },
  robots: { index: true, follow: true },
  authors: [{ name: 'Blaze Sports Intel' }],
  referrer: 'strict-origin-when-cross-origin'
};

export const viewport: Viewport = {
  themeColor: '#fbbf24',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <WebVitalsTracker />
        <ServiceWorkerRegistration />
        <ObservabilityProvider>
          <AppProviders>
            {children}
            <Footer />
          </AppProviders>
        </ObservabilityProvider>
      </body>
    </html>
  );
}
