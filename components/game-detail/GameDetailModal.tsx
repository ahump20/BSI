'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameDetail } from '@/lib/hooks';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';
import { GAME_DETAIL_TABS, type GameDetailTab } from '@/lib/types/adapters';
import type { GameDetailModalProps } from './GameDetailModal.types';
import { ModalHeader } from './shared/ModalHeader';
import { TabNavigation } from './shared/TabNavigation';
import { SwipeIndicator } from './shared/SwipeIndicator';
import { GamecastTab } from './tabs/GamecastTab';
import { RecapTab } from './tabs/RecapTab';
import { BoxScoreTab } from './tabs/BoxScoreTab';
import { PlayByPlayTab } from './tabs/PlayByPlayTab';
import { PitchTrackerTab } from './tabs/PitchTrackerTab';
import { TeamStatsTab } from './tabs/TeamStatsTab';
import { VideosTab } from './tabs/VideosTab';

export function GameDetailModal({
  gameId,
  sport,
  isOpen,
  onClose,
  initialTab = 'gamecast',
}: GameDetailModalProps) {
  const { game, boxScore, plays, videos, recap, activeTab, loading, setActiveTab } = useGameDetail(
    isOpen ? gameId : null,
    sport
  );

  // Set initial tab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, setActiveTab]);

  // Determine available tabs based on sport and game status
  const availableTabs = useMemo(() => {
    if (!game) return ['gamecast'] as GameDetailTab[];

    return GAME_DETAIL_TABS.filter((tabConfig) => {
      // Check if tab is available for this sport
      if (!tabConfig.sports.includes(sport)) return false;

      // Check if tab requires specific game status
      if (tabConfig.requiresStatus && !tabConfig.requiresStatus.includes(game.status)) {
        return false;
      }

      return true;
    }).map((t) => t.id);
  }, [game, sport]);

  // Navigate to next/previous tab
  const navigateTab = useCallback(
    (direction: 'next' | 'prev') => {
      const currentIndex = availableTabs.indexOf(activeTab);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (direction === 'next') {
        newIndex = currentIndex < availableTabs.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : availableTabs.length - 1;
      }

      setActiveTab(availableTabs[newIndex]);
    },
    [availableTabs, activeTab, setActiveTab]
  );

  // Swipe gesture handlers for mobile tab navigation
  const swipeHandlers = useSwipeGesture({
    threshold: 50,
    onSwipeLeft: () => navigateTab('next'),
    onSwipeRight: () => navigateTab('prev'),
    enabled: true,
  });

  // Keyboard handling for Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Prevent rendering if not open or no gameId
  if (!isOpen || !gameId) return null;

  // Loading state
  if (loading.game && !game) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-white/50 text-sm">Loading game details...</span>
          </div>
        </div>
      </ModalShell>
    );
  }

  // Error state
  if (!game) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-white/50">Unable to load game details</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // Render active tab content
  const renderTabContent = () => {
    const recentPlays = plays.slice(0, 5);

    switch (activeTab) {
      case 'gamecast':
        return (
          <GamecastTab
            game={game}
            boxScore={boxScore}
            recentPlays={recentPlays}
            loading={loading.boxScore}
          />
        );
      case 'recap':
        return <RecapTab recap={recap} game={game} loading={loading.recap} />;
      case 'boxscore':
        return <BoxScoreTab boxScore={boxScore} sport={sport} loading={loading.boxScore} />;
      case 'playbyplay':
        return <PlayByPlayTab plays={plays} sport={sport} loading={loading.plays} />;
      case 'pitchtracker':
        return <PitchTrackerTab gameId={gameId} loading={loading.plays} />;
      case 'teamstats':
        return <TeamStatsTab boxScore={boxScore} sport={sport} loading={loading.boxScore} />;
      case 'videos':
        return <VideosTab videos={videos} loading={loading.videos} />;
      default:
        return null;
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader game={game} onClose={onClose} />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sport={sport}
        gameStatus={game.status}
        availableTabs={availableTabs}
      />

      <SwipeIndicator
        tabs={availableTabs}
        activeIndex={availableTabs.indexOf(activeTab)}
        showHint
      />

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto touch-pan-y"
        {...swipeHandlers}
      >
        {renderTabContent()}
      </div>
    </ModalShell>
  );
}

// Modal shell wrapper
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Use portal to render at document root
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Game details"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[1000px] md:rounded-lg bg-midnight border border-white/10 flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// Loading skeleton for modal content
export function GameDetailModalSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="skeleton w-full h-20 rounded" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-20 h-8 rounded" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton w-full h-12 rounded" />
        ))}
      </div>
    </div>
  );
}
