/**
 * BSI Design System - Color Tokens
 *
 * Brand colors for Blaze Sports Intel
 * Use these instead of hardcoded hex values
 */

export const colors = {
  brand: {
    burntOrange: '#BF5700', // UT Official - Heritage, passion
    texasSoil: '#8B4513', // West Columbia earth - Roots
    ember: '#FF6B35', // Interactive accent
    gold: '#C9A227', // Value highlights
    primary: '#BF5700', // Alias for burntOrange
    secondary: '#1A1A1A', // Alias for charcoal
    accent: '#FF6B35', // Alias for ember
  },
  background: {
    charcoal: '#1A1A1A', // Premium editorial dark
    midnight: '#0D0D0D', // True dark backgrounds
    cream: '#FAF8F5', // Warm newspaper aesthetic
    warmWhite: '#FAFAFA', // Clean text backgrounds
  },
  semantic: {
    success: '#2E7D32', // Winning, positive stats
    warning: '#F9A825', // Caution, watch stats
    error: '#C62828', // Losing, negative stats
    info: '#1976D2', // Informational, neutral
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
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
    },
  },
  // Sport-specific accent colors (favorite teams)
  sports: {
    cardinals: '#C41E3A', // St. Louis Cardinals
    titans: '#4B92DB', // Tennessee Titans
    grizzlies: '#5D76A9', // Memphis Grizzlies
    longhorns: '#BF5700', // Texas Longhorns
  },
} as const;

export type Colors = typeof colors;
export type BrandColor = keyof typeof colors.brand;
export type BackgroundColor = keyof typeof colors.background;
export type SemanticColor = keyof typeof colors.semantic;
export type NeutralColor = keyof typeof colors.neutral;
export type SportsColor = keyof typeof colors.sports;
