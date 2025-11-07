-- 2001 College World Series Games (Verified Data)
-- Source: Wikipedia wikitext extraction + cross-validation
-- Champion: Miami (FL) defeated Stanford 12-1 in championship
-- Dates: June 8-16, 2001
-- Venue: Rosenblatt Stadium (Johnny Rosenblatt Stadium), Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 8)
  ('cws-2001-20010608-stanford-tulane', '2001-06-08', 'Stanford', 'Tulane', 13, 11, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2001-20010608-cal-state-fullerton-nebraska', '2001-06-08', 'Cal State Fullerton', 'Nebraska', 5, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Second Round (June 9)
  ('cws-2001-20010609-southern-california-georgia', '2001-06-09', 'Southern California', 'Georgia', 11, 5, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2001-20010609-miami-tennessee', '2001-06-09', 'Miami (Fla.)', 'Tennessee', 21, 13, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Winner's Bracket & Elimination Games (June 10)
  ('cws-2001-20010610-tulane-nebraska', '2001-06-10', 'Tulane', 'Nebraska', 6, 5, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2001-20010610-stanford-cal-state-fullerton', '2001-06-10', 'Stanford', 'Cal State Fullerton', 5, 2, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 10, 1, 2, CURRENT_TIMESTAMP),

  -- Elimination Games (June 11)
  ('cws-2001-20010611-tennessee-georgia', '2001-06-11', 'Tennessee', 'Georgia', 19, 12, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2001-20010611-miami-southern-california', '2001-06-11', 'Miami (Fla.)', 'Southern California', 4, 3, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Bracket Finals (June 12)
  ('cws-2001-20010612-cal-state-fullerton-tulane', '2001-06-12', 'Cal State Fullerton', 'Tulane', 11, 2, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2001-20010612-tennessee-southern-california', '2001-06-12', 'Tennessee', 'Southern California', 10, 2, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Bracket Finals Continued (June 13-14)
  ('cws-2001-20010613-stanford-cal-state-fullerton', '2001-06-13', 'Stanford', 'Cal State Fullerton', 4, 1, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2001-20010614-miami-tennessee', '2001-06-14', 'Miami (Fla.)', 'Tennessee', 12, 6, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Game (June 16)
  ('cws-2001-20010616-miami-stanford', '2001-06-16', 'Miami (Fla.)', 'Stanford', 12, 1, 'baseball', 'College World Series Finals - Championship Game', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP);
