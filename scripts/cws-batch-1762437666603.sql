
INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  ('cws-finals-2012-arizona-south-carolina', '2012-06-23', 'Arizona', 'South Carolina', 4, 1, 'baseball', 'College World Series Finals - Finals Game 1', 'Charles Schwab Field Omaha', 26842, 9, 0, 2, '2025-11-06T14:01:05.602Z'),
  ('cws-2012-opening-game-1', '2012-06-15', 'Example Team A', 'Example Team B', 5, 3, 'baseball', 'College World Series - Opening Round', 'Charles Schwab Field Omaha', 25000, 9, 0, 2, '2025-11-06T14:01:05.602Z');
