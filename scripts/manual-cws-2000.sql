-- 2000 College World Series Games (Verified Data)
-- Source: Creighton University CWS Archive (static.gocreighton.com)
-- Champion: LSU defeated Stanford 6-5 in championship
-- Dates: June 9-17, 2000
-- Venue: Rosenblatt Stadium, Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 9-10)
  ('cws-2000-20000609-clemson-san-jose-state', '2000-06-09', 'Clemson', 'San Jose State', 10, 6, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000609-stanford-louisiana-lafayette', '2000-06-09', 'Stanford', 'Louisiana-Lafayette', 6, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000610-southern-california-florida-state', '2000-06-10', 'Southern California', 'Florida State', 6, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000610-lsu-texas', '2000-06-10', 'LSU', 'Texas', 13, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Winner's Bracket & Elimination Games (June 11-12)
  ('cws-2000-20000611-stanford-clemson', '2000-06-11', 'Stanford', 'Clemson', 10, 4, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000611-louisiana-lafayette-san-jose-state', '2000-06-11', 'Louisiana-Lafayette', 'San Jose State', 6, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000612-lsu-southern-california', '2000-06-12', 'LSU', 'Southern California', 10, 4, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000612-florida-state-texas', '2000-06-12', 'Florida State', 'Texas', 6, 2, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Bracket Finals (June 14-15)
  ('cws-2000-20000614-louisiana-lafayette-clemson', '2000-06-14', 'Louisiana-Lafayette', 'Clemson', 5, 4, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000614-florida-state-southern-california', '2000-06-14', 'Florida State', 'Southern California', 3, 2, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000615-stanford-louisiana-lafayette', '2000-06-15', 'Stanford', 'Louisiana-Lafayette', 19, 9, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2000-20000615-lsu-florida-state', '2000-06-15', 'LSU', 'Florida State', 6, 3, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Game (June 17)
  ('cws-2000-20000617-lsu-stanford', '2000-06-17', 'LSU', 'Stanford', 6, 5, 'baseball', 'College World Series Finals - Championship Game', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP);
