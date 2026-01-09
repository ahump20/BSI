-- Migration: Add headshot and verification fields to transfer_portal
-- Created: 2025-01-08
-- Purpose: Enable player headshots and roster verification tracking

-- Add headshot_url for custom uploaded photos
ALTER TABLE transfer_portal ADD COLUMN headshot_url TEXT;

-- Add verification tracking fields
ALTER TABLE transfer_portal ADD COLUMN verification_source TEXT;
ALTER TABLE transfer_portal ADD COLUMN verification_date TEXT;
ALTER TABLE transfer_portal ADD COLUMN verified_roster INTEGER DEFAULT 0;

-- Create school_colors lookup table for avatar generation
CREATE TABLE IF NOT EXISTS school_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_name TEXT NOT NULL UNIQUE,
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  abbreviation TEXT,
  conference TEXT,
  logo_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert major D1 baseball program colors
INSERT OR IGNORE INTO school_colors (school_name, primary_color, secondary_color, abbreviation, conference) VALUES
-- SEC
('Alabama', '#9E1B32', '#828A8F', 'ALA', 'SEC'),
('Arkansas', '#9D2235', '#FFFFFF', 'ARK', 'SEC'),
('Auburn', '#03244D', '#F26522', 'AUB', 'SEC'),
('Florida', '#0021A5', '#FA4616', 'UF', 'SEC'),
('Georgia', '#BA0C2F', '#000000', 'UGA', 'SEC'),
('Kentucky', '#0033A0', '#FFFFFF', 'UK', 'SEC'),
('LSU', '#461D7C', '#FDD023', 'LSU', 'SEC'),
('Mississippi State', '#660000', '#FFFFFF', 'MSST', 'SEC'),
('Missouri', '#F1B82D', '#000000', 'MIZ', 'SEC'),
('Ole Miss', '#14213D', '#CE1126', 'MISS', 'SEC'),
('South Carolina', '#73000A', '#000000', 'SC', 'SEC'),
('Tennessee', '#FF8200', '#FFFFFF', 'TENN', 'SEC'),
('Texas A&M', '#500000', '#FFFFFF', 'TAMU', 'SEC'),
('Vanderbilt', '#866D4B', '#000000', 'VAN', 'SEC'),
('Oklahoma', '#841617', '#FFC20E', 'OU', 'SEC'),
('Texas', '#BF5700', '#FFFFFF', 'TEX', 'SEC'),
-- ACC
('Clemson', '#F56600', '#522D80', 'CLEM', 'ACC'),
('Duke', '#003087', '#FFFFFF', 'DUKE', 'ACC'),
('Florida State', '#782F40', '#CEB888', 'FSU', 'ACC'),
('Georgia Tech', '#B3A369', '#003057', 'GT', 'ACC'),
('Louisville', '#AD0000', '#000000', 'LOU', 'ACC'),
('Miami', '#F47321', '#005030', 'MIA', 'ACC'),
('North Carolina', '#7BAFD4', '#13294B', 'UNC', 'ACC'),
('NC State', '#CC0000', '#FFFFFF', 'NCST', 'ACC'),
('Notre Dame', '#0C2340', '#C99700', 'ND', 'ACC'),
('Pittsburgh', '#003594', '#FFB81C', 'PITT', 'ACC'),
('Virginia', '#232D4B', '#F84C1E', 'UVA', 'ACC'),
('Virginia Tech', '#660000', '#FF6600', 'VT', 'ACC'),
('Wake Forest', '#9E7E38', '#000000', 'WAKE', 'ACC'),
('Stanford', '#8C1515', '#FFFFFF', 'STAN', 'ACC'),
('Cal', '#003262', '#FDB515', 'CAL', 'ACC'),
('SMU', '#0033A0', '#C8102E', 'SMU', 'ACC'),
-- Big 12
('Arizona', '#CC0033', '#003366', 'ARIZ', 'Big 12'),
('Arizona State', '#8C1D40', '#FFC627', 'ASU', 'Big 12'),
('Baylor', '#003015', '#FFB81C', 'BAY', 'Big 12'),
('BYU', '#002E5D', '#FFFFFF', 'BYU', 'Big 12'),
('Cincinnati', '#E00122', '#000000', 'CIN', 'Big 12'),
('Colorado', '#CFB87C', '#000000', 'COLO', 'Big 12'),
('Houston', '#C8102E', '#FFFFFF', 'HOU', 'Big 12'),
('Iowa State', '#C8102E', '#F1BE48', 'ISU', 'Big 12'),
('Kansas', '#0051BA', '#E8000D', 'KU', 'Big 12'),
('Kansas State', '#512888', '#FFFFFF', 'KSU', 'Big 12'),
('Oklahoma State', '#FF7300', '#000000', 'OKST', 'Big 12'),
('TCU', '#4D1979', '#A3A9AC', 'TCU', 'Big 12'),
('Texas Tech', '#CC0000', '#000000', 'TTU', 'Big 12'),
('UCF', '#BA9B37', '#000000', 'UCF', 'Big 12'),
('Utah', '#CC0000', '#FFFFFF', 'UTAH', 'Big 12'),
('West Virginia', '#002855', '#EAAA00', 'WVU', 'Big 12'),
-- Big Ten
('Illinois', '#13294B', '#E84A27', 'ILL', 'Big Ten'),
('Indiana', '#990000', '#FFFFFF', 'IU', 'Big Ten'),
('Iowa', '#FFCD00', '#000000', 'IOWA', 'Big Ten'),
('Maryland', '#E03A3E', '#FFD520', 'UMD', 'Big Ten'),
('Michigan', '#00274C', '#FFCB05', 'MICH', 'Big Ten'),
('Michigan State', '#18453B', '#FFFFFF', 'MSU', 'Big Ten'),
('Minnesota', '#7A0019', '#FFCC33', 'MINN', 'Big Ten'),
('Nebraska', '#E41C38', '#FFFFFF', 'NEB', 'Big Ten'),
('Northwestern', '#4E2A84', '#FFFFFF', 'NU', 'Big Ten'),
('Ohio State', '#BB0000', '#666666', 'OSU', 'Big Ten'),
('Oregon', '#154733', '#FEE11A', 'ORE', 'Big Ten'),
('Oregon State', '#DC4405', '#000000', 'ORST', 'Big Ten'),
('Penn State', '#041E42', '#FFFFFF', 'PSU', 'Big Ten'),
('Purdue', '#CEB888', '#000000', 'PUR', 'Big Ten'),
('Rutgers', '#CC0033', '#FFFFFF', 'RUT', 'Big Ten'),
('UCLA', '#2D68C4', '#F2A900', 'UCLA', 'Big Ten'),
('USC', '#990000', '#FFC72C', 'USC', 'Big Ten'),
('Washington', '#4B2E83', '#E8E3D3', 'WASH', 'Big Ten'),
-- Other major programs
('Coastal Carolina', '#006F71', '#A27752', 'CCU', 'Sun Belt'),
('Dallas Baptist', '#002D62', '#AD841F', 'DBU', 'WAC'),
('East Carolina', '#592A8A', '#FFC600', 'ECU', 'American'),
('Gonzaga', '#002967', '#C8102E', 'GONZ', 'WCC'),
('Liberty', '#002D62', '#A50034', 'LIB', 'CUSA'),
('Louisiana Tech', '#002F8B', '#E31B23', 'LATECH', 'CUSA'),
('Memphis', '#003087', '#898D8D', 'MEM', 'American'),
('South Alabama', '#003E7E', '#C41230', 'USA', 'Sun Belt'),
('Southern Miss', '#FFAB00', '#000000', 'USM', 'Sun Belt'),
('Tulane', '#006747', '#87CEEB', 'TUL', 'American'),
('Wichita State', '#FFCD00', '#000000', 'WSU', 'American');

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_school_colors_name ON school_colors(school_name);
CREATE INDEX IF NOT EXISTS idx_school_colors_conference ON school_colors(conference);

-- Historical snapshots table for momentum tracking
CREATE TABLE IF NOT EXISTS transfer_portal_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  total_entries INTEGER DEFAULT 0,
  in_portal INTEGER DEFAULT 0,
  committed INTEGER DEFAULT 0,
  withdrawn INTEGER DEFAULT 0,
  entries_24h INTEGER DEFAULT 0,
  commits_24h INTEGER DEFAULT 0,
  avg_days_to_commit REAL,
  top_conference TEXT,
  top_gainer TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON transfer_portal_snapshots(snapshot_date);
