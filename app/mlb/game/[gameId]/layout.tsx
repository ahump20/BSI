import type { ReactNode } from 'react';
import GameLayoutClient, { useGameData, type GameData } from './GameLayoutClient';

// Re-export for child pages
export { useGameData, type GameData };

// Generate static params for static export
export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

interface LayoutProps {
  children: ReactNode;
}

export default function MLBGameLayout({ children }: LayoutProps) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
