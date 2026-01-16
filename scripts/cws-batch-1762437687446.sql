
INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  ('cws-finals-2022-ole-miss-oklahoma', '2022-06-24', 'Ole Miss', 'Oklahoma', 4, 2, 'baseball', 'College World Series Finals - Finals Game 2', 'Charles Schwab Field Omaha', 26842, 9, 0, 3, '2025-11-06T14:01:26.444Z'),
  ('cws-2022-opening-game-1', '2022-06-15', 'Example Team A', 'Example Team B', 5, 3, 'baseball', 'College World Series - Opening Round', 'Charles Schwab Field Omaha', 25000, 9, 0, 2, '2025-11-06T14:01:26.444Z');
