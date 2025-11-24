'use client';

import { ReactNode, useState, useCallback } from 'react';
import { ToastProvider } from '../components/ui/Toast';
import { ConfettiProvider } from '../components/ui/Confetti';
import CommandPalette from '../components/ui/CommandPalette';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../hooks/useKeyboardShortcuts';

/**
 * App Providers
 *
 * Wraps the application with all necessary providers:
 * - Toast notifications
 * - Confetti celebrations
 * - Command palette
 * - Keyboard shortcuts
 */

function KeyboardShortcutsManager({ children }: { children: ReactNode }) {
  const [showHelp, setShowHelp] = useState(false);

  const handleToggleTheme = useCallback(() => {
    // Theme toggle logic - could be extended to use a theme context
    document.documentElement.classList.toggle('light');
  }, []);

  const handleOpenSearch = useCallback(() => {
    // Trigger command palette - we'll dispatch a custom event
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }, []);

  useKeyboardShortcuts({
    onToggleTheme: handleToggleTheme,
    onShowHelp: () => setShowHelp(true),
    onCloseModal: () => setShowHelp(false),
    onOpenSearch: handleOpenSearch,
    enabled: true,
  });

  return (
    <>
      {children}
      <KeyboardShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfettiProvider>
        <KeyboardShortcutsManager>
          {children}
          <CommandPalette />
        </KeyboardShortcutsManager>
      </ConfettiProvider>
    </ToastProvider>
  );
}
