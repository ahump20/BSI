import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Real-Time Sports Analytics',
  description: 'Enterprise sports intelligence platform with real MLB, NFL, NBA data',
  keywords: ['sports analytics', 'MLB', 'NFL', 'NBA', 'real-time data', 'sports intelligence'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
