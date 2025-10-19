export interface FieldingStatPayload {
  playerId: string;
  gameId?: string | null;
  seasonId?: string | null;
}

interface DuplicateContext {
  source?: string;
  gameId?: string;
  seasonId?: string;
}

/**
 * Validate that fielding stat payloads are unique before persistence.
 *
 * Throws an error when duplicates are detected so the ingest task can abort
 * before attempting database inserts that would violate unique constraints.
 */
export function assertNoDuplicateFieldingStats(
  stats: FieldingStatPayload[],
  context: DuplicateContext = {}
): void {
  const seen = new Map<string, FieldingStatPayload>();

  for (const stat of stats) {
    if (!stat.playerId) {
      throw new Error('Fielding stat payload is missing playerId');
    }

    const normalizedGameId = stat.gameId ?? null;
    const normalizedSeasonId = stat.seasonId ?? null;

    const key = normalizedGameId
      ? `game:${stat.playerId}:${normalizedGameId}`
      : normalizedSeasonId
      ? `season:${stat.playerId}:${normalizedSeasonId}`
      : (() => {
          throw new Error(
            `Fielding stat for player ${stat.playerId} must include either gameId or seasonId`
          );
        })();

    if (seen.has(key)) {
      const duplicate = seen.get(key)!;
      const error = new Error(
        `Duplicate fielding stat detected for ${key}.` +
          ` Incoming payload conflicts with existing record.`
      );
      (error as Error & { meta?: unknown }).meta = {
        context,
        duplicate,
        incoming: stat,
      };
      throw error;
    }

    seen.set(key, stat);
  }
}
