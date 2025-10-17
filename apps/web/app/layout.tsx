import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ObservabilityProvider from './observability-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://blazesportsintel.com'),
  title: 'Blaze Sports Intel — Sports Data Analytics & Intelligence Platform',
  description:
    'Blaze Sports Intel delivers professional sports data analytics, real-time scores, and compliance-ready intelligence for Baseball, Football, Basketball, and Track & Field.',
  alternates: { canonical: '/' },
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
  themeColor: '#1a1a1a'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ObservabilityProvider>{children}</ObservabilityProvider>
      </body>
    </html>
  );
}
