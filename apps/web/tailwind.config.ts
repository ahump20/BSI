import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import typography from '@tailwindcss/typography';
import { colors, spacing, radii } from '../../packages/design-tokens/src/index';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'bsi-bg': colors.background,
        'bsi-surface': colors.surface,
        'bsi-surface-muted': colors.surfaceMuted,
        'bsi-border': colors.border,
        'bsi-border-strong': colors.borderStrong,
        'bsi-text': colors.textPrimary,
        'bsi-muted': colors.textMuted,
        'bsi-accent': colors.accent,
        'bsi-accent-alt': colors.accentAlt,
        'bsi-accent-strong': colors.accentStrong
      },
      spacing: {
        'gutter-xs': spacing.gutterXs,
        'gutter-sm': spacing.gutterSm,
        'gutter-md': spacing.gutterMd,
        'gutter-lg': spacing.gutterLg,
        'gutter-xl': spacing.gutterXl,
        'gutter-2xl': spacing.gutter2xl
      },
      borderRadius: {
        'card': radii.lg,
        'layout': radii.xl,
        'pill': radii.pill
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'serif']
      },
      fontSize: {
        display: ['clamp(2.5rem, 6vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        headline: ['clamp(1.75rem, 4vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        title: ['clamp(1.25rem, 3vw, 1.75rem)', { lineHeight: '1.3' }]
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(0.75rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      boxShadow: {
        card: '0 22px 48px rgba(15, 23, 42, 0.45)'
      }
    }
  },
  plugins: [
    typography,
    plugin(({ addBase, addComponents, theme }) => {
      addBase({
        ':root': {
          colorScheme: 'dark',
          '--bsi-color-bg': colors.background,
          '--bsi-color-surface': colors.surface,
          '--bsi-color-surface-muted': colors.surfaceMuted,
          '--bsi-color-border': colors.border,
          '--bsi-color-border-strong': colors.borderStrong,
          '--bsi-color-text': colors.textPrimary,
          '--bsi-color-muted': colors.textMuted,
          '--bsi-color-accent': colors.accent,
          '--bsi-color-accent-strong': colors.accentStrong,
          '--bsi-color-accent-alt': colors.accentAlt,
          '--bsi-radius-card': radii.lg,
          '--bsi-radius-pill': radii.pill
        },
        'body': {
          backgroundColor: 'var(--bsi-color-bg)',
          color: 'var(--bsi-color-text)'
        }
      });

      addComponents({
        '.bsi-card': {
          borderRadius: theme('borderRadius.card'),
          borderWidth: '1px',
          borderColor: 'var(--bsi-color-border)',
          backgroundColor: 'rgba(17, 24, 39, 0.92)',
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.gutter-md'),
          backdropFilter: 'blur(16px)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease'
        },
        '.bsi-card:hover': {
          borderColor: 'var(--bsi-color-border-strong)',
          boxShadow: '0 24px 50px rgba(15, 23, 42, 0.6)',
          transform: 'translateY(-1px)'
        },
        '.bsi-tablist': {
          display: 'flex',
          gap: theme('spacing.2'),
          overflowX: 'auto',
          paddingBottom: theme('spacing.1')
        },
        '.bsi-tab': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '2.75rem',
          paddingInline: theme('spacing.4'),
          paddingBlock: theme('spacing.2'),
          borderWidth: '1px',
          borderColor: 'var(--bsi-color-border)',
          borderRadius: theme('borderRadius.pill'),
          backgroundColor: 'var(--bsi-color-surface)',
          color: 'var(--bsi-color-muted)',
          fontSize: theme('fontSize.sm'),
          fontWeight: '600',
          transition: 'all 150ms ease'
        },
        '.bsi-tab[data-state="active"]': {
          borderColor: colors.accent,
          backgroundColor: colors.accent,
          color: colors.background,
          boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.45)'
        },
        '.bsi-table': {
          width: '100%',
          overflow: 'hidden',
          borderRadius: theme('borderRadius.card'),
          borderWidth: '1px',
          borderColor: 'var(--bsi-color-border)',
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          color: 'var(--bsi-color-text)',
          fontSize: theme('fontSize.sm')
        },
        '.bsi-bottom-nav': {
          position: 'fixed',
          insetInline: '0',
          bottom: '0',
          height: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderTop: `1px solid ${colors.borderStrong}`,
          backgroundColor: 'rgba(17, 24, 39, 0.92)',
          color: 'var(--bsi-color-muted)',
          fontSize: theme('fontSize.xs'),
          backdropFilter: 'blur(18px)'
        },
        '.bsi-bottom-nav__item': {
          flex: '1 1 0%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme('spacing.1'),
          fontWeight: '600',
          transition: 'color 150ms ease'
        },
        '.bsi-bottom-nav__item[data-state="active"]': {
          color: colors.accent
        }
      });
    })
  ]
};

export default config;
