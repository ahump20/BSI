'use client';

import { useCallback } from 'react';
import React from 'react';

interface Tab {
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
    container: 'flex border-b border-white/10',
    tab: 'border-b-2 border-transparent transition-colors',
    active: 'border-b-2 border-[#BF5700] text-white',
    inactive: 'text-white/50 hover:text-white',
  },
  pills: {
    container: 'flex gap-2 p-1 bg-white/5 rounded-lg',
    tab: 'rounded-md transition-colors',
    active: 'bg-[#BF5700] text-white',
    inactive: 'text-white/60 hover:text-white hover:bg-white/5',
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
        // Focus the newly activated tab
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
            aria-selected={isActive}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              ${sizeClass}
              ${variantStyle.tab}
              ${isActive ? variantStyle.active : variantStyle.inactive}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF5700]
              whitespace-nowrap flex items-center gap-2 transition-all
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#BF5700] text-white text-xs font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
