/**
 * Original Baseball Game - Configuration
 * NO Backyard Baseball IP - All original content
 */

export const GameConfig = {
  // Game dimensions
  width: 800,
  height: 600,

  // Physics
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 980 },
      debug: false
    }
  },

  // Rendering
  backgroundColor: '#87CEEB', // Sky blue
  pixelArt: true,

  // Game rules
  innings: 3,
  outsPerInning: 3,
  strikesPerOut: 3,
  ballsPerWalk: 4,

  // Batting mechanics
  batting: {
    swingWindowMs: 400,
    perfectTimingMs: 50,
    goodTimingMs: 150,
    earlyLateMs: 200,
  },

  // Pitch types
  pitches: {
    fastball: {
      speed: 600,
      name: 'Fastball',
      color: 0xff0000
    },
    changeup: {
      speed: 400,
      name: 'Changeup',
      color: 0x0000ff
    },
    curveball: {
      speed: 500,
      name: 'Curveball',
      color: 0x00ff00
    }
  },

  // Scoring
  scoring: {
    single: { minDistance: 200, maxDistance: 350 },
    double: { minDistance: 350, maxDistance: 500 },
    triple: { minDistance: 500, maxDistance: 650 },
    homerun: { minDistance: 650, maxDistance: 999 }
  },

  // UI
  ui: {
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#ffffff',
    accentColor: '#ffcc00'
  }
};

export default GameConfig;
