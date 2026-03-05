import { Metadata } from 'next';
import { WC3Dashboard } from '@/components/wc3-dashboard/WC3Dashboard';

export const metadata: Metadata = {
  title: 'BSI Sports Intelligence Dashboard | Blaze Sports Intel',
  description:
    'State-of-the-art sports intelligence command center with game-level analytics, cross-sport signals, and interactive drilldowns.',
};

export default function WC3DashboardPage() {
  return <WC3Dashboard />;
}
