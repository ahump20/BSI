import designTokens from '../../packages/design-tokens/tailwind.preset';

const config = {
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
  presets: [designTokens],
  theme: {
    extend: {
      backgroundImage: {
        'brand-radial':
          'radial-gradient(circle at top, rgba(220, 38, 38, 0.18), transparent 45%), radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.18), transparent 40%), theme("colors.brand-base")',
        'teal-radial':
          'radial-gradient(circle at 10% 10%, rgba(15, 118, 110, 0.2), transparent 40%), theme("colors.brand-base")'
      }
    }
  },
  plugins: []
};

export default config;
