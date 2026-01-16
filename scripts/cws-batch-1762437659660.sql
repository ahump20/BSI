
INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  ('cws-finals-2009-lsu-texas', '2009-06-24', 'LSU', 'Texas', 11, 4, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 24167, 9, 0, 2, '2025-11-06T14:00:58.658Z'),
  ('cws-2009-opening-game-1', '2009-06-15', 'Example Team A', 'Example Team B', 5, 3, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 22500, 9, 0, 2, '2025-11-06T14:00:58.658Z');
