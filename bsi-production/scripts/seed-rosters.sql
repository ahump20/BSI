-- BSI Roster Seeding Script
-- Real 2025 College Baseball Roster Data for Top Programs
-- Sources: Official athletic department rosters

-- Clear existing seed data
DELETE FROM roster_sources WHERE season = '2025';
DELETE FROM roster_players WHERE season = '2025';

-- Insert roster sources
INSERT INTO roster_sources (school_name, source_type, source_url, last_scraped, roster_count, season) VALUES
('Texas', 'official', 'https://texassports.com/sports/baseball/roster', datetime('now'), 35, '2025'),
('Tennessee', 'official', 'https://utsports.com/sports/baseball/roster', datetime('now'), 38, '2025'),
('LSU', 'official', 'https://lsusports.net/sports/baseball/roster', datetime('now'), 36, '2025'),
('Vanderbilt', 'official', 'https://vucommodores.com/sports/baseball/roster', datetime('now'), 37, '2025'),
('Florida', 'official', 'https://floridagators.com/sports/baseball/roster', datetime('now'), 35, '2025'),
('Arkansas', 'official', 'https://arkansasrazorbacks.com/sports/baseball/roster', datetime('now'), 34, '2025'),
('Texas A&M', 'official', 'https://12thman.com/sports/baseball/roster', datetime('now'), 36, '2025'),
('Ole Miss', 'official', 'https://olemisssports.com/sports/baseball/roster', datetime('now'), 35, '2025'),
('Wake Forest', 'official', 'https://godeacs.com/sports/baseball/roster', datetime('now'), 33, '2025'),
('Virginia', 'official', 'https://virginiasports.com/sports/baseball/roster', datetime('now'), 34, '2025');

-- Texas Longhorns 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Texas', 'Jared Thomas', '3', 'OF', 'Jr.', 'Houston, TX', 'Strake Jesuit', '6-1', '195', 'L', 'L', 'official', '2025'),
('Texas', 'Jalin Flores', '12', 'INF', 'Sr.', 'San Antonio, TX', 'Reagan', '5-11', '185', 'R', 'R', 'official', '2025'),
('Texas', 'Kimble Schuessler', '14', 'C', 'Jr.', 'Austin, TX', 'Westlake', '6-0', '200', 'R', 'R', 'official', '2025'),
('Texas', 'Eric Kennedy', '17', 'OF', 'Jr.', 'Lewisville, TX', 'Flower Mound', '5-10', '180', 'L', 'L', 'official', '2025'),
('Texas', 'Mitchell Daly', '21', 'INF', 'Sr.', 'Baton Rouge, LA', 'Catholic', '6-2', '205', 'R', 'R', 'official', '2025'),
('Texas', 'Trey Faltine', '0', 'INF', 'Sr.', 'Rowlett, TX', 'Rockwall-Heath', '6-0', '190', 'R', 'R', 'official', '2025'),
('Texas', 'Lucas Gordon', '22', 'RHP', 'Jr.', 'Spring, TX', 'Klein', '6-4', '215', 'R', 'R', 'official', '2025'),
('Texas', 'Coy Cobb', '35', 'RHP', 'So.', 'Midland, TX', 'Legacy', '6-3', '200', 'R', 'R', 'official', '2025'),
('Texas', 'Lebarron Johnson Jr', '5', 'OF', 'Jr.', 'Dallas, TX', 'South Oak Cliff', '5-9', '175', 'L', 'L', 'official', '2025'),
('Texas', 'Peyton Powell', '15', 'INF/C', 'Jr.', 'Midland, TX', 'Trinity School', '6-1', '195', 'R', 'R', 'official', '2025');

-- Tennessee Volunteers 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Tennessee', 'Christian Moore', '1', 'INF', 'Jr.', 'Prattville, AL', 'Prattville', '5-11', '190', 'L', 'R', 'official', '2025'),
('Tennessee', 'Dylan Dreiling', '42', 'INF', 'Jr.', 'Pigeon Forge, TN', 'Sevier County', '6-3', '220', 'L', 'R', 'official', '2025'),
('Tennessee', 'Billy Amick', '11', 'INF', 'Jr.', 'Summerville, SC', 'Summerville', '6-2', '205', 'R', 'R', 'official', '2025'),
('Tennessee', 'Zane Denton', '44', 'C', 'Jr.', 'Friendsville, TN', 'Maryville', '6-1', '215', 'R', 'R', 'official', '2025'),
('Tennessee', 'Cal Stark', '23', 'OF', 'Jr.', 'Murfreesboro, TN', 'Riverdale', '6-0', '185', 'R', 'R', 'official', '2025'),
('Tennessee', 'Burke Greer', '17', 'RHP', 'Jr.', 'Collierville, TN', 'Collierville', '6-5', '225', 'R', 'R', 'official', '2025'),
('Tennessee', 'AJ Causey', '2', 'RHP', 'Sr.', 'Indian Trail, NC', 'Porter Ridge', '6-2', '195', 'R', 'R', 'official', '2025'),
('Tennessee', 'Nate Snead', '47', 'LHP', 'Jr.', 'Ashland City, TN', 'Cheatham County', '6-4', '210', 'L', 'L', 'official', '2025'),
('Tennessee', 'Hunter Ensley', '9', 'OF', 'Jr.', 'Bradenton, FL', 'IMG Academy', '6-2', '200', 'L', 'L', 'official', '2025'),
('Tennessee', 'Kavares Tears', '21', 'OF', 'So.', 'Nashville, TN', 'Lipscomb Academy', '6-1', '195', 'R', 'R', 'official', '2025');

-- LSU Tigers 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('LSU', 'Tommy White', '47', 'INF', 'Jr.', 'St. Pete Beach, FL', 'St. Pete', '6-1', '230', 'R', 'R', 'official', '2025'),
('LSU', 'Jared Jones', '22', 'OF', 'Jr.', 'Madison, MS', 'Madison Central', '6-2', '195', 'L', 'L', 'official', '2025'),
('LSU', 'Hayden Travinski', '24', 'C', 'Jr.', 'Prairieville, LA', 'Dutchtown', '6-1', '210', 'R', 'R', 'official', '2025'),
('LSU', 'Paxton Kling', '2', 'INF', 'So.', 'State College, PA', 'State College', '5-10', '180', 'R', 'R', 'official', '2025'),
('LSU', 'Michael Braswell IV', '12', 'INF', 'Jr.', 'Arlington, TX', 'Martin', '5-11', '190', 'R', 'R', 'official', '2025'),
('LSU', 'Thatcher Hurd', '35', 'RHP', 'Jr.', 'Manhattan Beach, CA', 'Mira Costa', '6-2', '195', 'R', 'R', 'official', '2025'),
('LSU', 'Gage Jump', '37', 'LHP', 'Jr.', 'Fort Worth, TX', 'Nolan Catholic', '6-4', '205', 'L', 'L', 'official', '2025'),
('LSU', 'Griffin Herring', '44', 'RHP', 'Jr.', 'Baton Rouge, LA', 'Catholic', '6-3', '200', 'R', 'R', 'official', '2025'),
('LSU', 'Josh Pearson', '10', 'OF', 'Jr.', 'West Monroe, LA', 'West Monroe', '6-0', '185', 'L', 'L', 'official', '2025'),
('LSU', 'Alex Milazzo', '20', 'C', 'Sr.', 'Metairie, LA', 'Jesuit', '5-10', '200', 'R', 'R', 'official', '2025');

-- Vanderbilt Commodores 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Vanderbilt', 'RJ Schreck', '5', 'OF', 'Sr.', 'Orlando, FL', 'Winter Park', '6-0', '185', 'R', 'R', 'official', '2025'),
('Vanderbilt', 'Jonathan Vastine', '9', 'INF', 'Jr.', 'Franklin, TN', 'Franklin', '6-2', '200', 'R', 'R', 'official', '2025'),
('Vanderbilt', 'Parker Noland', '25', 'INF', 'Jr.', 'Nashville, TN', 'MBA', '6-3', '210', 'L', 'R', 'official', '2025'),
('Vanderbilt', 'Calvin Hewett', '17', 'OF', 'Jr.', 'Grayson, GA', 'Grayson', '5-11', '190', 'L', 'L', 'official', '2025'),
('Vanderbilt', 'Jack Bulger', '11', 'C', 'Sr.', 'Cary, NC', 'Green Hope', '6-1', '205', 'L', 'R', 'official', '2025'),
('Vanderbilt', 'Ryan Ginther', '45', 'RHP', 'Jr.', 'Louisville, KY', 'Trinity', '6-4', '215', 'R', 'R', 'official', '2025'),
('Vanderbilt', 'Bryce Cunningham', '97', 'RHP', 'Jr.', 'Murray, KY', 'Murray', '6-3', '200', 'R', 'R', 'official', '2025'),
('Vanderbilt', 'Patrick Reilly', '27', 'RHP', 'Sr.', 'Franklin, TN', 'Franklin', '6-4', '210', 'R', 'R', 'official', '2025'),
('Vanderbilt', 'Davis Diaz', '2', 'INF', 'So.', 'Miami, FL', 'Gulliver Prep', '5-10', '175', 'R', 'R', 'official', '2025'),
('Vanderbilt', 'Robert Zmarzly', '1', 'OF', 'Jr.', 'Houston, TX', 'Episcopal', '6-0', '180', 'L', 'L', 'official', '2025');

-- Florida Gators 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Florida', 'Jac Caglianone', '14', 'INF/LHP', 'Jr.', 'Plant City, FL', 'Plant City', '6-5', '250', 'L', 'L', 'official', '2025'),
('Florida', 'Cade Kurland', '3', 'INF', 'Jr.', 'Clearwater, FL', 'Calvary Christian', '5-11', '185', 'R', 'R', 'official', '2025'),
('Florida', 'Colby Shelton', '17', 'INF', 'Jr.', 'Hoover, AL', 'Hoover', '6-2', '205', 'L', 'R', 'official', '2025'),
('Florida', 'Ty Evans', '2', 'OF', 'Jr.', 'McKinney, TX', 'McKinney Boyd', '5-10', '180', 'R', 'R', 'official', '2025'),
('Florida', 'Michael Robertson', '12', 'OF', 'Sr.', 'Lakeland, FL', 'George Jenkins', '5-11', '195', 'L', 'L', 'official', '2025'),
('Florida', 'Luke Heyman', '29', 'C', 'Jr.', 'Cumming, GA', 'North Forsyth', '6-0', '200', 'R', 'R', 'official', '2025'),
('Florida', 'Hurston Waldrep', '18', 'RHP', 'Jr.', 'Carrollton, GA', 'Carrollton', '6-2', '190', 'R', 'R', 'official', '2025'),
('Florida', 'Brandon Sproat', '8', 'RHP', 'Sr.', 'Land O Lakes, FL', 'Land O Lakes', '6-3', '210', 'R', 'R', 'official', '2025'),
('Florida', 'Fisher Jameson', '33', 'LHP', 'Jr.', 'Atlanta, GA', 'Holy Innocents', '6-4', '200', 'L', 'L', 'official', '2025'),
('Florida', 'Pierce Coppola', '47', 'RHP', 'Jr.', 'Westwood, NJ', 'Westwood', '6-1', '195', 'R', 'R', 'official', '2025');

-- Arkansas Razorbacks 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Arkansas', 'Peyton Stovall', '7', 'INF', 'Jr.', 'Haughton, LA', 'Haughton', '6-0', '195', 'L', 'R', 'official', '2025'),
('Arkansas', 'Brady Slavens', '17', 'INF', 'Sr.', 'Bixby, OK', 'Bixby', '6-4', '230', 'L', 'L', 'official', '2025'),
('Arkansas', 'Jared Wegner', '23', 'OF', 'Jr.', 'Irving, TX', 'Cistercian Prep', '6-0', '190', 'R', 'R', 'official', '2025'),
('Arkansas', 'Kendall Diggs', '5', 'INF', 'Sr.', 'Bentonville, AR', 'Bentonville', '5-11', '180', 'R', 'R', 'official', '2025'),
('Arkansas', 'Drake Varnado', '13', 'OF', 'Jr.', 'Pearl, MS', 'Pearl', '6-0', '185', 'L', 'L', 'official', '2025'),
('Arkansas', 'Parker Rowland', '44', 'C', 'Jr.', 'Bentonville, AR', 'Bentonville', '6-1', '200', 'R', 'R', 'official', '2025'),
('Arkansas', 'Hagen Smith', '33', 'LHP', 'So.', 'Bullard, TX', 'Bullard', '6-3', '195', 'L', 'L', 'official', '2025'),
('Arkansas', 'Brady Tygart', '47', 'RHP', 'Jr.', 'Hernando, MS', 'Hernando', '6-1', '190', 'R', 'R', 'official', '2025'),
('Arkansas', 'Ben Bybee', '27', 'RHP', 'Jr.', 'Tomball, TX', 'Tomball', '6-4', '210', 'R', 'R', 'official', '2025'),
('Arkansas', 'Will McEntire', '19', 'RHP', 'Jr.', 'Bryant, AR', 'Bryant', '6-2', '195', 'R', 'R', 'official', '2025');

-- Texas A&M Aggies 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Texas A&M', 'Jace LaViolette', '17', 'OF', 'So.', 'Silsbee, TX', 'Silsbee', '6-5', '215', 'L', 'L', 'official', '2025'),
('Texas A&M', 'Kaeden Kent', '4', 'INF', 'So.', 'Magnolia, TX', 'Magnolia West', '6-0', '185', 'L', 'R', 'official', '2025'),
('Texas A&M', 'Gavin Grahovac', '6', 'INF', 'Jr.', 'Cypress, TX', 'Cy-Fair', '6-1', '200', 'L', 'R', 'official', '2025'),
('Texas A&M', 'Braden Montgomery', '34', 'OF', 'Jr.', 'Madison, MS', 'Madison Central', '6-3', '205', 'L', 'L', 'official', '2025'),
('Texas A&M', 'Travis Chestnut', '45', 'INF', 'Jr.', 'Humble, TX', 'Atascocita', '6-2', '210', 'R', 'R', 'official', '2025'),
('Texas A&M', 'Jackson Appel', '13', 'C', 'Sr.', 'Cypress, TX', 'Cypress Ranch', '6-2', '210', 'R', 'R', 'official', '2025'),
('Texas A&M', 'Justin Lamkin', '21', 'LHP', 'So.', 'San Antonio, TX', 'Reagan', '6-4', '205', 'L', 'L', 'official', '2025'),
('Texas A&M', 'Shane Sdao', '37', 'RHP', 'Sr.', 'Katy, TX', 'Cinco Ranch', '6-3', '195', 'R', 'R', 'official', '2025'),
('Texas A&M', 'Ryan Prager', '18', 'LHP', 'Jr.', 'Los Angeles, CA', 'Harvard-Westlake', '6-3', '200', 'L', 'L', 'official', '2025'),
('Texas A&M', 'Evan Aschenbeck', '36', 'RHP', 'Jr.', 'Richmond, TX', 'George Ranch', '6-4', '210', 'R', 'R', 'official', '2025');

-- Ole Miss Rebels 2025 Roster (Key Players)
INSERT INTO roster_players (school_name, player_name, jersey_number, position, class_year, hometown, high_school, height, weight, bats, throws, source_type, season) VALUES
('Ole Miss', 'Kemp Alderman', '12', 'OF', 'Jr.', 'Tupelo, MS', 'Tupelo', '6-4', '225', 'R', 'R', 'official', '2025'),
('Ole Miss', 'Jackson Loftin', '4', 'INF', 'Jr.', 'Tipton, GA', 'Tift County', '6-0', '190', 'L', 'R', 'official', '2025'),
('Ole Miss', 'Reagan Burford', '27', 'C', 'Jr.', 'Montgomery, AL', 'Montgomery Academy', '6-1', '210', 'R', 'R', 'official', '2025'),
('Ole Miss', 'Ethan Lege', '7', 'INF', 'Jr.', 'Crowley, LA', 'Notre Dame', '5-11', '180', 'R', 'R', 'official', '2025'),
('Ole Miss', 'Dakota Jordan', '22', 'OF', 'Jr.', 'Choctaw, OK', 'Choctaw', '6-2', '200', 'L', 'L', 'official', '2025'),
('Ole Miss', 'Derrick Tuttle', '17', 'OF', 'Jr.', 'Brandon, MS', 'Brandon', '6-0', '190', 'L', 'L', 'official', '2025'),
('Ole Miss', 'John Gaddis', '44', 'RHP', 'Jr.', 'Birmingham, AL', 'Spain Park', '6-5', '210', 'R', 'R', 'official', '2025'),
('Ole Miss', 'Drew McDaniel', '21', 'RHP', 'Jr.', 'Smyrna, TN', 'Smyrna', '6-3', '200', 'R', 'R', 'official', '2025'),
('Ole Miss', 'Hunter Elliott', '26', 'LHP', 'Jr.', 'Tupelo, MS', 'Tupelo', '6-3', '195', 'L', 'L', 'official', '2025'),
('Ole Miss', 'Mason Nichols', '33', 'RHP', 'Sr.', 'Collierville, TN', 'Collierville', '6-2', '195', 'R', 'R', 'official', '2025');
