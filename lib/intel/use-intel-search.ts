'use client';

import { useMemo } from 'react';
import type {
  IntelGame,
  IntelSignal,
  CommandPaletteItem,
} from './types';

export function useIntelSearch(
  games: IntelGame[],
  signals: IntelSignal[],
  allTeams: string[],
  query: string,
) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { filteredGames: games, filteredSignals: signals, paletteItems: [] };

    const filteredGames = games.filter(
      (g) =>
        g.home.name.toLowerCase().includes(q) ||
        g.away.name.toLowerCase().includes(q) ||
        g.home.abbreviation.toLowerCase().includes(q) ||
        g.away.abbreviation.toLowerCase().includes(q),
    );

    const filteredSignals = signals.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.teamTags ?? []).some((t) => t.toLowerCase().includes(q)),
    );

    const matchedTeams = allTeams.filter((t) => t.toLowerCase().includes(q));

    const paletteItems: CommandPaletteItem[] = [
      ...filteredGames.map((g): CommandPaletteItem => ({
        id: g.id,
        label: `${g.away.abbreviation} @ ${g.home.abbreviation}`,
        type: 'game',
        sport: g.sport,
        data: g,
      })),
      ...filteredSignals.slice(0, 8).map((s): CommandPaletteItem => ({
        id: s.id,
        label: s.text.slice(0, 80),
        type: 'signal',
        sport: s.sport,
        data: s,
      })),
      ...matchedTeams.map((t): CommandPaletteItem => ({
        id: `team-${t}`,
        label: t,
        type: 'team',
        data: t,
      })),
    ];

    return { filteredGames, filteredSignals, paletteItems };
  }, [games, signals, allTeams, query]);
}
