import { Metadata } from 'next';
import { WC3Dashboard } from '@/components/wc3-dashboard/WC3Dashboard';

export const metadata: Metadata = {
  title: 'WC3 Productivity Dashboard | Blaze Sports Intel',
  description:
    'Transform your dev workflow into Warcraft 3. Commits spawn units, errors spawn enemies, deployments upgrade your base.',
};

export default function WC3DashboardPage() {
  return <WC3Dashboard />;
}
