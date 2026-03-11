const WATCHLIST_KEY = 'bsi-show-dd-watchlist';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
  } catch {
    // Ignore persistence failures.
  }
}

export function getWatchlistIds() {
  return readIds();
}

export function hasWatchlistCard(cardId: string) {
  return readIds().includes(cardId);
}

export function toggleWatchlistCard(cardId: string) {
  const next = new Set(readIds());
  if (next.has(cardId)) next.delete(cardId);
  else next.add(cardId);
  const ids = [...next];
  writeIds(ids);
  return ids;
}
