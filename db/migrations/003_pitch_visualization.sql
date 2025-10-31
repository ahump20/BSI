-- Migration: 3D Pitch Visualization System
-- Created: 2025-10-31
-- Description: Tables for storing pitch trajectory data and player movements for 3D visualization

-- Players table
CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  position TEXT,
  jersey_number INTEGER,
  height_inches INTEGER,
  bats TEXT,
  throws TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pitches table for storing detailed pitch data
CREATE TABLE IF NOT EXISTS pitches (
  pitch_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  pitcher_id TEXT NOT NULL,
  batter_id TEXT NOT NULL,

  -- Pitch metrics
  velocity REAL NOT NULL,
  spin_rate REAL NOT NULL,

  -- Release point (feet from home plate)
  release_x REAL NOT NULL,
  release_y REAL NOT NULL,
  release_z REAL NOT NULL,

  -- Plate location (inches from center of plate)
  plate_x REAL NOT NULL,
  plate_z REAL NOT NULL,

  -- Break measurements (inches)
  break_x REAL NOT NULL,
  break_z REAL NOT NULL,

  -- Pitch classification
  pitch_type TEXT NOT NULL,
  pitch_number INTEGER,

  -- Outcome
  result TEXT NOT NULL,
  balls INTEGER,
  strikes INTEGER,
  outs INTEGER,

  -- Timing
  timestamp TIMESTAMP NOT NULL,
  inning INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pitcher_id) REFERENCES players(player_id),
  FOREIGN KEY (batter_id) REFERENCES players(player_id)
);

-- Player movements table for heat map visualization
CREATE TABLE IF NOT EXISTS player_movements (
  movement_id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,

  -- Position (feet from home plate)
  x_position REAL NOT NULL,
  y_position REAL NOT NULL,

  -- Velocity (feet per second)
  velocity_x REAL,
  velocity_y REAL,

  -- Acceleration (feet per second squared)
  acceleration REAL,

  -- Context
  action_type TEXT,
  play_id TEXT,

  -- Timing
  timestamp TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pitches_game_id ON pitches(game_id);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_id ON pitches(pitcher_id);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_id ON pitches(batter_id);
CREATE INDEX IF NOT EXISTS idx_pitches_timestamp ON pitches(timestamp);

CREATE INDEX IF NOT EXISTS idx_movements_game_id ON player_movements(game_id);
CREATE INDEX IF NOT EXISTS idx_movements_player_id ON player_movements(player_id);
CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON player_movements(timestamp);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
