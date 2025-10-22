import type { Config } from 'tailwindcss';
import { colorTokens, fontFamilies, radiusScale, spacingScale } from '@bsi/design-system/tokens';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/design-system/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: colorTokens.background,
        surface: colorTokens.surface,
        'surface-elevated': colorTokens.surfaceElevated,
        'surface-muted': colorTokens.surfaceMuted,
        border: colorTokens.border,
        accent: colorTokens.accent,
        'accent-secondary': colorTokens.accentSecondary,
        'accent-muted': colorTokens.accentMuted,
        foreground: colorTokens.foreground,
        'foreground-muted': colorTokens.foregroundMuted,
        highlight: colorTokens.highlight,
        success: colorTokens.success,
        warning: colorTokens.warning,
        danger: colorTokens.danger
      },
      spacing: {
        ...spacingScale
      },
      borderRadius: {
        ...radiusScale
      },
      fontFamily: {
        sans: [...fontFamilies.sans],
        serif: [...fontFamilies.serif]
      },
      boxShadow: {
        card: '0 24px 48px rgba(8, 15, 35, 0.45)'
      }
    }
  },
  plugins: []
};

export default config;
