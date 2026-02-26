/**
 * Player video highlights — manual curation store.
 *
 * No automated video pipeline exists yet. This module provides the type
 * contract and a manual map for seeding featured player highlights
 * (YouTube embeds, ESPN clips, etc.) until a pipeline is built.
 */

export interface PlayerHighlight {
  id: string;
  title: string;
  date: string;
  thumbnailUrl?: string;
  videoUrl: string;
  source: 'espn' | 'youtube' | 'bsi';
  duration?: string;
  /** e.g. "vs Ole Miss, March 14" */
  gameContext?: string;
}

/**
 * Returns manually curated highlights for a player.
 * Empty array means no highlights available — the UI hides the section.
 */
export function getPlayerHighlights(playerId: string): PlayerHighlight[] {
  return playerHighlightData[playerId] ?? [];
}

// ---------------------------------------------------------------------------
// Manual curation map — seed featured players here
// ---------------------------------------------------------------------------

const playerHighlightData: Record<string, PlayerHighlight[]> = {
  // Example:
  // '4683024': [
  //   {
  //     id: 'jac-1',
  //     title: 'Jace LaViolette 3-run HR vs Arkansas',
  //     date: '2026-03-01',
  //     videoUrl: 'https://www.youtube.com/watch?v=...',
  //     source: 'youtube',
  //     duration: '0:42',
  //     gameContext: 'vs Arkansas, March 1',
  //   },
  // ],
};
