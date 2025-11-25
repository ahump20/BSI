import type { Metadata } from 'next';
import './globals.css';
import './css/blaze-design-system.css';
import './css/blaze-components.css';
import './css/blaze-brand-identity.css';
import './css/blaze-animations.css';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description: 'Enterprise sports intelligence platform with real MLB, NFL, NBA data. Command palette, keyboard shortcuts, and live data streaming.',
  keywords: ['sports analytics', 'MLB', 'NFL', 'NBA', 'real-time data', 'sports intelligence', 'live stats'],
  openGraph: {
    title: 'Blaze Sports Intel | Real-Time Sports Analytics',
    description: 'Enterprise sports intelligence platform with real MLB, NFL, NBA data',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
