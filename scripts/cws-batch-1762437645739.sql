
INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  ('cws-finals-2003-rice-stanford', '2003-06-24', 'Rice', 'Stanford', 14, 2, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 24167, 9, 0, 2, '2025-11-06T14:00:44.738Z'),
  ('cws-2003-opening-game-1', '2003-06-15', 'Example Team A', 'Example Team B', 5, 3, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 22500, 9, 0, 2, '2025-11-06T14:00:44.738Z');
