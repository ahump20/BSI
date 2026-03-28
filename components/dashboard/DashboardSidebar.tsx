'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
  Trophy,
  BarChart3,
  Gamepad2,
  BookOpen,
  Target,
} from 'lucide-react';
import type { Sport } from '@/components/sports/SportTabs';

interface DashboardSidebarProps {
  activeSport: Sport;
  onSportChange: (sport: Sport) => void;
  onOpenConfigurator: () => void;
  /** When provided, only these sport keys appear in the selector */
  visibleSports?: Sport[];
}

// ── SVG icons for the sport selector ──
const DashBaseballIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="6.5" /><path d="M4.5 3c1 1.5 1 3.5 0 5s-1 3.5 0 5" /><path d="M11.5 3c-1 1.5-1 3.5 0 5s1 3.5 0 5" /></svg>
);
const DashFootballIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><ellipse cx="8" cy="8" rx="6.5" ry="4" transform="rotate(-45 8 8)" /><path d="M5.5 5.5l5 5" /><path d="M7 5.5L6 6.5M8.5 5.5L7 7M10.5 9L9 10.5M10.5 10.5L9.5 11.5" /></svg>
);
const DashBasketballIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><circle cx="8" cy="8" r="6.5" /><path d="M1.5 8h13M8 1.5v13" /><path d="M3 3c2.5 1.5 4 3 5 5" /><path d="M13 3c-2.5 1.5-4 3-5 5" /></svg>
);
const DashGradCapIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.5}><path d="M1 6.5l7-3.5 7 3.5-7 3.5z" /><path d="M4 8v3.5c0 1.1 1.79 2 4 2s4-.9 4-2V8" /><path d="M15 6.5v4" /></svg>
);

const SPORTS: { key: Sport; label: string; icon: React.FC }[] = [
  { key: 'mlb', label: 'MLB', icon: DashBaseballIcon },
  { key: 'nfl', label: 'NFL', icon: DashFootballIcon },
  { key: 'nba', label: 'NBA', icon: DashBasketballIcon },
  { key: 'ncaa', label: 'NCAA', icon: DashGradCapIcon },
];

const QUICK_LINKS = [
  { label: 'Scores', href: '/scores', icon: Zap },
  { label: 'Rankings', href: '/college-baseball/rankings', icon: Trophy },
  { label: 'Savant', href: '/college-baseball/savant', icon: BarChart3 },
  { label: 'Editorial', href: '/college-baseball/editorial', icon: BookOpen },
  { label: 'Arcade', href: '/arcade', icon: Gamepad2 },
  { label: 'Portal', href: '/college-baseball/portal', icon: Target },
];

const STORAGE_KEY = 'bsi-dashboard-sidebar-collapsed';

export function DashboardSidebar({
  activeSport,
  onSportChange,
  onOpenConfigurator,
  visibleSports,
}: DashboardSidebarProps) {
  const filteredSports = visibleSports
    ? SPORTS.filter((s) => visibleSports.includes(s.key))
    : SPORTS;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
  };

  return (
    <motion.aside
      className="hidden lg:flex flex-col bg-[var(--surface-press-box)]/50 border border-[var(--border-vintage)] rounded-sm backdrop-blur-sm h-fit sticky top-28 overflow-hidden"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="flex items-center justify-center p-3 hover:bg-[var(--surface-press-box)] transition-colors border-b border-[var(--border-vintage)]"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-[rgba(196,184,165,0.35)]" />
        ) : (
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.35)] font-medium">
              Sports
            </span>
            <ChevronLeft className="w-4 h-4 text-[rgba(196,184,165,0.35)]" />
          </div>
        )}
      </button>

      {/* Sport selector */}
      <div className="p-2 space-y-1">
        {filteredSports.map((sport) => {
          const active = activeSport === sport.key;
          return (
            <button
              key={sport.key}
              onClick={() => onSportChange(sport.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all text-sm ${
                active
                  ? 'bg-[var(--bsi-primary)]/15 text-[var(--bsi-primary)] font-semibold'
                  : 'text-[var(--bsi-dust)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)]'
              }`}
              title={sport.label}
            >
              <span className="flex-shrink-0"><sport.icon /></span>
              {!collapsed && <span>{sport.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--bsi-primary)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Links */}
      {!collapsed && (
        <>
          <div className="mx-3 my-1 border-t border-[var(--border-vintage)]" />
          <div className="px-4 pt-2 pb-1">
            <span className="text-[10px] uppercase tracking-widest text-[rgba(196,184,165,0.35)] font-medium">
              Quick Links
            </span>
          </div>
          <div className="p-2 space-y-0.5">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-colors"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Collapsed quick links — icon only */}
      {collapsed && (
        <>
          <div className="mx-2 my-1 border-t border-[var(--border-vintage)]" />
          <div className="p-2 space-y-0.5">
            {QUICK_LINKS.slice(0, 4).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-center p-2 rounded-sm text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-colors"
                  title={link.label}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Settings */}
      <div className="mt-auto border-t border-[var(--border-vintage)]">
        <button
          onClick={onOpenConfigurator}
          className="w-full flex items-center gap-3 px-4 py-3 text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] hover:bg-[var(--surface-press-box)] transition-colors"
          title="Customize Dashboard"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Customize</span>}
        </button>
      </div>
    </motion.aside>
  );
}
