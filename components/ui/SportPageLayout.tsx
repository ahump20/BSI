'use client';

import React from 'react';
import { TabBar } from './TabBar';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';

interface SportPageLayoutProps {
  sport: 'mlb' | 'nfl' | 'nba' | 'college-baseball' | 'cfb';
  title: string;
  subtitle?: string;
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  isLoading?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function SportPageLayout({
  sport,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
  isLoading = false,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}: SportPageLayoutProps) {
  const skeletonClasses =
    'h-4 bg-white/10 rounded animate-pulse w-full mb-3';

  return (
    <div className={`bsi-theme-${sport} min-h-screen bg-gradient-to-br from-midnight via-midnight to-midnight-dark`}>
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-30 bg-midnight/80 backdrop-blur-xl">
        <div className="px-4 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/60 text-base md:text-lg">{subtitle}</p>
          )}
        </div>

        {/* TabBar */}
        <div className="px-4">
          <TabBar
            tabs={tabs}
            active={activeTab}
            onChange={onTabChange}
            variant="default"
            size="md"
          />
        </div>

        {/* Data Freshness & Refresh */}
        {(lastUpdated || onRefresh) && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            {lastUpdated && (
              <DataFreshnessIndicator
                lastUpdated={lastUpdated}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
              />
            )}
          </div>
        )}
      </header>

      {/* Content Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="px-4 py-8">
            <div className={skeletonClasses} />
            <div className={skeletonClasses} />
            <div className={skeletonClasses} style={{ width: '80%' }} />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
