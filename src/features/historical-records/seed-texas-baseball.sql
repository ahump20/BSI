-- BSI Historical Records - Texas Longhorns Baseball Seed Data
-- All data sourced and verified - no fabrication
-- Sources: NCAA.com, Wikipedia, Burnt Orange Nation, Texas Longhorns Media Guide
-- Database: bsi-historical-db

-- =============================================================================
-- TEAM ENTRY
-- =============================================================================
INSERT OR REPLACE INTO teams (
  id, league, name, abbreviation, location, conference, division, 
  founded_year, venue, primary_color, secondary_color
) VALUES (
  'texas-baseball',
  'NCAA_BB',
  'Texas Longhorns',
  'TEX',
  'Austin, TX',
  'SEC',
  NULL,
  1894,
  'UFCU Disch-Falk Field',
  '#BF5700',
  '#FFFFFF'
);

-- =============================================================================
-- FRANCHISE RECORDS (Career)
-- Source: NCAA.com "The Texas college baseball all-time starting 9" 
-- https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9
-- =============================================================================

-- Career Home Runs - Kyle Russell
INSERT INTO franchise_records (
  team_id, category, record_type, stat_name, stat_value, holder_name, 
  holder_years, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'career',
  'Home Runs',
  62,
  'Kyle Russell',
  '2004-2007',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Career Home Runs #2 - Tanto Ontiveros
INSERT INTO franchise_records (
  team_id, category, record_type, stat_name, stat_value, holder_name, 
  holder_years, notes, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'career',
  'Career HR (2nd)',
  55,
  'Tanto Ontiveros',
  '2000-2003',
  'Also career leader in games played, games started, at-bats, and total bases',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Career Stolen Bases - Calvin Murray
INSERT INTO franchise_records (
  team_id, category, record_type, stat_name, stat_value, holder_name, 
  holder_years, notes, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'career',
  'Stolen Bases',
  139,
  'Calvin Murray',
  '1990-1992',
  'Holds top 3 single-season steals totals (49, 47, 43)',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Career Triples - Bill Bates
INSERT INTO franchise_records (
  team_id, category, record_type, stat_name, stat_value, holder_name, 
  holder_years, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'career',
  'Triples',
  20,
  'Bill Bates',
  '1983-1986',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Career Wins (Pitching) - Richard Wortham
INSERT INTO franchise_records (
  team_id, category, record_type, stat_name, stat_value, holder_name, 
  holder_years, source_url, source_name
) VALUES (
  'texas-baseball',
  'pitching',
  'career',
  'Wins',
  50,
  'Richard Wortham',
  '1974-1977',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Career Strikeouts (Pitching) - Greg Swindell
INSERT INTO franchise_records (
  team_id, category, record_type, stat_name, stat_value, holder_name, 
  holder_years, notes, source_url, source_name
) VALUES (
  'texas-baseball',
  'pitching',
  'career',
  'Strikeouts',
  501,
  'Greg Swindell',
  '1984-1986',
  '14 career shutouts (NCAA record)',
  'https://www.burntorangenation.com/2016/7/9/12117368/Texas-Longhorns-Roger-Clemens-Drew-Stubbs-Huston-Street',
  'Burnt Orange Nation'
);

-- =============================================================================
-- SINGLE-SEASON RECORDS
-- =============================================================================

-- Single-Season Home Runs - Kyle Russell
INSERT INTO season_records (
  team_id, category, stat_name, stat_value, player_name, season_year, 
  rank_in_category, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'Home Runs',
  28,
  'Kyle Russell',
  2007,
  1,
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Single-Season Stolen Bases - Calvin Murray
INSERT INTO season_records (
  team_id, category, stat_name, stat_value, player_name, season_year, 
  rank_in_category, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'Stolen Bases',
  49,
  'Calvin Murray',
  1992,
  1,
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Single-Season Runs - Bill Bates
INSERT INTO season_records (
  team_id, category, stat_name, stat_value, player_name, season_year, 
  rank_in_category, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'Runs Scored',
  100,
  'Bill Bates',
  1985,
  1,
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Single-Season Slugging % - Tom Hamilton (pre-modern records)
INSERT INTO season_records (
  team_id, category, stat_name, stat_value, player_name, season_year, 
  rank_in_category, notes, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'Slugging Percentage',
  '.878',
  'Tom Hamilton',
  1949,
  1,
  'Set prior to formation of Texas historical records in 1960',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Single-Season Slugging % (modern era) - Kyle Russell
INSERT INTO season_records (
  team_id, category, stat_name, stat_value, player_name, season_year, 
  rank_in_category, source_url, source_name
) VALUES (
  'texas-baseball',
  'hitting',
  'Slugging Pct (Modern)',
  '.807',
  'Kyle Russell',
  2007,
  2,
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- =============================================================================
-- POSTSEASON HISTORY
-- Source: Wikipedia - Texas Longhorns baseball
-- https://en.wikipedia.org/wiki/Texas_Longhorns_baseball
-- =============================================================================

-- 2005 National Championship
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  opponent, final_score, notable_moments, source_url, source_name
) VALUES (
  'texas-baseball',
  2005,
  'championship',
  'College World Series',
  'won',
  'Florida',
  '6-2',
  'Sixth national championship in program history',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- 2002 National Championship
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  opponent, final_score, source_url, source_name
) VALUES (
  'texas-baseball',
  2002,
  'championship',
  'College World Series',
  'won',
  'South Carolina',
  '12-6',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- 1983 National Championship
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  opponent, final_score, source_url, source_name
) VALUES (
  'texas-baseball',
  1983,
  'championship',
  'College World Series',
  'won',
  'Alabama',
  '4-3',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- 1975 National Championship
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  opponent, final_score, source_url, source_name
) VALUES (
  'texas-baseball',
  1975,
  'championship',
  'College World Series',
  'won',
  'South Carolina',
  '5-1',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- 1950 National Championship (First repeat champion)
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  opponent, final_score, notable_moments, source_url, source_name
) VALUES (
  'texas-baseball',
  1950,
  'championship',
  'College World Series',
  'won',
  'Washington State',
  '3-0',
  'First school to repeat as CWS champions',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- 1949 National Championship
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  opponent, final_score, source_url, source_name
) VALUES (
  'texas-baseball',
  1949,
  'championship',
  'College World Series',
  'won',
  'Wake Forest',
  '10-3',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- CWS Record Stats
INSERT INTO postseason_history (
  team_id, season_year, achievement_type, achievement_name, result,
  notable_moments, source_url, source_name
) VALUES (
  'texas-baseball',
  2024,
  'record',
  'All-Time CWS Records',
  'active',
  'Most CWS appearances (38), most CWS games won (88), most NCAA Tournament games won (258), most NCAA tournament appearances (63)',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- =============================================================================
-- KEY ERAS
-- =============================================================================

-- Augie Garrido Era
INSERT INTO key_eras (
  team_id, era_name, start_year, end_year, head_coach, overall_record,
  championships, notable_players, summary, significance, source_url, source_name
) VALUES (
  'texas-baseball',
  'The Garrido Dynasty',
  1997,
  2016,
  'Augie Garrido',
  '822-387',
  2,
  '["Drew Stubbs", "Huston Street", "Kyle Russell", "Tanto Ontiveros"]',
  'Augie Garrido led Texas to two national championships (2002, 2005) and five College World Series appearances. Won over 800 games and cemented Texas as the premier program in college baseball.',
  'Most successful modern era coach, won final championships in program history',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- Billy Disch Era
INSERT INTO key_eras (
  team_id, era_name, start_year, end_year, head_coach, overall_record,
  championships, summary, significance, source_url, source_name
) VALUES (
  'texas-baseball',
  'The Billy Disch Era',
  1911,
  1939,
  'Billy Disch',
  NULL,
  0,
  'Billy Disch led Texas to 22 conference titles, including an unprecedented run of 10 consecutive conference championships from 1913 to 1922. Established Texas as a regional powerhouse before the College World Series era.',
  'Built the foundation of Texas baseball tradition',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- Cliff Gustafson Era
INSERT INTO key_eras (
  team_id, era_name, start_year, end_year, head_coach, overall_record,
  championships, notable_players, summary, significance, source_url, source_name
) VALUES (
  'texas-baseball',
  'The Gustafson Era',
  1968,
  1996,
  'Cliff Gustafson',
  '1427-373',
  2,
  '["Roger Clemens", "Greg Swindell", "Calvin Murray", "Bill Bates", "Spike Owen"]',
  'Cliff Gustafson compiled a .793 winning percentage over 29 seasons, winning national championships in 1975 and 1983. Produced numerous MLB players including Roger Clemens and Greg Swindell.',
  'Winningest era in program history, produced Roger Clemens',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);

-- =============================================================================
-- ALL-TIME PLAYERS
-- =============================================================================

-- Roger Clemens
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team, jersey_number,
  hall_of_fame, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Roger Clemens',
  'RHP',
  '1982-1983',
  21,
  0,
  0,
  0,
  0,
  1,
  'pitchers',
  'Won 25 games at Texas. 7-time Cy Young Award winner in MLB. National college baseball award named in his honor.',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Greg Swindell
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team, jersey_number,
  hall_of_fame, hof_year, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, career_stats, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Greg Swindell',
  'LHP',
  '1984-1986',
  NULL,
  1,
  NULL,
  0,
  0,
  0,
  2,
  'pitchers',
  '{"career_strikeouts": 501, "career_era": 1.92, "career_shutouts": 14, "career_wins": 43}',
  '501 career strikeouts (Texas record). 14 career shutouts (NCAA record). 1985 National Player of the Year. College Baseball Hall of Fame inductee.',
  'https://www.burntorangenation.com/2016/7/9/12117368/Texas-Longhorns-Roger-Clemens-Drew-Stubbs-Huston-Street',
  'Burnt Orange Nation'
);

-- Kyle Russell
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team,
  hall_of_fame, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, career_stats, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Kyle Russell',
  'OF',
  '2004-2007',
  0,
  0,
  0,
  0,
  1,
  'power_hitters',
  '{"career_home_runs": 62, "single_season_hr": 28, "slugging_2007": 0.807}',
  'Career and single-season home run leader in Texas history. .807 slugging percentage in 2007 is second-best in program history.',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Drew Stubbs
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team,
  hall_of_fame, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, career_stats, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Drew Stubbs',
  'CF',
  '2004-2006',
  0,
  0,
  0,
  0,
  1,
  'outfielders',
  '{"career_home_runs": 31, "career_steals": 86, "batting_average": ".300+"}',
  'Never hit below .300. Top 10 all-time in career steals and home runs. 2006 Co-Big 12 Player of the Year. Golden Spikes Award finalist.',
  'https://www.burntorangenation.com/2016/7/9/12117368/Texas-Longhorns-Roger-Clemens-Drew-Stubbs-Huston-Street',
  'Burnt Orange Nation'
);

-- Calvin Murray
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team,
  hall_of_fame, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, career_stats, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Calvin Murray',
  'OF',
  '1990-1992',
  0,
  0,
  0,
  0,
  1,
  'base_stealers',
  '{"career_steals": 139, "career_runs": 197, "career_walks": 127, "career_triples": 14}',
  'Career stolen base leader (139). Holds top three single-season steals records (49, 47, 43). Hit .351 in 1992.',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Bill Bates
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team,
  hall_of_fame, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, career_stats, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Bill Bates',
  '2B',
  '1983-1986',
  0,
  0,
  0,
  0,
  1,
  'infielders',
  '{"career_triples": 20, "career_steals": 86, "single_season_runs": 100}',
  'Career triples leader (20). Single-season runs record (100 in 1985). Name appears in Texas record book 32 times. 1983 National Champion.',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Richard Wortham
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team,
  hall_of_fame, hof_year, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, career_stats, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Richard Wortham',
  'RHP',
  '1974-1977',
  1,
  NULL,
  0,
  0,
  0,
  3,
  'pitchers',
  '{"career_wins": 50, "career_strikeouts": 481, "freshman_record": "11-0", "opponent_avg": 0.173}',
  'Career wins leader (50). Second in career strikeouts (481). Went 11-0 as freshman. Won CWS as junior. Texas 8th inductee into College Baseball Hall of Fame.',
  'https://www.ncaa.com/news/baseball/article/2018-04-15/texas-college-baseball-all-time-starting-9',
  'NCAA.com'
);

-- Huston Street
INSERT INTO all_time_players (
  team_id, player_name, position, years_with_team,
  hall_of_fame, retired_number, all_star_selections, mvp_awards,
  franchise_rank, rank_category, legacy_summary, source_url, source_name
) VALUES (
  'texas-baseball',
  'Huston Street',
  'RHP/Closer',
  '2002-2004',
  0,
  0,
  0,
  0,
  4,
  'pitchers',
  '2002 CWS Most Outstanding Player. Dominant closer who anchored championship pitching staff.',
  'https://en.wikipedia.org/wiki/Texas_Longhorns_baseball',
  'Wikipedia'
);
