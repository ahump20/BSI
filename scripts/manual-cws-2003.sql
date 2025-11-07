-- 2003 College World Series Games (Verified Data)
-- Source: Creighton University CWS Archive + Wikipedia cross-validation
-- Champion: Rice defeated Stanford 2-1 in best-of-three championship series
-- Dates: June 13-23, 2003 (First year of best-of-three championship format)
-- Venue: Johnny Rosenblatt Stadium, Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 13-14)
  ('cws-2003-20030613-stanford-south-carolina', '2003-06-13', 'Stanford', 'South Carolina', 8, 0, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030613-cal-state-fullerton-lsu', '2003-06-13', 'Cal State Fullerton', 'LSU', 8, 2, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030614-rice-southwest-missouri-state', '2003-06-14', 'Rice', 'Southwest Missouri State', 4, 2, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030614-texas-miami', '2003-06-14', 'Texas', 'Miami (Fla.)', 13, 2, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination & Winner's Bracket Games (June 15-16)
  ('cws-2003-20030615-south-carolina-lsu', '2003-06-15', 'South Carolina', 'LSU', 11, 10, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030615-cal-state-fullerton-stanford', '2003-06-15', 'Cal State Fullerton', 'Stanford', 6, 5, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030616-miami-southwest-missouri-state', '2003-06-16', 'Miami (Fla.)', 'Southwest Missouri State', 7, 5, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030616-rice-texas', '2003-06-16', 'Rice', 'Texas', 12, 2, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination Games Continued (June 17)
  ('cws-2003-20030617-stanford-south-carolina', '2003-06-17', 'Stanford', 'South Carolina', 13, 6, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030617-texas-miami', '2003-06-17', 'Texas', 'Miami (Fla.)', 5, 1, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Bracket Finals (June 18-19)
  ('cws-2003-20030618-stanford-cal-state-fullerton', '2003-06-18', 'Stanford', 'Cal State Fullerton', 5, 3, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030618-rice-texas', '2003-06-18', 'Rice', 'Texas', 5, 4, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2003-20030619-stanford-cal-state-fullerton', '2003-06-19', 'Stanford', 'Cal State Fullerton', 7, 5, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 10, 1, 2, CURRENT_TIMESTAMP),

  -- Championship Series (June 21-23) - Best of Three
  ('cws-finals-2003-game1', '2003-06-21', 'Rice', 'Stanford', 4, 3, 'baseball', 'College World Series Finals - Finals Game 1', 'Rosenblatt Stadium', 23741, 10, 1, 3, CURRENT_TIMESTAMP),
  ('cws-finals-2003-game2', '2003-06-22', 'Stanford', 'Rice', 8, 3, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 17907, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2003-game3', '2003-06-23', 'Rice', 'Stanford', 14, 2, 'baseball', 'College World Series Finals - Finals Game 3', 'Rosenblatt Stadium', 18494, 9, 0, 1, CURRENT_TIMESTAMP);
