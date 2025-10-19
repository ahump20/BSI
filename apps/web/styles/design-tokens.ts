export const designTokens = {
  colors: {
    brand: {
      burnt: '#bf5700',
      ember: '#cc6600',
      copper: '#d97b38',
      sunset: '#e68a4f',
      crimson: '#8b0000',
      cardinal: '#dc143c',
      powder: '#b0e0e6'
    },
    surface: {
      primary: '#0d0d12',
      secondary: '#161620',
      elevated: '#1f1f2e',
      overlay: 'rgba(13, 13, 18, 0.72)'
    },
    text: {
      primary: '#f8fafc',
      secondary: 'rgba(248, 250, 252, 0.72)',
      tertiary: 'rgba(248, 250, 252, 0.56)'
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      strong: 'rgba(217, 123, 56, 0.32)'
    },
    brandSurface: {
      strong: 'rgba(191, 87, 0, 0.18)',
      soft: 'rgba(191, 87, 0, 0.1)'
    },
    focus: {
      ring: 'rgba(217, 123, 56, 0.45)'
    },
    state: {
      live: '#dc143c'
    },
    glass: {
      light: 'rgba(13, 13, 18, 0.45)',
      medium: 'rgba(13, 13, 18, 0.65)',
      heavy: 'rgba(13, 13, 18, 0.78)',
      border: 'rgba(191, 87, 0, 0.2)'
    }
  },
  gradients: {
    brand: 'linear-gradient(135deg, #bf5700 0%, #cc6600 50%, #d97b38 100%)',
    highlight: 'linear-gradient(135deg, #8b0000 0%, #dc143c 100%)',
    hero:
      'radial-gradient(ellipse at top, rgba(191, 87, 0, 0.15), transparent 70%), radial-gradient(ellipse at bottom, rgba(139, 0, 0, 0.12), transparent 70%), radial-gradient(ellipse at right, rgba(176, 224, 230, 0.08), transparent 70%)'
  },
  shadows: {
    burnt: '0 8px 32px rgba(191, 87, 0, 0.3), 0 2px 8px rgba(191, 87, 0, 0.18)',
    crimson: '0 8px 32px rgba(220, 20, 60, 0.25)',
    glowSoft: '0 0 40px rgba(217, 123, 56, 0.18)',
    glowMedium: '0 0 60px rgba(217, 123, 56, 0.28)'
  },
  radii: {
    pill: '999px',
    lg: '18px'
  }
} as const;

export type DesignTokens = typeof designTokens;
