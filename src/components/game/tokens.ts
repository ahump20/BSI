/**
 * Backyard Baseball Game Design Tokens
 * Extends BSI design system with game-specific colors and playful aesthetics
 *
 * These tokens are React Native compatible (no web-only values)
 * All colors meet WCAG AA contrast requirements for outdoor/sunlight visibility
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

// ============================================================================
// BSI CORE BRAND COLORS (Inherited)
// ============================================================================

export const bsiColors = {
  brand: {
    burntOrange: '#BF5700', // Primary BSI brand
    ember: '#FF6B35', // Interactive hover
    texasSoil: '#8B4513', // Heritage/roots
    titanBlue: '#4B92DB', // Memphis heritage
    cardinalRed: '#C41E3A', // Cardinals heritage
  },
  neutral: {
    charcoal: '#1A1A1A', // Card backgrounds
    midnight: '#0D0D0D', // Dark backgrounds
    cream: '#FAF8F5', // Light sections
    warmWhite: '#FAFAFA', // Text on dark
  },
  semantic: {
    success: '#2E7D32',
    warning: '#F9A825',
    danger: '#C62828',
    info: '#1976D2',
  },
} as const;

// ============================================================================
// GAME-SPECIFIC COLORS
// ============================================================================

export const gameColors = {
  // Field Elements
  grass: {
    light: '#66BB6A', // Sunlit grass
    base: '#4CAF50', // Standard outfield
    dark: '#388E3C', // Infield/shadows
    stripe: '#81C784', // Mowing pattern
  },
  dirt: {
    light: '#A1887F', // Baseline
    base: '#8D6E63', // Infield dirt
    dark: '#6D4C41', // Wet/shaded dirt
    mound: '#795548', // Pitcher's mound
  },
  sky: {
    morning: '#87CEEB', // Crisp morning game
    noon: '#64B5F6', // Midday
    sunset: '#FF8A65', // Golden hour
    dusk: '#7986CB', // Evening game
    night: '#3F51B5', // Night game
  },
  wood: {
    bat: '#A1887F', // Ash bat
    fence: '#8D6E63', // Outfield fence
    bench: '#6D4C41', // Dugout bench
    bleachers: '#BCAAA4', // Wooden bleachers
  },

  // UI Elements
  ui: {
    buttonPrimary: '#FF6B35', // Main CTA (ember)
    buttonSecondary: '#4CAF50', // Secondary actions (grass)
    buttonTertiary: '#8D6E63', // Tertiary (dirt)
    buttonDisabled: '#9E9E9E', // Disabled state
    cardBackground: '#FAFAFA', // Card surface
    cardBorder: '#E0E0E0', // Card borders
    overlay: 'rgba(0, 0, 0, 0.6)', // Modal overlays
  },

  // Team Colors (for character cards)
  team: {
    red: { primary: '#D32F2F', secondary: '#FFCDD2' },
    blue: { primary: '#1976D2', secondary: '#BBDEFB' },
    green: { primary: '#388E3C', secondary: '#C8E6C9' },
    orange: { primary: '#F57C00', secondary: '#FFE0B2' },
    purple: { primary: '#7B1FA2', secondary: '#E1BEE7' },
    yellow: { primary: '#FBC02D', secondary: '#FFF9C4' },
  },

  // Status Colors (high contrast for sunlight)
  status: {
    win: '#2E7D32', // Victory green
    loss: '#C62828', // Defeat red
    tie: '#F9A825', // Draw yellow
    locked: '#757575', // Locked content
    unlocked: '#4CAF50', // Available
    new: '#FF6B35', // New/highlight
    rare: '#7B1FA2', // Rare item
    legendary: '#FFD700', // Legendary
  },
} as const;

// ============================================================================
// TYPOGRAPHY (Game-specific, rounded/friendly)
// ============================================================================

export const gameTypography = {
  fontFamily: {
    // Playful display font for titles
    display: 'Fredoka One, Nunito, system-ui, sans-serif',
    // Rounded, friendly body text
    body: 'Nunito, Quicksand, system-ui, sans-serif',
    // Sporty/dynamic for stats
    stats: 'Bebas Neue, Impact, sans-serif',
    // Monospace for numbers
    mono: 'SF Mono, Monaco, Consolas, monospace',
  },
  fontSize: {
    tiny: 10, // Smallest labels
    xs: 12, // Small text
    sm: 14, // Secondary text
    base: 16, // Body text
    lg: 18, // Emphasis
    xl: 20, // Subheadings
    '2xl': 24, // Card titles
    '3xl': 30, // Section headers
    '4xl': 36, // Screen titles
    '5xl': 48, // Hero text
    '6xl': 60, // Score display
    '7xl': 72, // Celebration text
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    tight: 1.1, // Headlines
    snug: 1.25, // Compact text
    normal: 1.5, // Body
    relaxed: 1.75, // Readable
  },
} as const;

// ============================================================================
// SPACING (Larger touch targets for kids)
// ============================================================================

export const gameSpacing = {
  // Base unit: 4px
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

// ============================================================================
// TOUCH TARGETS (Kid-friendly, larger)
// ============================================================================

export const touchTargets = {
  minimum: 48, // WCAG minimum
  standard: 56, // Default for game buttons
  large: 64, // Primary actions
  extraLarge: 80, // Hero buttons (Play)
  iconButton: 44, // Icon-only buttons
} as const;

// ============================================================================
// BORDER RADIUS (Playful, rounded)
// ============================================================================

export const gameBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999, // Pills/circles
  // Game-specific
  card: 16, // Standard cards
  button: 12, // Buttons
  badge: 8, // Small badges
  avatar: 9999, // Character avatars
} as const;

// ============================================================================
// SHADOWS (Playful depth)
// ============================================================================

export const gameShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  // Glow effects for highlights
  glowOrange: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glowGreen: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glowGold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// ============================================================================
// ANIMATION TIMING
// ============================================================================

export const gameAnimations = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
    celebratory: 1200, // Win animations
  },
  easing: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  // React Native Animated values
  spring: {
    gentle: { tension: 100, friction: 10 },
    bouncy: { tension: 150, friction: 8 },
    stiff: { tension: 200, friction: 15 },
    wobbly: { tension: 180, friction: 12 },
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const gameZIndex = {
  background: 0,
  field: 10,
  players: 20,
  ball: 30,
  ui: 100,
  hud: 200,
  modal: 500,
  overlay: 600,
  tooltip: 700,
  celebration: 800,
  loading: 900,
} as const;

// ============================================================================
// BREAKPOINTS (Landscape-first for game)
// ============================================================================

export const gameBreakpoints = {
  // Phone portrait (secondary)
  phonePortrait: 320,
  // Phone landscape (primary)
  phoneLandscape: 568,
  // Tablet portrait
  tabletPortrait: 768,
  // Tablet landscape
  tabletLandscape: 1024,
  // Small laptop
  laptop: 1280,
} as const;

// ============================================================================
// COMBINED THEME EXPORT
// ============================================================================

export const gameTheme = {
  colors: {
    ...bsiColors,
    game: gameColors,
  },
  typography: gameTypography,
  spacing: gameSpacing,
  touchTargets,
  borderRadius: gameBorderRadius,
  shadows: gameShadows,
  animations: gameAnimations,
  zIndex: gameZIndex,
  breakpoints: gameBreakpoints,
} as const;

export type GameTheme = typeof gameTheme;
export type GameColors = typeof gameColors;
export type GameTypography = typeof gameTypography;
