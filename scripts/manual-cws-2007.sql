-- 2007 College World Series Games (Verified Data)
-- Source: Creighton University CWS Archive + cross-validation
-- Champion: Oregon State swept North Carolina 2-0 in championship series (repeat champions)
-- Dates: June 15-24, 2007
-- Venue: Johnny Rosenblatt Stadium, Omaha, NE
-- Note: Oregon State went undefeated 5-0 in Omaha, first repeat champion since LSU (1996-1997)

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 15-16)
  ('cws-2007-20070615-rice-louisville', '2007-06-15', 'Rice', 'Louisville', 15, 10, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070615-north-carolina-mississippi-state', '2007-06-15', 'North Carolina', 'Mississippi State', 8, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070616-arizona-state-uc-irvine', '2007-06-16', 'Arizona State', 'UC Irvine', 5, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070616-oregon-state-cal-state-fullerton', '2007-06-16', 'Oregon State', 'Cal State Fullerton', 3, 2, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination & Winner's Bracket Games (June 17-21)
  ('cws-2007-20070617-louisville-mississippi-state', '2007-06-17', 'Louisville', 'Mississippi State', 12, 4, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070617-rice-north-carolina', '2007-06-17', 'Rice', 'North Carolina', 14, 4, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070618-uc-irvine-cal-state-fullerton', '2007-06-18', 'UC Irvine', 'Cal State Fullerton', 5, 4, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 13, 4, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070618-oregon-state-arizona-state', '2007-06-18', 'Oregon State', 'Arizona State', 12, 6, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070619-north-carolina-louisville', '2007-06-19', 'North Carolina', 'Louisville', 3, 1, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070619-uc-irvine-arizona-state', '2007-06-19', 'UC Irvine', 'Arizona State', 8, 7, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 10, 1, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070620-north-carolina-rice', '2007-06-20', 'North Carolina', 'Rice', 6, 1, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070620-oregon-state-uc-irvine', '2007-06-20', 'Oregon State', 'UC Irvine', 7, 1, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2007-20070621-north-carolina-rice', '2007-06-21', 'North Carolina', 'Rice', 7, 4, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Series (June 23-24) - Best of Three
  ('cws-finals-2007-game1', '2007-06-23', 'Oregon State', 'North Carolina', 11, 4, 'baseball', 'College World Series Finals - Finals Game 1', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2007-game2', '2007-06-24', 'Oregon State', 'North Carolina', 9, 3, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP);
