'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { TabNavigationProps } from '../GameDetailModal.types';
import type { GameDetailTab } from '@/lib/types/adapters';

const TAB_LABELS: Record<GameDetailTab, string> = {
  gamecast: 'Gamecast',
  recap: 'Recap',
  boxscore: 'Box Score',
  playbyplay: 'Play-by-Play',
  pitchtracker: 'Pitches',
  teamstats: 'Team Stats',
  videos: 'Videos',
};

export function TabNavigation({ activeTab, onTabChange, availableTabs }: TabNavigationProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on mount and tab change
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const tabEl = activeTabRef.current;
      const containerEl = tabsRef.current;
      const tabRect = tabEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tabEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = availableTabs.indexOf(activeTab);
      let newIndex = currentIndex;

      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : availableTabs.length - 1;
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        newIndex = currentIndex < availableTabs.length - 1 ? currentIndex + 1 : 0;
        e.preventDefault();
      }

      if (newIndex !== currentIndex) {
        onTabChange(availableTabs[newIndex]);
      }
    },
    [activeTab, availableTabs, onTabChange]
  );

  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label="Game detail tabs"
      className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-white/10 px-4"
      onKeyDown={handleKeyDown}
    >
      {availableTabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            ref={isActive ? activeTabRef : null}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab}`}
            id={`tab-${tab}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab)}
            className={`
              relative px-4 py-3 text-sm font-medium whitespace-nowrap touch-target-sm
              transition-colors duration-200
              ${isActive ? 'text-burnt-orange' : 'text-white/60 hover:text-white/80'}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal
            `}
          >
            {TAB_LABELS[tab]}
            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-burnt-orange rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
