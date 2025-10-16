-- ============================================================================
-- BLAZE SPORTS INTEL - D1 DATABASE SEED DATA
-- Sample data for testing and development
-- ============================================================================

-- Seasons
INSERT INTO seasons (year, start_date, end_date, is_active) VALUES
(2024, '2024-02-16', '2024-06-24', 0),
(2025, '2025-02-14', '2025-06-23', 1),
(2026, '2026-02-13', '2026-06-22', 0);

-- Conferences
INSERT INTO conferences (name, abbreviation, division, region, tournament_bids, established_year) VALUES
('Southeastern Conference', 'SEC', 'D1', 'Southeast', 6, 1932),
('Atlantic Coast Conference', 'ACC', 'D1', 'East Coast', 5, 1953),
('Big 12 Conference', 'Big 12', 'D1', 'Central', 4, 1994),
('Pacific-12 Conference', 'Pac-12', 'D1', 'West Coast', 3, 1959),
('Big Ten Conference', 'Big Ten', 'D1', 'Midwest', 3, 1896);

-- Teams
INSERT INTO teams (espn_id, name, school, abbreviation, mascot, conference_id, city, state, stadium_name, stadium_capacity, color, alt_color, founded_year, is_active) VALUES
-- SEC Teams
('251', 'Texas Longhorns', 'University of Texas', 'TEX', 'Longhorns', 1, 'Austin', 'TX', 'UFCU Disch-Falk Field', 7000, '#BF5700', '#FFFFFF', 1896, 1),
('238', 'LSU Tigers', 'Louisiana State University', 'LSU', 'Tigers', 1, 'Baton Rouge', 'LA', 'Alex Box Stadium', 10326, '#461D7C', '#FDD023', 1893, 1),
('235', 'Vanderbilt Commodores', 'Vanderbilt University', 'VU', 'Commodores', 1, 'Nashville', 'TN', 'Hawkins Field', 3700, '#866D4B', '#000000', 1886, 1),
('2633', 'Tennessee Volunteers', 'University of Tennessee', 'TENN', 'Volunteers', 1, 'Knoxville', 'TN', 'Lindsey Nelson Stadium', 4283, '#FF8200', '#FFFFFF', 1891, 1),
('333', 'Arkansas Razorbacks', 'University of Arkansas', 'ARK', 'Razorbacks', 1, 'Fayetteville', 'AR', 'Baum-Walker Stadium', 11084, '#9D2235', '#FFFFFF', 1897, 1),

-- ACC Teams
('2390', 'Wake Forest Demon Deacons', 'Wake Forest University', 'WAKE', 'Demon Deacons', 2, 'Winston-Salem', 'NC', 'David F. Couch Ballpark', 3500, '#9E7E38', '#000000', 1894, 1),
('153', 'Florida State Seminoles', 'Florida State University', 'FSU', 'Seminoles', 2, 'Tallahassee', 'FL', 'Dick Howser Stadium', 6700, '#782F40', '#CEB888', 1947, 1),
('150', 'Duke Blue Devils', 'Duke University', 'DUKE', 'Blue Devils', 2, 'Durham', 'NC', 'Jack Coombs Field', 1000, '#003087', '#FFFFFF', 1905, 1),

-- Big 12 Teams
('201', 'Oklahoma State Cowboys', 'Oklahoma State University', 'OKST', 'Cowboys', 3, 'Stillwater', 'OK', "O'Brate Stadium", 4800, '#FF7300', '#000000', 1908, 1),
('197', 'TCU Horned Frogs', 'Texas Christian University', 'TCU', 'Horned Frogs', 3, 'Fort Worth', 'TX', 'Lupton Stadium', 4500, '#4D1979', '#FFFFFF', 1896, 1);

-- Players (Sample data for Texas Longhorns)
INSERT INTO players (espn_id, first_name, last_name, full_name, jersey_number, position, bats, throws, height, weight, home_town, home_state, birth_date) VALUES
('4567890', 'Ivan', 'Melendez', 'Ivan Melendez', 17, '1B', 'R', 'R', 73, 200, 'El Paso', 'TX', '2001-03-15'),
('4567891', 'Murphy', 'Stehly', 'Murphy Stehly', 8, 'C', 'R', 'R', 72, 210, 'Houston', 'TX', '2002-05-22'),
('4567892', 'Douglas', 'Hodo', 'Douglas Hodo III', 14, '2B', 'L', 'R', 71, 190, 'Georgetown', 'TX', '2001-08-10'),
('4567893', 'Trey', 'Faltine', 'Trey Faltine', 2, 'SS', 'R', 'R', 73, 195, 'San Antonio', 'TX', '2002-01-18'),
('4567894', 'Pete', 'Hansen', 'Pete Hansen', 25, 'P', 'R', 'R', 75, 205, 'Austin', 'TX', '2001-11-30'),
('4567895', 'Ty', 'Madden', 'Ty Madden', 21, 'P', 'R', 'R', 76, 220, 'The Woodlands', 'TX', '2000-09-12'),

-- LSU Players
('4567896', 'Dylan', 'Crews', 'Dylan Crews', 3, 'OF', 'R', 'R', 72, 205, 'Lake Mary', 'FL', '2002-02-26'),
('4567897', 'Paul', 'Skenes', 'Paul Skenes', 33, 'P', 'R', 'R', 78, 235, 'Laguna Hills', 'CA', '2002-05-29');

-- Team Rosters (2025 Season)
INSERT INTO team_rosters (team_id, player_id, season_id, jersey_number, class_year, is_redshirt) VALUES
(1, 1, 2, 17, 'SR', 0),
(1, 2, 2, 8, 'JR', 0),
(1, 3, 2, 14, 'SR', 0),
(1, 4, 2, 2, 'JR', 0),
(1, 5, 2, 25, 'SR', 0),
(1, 6, 2, 21, 'SR', 0),
(2, 7, 2, 3, 'JR', 0),
(2, 8, 2, 33, 'JR', 0);

-- Sample Games (2025 Season)
INSERT INTO games (espn_id, season_id, game_date, game_time, week_number, home_team_id, away_team_id, home_score, away_score, innings, status, is_conference_game, venue_name, venue_city, venue_state, attendance, winning_team_id) VALUES
('401234567', 2, '2025-02-16', '14:00', 1, 1, 2, 5, 3, 9, 'final', 1, 'UFCU Disch-Falk Field', 'Austin', 'TX', 6842, 1),
('401234568', 2, '2025-02-17', '14:00', 1, 1, 2, 2, 4, 9, 'final', 1, 'UFCU Disch-Falk Field', 'Austin', 'TX', 6921, 2),
('401234569', 2, '2025-02-18', '13:00', 1, 1, 2, 8, 6, 10, 'final', 1, 'UFCU Disch-Falk Field', 'Austin', 'TX', 6998, 1),
('401234570', 2, '2025-02-23', '14:00', 2, 3, 4, 7, 5, 9, 'final', 1, 'Hawkins Field', 'Nashville', 'TN', 3654, 3),
('401234571', 2, '2025-03-01', '18:00', 3, 1, 5, 10, 8, 11, 'final', 1, 'UFCU Disch-Falk Field', 'Austin', 'TX', 6850, 1);

-- Box Scores
INSERT INTO box_scores (game_id, home_runs, home_hits, home_errors, home_left_on_base, home_doubles, home_triples, home_home_runs, home_walks, home_strikeouts, home_stolen_bases, away_runs, away_hits, away_errors, away_left_on_base, away_doubles, away_triples, away_home_runs, away_walks, away_strikeouts, away_stolen_bases, home_innings, away_innings) VALUES
(1, 5, 10, 1, 7, 2, 0, 1, 4, 8, 2, 3, 7, 2, 5, 1, 0, 0, 3, 10, 1, '[0,2,0,0,1,0,2,0,0]', '[1,0,0,2,0,0,0,0,0]'),
(2, 2, 6, 0, 6, 1, 0, 0, 2, 9, 0, 4, 9, 1, 4, 2, 0, 1, 1, 7, 2, '[0,0,1,0,0,0,0,1,0]', '[1,0,0,2,0,0,0,1,0]'),
(3, 8, 13, 0, 5, 3, 1, 2, 5, 6, 3, 6, 11, 1, 7, 2, 0, 1, 4, 8, 1, '[2,0,1,2,0,0,1,1,0,1]', '[1,1,0,2,0,0,1,0,1,0]'),
(4, 7, 12, 2, 8, 2, 1, 1, 3, 7, 1, 5, 9, 0, 6, 1, 0, 1, 2, 9, 0, '[1,0,2,0,1,0,2,0,1]', '[0,1,1,0,0,2,0,0,1]'),
(5, 10, 14, 1, 6, 4, 0, 2, 6, 5, 2, 8, 13, 2, 9, 3, 1, 1, 5, 7, 3, '[2,1,0,2,1,0,1,0,2,0,1]', '[1,0,2,1,0,1,0,2,0,1,0]');

-- Batting Stats (Game 1: Texas vs LSU)
INSERT INTO batting_stats (game_id, player_id, team_id, at_bats, runs, hits, doubles, triples, home_runs, rbi, walks, strikeouts, stolen_bases, caught_stealing, hit_by_pitch, sacrifice_flies, sacrifice_bunts, batting_order) VALUES
-- Texas Batters
(1, 1, 1, 4, 2, 2, 1, 0, 1, 3, 1, 1, 0, 0, 0, 0, 0, 4),
(1, 2, 1, 4, 1, 2, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 2),
(1, 3, 1, 3, 1, 2, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1),
(1, 4, 1, 4, 1, 1, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 6),

-- LSU Batters
(1, 7, 2, 4, 1, 2, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 3);

-- Pitching Stats (Game 1: Texas vs LSU)
INSERT INTO pitching_stats (game_id, player_id, team_id, innings_pitched, hits_allowed, runs_allowed, earned_runs, walks, strikeouts, home_runs_allowed, hit_batters, wild_pitches, balks, pitches_thrown, strikes, decision) VALUES
-- Texas Pitchers
(1, 5, 1, 6.0, 5, 2, 1, 2, 7, 0, 0, 0, 0, 92, 61, 'W'),
(1, 6, 1, 3.0, 2, 1, 1, 1, 3, 0, 0, 1, 0, 45, 30, 'S'),

-- LSU Pitchers
(1, 8, 2, 7.0, 8, 4, 3, 3, 6, 1, 1, 0, 0, 105, 68, 'L');

-- Team Season Stats (2025 Season - Partial)
INSERT INTO team_season_stats (team_id, season_id, wins, losses, games_played, conference_wins, conference_losses, home_wins, home_losses, away_wins, away_losses, runs_scored, hits, doubles, triples, home_runs, rbi, walks, strikeouts, stolen_bases, batting_average, on_base_percentage, slugging_percentage, runs_allowed, earned_runs_allowed, innings_pitched, hits_allowed, walks_allowed, strikeouts_recorded, team_era, rpi, strength_of_schedule, pythagorean_wins) VALUES
(1, 2, 3, 1, 4, 2, 1, 3, 1, 0, 0, 25, 43, 10, 1, 5, 23, 17, 28, 7, 0.325, 0.398, 0.512, 21, 18, 36.0, 39, 13, 31, 4.50, 0.5520, 0.5180, 2.8),
(2, 2, 2, 2, 4, 1, 2, 1, 1, 1, 1, 21, 39, 7, 0, 3, 19, 11, 32, 6, 0.298, 0.362, 0.445, 25, 22, 36.0, 43, 17, 28, 5.50, 0.5180, 0.5020, 1.9),
(3, 2, 1, 0, 1, 1, 0, 1, 0, 0, 0, 7, 12, 2, 1, 1, 6, 3, 7, 1, 0.333, 0.394, 0.528, 5, 5, 9.0, 9, 2, 9, 5.00, 0.5450, 0.5100, 1.0);

-- Player Season Stats (2025 Season - Partial)
INSERT INTO player_season_stats (player_id, team_id, season_id, games_played, at_bats, runs, hits, doubles, triples, home_runs, rbi, walks, strikeouts, stolen_bases, batting_average, on_base_percentage, slugging_percentage, games_pitched, games_started, wins, losses, saves, innings_pitched, hits_allowed, runs_allowed, earned_runs, walks_allowed, strikeouts_recorded, era, whip) VALUES
-- Texas Position Players
(1, 1, 2, 4, 16, 5, 6, 2, 0, 2, 7, 3, 4, 1, 0.375, 0.450, 0.688, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, NULL, NULL),
(2, 1, 2, 4, 15, 3, 5, 1, 0, 0, 3, 1, 3, 2, 0.333, 0.375, 0.400, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, NULL, NULL),
(3, 1, 2, 4, 14, 4, 6, 2, 0, 0, 4, 2, 1, 1, 0.429, 0.500, 0.571, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, NULL, NULL),
(4, 1, 2, 4, 15, 2, 3, 0, 0, 0, 1, 1, 5, 2, 0.200, 0.250, 0.200, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, NULL, NULL),

-- Texas Pitchers
(5, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, 2, 1, 1, 0, 0, 8.0, 7, 3, 2, 3, 10, 2.25, 1.25),
(6, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, 2, 0, 0, 0, 1, 5.0, 4, 2, 2, 2, 6, 3.60, 1.20),

-- LSU Players
(7, 2, 2, 4, 16, 4, 7, 3, 0, 1, 5, 1, 3, 2, 0.438, 0.471, 0.688, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, NULL, NULL),
(8, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, 2, 2, 0, 1, 0, 12.0, 13, 7, 6, 4, 11, 4.50, 1.42);

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

SELECT 'Seed data inserted successfully!' AS result;
SELECT COUNT(*) AS total_teams FROM teams;
SELECT COUNT(*) AS total_players FROM players;
SELECT COUNT(*) AS total_games FROM games;
