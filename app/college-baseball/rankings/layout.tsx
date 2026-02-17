import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Rankings | BSI',
  description: 'NCAA baseball rankings including AP Top 25, coaches poll, and RPI rankings with week-over-week movement.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
