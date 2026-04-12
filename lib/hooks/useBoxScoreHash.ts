'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * URL-hash-backed state for a game-preview drawer.
 *
 * The hash format is `#game={gameId}`. Opening a game updates the URL in place
 * (no router push, no scroll jump), making the preview link-shareable: a
 * visitor who receives `/college-baseball/scores#game=401847630` lands on the
 * scoreboard with that game's drawer already open.
 *
 * Returns:
 * - `openGameId`: the game currently expected to be open, or `null`
 * - `openGame(id)`: open a game by id; updates hash, does not navigate
 * - `closeGame()`: close the current game; clears the hash
 */
export function useBoxScoreHash(): {
  openGameId: string | null;
  openGame: (id: string) => void;
  closeGame: () => void;
} {
  // Initialize lazily from the current hash so a shared link like
  // `/scores#game=12345` opens the drawer on the first render without a
  // no-drawer flash. `window` is safe to read inside a lazy initializer in
  // a 'use client' static export because this function only runs in the
  // browser (the module itself isn't imported during SSG).
  const [openGameId, setOpenGameId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const id = params.get('game');
    return id && id.length > 0 ? id : null;
  });

  // Keep state in sync if the user navigates via back/forward.
  useEffect(() => {
    const readHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const id = params.get('game');
      setOpenGameId(id && id.length > 0 ? id : null);
    };
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  const openGame = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    params.set('game', id);
    // replaceState keeps the hash update out of the back/forward history —
    // one open+close shouldn't create two history entries.
    const newHash = `#${params.toString()}`;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
    setOpenGameId(id);
  }, []);

  const closeGame = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    params.delete('game');
    const rest = params.toString();
    const newUrl = `${window.location.pathname}${window.location.search}${rest ? `#${rest}` : ''}`;
    window.history.replaceState(null, '', newUrl);
    setOpenGameId(null);
  }, []);

  return { openGameId, openGame, closeGame };
}
