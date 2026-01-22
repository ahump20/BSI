import type { Config } from 'tailwindcss';
import { colors as dsColors } from './src/styles/tokens/colors';
import { typography as dsTypography } from './src/styles/tokens/typography';
import { borderRadius as radii, shadows, spacing as dsSpacing } from './src/styles/tokens/spacing';

const toFontStack = (family: string) =>
  family
    .split(',')
    .map((font) => font.trim().replace(/^'(.*)'$/, '$1'))
    .filter(Boolean);

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: dsColors.brand.burntOrange,
          blaze: dsColors.brand.blaze,
          ember: dsColors.brand.ember,
          texasSoil: dsColors.brand.texasSoil,
        },
        background: {
          ...dsColors.background,
        },
        text: {
          ...dsColors.text,
        },
        semantic: {
          ...dsColors.semantic,
        },
        sport: {
          ...dsColors.sport,
        },
        border: {
          ...dsColors.border,
        },
        overlay: {
          ...dsColors.utility,
        },
        burnt: {
          500: dsColors.brand.burntOrange,
          600: dsColors.brand.texasSoil,
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...toFontStack(dsTypography.fontFamily.ui)],
        display: ['var(--font-display)', ...toFontStack(dsTypography.fontFamily.display)],
        mono: ['var(--font-mono)', ...toFontStack(dsTypography.fontFamily.mono)],
        serif: ['var(--font-serif)', ...toFontStack(dsTypography.fontFamily.body)],
      },
      fontSize: {
        ...dsTypography.fontSize,
      },
      spacing: {
        ...dsSpacing,
      },
      borderRadius: {
        ...radii,
      },
      boxShadow: {
        ...shadows,
        'glow-sm': '0 0 20px rgba(191, 87, 0, 0.3)',
        'glow-md': '0 0 40px rgba(191, 87, 0, 0.4), 0 0 60px rgba(191, 87, 0, 0.2)',
        'glow-lg': '0 0 60px rgba(204, 102, 0, 0.5), 0 0 100px rgba(191, 87, 0, 0.3), 0 0 140px rgba(217, 123, 56, 0.2)',
      },
      backdropBlur: {
        'glass': '12px',
        'glass-heavy': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(191, 87, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(191, 87, 0, 0.6)' },
        },
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-elastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'notification': '1080',
      },
    },
  },
  plugins: [],
};

export default config;
