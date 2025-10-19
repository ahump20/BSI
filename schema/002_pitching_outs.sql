BEGIN TRANSACTION;

-- Normalize player season innings to outs
ALTER TABLE player_season_stats ADD COLUMN innings_pitched_outs INTEGER NOT NULL DEFAULT 0;

UPDATE player_season_stats
SET innings_pitched_outs = CASE
  WHEN innings_pitched IS NULL THEN 0
  ELSE (CAST(innings_pitched AS INTEGER) * 3) +
       ROUND((innings_pitched - CAST(innings_pitched AS INTEGER)) * 10)
END;

ALTER TABLE player_season_stats DROP COLUMN innings_pitched;

-- Add outs column for team season pitching aggregates
ALTER TABLE team_season_stats ADD COLUMN innings_pitched_outs INTEGER NOT NULL DEFAULT 0;

COMMIT;
