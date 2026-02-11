'use client';

import { useState, useCallback } from 'react';
import type {
  UnifiedSportKey,
  UnifiedGame,
  UnifiedBoxScore,
  NormalizedPlay,
  VideoHighlight,
  GameRecap,
  GameDetailTab,
} from '@/lib/types/adapters';

interface GameDetailLoading {
  game: boolean;
  boxScore: boolean;
  plays: boolean;
  videos: boolean;
  recap: boolean;
}

interface GameDetailState {
  game: UnifiedGame | null;
  boxScore: UnifiedBoxScore | null;
  plays: NormalizedPlay[];
  videos: VideoHighlight[];
  recap: GameRecap | null;
  activeTab: GameDetailTab;
  loading: GameDetailLoading;
  setActiveTab: (tab: GameDetailTab) => void;
}

export function useGameDetail(
  gameId: string | null,
  sport: UnifiedSportKey
): GameDetailState {
  const [activeTab, setActiveTab] = useState<GameDetailTab>('gamecast');

  return {
    game: null,
    boxScore: null,
    plays: [],
    videos: [],
    recap: null,
    activeTab,
    loading: {
      game: !!gameId,
      boxScore: false,
      plays: false,
      videos: false,
      recap: false,
    },
    setActiveTab,
  };
}
