import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Football Standings | BSI',
  description: 'NCAA football conference standings with overall and conference records across Power 4 and Group of 5.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
