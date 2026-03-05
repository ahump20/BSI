import type { ReactNode } from 'react';
import GameLayoutClient, { useGameData, type CollegeGameData } from './GameLayoutClient';
import { cbbGameParams } from '@/lib/generate-static-params';

// Re-export for child pages
export { useGameData, type CollegeGameData };

// Fetch real game IDs from the production Worker at build time.
// Falls back to placeholder on any network failure.
export async function generateStaticParams() {
  return cbbGameParams();
}

interface LayoutProps {
  children: ReactNode;
}

export default function CollegeGameLayout({ children }: LayoutProps) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
