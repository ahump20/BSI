-- Indexes for savant advanced stats query performance
-- Applied to bsi-prod-db on 2026-02-26
CREATE INDEX IF NOT EXISTS idx_batting_adv_woba ON cbb_batting_advanced(woba DESC);
CREATE INDEX IF NOT EXISTS idx_batting_adv_conference ON cbb_batting_advanced(conference);
CREATE INDEX IF NOT EXISTS idx_batting_adv_team ON cbb_batting_advanced(team_id);
CREATE INDEX IF NOT EXISTS idx_pitching_adv_fip ON cbb_pitching_advanced(fip);
CREATE INDEX IF NOT EXISTS idx_pitching_adv_conference ON cbb_pitching_advanced(conference);
CREATE INDEX IF NOT EXISTS idx_pitching_adv_team ON cbb_pitching_advanced(team_id);
