'use client';

import { useRef, useEffect } from 'react';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onChange: (tabId: string) => void;
  /** Optional className for the container */
  className?: string;
}

/**
 * Tabs - Horizontal scrollable tab navigation (ESPN-style)
 *
 * Used for game detail pages, team pages, and any multi-section views.
 * Horizontal scroll on mobile, underline indicator for active state.
 */
export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const activeButton = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      // Calculate scroll position to center the active tab
      const scrollLeft = activeButton.offsetLeft - containerRect.width / 2 + buttonRect.width / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <nav
      ref={tabsRef}
      className={`flex overflow-x-auto scrollbar-hide bg-charcoal-900 border-b border-gray-700 ${className}`}
      role="tablist"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : null}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`
              flex-shrink-0 px-6 py-4
              font-display text-sm uppercase tracking-wide
              border-b-2 transition-colors duration-150
              ${isActive
                ? 'text-burnt-orange border-burnt-orange'
                : 'text-gray-400 border-transparent hover:text-white'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default Tabs;
