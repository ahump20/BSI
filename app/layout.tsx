import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '600', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Diamond Insights | College Baseball Live',
  description:
    'Mobile-first, dark-mode native college baseball scoreboard with live data, conference context, and sport switching.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${sourceSerif.variable} bg-background text-foreground antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
