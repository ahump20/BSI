import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], display: 'swap', variable: '--font-serif' });

export const metadata: Metadata = {
  metadataBase: new URL('https://blazesportsintel.com'),
  title: {
    default: 'Blaze Sports Intel | College Baseball Intelligence',
    template: '%s | Blaze Sports Intel',
  },
  description:
    'Real-time NCAA Division I college baseball scores, advanced metrics, and recruiting intel built for front offices and die-hard fans.',
  alternates: { canonical: '/' },
  openGraph: {
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    title: 'Blaze Sports Intel — College Baseball Intelligence Platform',
    description:
      'College baseball-first coverage featuring live win probability, conference filters, and Diamond Pro insights across every Division I program.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel — College Baseball Intelligence Platform',
    description:
      'College baseball-first coverage featuring live win probability, conference filters, and Diamond Pro insights across every Division I program.',
  },
  robots: { index: true, follow: true },
  authors: [{ name: 'Blaze Sports Intel' }],
  referrer: 'strict-origin-when-cross-origin',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

const primaryLinks = [
  { href: '/baseball/ncaab', label: 'Scores' },
  { href: '/games', label: 'Live Game Center' },
  { href: '/teams', label: 'Teams' },
  { href: '/standings', label: 'Standings' },
  { href: '/news', label: 'News' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceSerif.variable} flex min-h-screen flex-col bg-brand-slate text-slate-100`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-brand-gold focus:px-4 focus:py-2 focus:text-brand-slate">
          Skip to main content
        </a>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-slate/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/baseball/ncaab" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <span className="rounded-full bg-brand-gold px-2 py-1 text-sm font-bold uppercase text-brand-slate">BSI</span>
              <span className="font-serif text-xl">Diamond Intel</span>
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-slate-200 md:flex">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-6 md:pb-12">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8">
          <div className="hidden justify-between text-sm text-slate-400 md:flex">
            <p>Standard over vibes.</p>
            <p>© {new Date().getFullYear()} Blaze Sports Intel. All rights reserved.</p>
          </div>
        </footer>
        <nav
          aria-label="Bottom navigation"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-brand-charcoal/95 backdrop-blur md:hidden"
        >
          <ul className="grid grid-cols-4 text-xs font-medium text-slate-200">
            {primaryLinks.slice(0, 4).map((link) => (
              <li key={link.href} className="flex items-center justify-center">
                <Link
                  href={link.href}
                  className="flex h-14 w-full flex-col items-center justify-center gap-1 transition hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"
                >
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </body>
    </html>
  );
}
