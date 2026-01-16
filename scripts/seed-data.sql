-- Seed Sample Data for Copilot Testing
-- This script inserts sample teams and games for testing semantic search

PRAGMA foreign_keys = OFF;

-- Insert Teams
INSERT OR REPLACE INTO teams (sport, team_id, key, name, city, conference, division)
VALUES
  ('NFL', 1001, 'KC', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West'),
  ('NFL', 1002, 'MIN', 'Minnesota Vikings', 'Minnesota', 'NFC', 'North'),
  ('NFL', 1003, 'BAL', 'Baltimore Ravens', 'Baltimore', 'AFC', 'North'),
  ('NFL', 1004, 'CIN', 'Cincinnati Bengals', 'Cincinnati', 'AFC', 'North'),
  ('MLB', 2001, 'STL', 'St. Louis Cardinals', 'St. Louis', 'NL', 'Central'),
  ('MLB', 2002, 'CHC', 'Chicago Cubs', 'Chicago', 'NL', 'Central'),
  ('MLB', 2003, 'LAD', 'Los Angeles Dodgers', 'Los Angeles', 'NL', 'West'),
  ('MLB', 2004, 'COL', 'Colorado Rockies', 'Colorado', 'NL', 'West'),
  ('CFB', 3001, 'TEX', 'Texas Longhorns', 'Austin', 'SEC', NULL),
  ('CFB', 3002, 'OU', 'Oklahoma Sooners', 'Norman', 'SEC', NULL),
  ('CFB', 3003, 'ALA', 'Alabama Crimson Tide', 'Tuscaloosa', 'SEC', 'West'),
  ('CFB', 3004, 'MISS', 'Ole Miss Rebels', 'Oxford', 'SEC', 'West'),
  ('CBB', 4001, 'UK', 'Kentucky Wildcats', 'Lexington', 'SEC', NULL),
  ('CBB', 4002, 'LOU', 'Louisville Cardinals', 'Louisville', 'ACC', NULL),
  ('CBB', 4003, 'DUKE', 'Duke Blue Devils', 'Durham', 'ACC', NULL),
  ('CBB', 4004, 'UNC', 'North Carolina Tar Heels', 'Chapel Hill', 'ACC', NULL);

-- Insert Games
INSERT OR REPLACE INTO games (sport, game_id, season, season_type, week, game_date, game_time, status,
  home_team_id, home_team_key, home_team_name, home_score,
  away_team_id, away_team_key, away_team_name, away_score,
  stadium_name, winning_team_id)
VALUES
  ('NFL', 10001, 2025, 'REG', 5, '2025-10-05', '13:00', 'Final',
   1001, 'KC', 'Kansas City Chiefs', 28,
   1002, 'MIN', 'Minnesota Vikings', 24,
   'Arrowhead Stadium', 1001),
  ('NFL', 10002, 2025, 'REG', 5, '2025-10-06', '16:25', 'Final',
   1003, 'BAL', 'Baltimore Ravens', 31,
   1004, 'CIN', 'Cincinnati Bengals', 27,
   'M&T Bank Stadium', 1003),
  ('MLB', 20001, 2025, 'REG', NULL, '2025-09-28', '19:10', 'Final',
   2001, 'STL', 'St. Louis Cardinals', 4,
   2002, 'CHC', 'Chicago Cubs', 2,
   'Busch Stadium', 2001),
  ('MLB', 20002, 2025, 'REG', NULL, '2025-09-29', '13:15', 'Final',
   2003, 'LAD', 'Los Angeles Dodgers', 5,
   2004, 'COL', 'Colorado Rockies', 3,
   'Dodger Stadium', 2003),
  ('CFB', 30001, 2025, 'REG', 7, '2025-10-12', '15:30', 'Final',
   3001, 'TEX', 'Texas Longhorns', 34,
   3002, 'OU', 'Oklahoma Sooners', 24,
   'Darrell K Royal-Texas Memorial Stadium', 3001),
  ('CFB', 30002, 2025, 'REG', 7, '2025-10-12', '19:00', 'Final',
   3003, 'ALA', 'Alabama Crimson Tide', 42,
   3004, 'MISS', 'Ole Miss Rebels', 28,
   'Bryant-Denny Stadium', 3003),
  ('CBB', 40001, 2025, 'REG', NULL, '2025-11-15', '20:00', 'Final',
   4001, 'UK', 'Kentucky Wildcats', 78,
   4002, 'LOU', 'Louisville Cardinals', 72,
   'Rupp Arena', 4001),
  ('CBB', 40002, 2025, 'REG', NULL, '2025-11-16', '18:00', 'Final',
   4003, 'DUKE', 'Duke Blue Devils', 85,
   4004, 'UNC', 'North Carolina Tar Heels', 81,
   'Cameron Indoor Stadium', 4003);

PRAGMA foreign_keys = ON;
