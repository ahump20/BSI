import { describe, expect, it, vi } from 'vitest';

import {
  getGameLeaderboard,
  normalizeSubmissionMetadata,
  submitScore,
} from '../../workers/mini-games-api/src/leaderboard';

function createLeaderboardEnv(results: unknown[] = []) {
  const preparedStatements: Array<{ query: string; args: unknown[] }> = [];
  const rateLimit = {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
  };
  const db = {
    prepare: vi.fn((query: string) => ({
      bind: (...args: unknown[]) => {
        preparedStatements.push({ query, args });
        return {
          run: vi.fn().mockResolvedValue({ success: true, meta: { changed_db: true } }),
          all: vi.fn().mockResolvedValue({ results }),
        };
      },
    })),
  };

  return {
    env: {
      DB: db,
      RATE_LIMIT: rateLimit,
    } as unknown as Env,
    preparedStatements,
    rateLimit,
  };
}

describe('mini-games leaderboard metadata handling', () => {
  it('fills in quick-play, medium, and scoreVersion defaults for old clients', () => {
    expect(normalizeSubmissionMetadata()).toEqual({
      mode: 'quick-play',
      difficulty: 'medium',
      scoreVersion: 1,
    });
    expect(
      normalizeSubmissionMetadata({
        mode: 'team-mode',
        difficulty: 'hard',
        scoreVersion: 2,
        sessionSeed: 123,
      }),
    ).toEqual({
      mode: 'team-mode',
      difficulty: 'hard',
      scoreVersion: 2,
      sessionSeed: 123,
    });
  });

  it('stores normalized metadata even when the submission did not send any', async () => {
    const { env, preparedStatements, rateLimit } = createLeaderboardEnv();

    const response = await submitScore(
      {
        gameId: 'sandlot-sluggers',
        playerName: 'Austin',
        score: 144,
      },
      '127.0.0.1',
      env,
    );
    const insertStatement = preparedStatements.find(({ query }) =>
      query.includes('INSERT INTO leaderboard_entries'),
    );

    expect(response.status).toBe(200);
    expect(rateLimit.get).toHaveBeenCalled();
    expect(insertStatement).toBeDefined();
    expect(insertStatement?.args[3]).toBe(
      JSON.stringify({
        mode: 'quick-play',
        difficulty: 'medium',
        scoreVersion: 1,
      }),
    );
  });

  it('filters leaderboard queries by mode and difficulty while treating old rows as quick-play/medium', async () => {
    const { env, preparedStatements } = createLeaderboardEnv([
      {
        id: 7,
        game_id: 'sandlot-sluggers',
        player_name: 'Austin',
        score: 188,
        metadata: JSON.stringify({ mode: 'team-mode', difficulty: 'hard', scoreVersion: 2 }),
        submitted_at: '2026-03-26 12:00:00',
      },
    ]);

    const response = await getGameLeaderboard('sandlot-sluggers', 10, env, {
      mode: 'team-mode',
      difficulty: 'hard',
    });
    const json = await response.json() as { entries: Array<Record<string, unknown>> };
    const selectStatement = preparedStatements.find(({ query }) =>
      query.includes('FROM leaderboard_entries'),
    );

    expect(selectStatement?.query).toContain("coalesce(json_extract(metadata, '$.mode'), 'quick-play') = ?");
    expect(selectStatement?.query).toContain(
      "coalesce(json_extract(metadata, '$.difficulty'), 'medium') = ?",
    );
    expect(selectStatement?.args).toEqual([
      'sandlot-sluggers',
      'team-mode',
      'hard',
      10,
    ]);
    expect(json.entries[0].metadata).toEqual({
      mode: 'team-mode',
      difficulty: 'hard',
      scoreVersion: 2,
    });
  });
});
