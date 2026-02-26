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
  // Roch Cholowsky — UCLA, projected No. 1 pick, SS
  '78754': [
    {
      id: 'chol-1',
      title: 'Cholowsky & Gasparino combine for 16 RBI vs TCU',
      date: '2026-02-22',
      videoUrl: 'https://uclabruins.com/watch?Archive=15357',
      source: 'espn',
      gameContext: 'vs TCU, Feb 22',
    },
  ],
  // Liam Peterson — Florida, top RHP draft prospect
  '77371': [
    {
      id: 'pet-1',
      title: '2026 MLB Draft Profile: Liam Peterson, RHP',
      date: '2026-02-01',
      videoUrl: 'https://www.mlb.com/video/2026-draft-liam-peterson-rhp',
      source: 'espn',
      gameContext: 'Draft scouting report',
    },
  ],
  // Tyce Armstrong — Baylor, 3 grand slams on opening day (Feb 13, 2026)
  // Not yet in D1 (Baylor games not ESPN-covered). ID TBD — using placeholder.
  // When Armstrong gets ingested, update this key to his espn_id.
  'tyce-armstrong-placeholder': [
    {
      id: 'arm-1',
      title: 'Tyce Armstrong — 3 Grand Slams vs New Mexico State',
      date: '2026-02-13',
      videoUrl: 'https://www.espn.com/video/clip/_/id/47924782',
      source: 'espn',
      duration: '1:45',
      gameContext: 'vs New Mexico State, Feb 13 — ties NCAA record',
    },
    {
      id: 'arm-2',
      title: 'Armstrong on his historic three grand slam performance',
      date: '2026-02-20',
      videoUrl: 'https://www.ncaa.com/video/baseball/2026-02-20/baylors-tyce-armstrong-his-historic-three-grand-slam-performance',
      source: 'espn',
      gameContext: 'NCAA.com interview',
    },
  ],
};
