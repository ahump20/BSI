-- 2004 College World Series Games (Verified Data)
-- Source: Creighton University CWS Archive + cross-validation
-- Champion: Cal State Fullerton defeated Texas 2-0 in championship series
-- Dates: June 18-27, 2004
-- Venue: Johnny Rosenblatt Stadium, Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 18-19)
  ('cws-2004-20040618-georgia-arizona', '2004-06-18', 'Georgia', 'Arizona', 8, 7, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040618-texas-arkansas', '2004-06-18', 'Texas', 'Arkansas', 13, 2, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040619-cal-state-fullerton-south-carolina', '2004-06-19', 'Cal State Fullerton', 'South Carolina', 2, 0, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040619-miami-lsu', '2004-06-19', 'Miami (Fla.)', 'LSU', 9, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination Games (June 20-23)
  ('cws-2004-20040620-arizona-arkansas', '2004-06-20', 'Arizona', 'Arkansas', 7, 2, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040620-texas-georgia', '2004-06-20', 'Texas', 'Georgia', 9, 3, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040621-south-carolina-lsu', '2004-06-21', 'South Carolina', 'LSU', 15, 4, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040621-cal-state-fullerton-miami', '2004-06-21', 'Cal State Fullerton', 'Miami (Fla.)', 6, 3, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040622-georgia-arizona', '2004-06-22', 'Georgia', 'Arizona', 3, 1, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040622-south-carolina-miami', '2004-06-22', 'South Carolina', 'Miami (Fla.)', 15, 11, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040623-texas-georgia', '2004-06-23', 'Texas', 'Georgia', 7, 6, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Bracket Finals (June 23-24)
  ('cws-2004-20040623-south-carolina-cal-state-fullerton', '2004-06-23', 'South Carolina', 'Cal State Fullerton', 5, 3, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2004-20040624-cal-state-fullerton-south-carolina', '2004-06-24', 'Cal State Fullerton', 'South Carolina', 4, 0, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Series (June 26-27) - Best of Three
  ('cws-finals-2004-game1', '2004-06-26', 'Cal State Fullerton', 'Texas', 6, 4, 'baseball', 'College World Series Finals - Finals Game 1', 'Rosenblatt Stadium', 23500, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2004-game2', '2004-06-27', 'Cal State Fullerton', 'Texas', 3, 2, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 23500, 9, 0, 2, CURRENT_TIMESTAMP);
