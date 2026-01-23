import type { ReactNode } from 'react';
import NBAGameLayoutClient, { useGameData, type NBAGameData } from './GameLayoutClient';

export { useGameData, type NBAGameData };

export function generateStaticParams() {
  return [{ gameId: 'placeholder' }];
}

interface LayoutProps {
  children: ReactNode;
}

export default function NBAGameLayout({ children }: LayoutProps) {
  return <NBAGameLayoutClient>{children}</NBAGameLayoutClient>;
}
