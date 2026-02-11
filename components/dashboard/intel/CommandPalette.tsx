'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Gamepad2, Radio, Users } from 'lucide-react';
import { useIntelSearch } from '@/lib/intel/hooks';
import type { IntelGame, IntelSignal, CommandPaletteItem } from '@/lib/intel/types';
import { SPORT_ACCENT } from '@/lib/intel/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  games: IntelGame[];
  signals: IntelSignal[];
  allTeams: string[];
  onSelectGame: (game: IntelGame) => void;
  onSelectTeam: (team: string) => void;
}

const SECTION_ICONS: Record<CommandPaletteItem['type'], React.ReactNode> = {
  game: <Gamepad2 className="h-3.5 w-3.5 text-white/30" />,
  signal: <Radio className="h-3.5 w-3.5 text-white/30" />,
  team: <Users className="h-3.5 w-3.5 text-white/30" />,
};

export function CommandPalette({
  open,
  onClose,
  games,
  signals,
  allTeams,
  onSelectGame,
  onSelectTeam,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { paletteItems } = useIntelSearch(games, signals, allTeams, query);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Clamp active index when results change
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(paletteItems.length - 1, 0)));
  }, [paletteItems.length]);

  const handleSelect = useCallback(
    (item: CommandPaletteItem) => {
      if (item.type === 'game') {
        onSelectGame(item.data as IntelGame);
      } else if (item.type === 'team') {
        onSelectTeam(item.data as string);
      }
      // Signal selection could be extended — for now just close
      onClose();
    },
    [onSelectGame, onSelectTeam, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, paletteItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && paletteItems[activeIndex]) {
        e.preventDefault();
        handleSelect(paletteItems[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [paletteItems, activeIndex, handleSelect, onClose],
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Palette */}
          <motion.div
            className="fixed left-1/2 top-[15%] z-50 w-[90vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-white/30" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search games, signals, teams..."
                className="flex-1 bg-transparent font-mono text-[13px] text-white/90 placeholder:text-white/30 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/30">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {paletteItems.length === 0 && query.length > 0 && (
                <p className="px-4 py-6 text-center font-mono text-[12px] text-white/30">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}
              {paletteItems.length === 0 && query.length === 0 && (
                <p className="px-4 py-6 text-center font-mono text-[12px] text-white/30">
                  Start typing to search...
                </p>
              )}
              {paletteItems.map((item, i) => {
                const isActive = i === activeIndex;
                const accent = item.sport ? SPORT_ACCENT[item.sport] : undefined;
                return (
                  <button
                    key={item.id}
                    data-index={i}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                      isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {SECTION_ICONS[item.type]}
                    <span className="flex-1 truncate font-mono text-[12px] text-white/80">
                      {item.label}
                    </span>
                    {accent && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/20">
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
