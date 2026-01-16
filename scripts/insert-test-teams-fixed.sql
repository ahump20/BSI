-- Insert test teams and games for RPI/SOS/ISR calculations
-- CORRECTED: All team references now match auto-generated id values
-- Created: 2025-10-19

-- Temporarily disable foreign keys for insertion
PRAGMA foreign_keys = OFF;

-- Insert baseball teams (Texas + 5 SEC teams for opponent network)
-- AUTO-INCREMENT will assign id values: 1=Texas, 2=Arkansas, 3=LSU, 4=Vanderbilt, 5=Florida, 6=Alabama
INSERT INTO teams (
  sport, team_id, global_team_id, key, city, name, school, conference,
  wins, losses, conference_wins, conference_losses,
  home_wins, home_losses, away_wins, away_losses,
  neutral_wins, neutral_losses, runs_scored, runs_allowed
) VALUES
  -- id=1: Texas Longhorns
  ('baseball', 251, 251, 'texas', 'Austin', 'Longhorns', 'University of Texas', 'SEC', 30, 10, 18, 6, 20, 4, 10, 6, 0, 0, 320, 180),

  -- id=2: Arkansas Razorbacks
  ('baseball', 145, 145, 'arkansas', 'Fayetteville', 'Razorbacks', 'University of Arkansas', 'SEC', 25, 15, 15, 9, 18, 5, 7, 10, 0, 0, 280, 200),

  -- id=3: LSU Tigers
  ('baseball', 99, 99, 'lsu', 'Baton Rouge', 'Tigers', 'Louisiana State University', 'SEC', 28, 12, 16, 8, 20, 4, 8, 8, 0, 0, 310, 190),

  -- id=4: Vanderbilt Commodores
  ('baseball', 333, 333, 'vanderbilt', 'Nashville', 'Commodores', 'Vanderbilt University', 'SEC', 22, 18, 12, 12, 15, 8, 7, 10, 0, 0, 240, 220),

  -- id=5: Florida Gators
  ('baseball', 57, 57, 'florida', 'Gainesville', 'Gators', 'University of Florida', 'SEC', 26, 14, 14, 10, 19, 6, 7, 8, 0, 0, 270, 210),

  -- id=6: Alabama Crimson Tide
  ('baseball', 8, 8, 'alabama', 'Tuscaloosa', 'Crimson Tide', 'University of Alabama', 'SEC', 20, 20, 10, 14, 14, 9, 6, 11, 0, 0, 235, 235);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Add completed games between teams (for RPI opponent network calculations)
-- home_team_id and away_team_id now correctly reference the id column (1-6)
INSERT INTO games (
  sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, neutral_site, winning_team_id
) VALUES
  -- Game 1: Texas (home) vs Arkansas (away) - Texas won 5-3
  ('baseball', 1001, 2025, 'REG', 10, '2025-04-15', '19:00', 'final',
   1, 'texas', 'Longhorns', 5,
   2, 'arkansas', 'Razorbacks', 3,
   'Disch-Falk Field', 0, 1),

  -- Game 2: LSU (home) vs Texas (away) - LSU won 7-4
  ('baseball', 1002, 2025, 'REG', 11, '2025-04-22', '18:30', 'final',
   3, 'lsu', 'Tigers', 7,
   1, 'texas', 'Longhorns', 4,
   'Alex Box Stadium', 0, 3),

  -- Game 3: Texas (home) vs Vanderbilt (away) - Texas won 6-2
  ('baseball', 1003, 2025, 'REG', 12, '2025-04-29', '20:00', 'final',
   1, 'texas', 'Longhorns', 6,
   4, 'vanderbilt', 'Commodores', 2,
   'Disch-Falk Field', 0, 1),

  -- Game 4: Florida (home) vs Texas (away) - Texas won 8-5
  ('baseball', 1004, 2025, 'REG', 13, '2025-05-06', '18:00', 'final',
   5, 'florida', 'Gators', 5,
   1, 'texas', 'Longhorns', 8,
   'Florida Ballpark', 0, 1),

  -- Game 5: Alabama (home) vs Texas (away) - Alabama won 4-3
  ('baseball', 1005, 2025, 'REG', 14, '2025-05-13', '19:30', 'final',
   6, 'alabama', 'Crimson Tide', 4,
   1, 'texas', 'Longhorns', 3,
   'Sewell-Thomas Stadium', 0, 6),

  -- Game 6: Arkansas (home) vs LSU (away) - LSU won 9-2
  ('baseball', 1006, 2025, 'REG', 11, '2025-04-23', '14:00', 'final',
   2, 'arkansas', 'Razorbacks', 2,
   3, 'lsu', 'Tigers', 9,
   'Baum-Walker Stadium', 0, 3),

  -- Game 7: Vanderbilt (home) vs Florida (away) - Vanderbilt won 3-2
  ('baseball', 1007, 2025, 'REG', 12, '2025-04-30', '16:00', 'final',
   4, 'vanderbilt', 'Commodores', 3,
   5, 'florida', 'Gators', 2,
   'Hawkins Field', 0, 4);

-- Add upcoming games for schedule optimization testing
INSERT INTO games (
  sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, neutral_site, winning_team_id
) VALUES
  -- Upcoming Game 1: Arkansas (home) vs Texas (away)
  ('baseball', 1008, 2025, 'REG', 15, '2025-10-25', '19:00', 'scheduled',
   2, 'arkansas', 'Razorbacks', NULL,
   1, 'texas', 'Longhorns', NULL,
   'Baum-Walker Stadium', 0, NULL),

  -- Upcoming Game 2: Texas (home) vs LSU (away)
  ('baseball', 1009, 2025, 'REG', 16, '2025-11-01', '18:30', 'scheduled',
   1, 'texas', 'Longhorns', NULL,
   3, 'lsu', 'Tigers', NULL,
   'Disch-Falk Field', 0, NULL),

  -- Upcoming Game 3: Texas (home) vs Florida (away)
  ('baseball', 1010, 2025, 'REG', 17, '2025-11-08', '20:00', 'scheduled',
   1, 'texas', 'Longhorns', NULL,
   5, 'florida', 'Gators', NULL,
   'Disch-Falk Field', 0, NULL);

-- Verify data insertion
SELECT 'Data inserted successfully!' as status;
SELECT COUNT(*) as team_count FROM teams WHERE sport = 'baseball';
SELECT COUNT(*) as completed_games FROM games WHERE status = 'final';
SELECT COUNT(*) as upcoming_games FROM games WHERE status = 'scheduled';
SELECT
  t.id,
  t.key,
  t.name,
  t.wins,
  t.losses,
  COUNT(DISTINCT CASE
    WHEN (g.home_team_id = t.id OR g.away_team_id = t.id) AND g.status = 'final'
    THEN CASE WHEN g.home_team_id = t.id THEN g.away_team_id ELSE g.home_team_id END
  END) as opponents_played
FROM teams t
LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id) AND g.status = 'final'
WHERE t.sport = 'baseball'
GROUP BY t.id, t.key, t.name, t.wins, t.losses
ORDER BY t.id;
