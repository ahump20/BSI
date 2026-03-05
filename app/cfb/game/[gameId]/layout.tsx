import type { ReactNode } from 'react';
import GameLayoutClient, { useGameData, type GameData, type Competitor, type Leader, type Play } from './GameLayoutClient';

// Re-export for child pages
export { useGameData, type GameData, type Competitor, type Leader, type Play };

// Generate static params for static export
export async function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

interface LayoutProps {
  children: ReactNode;
}

export default function CFBGameLayout({ children }: LayoutProps) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
