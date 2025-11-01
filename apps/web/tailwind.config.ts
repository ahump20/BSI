import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#1A202C',
          charcoal: '#2D3748',
          slate: '#0F172A',
          gold: '#FBBF24',
          crimson: '#DC2626',
          ash: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Source Serif Pro', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        elevation: '0 20px 45px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [typography],
};

export default config;
