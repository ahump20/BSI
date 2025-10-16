-- Add partial unique indexes to guard season aggregate rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_baseball_batting_stats_season_unique
ON baseball_batting_stats(player_id, season_id)
WHERE game_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_baseball_pitching_stats_season_unique
ON baseball_pitching_stats(player_id, season_id)
WHERE game_id IS NULL;
