/**
 * Diamond Sluggers - Game Configuration
 * Phaser 3 game settings for mobile-first baseball game
 */

import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameScene } from '../scenes/GameScene';
import { ResultsScene } from '../scenes/ResultsScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
    min: {
      width: 480,
      height: 270,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 980 },
      debug: false,
    },
  },
  input: {
    activePointers: 3,
    touch: {
      capture: true,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, ResultsScene],
};

// Game constants
export const GAME_CONSTANTS = {
  // Field dimensions
  FIELD: {
    HOME_PLATE: { x: 960, y: 900 },
    PITCHERS_MOUND: { x: 960, y: 550 },
    FIRST_BASE: { x: 1300, y: 650 },
    SECOND_BASE: { x: 960, y: 400 },
    THIRD_BASE: { x: 620, y: 650 },
    OUTFIELD_FENCE: 250,
  },

  // Pitch speeds (pixels per second)
  PITCH_SPEEDS: {
    FASTBALL: 1200,
    CURVEBALL: 800,
    CHANGEUP: 600,
    SLIDER: 900,
    KNUCKLEBALL: 500,
  },

  // Batting timing windows (milliseconds)
  TIMING: {
    PERFECT: 50,
    GOOD: 100,
    OKAY: 150,
    EARLY: -200,
    LATE: 200,
  },

  // Hit types based on timing and contact
  HIT_TYPES: {
    PERFECT_POWER: { exitVelo: 110, launchAngle: 28 },
    PERFECT_CONTACT: { exitVelo: 95, launchAngle: 18 },
    GOOD: { exitVelo: 85, launchAngle: 15 },
    OKAY: { exitVelo: 70, launchAngle: 10 },
    WEAK: { exitVelo: 55, launchAngle: 5 },
  },

  // Game rules
  RULES: {
    INNINGS: 3,
    OUTS_PER_INNING: 3,
    BALLS_FOR_WALK: 4,
    STRIKES_FOR_STRIKEOUT: 3,
  },

  // Scoring
  SCORING: {
    SINGLE: 10,
    DOUBLE: 25,
    TRIPLE: 50,
    HOME_RUN: 100,
    RUN_SCORED: 200,
    STRIKEOUT: 15,
    CATCH: 20,
    DOUBLE_PLAY: 75,
  },

  // Power-up durations (seconds)
  POWERUP_DURATIONS: {
    MEGA_BAT: 10,
    EAGLE_EYE: 8,
    SPEED_BOOST: 15,
    MAGNET_GLOVE: 12,
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: 'https://bsi-game-backend.humphrey-austin20.workers.dev',
  SAVE_GAME: '/api/game/save',
  LOAD_GAME: '/api/game/load',
  LEADERBOARD: '/api/leaderboard',
  SUBMIT_SCORE: '/api/leaderboard/submit',
  PLAYERS: '/api/players',
  STADIUMS: '/api/stadiums',
  MATCH_RESULT: '/api/match/result',
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
export type ApiEndpoints = typeof API_ENDPOINTS;
