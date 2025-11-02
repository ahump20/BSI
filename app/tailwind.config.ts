import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bsi-surface': '#1A202C',
        'bsi-panel': '#2D3748',
        'bsi-text': '#E2E8F0',
        'bsi-gold': '#FBBF24'
      }
    }
  },
  plugins: []
};

export default config;
