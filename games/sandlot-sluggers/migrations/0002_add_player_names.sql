-- Add optional player name for leaderboard display
-- Players can optionally submit a name with their score

ALTER TABLE game_stats ADD COLUMN player_name TEXT DEFAULT NULL;

-- Update leaderboard index to include player_name
DROP INDEX IF EXISTS idx_game_stats_leaderboard;
CREATE INDEX idx_game_stats_leaderboard
ON game_stats (mode, runs DESC, hits DESC, created_at DESC);
