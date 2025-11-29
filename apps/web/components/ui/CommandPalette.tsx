'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Command Palette - Spotlight-Style Navigation (Cmd+K / Ctrl+K)
 *
 * Features:
 * - Fuzzy search across all navigation items
 * - Keyboard-first navigation (arrow keys, enter)
 * - Recent searches memory
 * - Category grouping
 * - Context actions
 * - Full accessibility support
 */

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  action?: () => void;
  icon?: string;
  category: 'navigation' | 'sports' | 'tools' | 'settings' | 'recent';
  keywords?: string[];
  shortcut?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Navigation
  { id: 'home', title: 'Home', description: 'Return to homepage', href: '/', icon: '🏠', category: 'navigation', keywords: ['main', 'start'] },
  { id: 'features', title: 'Features', description: 'View platform features', href: '/features', icon: '⭐', category: 'navigation', keywords: ['pricing', 'plans'] },
  { id: 'command-center', title: 'Command Center', description: 'Multi-sport dashboard', href: '/command-center', icon: '🎯', category: 'navigation', keywords: ['dashboard', 'live'] },
  { id: 'copilot', title: 'AI Copilot', description: 'Ask questions, get answers', href: '/copilot', icon: '🤖', category: 'navigation', keywords: ['ai', 'chat', 'assistant'] },

  // Sports
  { id: 'mlb', title: 'MLB Analytics', description: 'Major League Baseball stats', href: '/baseball/mlb', icon: '⚾', category: 'sports', keywords: ['baseball', 'statcast'] },
  { id: 'ncaab', title: 'College Baseball', description: 'NCAA baseball hub', href: '/baseball/ncaab/hub', icon: '🏟️', category: 'sports', keywords: ['ncaa', 'college'] },
  { id: 'cfp', title: 'CFP Intelligence', description: 'Playoff simulator', href: '/CFP', icon: '🏈', category: 'sports', keywords: ['football', 'playoff', 'college'] },
  { id: 'nfl', title: 'NFL Standings', description: 'Pro football standings', href: '/football/nfl/standings', icon: '🏈', category: 'sports', keywords: ['football', 'pro'] },
  { id: 'basketball', title: 'Basketball', description: 'NBA & NCAA basketball', href: '/basketball', icon: '🏀', category: 'sports', keywords: ['nba', 'hoops'] },
  { id: 'lei', title: 'Clutch Analytics', description: 'Leverage & intensity metrics', href: '/lei', icon: '📊', category: 'sports', keywords: ['clutch', 'performance'] },
  { id: 'historical', title: 'Historical Data', description: '212 real games archive', href: '/historical-comparisons', icon: '📚', category: 'sports', keywords: ['history', 'archive'] },

  // Tools
  { id: 'sabermetrics', title: 'Sabermetrics', description: 'Advanced baseball metrics', href: '/baseball/sabermetrics', icon: '🧮', category: 'tools', keywords: ['war', 'ops', 'metrics'] },
  { id: 'leaderboards', title: 'Leaderboards', description: 'MLB player rankings', href: '/baseball/mlb/leaderboards', icon: '🏆', category: 'tools', keywords: ['rankings', 'leaders'] },
  { id: 'pitch-tunnel', title: 'Pitch Tunnel', description: '3D pitch visualization', href: '/baseball/overlays/pitch-tunnel', icon: '🎯', category: 'tools', keywords: ['pitching', '3d'] },
  { id: 'graphics', title: 'Graphics Demo', description: '3D visuals showcase', href: '/graphics-demo', icon: '✨', category: 'tools', keywords: ['demo', '3d', 'visuals'] },

  // Settings & Info
  { id: 'data-transparency', title: 'Data Transparency', description: 'Our data sources', href: '/data-transparency', icon: '🔍', category: 'settings', keywords: ['sources', 'api'] },
  { id: 'api-docs', title: 'API Docs', description: 'Developer documentation', href: '/api-docs', icon: '📖', category: 'settings', keywords: ['api', 'developer'] },
  { id: 'privacy', title: 'Privacy Policy', description: 'How we handle data', href: '/privacy', icon: '🔒', category: 'settings' },
  { id: 'contact', title: 'Contact', description: 'Get in touch', href: '/contact', icon: '📧', category: 'settings' },
];

const CATEGORY_LABELS: Record<string, string> = {
  recent: 'Recent',
  navigation: 'Navigation',
  sports: 'Sports',
  tools: 'Tools',
  settings: 'Settings & Info',
};

function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Direct includes check
  if (textLower.includes(queryLower)) return true;

  // Fuzzy match - all query chars must appear in order
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
}

function scoreMatch(query: string, item: CommandItem): number {
  const queryLower = query.toLowerCase();
  const titleLower = item.title.toLowerCase();

  // Exact match in title = highest score
  if (titleLower.startsWith(queryLower)) return 100;
  if (titleLower.includes(queryLower)) return 80;

  // Match in keywords
  if (item.keywords?.some(k => k.toLowerCase().includes(queryLower))) return 60;

  // Match in description
  if (item.description?.toLowerCase().includes(queryLower)) return 40;

  // Fuzzy match
  if (fuzzyMatch(queryLower, titleLower)) return 20;

  return 0;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('blaze-recent-commands');
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Keyboard shortcut to open (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items: CommandItem[] = [];

    if (!query.trim()) {
      // Show recent items first, then all items
      const recent = recentItems
        .map(id => COMMAND_ITEMS.find(item => item.id === id))
        .filter((item): item is CommandItem => !!item)
        .map(item => ({ ...item, category: 'recent' as const }));

      items = [...recent.slice(0, 3), ...COMMAND_ITEMS];
    } else {
      // Score and filter items
      items = COMMAND_ITEMS
        .map(item => ({ item, score: scoreMatch(query, item) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    }

    return items;
  }, [query, recentItems]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};

    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [filteredItems]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => {
    return Object.values(groupedItems).flat();
  }, [groupedItems]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selectedItem = flatItems[selectedIndex];
        if (selectedItem) {
          executeItem(selectedItem);
        }
        break;
    }
  }, [flatItems, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Execute selected item
  const executeItem = (item: CommandItem) => {
    // Add to recent items
    const newRecent = [item.id, ...recentItems.filter(id => id !== item.id)].slice(0, 5);
    setRecentItems(newRecent);
    localStorage.setItem('blaze-recent-commands', JSON.stringify(newRecent));

    // Close palette
    setIsOpen(false);

    // Execute action
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="command-trigger"
        aria-label="Open command palette (Cmd+K)"
      >
        <span className="command-trigger-icon">⌘</span>
        <span className="command-trigger-text">Search...</span>
        <kbd className="command-trigger-kbd">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="command-backdrop"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="command-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="command-header">
          <span className="command-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="Search pages, tools, or settings..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
            autoComplete="off"
          />
          <kbd className="command-escape">ESC</kbd>
        </div>

        {/* Results */}
        <div className="command-results" ref={listRef} role="listbox">
          {flatItems.length === 0 ? (
            <div className="command-empty">
              <span className="command-empty-icon">🔍</span>
              <p>No results found for "{query}"</p>
              <p className="command-empty-hint">Try searching for pages, sports, or tools</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="command-group">
                <div className="command-group-label">
                  {CATEGORY_LABELS[category] || category}
                </div>
                {items.map((item, itemIndex) => {
                  const globalIndex = flatItems.indexOf(item);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      className={`command-item ${isSelected ? 'command-item-selected' : ''}`}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      role="option"
                      aria-selected={isSelected}
                      data-index={globalIndex}
                    >
                      <span className="command-item-icon">{item.icon}</span>
                      <div className="command-item-content">
                        <span className="command-item-title">{item.title}</span>
                        {item.description && (
                          <span className="command-item-description">
                            {item.description}
                          </span>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className="command-item-shortcut">{item.shortcut}</kbd>
                      )}
                      {isSelected && (
                        <span className="command-item-enter">↵</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="command-footer">
          <span className="command-hint">
            <kbd>↑↓</kbd> to navigate
          </span>
          <span className="command-hint">
            <kbd>↵</kbd> to select
          </span>
          <span className="command-hint">
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </>
  );
}
