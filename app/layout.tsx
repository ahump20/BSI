import type { Metadata, Viewport } from 'next';
import { Inter, Oswald, Playfair_Display, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { KonamiCodeWrapper } from '@/components/easter-eggs';
import { NoiseOverlay, CustomCursor } from '../components/cinematic';

// Optimized font loading - eliminates render-blocking
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
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
    'college baseball',
    'real-time data',
    'sports intelligence',
    'live stats',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${oswald.variable} ${playfair.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-midnight text-white antialiased min-h-screen font-sans">
        <NoiseOverlay cssOnly />
        <CustomCursor />
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <KonamiCodeWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}
