-- Temporarily disable foreign keys
PRAGMA foreign_keys = OFF;

-- Insert SEC baseball teams
INSERT INTO teams (
  sport, team_id, global_team_id, key, city, name, school, conference,
  wins, losses, conference_wins, conference_losses,
  home_wins, home_losses, away_wins, away_losses,
  neutral_wins, neutral_losses, runs_scored, runs_allowed
) VALUES
  ('baseball', 145, 145, 'arkansas', 'Fayetteville', 'Razorbacks', 'University of Arkansas', 'SEC', 25, 15, 15, 9, 18, 5, 7, 10, 0, 0, 280, 200),
  ('baseball', 99, 99, 'lsu', 'Baton Rouge', 'Tigers', 'Louisiana State University', 'SEC', 28, 12, 16, 8, 20, 4, 8, 8, 0, 0, 310, 190),
  ('baseball', 333, 333, 'vanderbilt', 'Nashville', 'Commodores', 'Vanderbilt University', 'SEC', 22, 18, 12, 12, 15, 8, 7, 10, 0, 0, 240, 220),
  ('baseball', 57, 57, 'florida', 'Gainesville', 'Gators', 'University of Florida', 'SEC', 26, 14, 14, 10, 19, 6, 7, 8, 0, 0, 270, 210),
  ('baseball', 8, 8, 'alabama', 'Tuscaloosa', 'Crimson Tide', 'University of Alabama', 'SEC', 20, 20, 10, 14, 14, 9, 6, 11, 0, 0, 235, 235);

-- Add some completed games between teams for RPI calculations
INSERT INTO games (
  sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, neutral_site, winning_team_id
) VALUES
  -- Texas vs Arkansas (Texas won 5-3)
  ('baseball', 1001, 2025, 'REG', 10, '2025-04-15', '19:00', 'final',
   1, 'texas', 'Longhorns', 5,
   2, 'arkansas', 'Razorbacks', 3,
   'Disch-Falk Field', 0, 1),

  -- Texas vs LSU (LSU won 7-4)
  ('baseball', 1002, 2025, 'REG', 11, '2025-04-22', '18:30', 'final',
   3, 'lsu', 'Tigers', 7,
   1, 'texas', 'Longhorns', 4,
   'Alex Box Stadium', 0, 3),

  -- Texas vs Vanderbilt (Texas won 6-2)
  ('baseball', 1003, 2025, 'REG', 12, '2025-04-29', '20:00', 'final',
   1, 'texas', 'Longhorns', 6,
   4, 'vanderbilt', 'Commodores', 2,
   'Disch-Falk Field', 0, 1),

  -- Texas vs Florida (Texas won 8-5)
  ('baseball', 1004, 2025, 'REG', 13, '2025-05-06', '18:00', 'final',
   5, 'florida', 'Gators', 5,
   1, 'texas', 'Longhorns', 8,
   'Florida Ballpark', 0, 1),

  -- Texas vs Alabama (Alabama won 4-3)
  ('baseball', 1005, 2025, 'REG', 14, '2025-05-13', '19:30', 'final',
   6, 'alabama', 'Crimson Tide', 4,
   1, 'texas', 'Longhorns', 3,
   'Sewell-Thomas Stadium', 0, 6),

  -- LSU vs Arkansas (LSU won 9-2)
  ('baseball', 1006, 2025, 'REG', 11, '2025-04-23', '14:00', 'final',
   2, 'arkansas', 'Razorbacks', 2,
   3, 'lsu', 'Tigers', 9,
   'Baum-Walker Stadium', 0, 3),

  -- Vanderbilt vs Florida (Vanderbilt won 3-2)
  ('baseball', 1007, 2025, 'REG', 12, '2025-04-30', '16:00', 'final',
   4, 'vanderbilt', 'Commodores', 3,
   5, 'florida', 'Gators', 2,
   'Hawkins Field', 0, 4);

-- Add upcoming games for schedule optimization
INSERT INTO games (
  sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, neutral_site, winning_team_id
) VALUES
  -- Texas vs Arkansas (upcoming)
  ('baseball', 1008, 2025, 'REG', 15, '2025-10-25', '19:00', 'scheduled',
   2, 'arkansas', 'Razorbacks', NULL,
   1, 'texas', 'Longhorns', NULL,
   'Baum-Walker Stadium', 0, NULL),

  -- Texas vs LSU (upcoming)
  ('baseball', 1009, 2025, 'REG', 16, '2025-11-01', '18:30', 'scheduled',
   1, 'texas', 'Longhorns', NULL,
   3, 'lsu', 'Tigers', NULL,
   'Disch-Falk Field', 0, NULL),

  -- Texas vs Florida (upcoming)
  ('baseball', 1010, 2025, 'REG', 17, '2025-11-08', '20:00', 'scheduled',
   1, 'texas', 'Longhorns', NULL,
   5, 'florida', 'Gators', NULL,
   'Disch-Falk Field', 0, NULL);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Verify data
SELECT COUNT(*) as team_count FROM teams WHERE sport = 'baseball';
SELECT COUNT(*) as completed_games FROM games WHERE status = 'final';
SELECT COUNT(*) as upcoming_games FROM games WHERE status = 'scheduled';
