'use client';

import { useCallback } from 'react';
import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

const variantClasses = {
  default: {
    container: 'flex border-b border-border',
    tab: 'border-b-2 border-transparent transition-colors',
    active: 'border-b-2 border-burnt-orange text-text-primary',
    inactive: 'text-text-muted hover:text-text-primary',
  },
  pills: {
    container: 'flex gap-2 p-1 bg-surface-light rounded-lg',
    tab: 'rounded-md transition-colors',
    active: 'bg-burnt-orange text-white',
    inactive: 'text-text-secondary hover:text-text-primary hover:bg-surface-light',
  },
};

export function TabBar({
  tabs,
  active,
  onChange,
  variant = 'default',
  size = 'md',
}: TabBarProps) {
  const activeIndex = tabs.findIndex((tab) => tab.id === active);
  const variantStyle = variantClasses[variant];
  const sizeClass = sizeClasses[size];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let newIndex = activeIndex;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = activeIndex > 0 ? activeIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = activeIndex < tabs.length - 1 ? activeIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== activeIndex) {
        onChange(tabs[newIndex].id);
        setTimeout(() => {
          const button = document.querySelector(
            `[data-tab-id="${tabs[newIndex].id}"]`
          ) as HTMLButtonElement;
          button?.focus();
        }, 0);
      }
    },
    [activeIndex, tabs, onChange]
  );

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`${variantStyle.container} overflow-x-auto`}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              ${sizeClass}
              ${variantStyle.tab}
              ${isActive ? variantStyle.active : variantStyle.inactive}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange
              whitespace-nowrap flex items-center gap-2 transition-all
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-burnt-orange text-white text-xs font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (activeTab !== id) return null;

  return (
    <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}
