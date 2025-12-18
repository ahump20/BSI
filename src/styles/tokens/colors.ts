/**
 * BSI Color System - Cinematic Grit / Texas Soil / Intel
 *
 * Design Language: Dark cinematic UI with burnt orange accent
 * Think: premium sports intel platform, not flashy sports site
 *
 * Logo Reference: Blaze the Dachshund in flames, shield badge design
 * Tagline: "Born to Blaze the Path Less Beaten"
 */

export const colors = {
  // Core Brand
  brand: {
    burntOrange: '#BF5700', // Primary brand - UT Burnt Orange
    blaze: '#FF4500', // Accent highlight - Blaze orange
    ember: '#FF6B35', // Secondary accent - softer orange
    texasSoil: '#8B4513', // Earth tone - grounding color
    gold: '#C9A227', // Championship gold - logo text accent
  },

  // Flame Palette (extracted from logo)
  flame: {
    core: '#FF6B35', // Inner flame - brightest
    mid: '#E85D04', // Mid flame
    outer: '#DC2F02', // Outer flame edge
    glow: '#FFBA08', // Flame glow/highlights
    ember: '#9D0208', // Deep ember coals
    smoke: '#370617', // Dark smoke tones
  },

  // Background Hierarchy (Dark UI)
  background: {
    midnight: '#0D0D0D', // Deepest - page background
    charcoal: '#1A1A1A', // Primary surface
    graphite: '#242424', // Elevated surface
    slate: '#2D2D2D', // Cards, containers
    steel: '#363636', // Hover states
  },

  // Text Hierarchy
  text: {
    primary: '#FAFAFA', // High emphasis
    secondary: '#A3A3A3', // Medium emphasis
    tertiary: '#737373', // Low emphasis
    muted: '#525252', // Disabled, hints
    inverse: '#0D0D0D', // On light backgrounds
  },

  // Semantic States
  semantic: {
    success: '#22C55E', // Green - wins, positive
    warning: '#F59E0B', // Amber - caution
    error: '#EF4444', // Red - losses, errors
    info: '#3B82F6', // Blue - informational
  },

  // Sport-Specific Accents (use sparingly)
  sport: {
    baseball: '#BF5700', // Burnt Orange
    football: '#8B4513', // Texas Soil
    basketball: '#FF6B35', // Ember
    track: '#F59E0B', // Gold
  },

  // Team Colors (for arcade games and visualizations)
  sports: {
    cardinals: '#C41E3A', // St. Louis Cardinals Red
    longhorns: '#BF5700', // Texas Longhorns Burnt Orange
    titans: '#4B92DB', // Tennessee Titans Navy
    grizzlies: '#5D76A9', // Memphis Grizzlies Beale Street Blue
  },

  // Utility
  utility: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    overlayHeavy: 'rgba(0, 0, 0, 0.85)',
    grain: 'rgba(255, 255, 255, 0.03)',
  },

  // Border Colors
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.15)',
    accent: 'rgba(191, 87, 0, 0.4)',
  },
} as const;

// CSS Custom Properties string for Tailwind config
export const colorsCSSVars = `
  --color-burnt-orange: ${colors.brand.burntOrange};
  --color-blaze: ${colors.brand.blaze};
  --color-ember: ${colors.brand.ember};
  --color-texas-soil: ${colors.brand.texasSoil};
  --color-gold: ${colors.brand.gold};
  --color-midnight: ${colors.background.midnight};
  --color-charcoal: ${colors.background.charcoal};
  --color-graphite: ${colors.background.graphite};
  --color-slate: ${colors.background.slate};
  --color-steel: ${colors.background.steel};
  --color-flame-core: ${colors.flame.core};
  --color-flame-mid: ${colors.flame.mid};
  --color-flame-outer: ${colors.flame.outer};
  --color-flame-glow: ${colors.flame.glow};
`;

// Gradient definitions for consistent use across components
export const gradients = {
  // Primary flame gradient (logo-inspired)
  flame: 'linear-gradient(180deg, #FFBA08 0%, #FF6B35 25%, #E85D04 50%, #DC2F02 75%, #9D0208 100%)',
  flameHorizontal: 'linear-gradient(90deg, #9D0208 0%, #DC2F02 25%, #E85D04 50%, #FF6B35 75%, #FFBA08 100%)',
  flameRadial: 'radial-gradient(ellipse at center, #FFBA08 0%, #FF6B35 30%, #E85D04 50%, #DC2F02 70%, #370617 100%)',

  // Shield badge gradient (logo badge)
  shieldDark: 'linear-gradient(180deg, #2D2D2D 0%, #1A1A1A 50%, #0D0D0D 100%)',
  shieldBorder: 'linear-gradient(180deg, #C9A227 0%, #8B4513 50%, #5C2D0A 100%)',

  // Brand text gradient (BLAZE logo text)
  brandText: 'linear-gradient(180deg, #FFBA08 0%, #C9A227 40%, #BF5700 100%)',

  // Smoke/atmosphere
  smokeOverlay: 'linear-gradient(180deg, rgba(55, 6, 23, 0.8) 0%, rgba(13, 13, 13, 0.95) 100%)',
} as const;

export type BrandColor = keyof typeof colors.brand;
export type FlameColor = keyof typeof colors.flame;
export type BackgroundColor = keyof typeof colors.background;
export type TextColor = keyof typeof colors.text;
