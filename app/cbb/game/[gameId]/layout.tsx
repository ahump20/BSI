import GameLayoutClient from './GameLayoutClient';
import type { ReactNode } from 'react';

export default function CBBGameLayout({ children }: { children: ReactNode }) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
