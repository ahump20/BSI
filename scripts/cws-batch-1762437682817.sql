
INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  ('cws-finals-2019-vanderbilt-michigan', '2019-06-24', 'Vanderbilt', 'Michigan', 8, 2, 'baseball', 'College World Series Finals - Finals Game 2', 'Charles Schwab Field Omaha', 26842, 9, 0, 2, '2025-11-06T14:01:21.815Z'),
  ('cws-2019-opening-game-1', '2019-06-15', 'Example Team A', 'Example Team B', 5, 3, 'baseball', 'College World Series - Opening Round', 'Charles Schwab Field Omaha', 25000, 9, 0, 2, '2025-11-06T14:01:21.815Z');
