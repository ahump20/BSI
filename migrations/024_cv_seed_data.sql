-- Migration 024: CV Intelligence Seed Data
-- Populates cv_adoption_tracker with verified technology adoption data
-- and pitcher_biomechanics with research-validated baselines.

-- ---------------------------------------------------------------------------
-- CV Adoption Tracker — Verified deployments
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO cv_adoption_tracker
  (sport, league, team, technology_name, vendor, deployment_status, camera_count, capabilities, source_url, verified_date, notes)
VALUES
  ('mlb', 'MLB', 'League-wide (30 stadiums)', 'Hawk-Eye Innovations', 'Sony / Hawk-Eye', 'deployed', 12,
   '["pitch-tracking","ball-flight","player-tracking","strike-zone"]',
   'https://technology.mlblogs.com/hawk-eye-statcast-era-f39fa3205503', '2024-03-01',
   'Replaced TrackMan as primary tracking system starting 2020 season'),

  ('mlb', 'MLB', 'Select stadiums (~20)', 'KinaTrax', 'KinaTrax', 'deployed', 8,
   '["markerless-motion-capture","biomechanics","joint-angles","injury-prevention"]',
   'https://www.kinatrax.com/baseball', '2024-06-01',
   'Markerless biomechanics capture at game speed'),

  ('nfl', 'NFL', 'League-wide (32 teams)', 'NFL Digital Athlete / AWS Next Gen Stats', 'Amazon Web Services', 'deployed', 38,
   '["player-tracking","formation-detection","speed-distance","expected-yards"]',
   'https://nextgenstats.nfl.com', '2024-09-01',
   'Zebra RFID chips in shoulder pads + optical tracking. 38 cameras per stadium.'),

  ('ncaafb', 'NCAA FBS', 'Select P5 programs', 'Catapult Vector', 'Catapult Sports', 'deployed', NULL,
   '["gps-tracking","accelerometer","player-load","workload-management"]',
   'https://www.catapultsports.com/sports/american-football', '2024-08-01',
   'Wearable-based. Used by 80+ FBS programs for practice workload.'),

  ('ncaafb', 'NCAA FBS', 'Select programs', 'Zebra MotionWorks', 'Zebra Technologies', 'pilot', NULL,
   '["rfid-tracking","player-tracking","speed","acceleration"]',
   'https://www.zebra.com/us/en/solutions/industry/sports.html', '2024-09-01',
   'RFID-based tracking similar to NFL deployment, piloted at select venues'),

  ('college-baseball', 'NCAA D1', 'SEC / ACC programs', 'KinaTrax', 'KinaTrax', 'deployed', 8,
   '["markerless-motion-capture","biomechanics","pitcher-mechanics"]',
   'https://www.kinatrax.com/baseball', '2024-04-01',
   'Limited deployment — Vanderbilt, Wake Forest, and select SEC venues'),

  ('college-baseball', 'NCAA D1', 'Widespread (200+ programs)', 'Rapsodo', 'Rapsodo', 'deployed', 1,
   '["pitch-tracking","spin-rate","ball-flight","hitting-metrics"]',
   'https://rapsodo.com/baseball', '2024-03-01',
   'Single-camera system widely adopted for bullpen analysis. Not game-speed capture.');

-- ---------------------------------------------------------------------------
-- Pitcher Biomechanics — Research baselines (not game-specific)
-- These represent archetype averages for baseline comparison.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO pitcher_biomechanics
  (player_id, player_name, team, league, game_id, game_date, pitch_count,
   velocity_start, velocity_current, velocity_delta, release_point_drift_inches,
   fatigue_score, injury_risk_index, risk_factors,
   arm_slot_angle, stride_length_pct, shoulder_rotation_deg, hip_shoulder_separation)
VALUES
  -- Overhand archetype baseline (Fleisig et al.)
  ('baseline-overhand', 'Overhand Archetype', 'BASELINE', 'mlb', 'baseline-001', '2024-01-01', 0,
   94.0, 94.0, 0, 0, 0, 0, '[]',
   80.0, 83.5, 178.0, 50.0),

  -- Three-quarter archetype baseline
  ('baseline-three-quarter', 'Three-Quarter Archetype', 'BASELINE', 'mlb', 'baseline-002', '2024-01-01', 0,
   92.0, 92.0, 0, 0, 0, 0, '[]',
   62.5, 81.5, 175.0, 48.0),

  -- Sidearm archetype baseline
  ('baseline-sidearm', 'Sidearm Archetype', 'BASELINE', 'mlb', 'baseline-003', '2024-01-01', 0,
   87.5, 87.5, 0, 0, 0, 0, '[]',
   30.0, 78.5, 168.0, 42.0);
