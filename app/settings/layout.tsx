import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Blaze Sports Intel',
  description: 'Manage your BSI account preferences and settings.',
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
