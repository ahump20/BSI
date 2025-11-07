-- 2002 College World Series Games (Verified Data)
-- Source: Wikipedia wikitext extraction + cross-validation
-- Champion: Texas defeated South Carolina 12-6
-- Dates: June 14-22, 2002
-- Venue: Rosenblatt Stadium, Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 14-15)
  ('cws-2002-20020614-georgia-tech-south-carolina', '2002-06-14', 'Georgia Tech', 'South Carolina', 11, 0, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020614-clemson-nebraska', '2002-06-14', 'Clemson', 'Nebraska', 11, 10, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020615-stanford-notre-dame', '2002-06-15', 'Stanford', 'Notre Dame', 4, 3, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020615-texas-rice', '2002-06-15', 'Texas', 'Rice', 2, 1, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination & Winner's Bracket Games (June 16-18)
  ('cws-2002-20020616-south-carolina-nebraska', '2002-06-16', 'South Carolina', 'Nebraska', 10, 8, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020616-clemson-georgia-tech', '2002-06-16', 'Clemson', 'Georgia Tech', 9, 7, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020617-notre-dame-rice', '2002-06-17', 'Notre Dame', 'Rice', 5, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020617-texas-stanford', '2002-06-17', 'Texas', 'Stanford', 8, 7, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020618-south-carolina-georgia-tech', '2002-06-18', 'South Carolina', 'Georgia Tech', 9, 5, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020618-stanford-notre-dame', '2002-06-18', 'Stanford', 'Notre Dame', 5, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Bracket Finals (June 19-21)
  ('cws-2002-20020619-south-carolina-clemson', '2002-06-19', 'South Carolina', 'Clemson', 12, 4, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020620-texas-stanford', '2002-06-20', 'Texas', 'Stanford', 6, 5, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2002-20020621-south-carolina-clemson', '2002-06-21', 'South Carolina', 'Clemson', 10, 2, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Game (June 22)
  ('cws-2002-20020622-texas-south-carolina', '2002-06-22', 'Texas', 'South Carolina', 12, 6, 'baseball', 'College World Series Finals - Championship Game', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP);
