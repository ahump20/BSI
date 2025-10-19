import type { Config } from 'tailwindcss';
import { designTokens } from './styles/design-tokens';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: designTokens.colors.brand,
        surface: designTokens.colors.surface,
        text: designTokens.colors.text,
        border: designTokens.colors.border,
        brandSurface: designTokens.colors.brandSurface,
        focus: designTokens.colors.focus,
        state: designTokens.colors.state,
        glass: designTokens.colors.glass
      },
      backgroundImage: {
        ...designTokens.gradients
      },
      boxShadow: {
        ...designTokens.shadows
      },
      borderRadius: {
        ...designTokens.radii
      },
      fontFamily: {
        heading: ['var(--di-font-heading)', 'serif'],
        body: ['var(--di-font-body)', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
