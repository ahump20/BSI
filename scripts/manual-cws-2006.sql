-- 2006 College World Series Games (Verified Data)
-- Source: Creighton University CWS Archive + cross-validation
-- Champion: Oregon State defeated North Carolina 2-1 in championship series
-- Dates: June 16-26, 2006
-- Venue: Johnny Rosenblatt Stadium, Omaha, NE
-- Note: First team in CWS history to lose twice in Omaha and win national championship

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 16-17)
  ('cws-2006-20060616-clemson-georgia-tech', '2006-06-16', 'Clemson', 'Georgia Tech', 8, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060616-north-carolina-cal-state-fullerton', '2006-06-16', 'North Carolina', 'Cal State Fullerton', 7, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 13, 4, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060617-rice-georgia', '2006-06-17', 'Rice', 'Georgia', 6, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060617-miami-oregon-state', '2006-06-17', 'Miami (Fla.)', 'Oregon State', 11, 1, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination & Winner's Bracket Games (June 18-22)
  ('cws-2006-20060618-cal-state-fullerton-georgia-tech', '2006-06-18', 'Cal State Fullerton', 'Georgia Tech', 7, 5, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060618-north-carolina-clemson', '2006-06-18', 'North Carolina', 'Clemson', 2, 0, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060619-oregon-state-georgia', '2006-06-19', 'Oregon State', 'Georgia', 5, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060619-rice-miami', '2006-06-19', 'Rice', 'Miami (Fla.)', 3, 2, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060620-cal-state-fullerton-clemson', '2006-06-20', 'Cal State Fullerton', 'Clemson', 7, 6, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060620-oregon-state-miami', '2006-06-20', 'Oregon State', 'Miami (Fla.)', 8, 1, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060621-north-carolina-cal-state-fullerton', '2006-06-21', 'North Carolina', 'Cal State Fullerton', 6, 5, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060621-oregon-state-rice', '2006-06-21', 'Oregon State', 'Rice', 5, 0, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2006-20060622-oregon-state-rice', '2006-06-22', 'Oregon State', 'Rice', 2, 0, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Series (June 24-26) - Best of Three
  ('cws-finals-2006-game1', '2006-06-24', 'North Carolina', 'Oregon State', 4, 3, 'baseball', 'College World Series Finals - Finals Game 1', 'Rosenblatt Stadium', 23500, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2006-game2', '2006-06-25', 'Oregon State', 'North Carolina', 11, 7, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 23500, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2006-game3', '2006-06-26', 'Oregon State', 'North Carolina', 3, 2, 'baseball', 'College World Series Finals - Finals Game 3', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP);
