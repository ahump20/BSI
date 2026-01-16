/**
 * BSI Color System - Championship-Level Sports Analytics
 * Design Language: Cinematic Grit / Texas Soil / Intel
 *
 * Version 2.0.0 | Deep South Sports Authority
 */

export const colors = {
  // ========================================
  // BRAND SCALES
  // ========================================

  burntOrange: {
    50: '#FFF4E6',
    100: '#FFE4C4',
    200: '#FFCC99',
    300: '#FFB066',
    400: '#FF9333',
    500: '#FF7700',
    600: '#BF5700', // Primary brand - UT Burnt Orange
    700: '#994500',
    800: '#733400',
    900: '#4D2300',
  },

  gold: {
    50: '#FFFBEB',
    100: '#FFF3C4',
    200: '#FFE588',
    300: '#FFD54F',
    400: '#FFC947',
    500: '#FDB913', // Primary gold accent
    600: '#F59E0B',
    700: '#D97706',
    800: '#B45309',
    900: '#92400E',
  },

  charcoal: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#0A0A0F',
  },

  // ========================================
  // CORE BRAND COLORS
  // ========================================

  brand: {
    burntOrange: '#BF5700', // Primary brand - UT Burnt Orange
    blaze: '#FF4500', // Accent highlight - Blaze orange
    ember: '#FF6B35', // Secondary accent - softer orange
    texasSoil: '#8B4513', // West Columbia earth - grounding color
    gold: '#C9A227', // Value highlights
    texasOrange: '#FF6600', // Secondary orange
  },

  // ========================================
  // BACKGROUND HIERARCHY (Dark UI)
  // ========================================

  background: {
    midnight: '#0D0D0D', // Deepest - page background
    charcoal: '#1A1A1A', // Primary surface
    graphite: '#242424', // Elevated surface
    slate: '#2D2D2D', // Cards, containers
    steel: '#363636', // Hover states
    cream: '#FAF8F5', // Warm newspaper (light mode)
    warmWhite: '#FAFAFA', // Clean text backgrounds
  },

  // ========================================
  // SURFACE & GLASS COLORS
  // ========================================

  surface: {
    primary: 'rgba(255, 255, 255, 0.08)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    tertiary: 'rgba(255, 255, 255, 0.03)',
    hover: 'rgba(255, 255, 255, 0.12)',
    active: 'rgba(255, 255, 255, 0.15)',
    glass: 'rgba(26, 26, 26, 0.7)',
    glassLight: 'rgba(255, 255, 255, 0.05)',
    glassRaised: 'rgba(255, 255, 255, 0.08)',
  },

  // ========================================
  // TEXT HIERARCHY
  // ========================================

  text: {
    primary: '#FAFAFA', // High emphasis
    secondary: '#A3A3A3', // Medium emphasis
    tertiary: '#737373', // Low emphasis
    muted: '#525252', // Disabled, hints
    inverse: '#0D0D0D', // On light backgrounds
  },

  // ========================================
  // SEMANTIC STATES
  // ========================================

  semantic: {
    success: '#22C55E', // Green - wins, positive
    successLight: '#34D399',
    successDark: '#16A34A',
    warning: '#F59E0B', // Amber - caution
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    error: '#EF4444', // Red - losses, errors
    errorLight: '#F87171',
    errorDark: '#DC2626',
    info: '#3B82F6', // Blue - informational
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
  },

  // ========================================
  // SPORT-SPECIFIC COLORS
  // ========================================

  sports: {
    baseball: {
      primary: '#BF5700', // Burnt Orange
      diamond: '#6B8E23', // Olive Drab - outfield
      dirt: '#8B7355', // Infield dirt
      grass: '#228B22', // Forest Green
      warning: '#FF6B35', // Warning track
      leather: '#8B4513', // Glove/ball leather
      redStitch: '#C41E3A', // Baseball stitching
    },
    football: {
      primary: '#8B4513', // Texas Soil
      grass: '#228B22', // Field green
      field: '#355E3B', // Hunter Green
      endzone: '#DC2626', // End zone red
      hash: '#FFFFFF', // Hash marks
      pigskin: '#7B3F00', // Football brown
      goalpost: '#FFD700', // Yellow goalpost
    },
    basketball: {
      primary: '#FF6B35', // Ember
      court: '#E25822', // Court orange/brown
      hardwood: '#8B4513', // Hardwood floor
      paint: '#1E40AF', // Lane/paint blue
      line: '#FBBF24', // Court lines
      rim: '#DC2626', // Rim red
      net: '#FFFFFF', // Net white
    },
    track: {
      primary: '#F59E0B', // Gold
      surface: '#DC143C', // Track red
      lane: '#FFD700', // Lane dividers
      field: '#10B981', // Field events green
      starting: '#F59E0B', // Starting blocks
      finish: '#FFFFFF', // Finish line
    },
  },

  // ========================================
  // TEAM COLORS
  // ========================================

  teams: {
    cardinals: {
      primary: '#C41E3A', // St. Louis Cardinals Red
      secondary: '#0C2340', // Navy
      accent: '#FEDB00', // Gold
    },
    titans: {
      primary: '#002244', // Tennessee Titans Navy
      secondary: '#4B92DB', // Titans Light Blue
      accent: '#C8102E', // Red
    },
    longhorns: {
      primary: '#BF5700', // Texas Longhorns Burnt Orange
      secondary: '#FFFFFF', // White
      accent: '#333F48', // Charcoal
    },
    grizzlies: {
      primary: '#5D76A9', // Memphis Grizzlies Beale Street Blue
      secondary: '#FDB927', // Gold
      accent: '#00285E', // Midnight Blue
    },
  },

  // ========================================
  // DATA VISUALIZATION
  // ========================================

  dataviz: {
    positive: ['#22C55E', '#10B981', '#059669'],
    negative: ['#EF4444', '#DC2626', '#B91C1C'],
    neutral: ['#3B82F6', '#2563EB', '#1D4ED8'],
    sequential: ['#FFF4E6', '#FFCC99', '#FF9333', '#BF5700', '#733400'],
    categorical: ['#BF5700', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'],
    heatmap: {
      cold: '#3B82F6',
      cool: '#06B6D4',
      neutral: '#FAF8F5',
      warm: '#F59E0B',
      hot: '#EF4444',
    },
  },

  // ========================================
  // UTILITY
  // ========================================

  utility: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    overlayHeavy: 'rgba(0, 0, 0, 0.85)',
    grain: 'rgba(255, 255, 255, 0.03)',
  },

  // ========================================
  // BORDER COLORS
  // ========================================

  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.15)',
    accent: 'rgba(191, 87, 0, 0.4)',
    accentStrong: 'rgba(191, 87, 0, 0.6)',
  },

  // ========================================
  // GRADIENTS (as CSS strings)
  // ========================================

  gradients: {
    brand: 'linear-gradient(135deg, #BF5700 0%, #CC6600 50%, #D97B38 100%)',
    brandDeep: 'linear-gradient(135deg, #8B4513 0%, #BF5700 50%, #CC6600 100%)',
    championship: 'linear-gradient(135deg, #FDB913 0%, #FFC947 50%, #F59E0B 100%)',
    texas: 'linear-gradient(135deg, #BF5700 0%, #FF6600 100%)',
    sunset: 'linear-gradient(135deg, #BF5700 0%, #FF6B35 50%, #F59E0B 100%)',
    midnight: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
} as const;

// ========================================
// CSS CUSTOM PROPERTIES
// ========================================

export const colorsCSSVars = `
  /* Brand Scales */
  --bsi-burnt-orange-50: ${colors.burntOrange[50]};
  --bsi-burnt-orange-100: ${colors.burntOrange[100]};
  --bsi-burnt-orange-200: ${colors.burntOrange[200]};
  --bsi-burnt-orange-300: ${colors.burntOrange[300]};
  --bsi-burnt-orange-400: ${colors.burntOrange[400]};
  --bsi-burnt-orange-500: ${colors.burntOrange[500]};
  --bsi-burnt-orange-600: ${colors.burntOrange[600]};
  --bsi-burnt-orange-700: ${colors.burntOrange[700]};
  --bsi-burnt-orange-800: ${colors.burntOrange[800]};
  --bsi-burnt-orange-900: ${colors.burntOrange[900]};

  --bsi-gold-50: ${colors.gold[50]};
  --bsi-gold-100: ${colors.gold[100]};
  --bsi-gold-200: ${colors.gold[200]};
  --bsi-gold-300: ${colors.gold[300]};
  --bsi-gold-400: ${colors.gold[400]};
  --bsi-gold-500: ${colors.gold[500]};
  --bsi-gold-600: ${colors.gold[600]};
  --bsi-gold-700: ${colors.gold[700]};
  --bsi-gold-800: ${colors.gold[800]};
  --bsi-gold-900: ${colors.gold[900]};

  /* Core Brand */
  --bsi-burnt-orange: ${colors.brand.burntOrange};
  --bsi-blaze: ${colors.brand.blaze};
  --bsi-ember: ${colors.brand.ember};
  --bsi-texas-soil: ${colors.brand.texasSoil};
  --bsi-gold: ${colors.brand.gold};

  /* Backgrounds */
  --bsi-midnight: ${colors.background.midnight};
  --bsi-charcoal: ${colors.background.charcoal};
  --bsi-graphite: ${colors.background.graphite};
  --bsi-slate: ${colors.background.slate};
  --bsi-steel: ${colors.background.steel};

  /* Surfaces */
  --bsi-surface: ${colors.surface.primary};
  --bsi-surface-hover: ${colors.surface.hover};
  --bsi-glass: ${colors.surface.glass};

  /* Sports */
  --bsi-baseball: ${colors.sports.baseball.primary};
  --bsi-football: ${colors.sports.football.primary};
  --bsi-basketball: ${colors.sports.basketball.primary};
  --bsi-track: ${colors.sports.track.primary};

  /* Teams */
  --bsi-cardinals: ${colors.teams.cardinals.primary};
  --bsi-titans: ${colors.teams.titans.primary};
  --bsi-longhorns: ${colors.teams.longhorns.primary};
  --bsi-grizzlies: ${colors.teams.grizzlies.primary};
`;

// ========================================
// TYPE EXPORTS
// ========================================

export type BrandColor = keyof typeof colors.brand;
export type BackgroundColor = keyof typeof colors.background;
export type TextColor = keyof typeof colors.text;
export type SemanticColor = keyof typeof colors.semantic;
export type SportColors = keyof typeof colors.sports;
export type TeamColors = keyof typeof colors.teams;
export type BurntOrangeShade = keyof typeof colors.burntOrange;
export type GoldShade = keyof typeof colors.gold;
export type CharcoalShade = keyof typeof colors.charcoal;
