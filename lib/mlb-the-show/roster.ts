import type { DDBuildCardSelection, DDBuildSummary, DDRosterSlot } from './types';

export const DD_ROSTER_SLOTS: DDRosterSlot[] = [
  { id: 'captain', label: 'Captain', group: 'captain', allowedPositions: ['ANY'] },
  { id: 'c', label: 'C', group: 'lineup', allowedPositions: ['C'] },
  { id: '1b', label: '1B', group: 'lineup', allowedPositions: ['1B'] },
  { id: '2b', label: '2B', group: 'lineup', allowedPositions: ['2B'] },
  { id: '3b', label: '3B', group: 'lineup', allowedPositions: ['3B'] },
  { id: 'ss', label: 'SS', group: 'lineup', allowedPositions: ['SS'] },
  { id: 'lf', label: 'LF', group: 'lineup', allowedPositions: ['LF'] },
  { id: 'cf', label: 'CF', group: 'lineup', allowedPositions: ['CF'] },
  { id: 'rf', label: 'RF', group: 'lineup', allowedPositions: ['RF'] },
  { id: 'dh', label: 'DH', group: 'lineup', allowedPositions: ['DH', '1B', 'LF', 'RF', 'C', '3B'] },
  { id: 'bench-1', label: 'Bench 1', group: 'bench', allowedPositions: ['ANY'] },
  { id: 'bench-2', label: 'Bench 2', group: 'bench', allowedPositions: ['ANY'] },
  { id: 'bench-3', label: 'Bench 3', group: 'bench', allowedPositions: ['ANY'] },
  { id: 'bench-4', label: 'Bench 4', group: 'bench', allowedPositions: ['ANY'] },
  { id: 'bench-5', label: 'Bench 5', group: 'bench', allowedPositions: ['ANY'] },
  { id: 'sp-1', label: 'SP1', group: 'rotation', allowedPositions: ['SP'] },
  { id: 'sp-2', label: 'SP2', group: 'rotation', allowedPositions: ['SP'] },
  { id: 'sp-3', label: 'SP3', group: 'rotation', allowedPositions: ['SP'] },
  { id: 'sp-4', label: 'SP4', group: 'rotation', allowedPositions: ['SP'] },
  { id: 'sp-5', label: 'SP5', group: 'rotation', allowedPositions: ['SP'] },
  { id: 'rp-1', label: 'RP1', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-2', label: 'RP2', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-3', label: 'RP3', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-4', label: 'RP4', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-5', label: 'RP5', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-6', label: 'RP6', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-7', label: 'RP7', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
  { id: 'rp-8', label: 'RP8', group: 'bullpen', allowedPositions: ['RP', 'CP'] },
];

export const DD_PARALLEL_LEVELS = [0, 1, 2, 3, 4, 5] as const;

export const DD_PARALLEL_MODS = [
  'None',
  'Contact Focus',
  'Power Focus',
  'Fielding Focus',
  'Speed Focus',
  'Pitch Mix Focus',
] as const;

function normalizeThemeTag(selection: DDBuildCardSelection): string | null {
  return selection.themeTag?.trim() || null;
}

function countHands(cards: DDBuildCardSelection[]) {
  return cards.reduce(
    (acc, card) => {
      const normalized = card.bats.trim().toUpperCase();
      const hand = normalized.startsWith('S') ? 'switch' : normalized.startsWith('L') ? 'left' : 'right';
      acc[hand] += 1;
      return acc;
    },
    { left: 0, right: 0, switch: 0 },
  );
}

export function summarizeBuild(cards: DDBuildCardSelection[]): DDBuildSummary {
  const totalStubCost = cards.reduce((sum, card) => sum + (card.bestSellNow ?? 0), 0);
  const averageOverall = cards.length
    ? Number((cards.reduce((sum, card) => sum + card.overall, 0) / cards.length).toFixed(1))
    : 0;

  const themes = new Map<string, number>();
  for (const card of cards) {
    const tag = normalizeThemeTag(card);
    if (!tag) continue;
    themes.set(tag, (themes.get(tag) ?? 0) + 1);
  }

  return {
    totalStubCost,
    averageOverall,
    captainEligibleCount: cards.filter((card) => card.slotId !== 'captain' && normalizeThemeTag(card)).length,
    hitterHandedness: countHands(cards.filter((card) => !card.slotId.startsWith('sp') && !card.slotId.startsWith('rp'))),
    themeTeams: [...themes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([team]) => team),
  };
}
