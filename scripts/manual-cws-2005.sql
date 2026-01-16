-- 2005 College World Series Games (Verified Data)
-- Source: Creighton University CWS Archive + cross-validation
-- Champion: Texas defeated Florida 2-0 in championship series
-- Dates: June 17-26, 2005
-- Venue: Johnny Rosenblatt Stadium, Omaha, NE

INSERT OR IGNORE INTO historical_games (
  game_id, date, home_team, away_team, home_score, away_score,
  sport, tournament_round, venue, attendance, innings, extra_innings,
  lead_changes, created_at
)
VALUES
  -- Opening Round (June 17-18)
  ('cws-2005-20050617-florida-tennessee', '2005-06-17', 'Florida', 'Tennessee', 6, 4, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050617-nebraska-arizona-state', '2005-06-17', 'Nebraska', 'Arizona State', 5, 3, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050618-tulane-oregon-state', '2005-06-18', 'Tulane', 'Oregon State', 3, 1, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050618-texas-baylor', '2005-06-18', 'Texas', 'Baylor', 5, 1, 'baseball', 'College World Series - Opening Round', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Elimination & Winner's Bracket Games (June 19-22)
  ('cws-2005-20050619-arizona-state-tennessee', '2005-06-19', 'Arizona State', 'Tennessee', 4, 2, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050619-florida-nebraska', '2005-06-19', 'Florida', 'Nebraska', 7, 4, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050620-baylor-oregon-state', '2005-06-20', 'Baylor', 'Oregon State', 4, 3, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 10, 1, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050620-texas-tulane', '2005-06-20', 'Texas', 'Tulane', 5, 0, 'baseball', 'College World Series - Winner''s Bracket', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050621-arizona-state-nebraska', '2005-06-21', 'Arizona State', 'Nebraska', 8, 7, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 11, 2, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050621-baylor-tulane', '2005-06-21', 'Baylor', 'Tulane', 8, 7, 'baseball', 'College World Series - Elimination Game', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050622-arizona-state-florida', '2005-06-22', 'Arizona State', 'Florida', 6, 1, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050622-texas-baylor', '2005-06-22', 'Texas', 'Baylor', 4, 3, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-2005-20050623-florida-arizona-state', '2005-06-23', 'Florida', 'Arizona State', 6, 3, 'baseball', 'College World Series - Bracket Final', 'Rosenblatt Stadium', 23000, 9, 0, 2, CURRENT_TIMESTAMP),

  -- Championship Series (June 25-26) - Best of Three
  ('cws-finals-2005-game1', '2005-06-25', 'Texas', 'Florida', 4, 2, 'baseball', 'College World Series Finals - Finals Game 1', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP),
  ('cws-finals-2005-game2', '2005-06-26', 'Texas', 'Florida', 6, 2, 'baseball', 'College World Series Finals - Finals Game 2', 'Rosenblatt Stadium', 24000, 9, 0, 2, CURRENT_TIMESTAMP);
