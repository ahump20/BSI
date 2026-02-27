import type { Metadata } from 'next';
import { Oswald, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BSI Pro — Real-Time College Baseball Intelligence',
  description:
    'Unlock win probability, leverage scores, and pitch-level data for college baseball. BSI Pro starts at $12/month.',
  openGraph: {
    title: 'BSI Pro — Real-Time College Baseball Intelligence',
    description:
      'Unlock win probability, leverage scores, and pitch-level data for college baseball.',
    url: 'https://blazesportsintel.com/pro',
  },
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${oswald.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
