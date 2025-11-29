'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Keyboard Shortcuts System
 *
 * Features:
 * - Global keyboard shortcuts for power users
 * - Navigation shortcuts (g + key combos)
 * - Action shortcuts (refresh, search, etc.)
 * - Help modal (? key)
 * - Prevents conflicts with inputs/textareas
 */

interface ShortcutConfig {
  key: string;
  meta?: boolean;  // Cmd/Ctrl
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'actions' | 'view';
}

export interface ShortcutGroup {
  category: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

// Shortcut definitions
const SHORTCUTS_MAP: Map<string, ShortcutConfig> = new Map([
  // Navigation (g + key)
  ['g+h', { key: 'h', description: 'Go to Home', category: 'navigation', action: () => {} }],
  ['g+c', { key: 'c', description: 'Go to Command Center', category: 'navigation', action: () => {} }],
  ['g+b', { key: 'b', description: 'Go to Baseball', category: 'navigation', action: () => {} }],
  ['g+f', { key: 'f', description: 'Go to Football', category: 'navigation', action: () => {} }],
  ['g+k', { key: 'k', description: 'Go to Basketball', category: 'navigation', action: () => {} }],
  ['g+a', { key: 'a', description: 'Go to AI Copilot', category: 'navigation', action: () => {} }],
  ['g+s', { key: 's', description: 'Go to Settings', category: 'navigation', action: () => {} }],

  // Actions
  ['/', { key: '/', description: 'Focus search', category: 'actions', action: () => {} }],
  ['r', { key: 'r', description: 'Refresh data', category: 'actions', action: () => {} }],
  ['Escape', { key: 'Escape', description: 'Close modal/panel', category: 'actions', action: () => {} }],

  // View
  ['t', { key: 't', description: 'Toggle theme', category: 'view', action: () => {} }],
  ['[', { key: '[', description: 'Previous item', category: 'view', action: () => {} }],
  [']', { key: ']', description: 'Next item', category: 'view', action: () => {} }],
]);

export function getShortcutGroups(): ShortcutGroup[] {
  const groups: Map<string, ShortcutGroup> = new Map();

  SHORTCUTS_MAP.forEach((config, keys) => {
    if (!groups.has(config.category)) {
      groups.set(config.category, {
        category: config.category.charAt(0).toUpperCase() + config.category.slice(1),
        shortcuts: [],
      });
    }
    groups.get(config.category)!.shortcuts.push({
      keys: formatKeys(keys),
      description: config.description,
    });
  });

  return Array.from(groups.values());
}

function formatKeys(keys: string): string {
  return keys
    .replace('meta+', '⌘')
    .replace('ctrl+', 'Ctrl+')
    .replace('shift+', '⇧')
    .replace('alt+', '⌥')
    .replace('g+', 'g ')
    .toUpperCase();
}

function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}

interface UseKeyboardShortcutsOptions {
  onToggleTheme?: () => void;
  onRefresh?: () => void;
  onOpenSearch?: () => void;
  onCloseModal?: () => void;
  onShowHelp?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onToggleTheme,
    onRefresh,
    onOpenSearch,
    onCloseModal,
    onShowHelp,
    onPrevious,
    onNext,
    enabled = true,
  } = options;

  const router = useRouter();
  const gPressedRef = useRef(false);
  const gTimeoutRef = useRef<NodeJS.Timeout>();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    if (isInputElement(event.target)) return;

    const { key, metaKey, ctrlKey, shiftKey, altKey } = event;

    // Command palette shortcut (handled by CommandPalette)
    if ((metaKey || ctrlKey) && key === 'k') {
      return; // Let CommandPalette handle this
    }

    // Help modal
    if (key === '?' && shiftKey) {
      event.preventDefault();
      onShowHelp?.();
      return;
    }

    // Escape
    if (key === 'Escape') {
      event.preventDefault();
      onCloseModal?.();
      return;
    }

    // Focus search
    if (key === '/') {
      event.preventDefault();
      onOpenSearch?.();
      return;
    }

    // Theme toggle
    if (key === 't' && !metaKey && !ctrlKey && !altKey) {
      event.preventDefault();
      onToggleTheme?.();
      return;
    }

    // Refresh
    if (key === 'r' && !metaKey && !ctrlKey && !altKey) {
      event.preventDefault();
      onRefresh?.();
      return;
    }

    // Navigation
    if (key === '[') {
      event.preventDefault();
      onPrevious?.();
      return;
    }

    if (key === ']') {
      event.preventDefault();
      onNext?.();
      return;
    }

    // G key combos for navigation
    if (key === 'g' && !metaKey && !ctrlKey && !altKey) {
      gPressedRef.current = true;
      // Clear g after 1 second
      clearTimeout(gTimeoutRef.current);
      gTimeoutRef.current = setTimeout(() => {
        gPressedRef.current = false;
      }, 1000);
      return;
    }

    if (gPressedRef.current) {
      gPressedRef.current = false;
      clearTimeout(gTimeoutRef.current);

      switch (key) {
        case 'h':
          event.preventDefault();
          router.push('/');
          break;
        case 'c':
          event.preventDefault();
          router.push('/command-center');
          break;
        case 'b':
          event.preventDefault();
          router.push('/baseball');
          break;
        case 'f':
          event.preventDefault();
          router.push('/football');
          break;
        case 'k':
          event.preventDefault();
          router.push('/basketball');
          break;
        case 'a':
          event.preventDefault();
          router.push('/copilot');
          break;
        case 's':
          event.preventDefault();
          router.push('/account/settings');
          break;
      }
    }
  }, [enabled, router, onToggleTheme, onRefresh, onOpenSearch, onCloseModal, onShowHelp, onPrevious, onNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeoutRef.current);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: getShortcutGroups(),
  };
}

// Keyboard Shortcuts Help Modal Component
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const groups = getShortcutGroups();

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="shortcuts-backdrop" onClick={onClose} />
      <div className="shortcuts-modal" role="dialog" aria-label="Keyboard shortcuts">
        <div className="shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="shortcuts-content">
          {groups.map((group) => (
            <div key={group.category} className="shortcuts-group">
              <h3>{group.category}</h3>
              <ul>
                {group.shortcuts.map((shortcut) => (
                  <li key={shortcut.keys}>
                    <kbd>{shortcut.keys}</kbd>
                    <span>{shortcut.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="shortcuts-footer">
          Press <kbd>?</kbd> anytime to show this help
        </div>
      </div>
    </>
  );
}
