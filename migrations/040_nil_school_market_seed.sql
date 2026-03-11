-- NIL School Market Seed — D1 baseball programs with Census metro population + NCES enrollment
-- Market size: top-25 metro = large, top-75 = medium, rest = small
-- Program tier: SEC/ACC/Big 12/Big Ten = power, select mid-majors = mid-major, rest = low-major

-- SEC
INSERT OR REPLACE INTO nil_school_market (team, conference, metro_population, enrollment, program_tier, market_size, updated_at) VALUES
('Texas Longhorns', 'SEC', 2283000, 52000, 'power', 'large', '2026-03-10'),
('Texas A&M Aggies', 'SEC', 268000, 72000, 'power', 'small', '2026-03-10'),
('Florida Gators', 'SEC', 332000, 55000, 'power', 'small', '2026-03-10'),
('LSU Tigers', 'SEC', 870000, 36000, 'power', 'medium', '2026-03-10'),
('Arkansas Razorbacks', 'SEC', 564000, 30000, 'power', 'medium', '2026-03-10'),
('Tennessee Volunteers', 'SEC', 892000, 34000, 'power', 'medium', '2026-03-10'),
('Vanderbilt Commodores', 'SEC', 1989000, 13000, 'power', 'large', '2026-03-10'),
('Ole Miss Rebels', 'SEC', 173000, 24000, 'power', 'small', '2026-03-10'),
('Georgia Bulldogs', 'SEC', 213000, 41000, 'power', 'small', '2026-03-10'),
('Auburn Tigers', 'SEC', 174000, 32000, 'power', 'small', '2026-03-10'),
('Alabama Crimson Tide', 'SEC', 244000, 39000, 'power', 'small', '2026-03-10'),
('Mississippi State Bulldogs', 'SEC', 131000, 23000, 'power', 'small', '2026-03-10'),
('South Carolina Gamecocks', 'SEC', 838000, 35000, 'power', 'medium', '2026-03-10'),
('Kentucky Wildcats', 'SEC', 516000, 31000, 'power', 'medium', '2026-03-10'),
('Missouri Tigers', 'SEC', 476000, 32000, 'power', 'medium', '2026-03-10'),
('Oklahoma Sooners', 'SEC', 1437000, 32000, 'power', 'large', '2026-03-10');

-- ACC
INSERT OR REPLACE INTO nil_school_market (team, conference, metro_population, enrollment, program_tier, market_size, updated_at) VALUES
('Wake Forest Demon Deacons', 'ACC', 676000, 9000, 'power', 'medium', '2026-03-10'),
('Virginia Cavaliers', 'ACC', 235000, 26000, 'power', 'small', '2026-03-10'),
('NC State Wolfpack', 'ACC', 1413000, 37000, 'power', 'large', '2026-03-10'),
('Clemson Tigers', 'ACC', 507000, 28000, 'power', 'medium', '2026-03-10'),
('Florida State Seminoles', 'ACC', 384000, 44000, 'power', 'small', '2026-03-10'),
('Miami Hurricanes', 'ACC', 6138000, 19000, 'power', 'large', '2026-03-10'),
('Louisville Cardinals', 'ACC', 1285000, 23000, 'power', 'large', '2026-03-10'),
('Duke Blue Devils', 'ACC', 636000, 17000, 'power', 'medium', '2026-03-10'),
('North Carolina Tar Heels', 'ACC', 636000, 31000, 'power', 'medium', '2026-03-10'),
('Stanford Cardinal', 'ACC', 3298000, 17000, 'power', 'large', '2026-03-10'),
('California Golden Bears', 'ACC', 3298000, 45000, 'power', 'large', '2026-03-10'),
('Georgia Tech Yellow Jackets', 'ACC', 6144000, 44000, 'power', 'large', '2026-03-10'),
('Notre Dame Fighting Irish', 'ACC', 324000, 13000, 'power', 'small', '2026-03-10');

-- Big 12
INSERT OR REPLACE INTO nil_school_market (team, conference, metro_population, enrollment, program_tier, market_size, updated_at) VALUES
('TCU Horned Frogs', 'Big 12', 7637000, 12000, 'power', 'large', '2026-03-10'),
('Texas Tech Red Raiders', 'Big 12', 322000, 40000, 'power', 'small', '2026-03-10'),
('Oklahoma State Cowboys', 'Big 12', 81000, 24000, 'power', 'small', '2026-03-10'),
('Baylor Bears', 'Big 12', 276000, 20000, 'power', 'small', '2026-03-10'),
('West Virginia Mountaineers', 'Big 12', 138000, 26000, 'power', 'small', '2026-03-10'),
('Kansas State Wildcats', 'Big 12', 132000, 20000, 'power', 'small', '2026-03-10'),
('Arizona Wildcats', 'Big 12', 1043000, 49000, 'power', 'large', '2026-03-10'),
('Arizona State Sun Devils', 'Big 12', 4946000, 77000, 'power', 'large', '2026-03-10'),
('BYU Cougars', 'Big 12', 636000, 34000, 'power', 'medium', '2026-03-10'),
('Cincinnati Bearcats', 'Big 12', 2256000, 47000, 'power', 'large', '2026-03-10'),
('Houston Cougars', 'Big 12', 7122000, 47000, 'power', 'large', '2026-03-10'),
('UCF Knights', 'Big 12', 2674000, 72000, 'power', 'large', '2026-03-10'),
('Kansas Jayhawks', 'Big 12', 504000, 28000, 'power', 'medium', '2026-03-10');

-- Big Ten
INSERT OR REPLACE INTO nil_school_market (team, conference, metro_population, enrollment, program_tier, market_size, updated_at) VALUES
('UCLA Bruins', 'Big Ten', 13200000, 46000, 'power', 'large', '2026-03-10'),
('USC Trojans', 'Big Ten', 13200000, 49000, 'power', 'large', '2026-03-10'),
('Michigan Wolverines', 'Big Ten', 4392000, 47000, 'power', 'large', '2026-03-10'),
('Ohio State Buckeyes', 'Big Ten', 2138000, 61000, 'power', 'large', '2026-03-10'),
('Indiana Hoosiers', 'Big Ten', 249000, 46000, 'power', 'small', '2026-03-10'),
('Maryland Terrapins', 'Big Ten', 6304000, 41000, 'power', 'large', '2026-03-10'),
('Minnesota Golden Gophers', 'Big Ten', 3690000, 52000, 'power', 'large', '2026-03-10'),
('Nebraska Cornhuskers', 'Big Ten', 960000, 25000, 'power', 'medium', '2026-03-10'),
('Oregon Ducks', 'Big Ten', 381000, 23000, 'power', 'small', '2026-03-10'),
('Penn State Nittany Lions', 'Big Ten', 162000, 88000, 'power', 'small', '2026-03-10'),
('Rutgers Scarlet Knights', 'Big Ten', 20140000, 51000, 'power', 'large', '2026-03-10'),
('Illinois Fighting Illini', 'Big Ten', 238000, 56000, 'power', 'small', '2026-03-10'),
('Iowa Hawkeyes', 'Big Ten', 179000, 31000, 'power', 'small', '2026-03-10'),
('Northwestern Wildcats', 'Big Ten', 9618000, 22000, 'power', 'large', '2026-03-10'),
('Purdue Boilermakers', 'Big Ten', 228000, 50000, 'power', 'small', '2026-03-10');

-- Select mid-majors with strong baseball programs
INSERT OR REPLACE INTO nil_school_market (team, conference, metro_population, enrollment, program_tier, market_size, updated_at) VALUES
('Coastal Carolina Chanticleers', 'Sun Belt', 480000, 10000, 'mid-major', 'medium', '2026-03-10'),
('East Carolina Pirates', 'AAC', 174000, 29000, 'mid-major', 'small', '2026-03-10'),
('Rice Owls', 'AAC', 7122000, 4000, 'mid-major', 'large', '2026-03-10'),
('Tulane Green Wave', 'AAC', 1271000, 14000, 'mid-major', 'large', '2026-03-10'),
('Southern Miss Golden Eagles', 'Sun Belt', 199000, 14000, 'mid-major', 'small', '2026-03-10'),
('Dallas Baptist Patriots', 'CUSA', 7637000, 5000, 'mid-major', 'large', '2026-03-10'),
('Fresno State Bulldogs', 'Mountain West', 1008000, 25000, 'mid-major', 'large', '2026-03-10'),
('Gonzaga Bulldogs', 'WCC', 573000, 8000, 'mid-major', 'medium', '2026-03-10'),
('Wichita State Shockers', 'AAC', 647000, 15000, 'mid-major', 'medium', '2026-03-10'),
('Florida Atlantic Owls', 'AAC', 6138000, 30000, 'mid-major', 'large', '2026-03-10'),
('Oral Roberts Golden Eagles', 'Summit', 1016000, 4000, 'mid-major', 'large', '2026-03-10'),
('Liberty Flames', 'CUSA', 271000, 15000, 'mid-major', 'small', '2026-03-10'),
('Sam Houston Bearkats', 'CUSA', 7122000, 22000, 'mid-major', 'large', '2026-03-10'),
('Louisiana Tech Bulldogs', 'CUSA', 258000, 12000, 'mid-major', 'small', '2026-03-10'),
('Oregon State Beavers', 'Independent', 308000, 33000, 'mid-major', 'small', '2026-03-10'),
('San Diego State Aztecs', 'Mountain West', 3338000, 36000, 'mid-major', 'large', '2026-03-10'),
('Washington State Cougars', 'Mountain West', 115000, 28000, 'mid-major', 'small', '2026-03-10'),
('Campbell Fighting Camels', 'CAA', 1362000, 7000, 'low-major', 'large', '2026-03-10'),
('Creighton Bluejays', 'Big East', 960000, 9000, 'mid-major', 'medium', '2026-03-10'),
('UConn Huskies', 'Big East', 1215000, 32000, 'mid-major', 'large', '2026-03-10');
