'use client';

import { Oswald, Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google';
import './intel-editorial.css';

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

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export default function IntelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`intel-editorial ${oswald.variable} ${cormorant.variable} ${ibmPlexMono.variable}`}
    >
      {children}
    </div>
  );
}
