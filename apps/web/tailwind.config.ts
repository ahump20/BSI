import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'media',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        di: {
          bg: 'rgb(var(--di-color-bg) / <alpha-value>)',
          surface: 'rgb(var(--di-color-surface) / <alpha-value>)',
          surfaceMuted: 'rgb(var(--di-color-surface-muted) / <alpha-value>)',
          border: 'rgb(var(--di-color-border) / <alpha-value>)',
          text: 'rgb(var(--di-color-text) / <alpha-value>)',
          textMuted: 'rgb(var(--di-color-text-muted) / <alpha-value>)',
          accent: 'rgb(var(--di-color-accent) / <alpha-value>)',
          accentStrong: 'rgb(var(--di-color-accent-strong) / <alpha-value>)'
        },
        gold: '#FBBF24',
        crimson: '#DC2626'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
        42: '10.5rem'
      },
      fontFamily: {
        display: ['"Source Serif Pro"', ...defaultTheme.fontFamily.serif],
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      borderRadius: {
        di: '1.125rem'
      },
      boxShadow: {
        'di-card': '0 1px 0 rgba(15, 23, 42, 0.4)'
      }
    }
  },
  plugins: []
};

export default config;
