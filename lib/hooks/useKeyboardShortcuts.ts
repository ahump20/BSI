/**
 * BLAZE SPORTS INTEL - Keyboard Shortcuts Hook
 * ==============================================
 * Global keyboard shortcuts system for power users
 * Features: Command palette (Cmd+K), vim-style navigation, quick actions
 *
 * Last Updated: 2025-11-24
 */

import { useEffect, useCallback } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

/**
 * Hook for registering global keyboard shortcuts
 * Handles Mac (meta) and Windows (ctrl) key modifiers
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape to always work
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !shortcut.ctrl || event.ctrlKey;
        const metaMatches = !shortcut.meta || event.metaKey;
        const shiftMatches = !shortcut.shift || event.shiftKey;
        const altMatches = !shortcut.alt || event.altKey;

        // Handle Cmd/Ctrl cross-platform
        const modifierMatches =
          (shortcut.meta && (event.metaKey || event.ctrlKey)) ||
          (shortcut.ctrl && event.ctrlKey) ||
          (!shortcut.meta && !shortcut.ctrl);

        if (
          keyMatches &&
          ctrlMatches &&
          metaMatches &&
          shiftMatches &&
          altMatches &&
          modifierMatches
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Predefined shortcuts for sports analytics dashboard
 */
export const DASHBOARD_SHORTCUTS = {
  COMMAND_PALETTE: { key: 'k', meta: true, description: 'Open command palette' },
  SEARCH: { key: '/', description: 'Focus search' },
  REFRESH: { key: 'r', meta: true, description: 'Refresh data' },
  TOGGLE_THEME: { key: 't', meta: true, shift: true, description: 'Toggle theme' },
  EXPORT_CSV: { key: 'e', meta: true, description: 'Export to CSV' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal/dialog' },
  GRID_VIEW: { key: '1', meta: true, description: 'Grid view' },
  LIST_VIEW: { key: '2', meta: true, description: 'List view' },
  GO_MLB: { key: 'm', alt: true, description: 'Go to MLB' },
  GO_NFL: { key: 'n', alt: true, description: 'Go to NFL' },
  GO_NBA: { key: 'b', alt: true, description: 'Go to NBA' },
};
