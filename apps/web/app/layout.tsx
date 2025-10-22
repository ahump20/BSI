import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 as SourceSerif } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const sourceSerif = SourceSerif({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://blazesportsintel.com'),
  title: 'Blaze Sports Intel — NCAA Baseball Intelligence',
  description:
    'Mobile-first NCAA Division I baseball intelligence built for coaching staffs, scouting departments, and NIL collectives. Live context, player models, and Diamond Pro decision support.',
  alternates: { canonical: '/' },
  openGraph: {
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    title: 'Blaze Sports Intel — NCAA Baseball Intelligence',
    description:
      'College baseball analytics with live win probability, player health signals, and recruiting momentum — purpose-built for Diamond Pro subscribers.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel — NCAA Baseball Intelligence',
    description:
      'College baseball analytics with live win probability, player health signals, and recruiting momentum for coaches who demand clarity over noise.'
  },
  robots: { index: true, follow: true },
  authors: [{ name: 'Blaze Sports Intel' }],
  referrer: 'strict-origin-when-cross-origin'
};

export const viewport: Viewport = {
  themeColor: '#0b1120'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${sourceSerif.variable} bg-background text-foreground font-sans antialiased`}> 
        <div className="min-h-screen bg-gradient-to-b from-background via-surface to-background">{children}</div>
      </body>
    </html>
  );
}
