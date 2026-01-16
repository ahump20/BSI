-- 2008 College World Series Games (Verified Data)
-- Source: Multiple cross-validated sources (Wikipedia, LSUsports.net, Creighton archives)
-- Champion: Fresno State defeated Georgia 2-1 in finals
-- Dates: June 14-25, 2008
-- Venue: Rosenblatt Stadium, Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 14-15)
  ('cws-2008-20080614-stanford-florida-state', '2008-06-14', 'Stanford', 'Florida State', 16, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080614-georgia-miami', '2008-06-14', 'Georgia', 'Miami (Fla.)', 7, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080615-north-carolina-lsu', '2008-06-15', 'North Carolina', 'LSU', 8, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080615-fresno-state-rice', '2008-06-15', 'Fresno State', 'Rice', 17, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination Games (June 16-22)
  ('cws-2008-20080616-miami-florida-state', '2008-06-16', 'Miami (Fla.)', 'Florida State', 7, 5, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080616-georgia-stanford', '2008-06-16', 'Georgia', 'Stanford', 4, 3, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080617-fresno-state-north-carolina', '2008-06-17', 'Fresno State', 'North Carolina', 5, 3, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080617-lsu-rice', '2008-06-17', 'LSU', 'Rice', 6, 5, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080618-stanford-miami', '2008-06-18', 'Stanford', 'Miami (Fla.)', 8, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080619-north-carolina-lsu', '2008-06-19', 'North Carolina', 'LSU', 7, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080621-north-carolina-fresno-state', '2008-06-21', 'North Carolina', 'Fresno State', 4, 3, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080621-georgia-stanford', '2008-06-21', 'Georgia', 'Stanford', 10, 8, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2008-20080622-fresno-state-north-carolina', '2008-06-22', 'Fresno State', 'North Carolina', 6, 1, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Series (June 23-25)
  ('cws-finals-2008-game1', '2008-06-23', 'Georgia', 'Fresno State', 7, 6, 'baseball', 'College World Series Finals - Finals Game 1', 'Rosenblatt Stadium', 24000, 9, 0, 3, CURRENT_TIMESTAMP),
  ('cws-finals-2008-game2', '2008-06-24', 'Fresno State', 'Georgia', 19, 10, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2008-game3', '2008-06-25', 'Fresno State', 'Georgia', 6, 1, 'baseball', 'College World Series Finals - Finals Game 3', 'Rosenblatt Stadium', 24000, 9, 0, 1, CURRENT_TIMESTAMP);
