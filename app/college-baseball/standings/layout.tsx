import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Standings | BSI',
  description: 'NCAA baseball conference standings with overall and conference records, RPI, and strength of schedule.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
