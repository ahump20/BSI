import type { ReactNode } from 'react';
import NFLGameLayoutClient, { useGameData, type NFLGameData } from './GameLayoutClient';

export { useGameData, type NFLGameData };

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

interface LayoutProps {
  children: ReactNode;
}

export default function NFLGameLayout({ children }: LayoutProps) {
  return <NFLGameLayoutClient>{children}</NFLGameLayoutClient>;
}
