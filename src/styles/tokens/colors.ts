/**
 * BSI Design System - Color Tokens
 *
 * Brand colors for Blaze Sports Intel
 * Use these instead of hardcoded hex values
 */

export const colors = {
  brand: {
    primary: '#FF6B35',      // Blaze orange
    secondary: '#1A1A2E',    // Deep navy
    accent: '#F7931E',       // Gold
  },
  semantic: {
    success: '#10B981',      // Green - positive stats, wins
    warning: '#F59E0B',      // Amber - caution, mid-tier
    error: '#EF4444',        // Red - losses, negative
    info: '#3B82F6',         // Blue - informational
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
  // Sport-specific accent colors
  sports: {
    baseball: '#C41E3A',     // Cardinal red
    football: '#4B2E83',     // Longhorn burnt orange base
    basketball: '#5D76A9',   // Grizzlies blue
  },
} as const;

export type Colors = typeof colors;
export type BrandColor = keyof typeof colors.brand;
export type SemanticColor = keyof typeof colors.semantic;
export type NeutralColor = keyof typeof colors.neutral;
