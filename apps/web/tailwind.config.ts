import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { colors, spacing, radii, typography as typographyTokens, sizing, gradients } from '../../config/design-tokens';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        di: {
          background: colors.background,
          surface: colors.surface,
          surfaceMuted: colors.surfaceMuted,
          border: colors.border,
          text: colors.text,
          textMuted: colors.textMuted,
          accent: colors.accent,
          accentStrong: colors.accentStrong
        }
      },
      spacing: {
        'page-x': spacing.pageX,
        'page-y': spacing.pageY,
        'shell-gap': spacing.shellGap,
        'section-gap': spacing.sectionGap,
        'hero-gap': spacing.heroGap,
        'card-gap': spacing.cardGap,
        'card-padding': spacing.cardPadding,
        'list-gap': spacing.listGap,
        'inline-gap': spacing.inlineGap,
        'kicker-spacing': spacing.kickerSpacing
      },
      maxWidth: {
        'di-content': sizing.maxWidth
      },
      borderRadius: {
        'di-card': radii.card,
        'di-pill': radii.pill
      },
      fontFamily: {
        sans: [...typographyTokens.fonts.body],
        heading: [...typographyTokens.fonts.heading]
      },
      letterSpacing: {
        kicker: typographyTokens.letterSpacing.kicker
      },
      backgroundImage: {
        'di-shell': gradients.shell,
        'di-page': gradients.page
      }
    }
  },
  plugins: [forms, typography]
};

export default config;
