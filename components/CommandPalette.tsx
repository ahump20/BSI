'use client';

/**
 * BLAZE SPORTS INTEL - Command Palette
 * ====================================
 * Spotlight-style command palette with fuzzy search
 * Inspired by Linear, Raycast, and VS Code
 *
 * Features:
 * - Cmd+K to open
 * - Fuzzy search across players, teams, actions
 * - Keyboard navigation
 * - Recently used items
 * - Context-aware suggestions
 *
 * Last Updated: 2025-11-24
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import {
  Search,
  ArrowRight,
  Database,
  Users,
  Download,
  Moon,
  Grid,
  List,
  Activity,
  Zap,
  Target,
  Keyboard,
  Command,
} from 'lucide-react';

// Command types
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'player' | 'team' | 'setting';
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  players?: Array<{ id: string; name: string; team: string; position: string }>;
  onSelectPlayer?: (id: string) => void;
  onSelectSport?: (sport: string) => void;
  onToggleTheme?: () => void;
  onExportCSV?: () => void;
  onRefresh?: () => void;
  onToggleView?: (view: 'grid' | 'list') => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  players = [],
  onSelectPlayer,
  onSelectSport,
  onToggleTheme,
  onExportCSV,
  onRefresh,
  onToggleView,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build command list
  const allCommands: CommandItem[] = useMemo(() => {
    const commands: CommandItem[] = [
      // Navigation
      {
        id: 'nav-mlb',
        label: 'Go to MLB',
        description: 'View MLB player statistics',
        icon: <Target className="w-4 h-4" />,
        category: 'navigation',
        shortcut: 'Alt+M',
        action: () => {
          onSelectSport?.('baseball');
          onClose();
        },
      },
      {
        id: 'nav-nfl',
        label: 'Go to NFL',
        description: 'View NFL player statistics',
        icon: <Zap className="w-4 h-4" />,
        category: 'navigation',
        shortcut: 'Alt+N',
        action: () => {
          onSelectSport?.('football');
          onClose();
        },
      },
      {
        id: 'nav-college-baseball',
        label: 'Go to College Baseball',
        description: 'View NCAA baseball player statistics',
        icon: <Target className="w-4 h-4" />,
        category: 'navigation',
        shortcut: 'Alt+B',
        action: () => {
          onSelectSport?.('collegeBaseball');
          onClose();
        },
      },
      {
        id: 'nav-college-football',
        label: 'Go to College Football',
        description: 'View NCAA football player statistics',
        icon: <Activity className="w-4 h-4" />,
        category: 'navigation',
        shortcut: 'Alt+F',
        action: () => {
          onSelectSport?.('collegeFootball');
          onClose();
        },
      },

      // Actions
      {
        id: 'action-refresh',
        label: 'Refresh Data',
        description: 'Fetch latest statistics from APIs',
        icon: <Database className="w-4 h-4" />,
        category: 'action',
        shortcut: 'Cmd+R',
        action: () => {
          onRefresh?.();
          onClose();
        },
      },
      {
        id: 'action-export',
        label: 'Export to CSV',
        description: 'Download current view as CSV file',
        icon: <Download className="w-4 h-4" />,
        category: 'action',
        shortcut: 'Cmd+E',
        action: () => {
          onExportCSV?.();
          onClose();
        },
      },

      // Settings
      {
        id: 'setting-theme',
        label: 'Toggle Theme',
        description: 'Switch between dark and light mode',
        icon: <Moon className="w-4 h-4" />,
        category: 'setting',
        shortcut: 'Cmd+Shift+T',
        action: () => {
          onToggleTheme?.();
          onClose();
        },
      },
      {
        id: 'setting-grid',
        label: 'Grid View',
        description: 'Display players in grid layout',
        icon: <Grid className="w-4 h-4" />,
        category: 'setting',
        shortcut: 'Cmd+1',
        action: () => {
          onToggleView?.('grid');
          onClose();
        },
      },
      {
        id: 'setting-list',
        label: 'List View',
        description: 'Display players in list layout',
        icon: <List className="w-4 h-4" />,
        category: 'setting',
        shortcut: 'Cmd+2',
        action: () => {
          onToggleView?.('list');
          onClose();
        },
      },
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View all available keyboard shortcuts',
        icon: <Keyboard className="w-4 h-4" />,
        category: 'setting',
        action: () => {
          alert(
            'Keyboard Shortcuts:\n\nCmd+K: Open command palette\n/: Focus search\nCmd+R: Refresh data\nCmd+E: Export CSV\nCmd+1/2: Grid/List view\nAlt+M: Go to MLB\nAlt+N: Go to NFL\nAlt+B: Go to College Baseball\nAlt+F: Go to College Football'
          );
          onClose();
        },
      },
    ];

    // Add players to commands
    players.slice(0, 50).forEach((player) => {
      commands.push({
        id: `player-${player.id}`,
        label: player.name,
        description: `${player.team} • ${player.position}`,
        icon: <Users className="w-4 h-4" />,
        category: 'player',
        action: () => {
          onSelectPlayer?.(player.id);
          onClose();
        },
      });
    });

    return commands;
  }, [
    players,
    onSelectPlayer,
    onSelectSport,
    onToggleTheme,
    onExportCSV,
    onRefresh,
    onToggleView,
    onClose,
  ]);

  // Fuzzy search with Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(allCommands, {
        keys: ['label', 'description', 'category'],
        threshold: 0.3,
        includeScore: true,
      }),
    [allCommands]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show categories when no query
      return allCommands.filter((cmd) => cmd.category !== 'player').slice(0, 8);
    }
    return fuse
      .search(query)
      .map((result) => result.item)
      .slice(0, 10);
  }, [query, fuse, allCommands]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex] as HTMLElement;
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // Category labels
  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    action: 'Actions',
    player: 'Players',
    team: 'Teams',
    setting: 'Settings',
  };

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl z-[101]"
          >
            <div
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background:
                  'linear-gradient(180deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 28, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 80px rgba(191, 87, 0, 0.15)',
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search className="w-5 h-5 text-orange-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search players, commands, or type a command..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-base outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-white/40 text-xs font-mono">
                  <Command className="w-3 h-3" />K
                </div>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-white/40">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No results found for "{query}"</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
                        {categoryLabels[category] || category}
                      </div>
                      {commands.map((command, _idx) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={command.id}
                            onClick={() => command.action()}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-orange-500/20 text-white'
                                : 'text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 p-1.5 rounded-md ${
                                isSelected
                                  ? 'bg-orange-500/30 text-orange-400'
                                  : 'bg-white/5 text-white/50'
                              }`}
                            >
                              {command.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{command.label}</div>
                              {command.description && (
                                <div className="text-xs text-white/40 truncate">
                                  {command.description}
                                </div>
                              )}
                            </div>
                            {command.shortcut && (
                              <span className="flex-shrink-0 text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                {command.shortcut}
                              </span>
                            )}
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/30">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-white/50">↑↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-white/50">↵</kbd>
                    <span>Select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-white/50">esc</kbd>
                    <span>Close</span>
                  </span>
                </div>
                <span className="font-mono text-orange-500/60">BLAZE INTEL</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
