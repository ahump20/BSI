/**
 * BSI Color System - Cinematic Grit / Texas Soil / Intel
 * 
 * Design Language: Dark cinematic UI with burnt orange accent
 * Think: premium sports intel platform, not flashy sports site
 */

export const colors = {
  // Core Brand
  brand: {
    burntOrange: '#BF5700',     // Primary brand - UT Burnt Orange
    blaze: '#FF4500',           // Accent highlight - Blaze orange
    ember: '#FF6B35',           // Secondary accent - softer orange
    texasSoil: '#8B4513',       // Earth tone - grounding color
  },

  // Background Hierarchy (Dark UI)
  background: {
    midnight: '#0D0D0D',        // Deepest - page background
    charcoal: '#1A1A1A',        // Primary surface
    graphite: '#242424',        // Elevated surface
    slate: '#2D2D2D',           // Cards, containers
    steel: '#363636',           // Hover states
  },

  // Text Hierarchy
  text: {
    primary: '#FAFAFA',         // High emphasis
    secondary: '#A3A3A3',       // Medium emphasis
    tertiary: '#737373',        // Low emphasis
    muted: '#525252',           // Disabled, hints
    inverse: '#0D0D0D',         // On light backgrounds
  },

  // Semantic States
  semantic: {
    success: '#22C55E',         // Green - wins, positive
    warning: '#F59E0B',         // Amber - caution
    error: '#EF4444',           // Red - losses, errors
    info: '#3B82F6',            // Blue - informational
  },

  // Sport-Specific Accents (use sparingly)
  sport: {
    baseball: '#BF5700',        // Burnt Orange
    football: '#8B4513',        // Texas Soil
    basketball: '#FF6B35',      // Ember
    track: '#F59E0B',           // Gold
  },

  // Team Colors (for arcade games and visualizations)
  sports: {
    cardinals: '#C41E3A',       // St. Louis Cardinals Red
    longhorns: '#BF5700',       // Texas Longhorns Burnt Orange
    titans: '#4B92DB',          // Tennessee Titans Navy
    grizzlies: '#5D76A9',       // Memphis Grizzlies Beale Street Blue
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
  --color-midnight: ${colors.background.midnight};
  --color-charcoal: ${colors.background.charcoal};
  --color-graphite: ${colors.background.graphite};
  --color-slate: ${colors.background.slate};
  --color-steel: ${colors.background.steel};
`;

export type BrandColor = keyof typeof colors.brand;
export type BackgroundColor = keyof typeof colors.background;
export type TextColor = keyof typeof colors.text;
