/**
 * BSI Design System - Color Tokens
 *
 * The visual identity of Blaze Sports Intel: burnt orange heritage,
 * Texas soil roots, and ember intensity.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

export const colors = {
  // Primary Brand Colors
  brand: {
    burntOrange: '#BF5700',     // UT Official - Heritage, passion, Texas identity
    burntOrangeRgb: '191, 87, 0',
    texasSoil: '#8B4513',       // West Columbia earth - Roots, authenticity
    texasSoilRgb: '139, 69, 19',
    ember: '#FF6B35',           // Interactive accent - Energy, action
    emberRgb: '255, 107, 53',
    gold: '#C9A227',            // Value highlights - Achievement, excellence
    goldRgb: '201, 162, 39',
    flame: '#E85D04',           // Secondary accent - Heat, intensity
    flameRgb: '232, 93, 4',
  },

  // Background Colors
  background: {
    charcoal: '#1A1A1A',        // Premium editorial dark
    charcoalRgb: '26, 26, 26',
    midnight: '#0D0D0D',        // True dark backgrounds
    midnightRgb: '13, 13, 13',
    cream: '#FAF8F5',           // Warm newspaper aesthetic
    creamRgb: '250, 248, 245',
    warmWhite: '#FAFAFA',       // Clean text backgrounds
    warmWhiteRgb: '250, 250, 250',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',         // Winning, positive stats
    successRgb: '16, 185, 129',
    warning: '#F9A825',         // Caution, watch stats
    warningRgb: '249, 168, 37',
    error: '#C62828',           // Losing, negative stats
    errorRgb: '198, 40, 40',
    info: '#1976D2',            // Informational, neutral
    infoRgb: '25, 118, 210',
  },

  // 3D Graphics Engine Colors (WebGL/Three.js optimized)
  graphics: {
    // Ember particle system
    emberCore: '#FF6B35',
    emberGlow: '#FF8F50',
    emberTrail: '#E85D04',
    emberDim: '#994400',

    // Heat distortion
    heatHot: '#FF4500',
    heatWarm: '#FF6347',
    heatCool: '#8B4513',

    // Volumetric lighting
    volumeLight: '#FFA500',
    volumeMid: '#FF8C00',
    volumeShadow: '#1A1A1A',

    // Data visualization gradients
    dataHigh: '#BF5700',
    dataMid: '#FF6B35',
    dataLow: '#C9A227',

    // Glow effects
    glowPrimary: 'rgba(191, 87, 0, 0.6)',
    glowSecondary: 'rgba(255, 107, 53, 0.4)',
    glowAccent: 'rgba(201, 162, 39, 0.5)',
  },

  // Transparent variants for overlays and glass effects
  transparent: {
    burntOrange10: 'rgba(191, 87, 0, 0.1)',
    burntOrange20: 'rgba(191, 87, 0, 0.2)',
    burntOrange30: 'rgba(191, 87, 0, 0.3)',
    burntOrange50: 'rgba(191, 87, 0, 0.5)',
    ember10: 'rgba(255, 107, 53, 0.1)',
    ember20: 'rgba(255, 107, 53, 0.2)',
    ember30: 'rgba(255, 107, 53, 0.3)',
    midnight80: 'rgba(13, 13, 13, 0.8)',
    midnight90: 'rgba(13, 13, 13, 0.9)',
    white5: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
  },
} as const;

// Three.js compatible hex colors (0x format)
export const threeColors = {
  burntOrange: 0xBF5700,
  texasSoil: 0x8B4513,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  flame: 0xE85D04,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  cream: 0xFAF8F5,
  white: 0xFFFFFF,
  black: 0x000000,
} as const;

// Gradient definitions for CSS and WebGL
export const gradients = {
  // Primary brand gradient
  brandPrimary: 'linear-gradient(135deg, #BF5700, #FF6B35)',
  brandVertical: 'linear-gradient(180deg, #BF5700, #8B4513)',

  // Heat/Fire gradients
  emberFire: 'linear-gradient(45deg, #FF6B35, #E85D04, #BF5700)',
  heatWave: 'linear-gradient(90deg, #FF4500, #FF6347, #FF8C00)',

  // Data visualization gradients
  dataScale: 'linear-gradient(90deg, #C9A227, #FF6B35, #BF5700)',
  performanceScale: 'linear-gradient(90deg, #10B981, #F9A825, #C62828)',

  // Background gradients
  darkRadial: 'radial-gradient(ellipse at 50% 50%, rgba(191, 87, 0, 0.15), transparent 70%)',
  heroGlow: 'radial-gradient(ellipse at 20% 20%, rgba(191, 87, 0, 0.15) 0%, transparent 50%)',

  // Glass/Overlay gradients
  glassOverlay: 'linear-gradient(180deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 26, 0.8))',
  cardGlow: 'linear-gradient(135deg, rgba(191, 87, 0, 0.12), rgba(139, 69, 19, 0.08))',
} as const;

export type ColorToken = typeof colors;
export type ThreeColorToken = typeof threeColors;
export type GradientToken = typeof gradients;
