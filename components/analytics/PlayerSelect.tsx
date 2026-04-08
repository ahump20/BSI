'use client';

import { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import { getConfColor } from '@/lib/analytics/viz';

interface Player {
  player_id: string;
  player_name: string;
  team: string;
  conference?: string;
}

interface Props {
  players: Player[];
  value: string;
  onChange: (id: string) => void;
  maxDisplay?: number;
  className?: string;
}

/**
 * Custom styled player selector — Heritage-themed dropdown with search-as-you-type,
 * conference-colored team dots, truncated names, keyboard navigation, and ARIA roles.
 */
export function PlayerSelect({
  players,
  value,
  onChange,
  maxDisplay = 100,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const listId = `player-select-${reactId.replace(/:/g, '')}`;

  const selected = players.find((p) => p.player_id === value);

  const filtered = useMemo(() => {
    if (!search) return players.slice(0, maxDisplay);
    const q = search.toLowerCase();
    return players
      .filter((p) =>
        p.player_name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        (p.conference ?? '').toLowerCase().includes(q),
      )
      .slice(0, maxDisplay);
  }, [players, search, maxDisplay]);

  useEffect(() => { setHighlightIdx(-1); }, [filtered]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setHighlightIdx(-1);
    }
  }, [open]);

  useEffect(() => {
    if (highlightIdx < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  const selectPlayer = useCallback((id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < filtered.length) {
          selectPlayer(filtered[highlightIdx].player_id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSearch('');
        break;
      case 'Home':
        e.preventDefault();
        setHighlightIdx(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightIdx(filtered.length - 1);
        break;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-mono cursor-pointer transition-all w-full"
        style={{
          background: 'rgba(196,184,165,0.04)',
          border: '1px solid var(--border-vintage)',
          color: 'var(--bsi-text)',
          maxWidth: 260,
        }}
      >
        {selected && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: getConfColor(selected.conference ?? '') }}
          />
        )}
        <span className="truncate flex-1 text-left">
          {selected ? `${selected.player_name} — ${selected.team}` : 'Select player...'}
        </span>
        <svg
          width="10" height="6" viewBox="0 0 10 6"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="var(--bsi-text-dim)"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[240px] rounded-[2px] overflow-hidden"
          style={{
            background: 'var(--surface-press-box)',
            border: '1px solid var(--border-vintage)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            maxHeight: 320,
          }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-vintage)' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              role="combobox"
              aria-expanded={true}
              aria-controls={listId}
              aria-activedescendant={highlightIdx >= 0 ? `${listId}-opt-${highlightIdx}` : undefined}
              aria-autocomplete="list"
              className="w-full text-xs font-mono bg-transparent outline-none"
              style={{ color: 'var(--bsi-text)' }}
            />
          </div>

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Players"
            className="overflow-y-auto"
            style={{ maxHeight: 260 }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <span className="text-[10px] font-mono" style={{ color: 'var(--bsi-text-dim)' }}>
                  No matches
                </span>
              </div>
            ) : (
              filtered.map((p, idx) => {
                const isActive = p.player_id === value;
                const isHighlighted = idx === highlightIdx;
                return (
                  <button
                    key={p.player_id}
                    id={`${listId}-opt-${idx}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => selectPlayer(p.player_id)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors cursor-pointer"
                    style={{
                      background: isHighlighted
                        ? 'rgba(196,184,165,0.06)'
                        : isActive
                          ? 'rgba(191, 87, 0, 0.1)'
                          : 'transparent',
                      color: 'var(--bsi-text)',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getConfColor(p.conference ?? '') }}
                    />
                    <span className="text-xs font-mono truncate">
                      {p.player_name}
                    </span>
                    <span className="text-[10px] font-mono truncate ml-auto" style={{ color: 'var(--bsi-text-dim)' }}>
                      {p.team}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
