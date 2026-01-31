import type { ReactNode } from 'react';
import GameLayoutClient, { useGameData, type CollegeGameData } from './GameLayoutClient';

// Re-export for child pages
export { useGameData, type CollegeGameData };

// Generate static params for static export
export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

interface LayoutProps {
  children: ReactNode;
}

export default function CollegeGameLayout({ children }: LayoutProps) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
