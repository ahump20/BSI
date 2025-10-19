-- Enforce uniqueness for baseball fielding stats
--
-- 1. Remove duplicate stat rows so that unique indexes can be created without
--    violating existing data. We deduplicate both game-level records and
--    season aggregate rows (which are stored with a NULL game_id).
-- 2. Create partial unique indexes that guarantee no future duplicates can be
--    inserted.
--
-- This migration is idempotent and safe to run multiple times.

BEGIN;

-- Deduplicate game-level fielding stats (player_id + game_id)
WITH duplicate_game_rows AS (
    SELECT ranked.ctid
    FROM (
        SELECT ctid,
               ROW_NUMBER() OVER (
                   PARTITION BY player_id, game_id
                   ORDER BY ctid DESC
               ) AS row_num
        FROM baseball_fielding_stats
        WHERE game_id IS NOT NULL
    ) AS ranked
    WHERE ranked.row_num > 1
)
DELETE FROM baseball_fielding_stats bfs
USING duplicate_game_rows dgr
WHERE bfs.ctid = dgr.ctid;

-- Deduplicate season aggregate fielding stats (player_id + season_id when game_id IS NULL)
WITH duplicate_season_rows AS (
    SELECT ranked.ctid
    FROM (
        SELECT ctid,
               ROW_NUMBER() OVER (
                   PARTITION BY player_id, season_id
                   ORDER BY ctid DESC
               ) AS row_num
        FROM baseball_fielding_stats
        WHERE game_id IS NULL
          AND season_id IS NOT NULL
    ) AS ranked
    WHERE ranked.row_num > 1
)
DELETE FROM baseball_fielding_stats bfs
USING duplicate_season_rows dsr
WHERE bfs.ctid = dsr.ctid;

COMMIT;

-- Enforce uniqueness for new data inserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_baseball_fielding_player_game
    ON baseball_fielding_stats (player_id, game_id)
    WHERE game_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_baseball_fielding_player_season_null_game
    ON baseball_fielding_stats (player_id, season_id)
    WHERE game_id IS NULL;
