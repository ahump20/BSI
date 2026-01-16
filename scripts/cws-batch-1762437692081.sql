
INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  ('cws-finals-2024-tennessee-texas-a&m', '2024-06-24', 'Tennessee', 'Texas A&M', 6, 5, 'baseball', 'College World Series Finals - Finals Game 2', 'Charles Schwab Field Omaha', 26842, 9, 0, 2, '2025-11-06T14:01:31.080Z'),
  ('cws-2024-opening-game-1', '2024-06-15', 'Example Team A', 'Example Team B', 5, 3, 'baseball', 'College World Series - Opening Round', 'Charles Schwab Field Omaha', 25000, 9, 0, 2, '2025-11-06T14:01:31.080Z');
