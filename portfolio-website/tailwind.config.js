export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'burnt-orange': '#BF5700',
        'texas-soil': '#8B4513',
        'charcoal': '#1A1A1A',
        'midnight': '#0D0D0D',
        'sand': '#F4EEE7',
        'ember': '#FF6B35',
        'bone': '#F5F0EB',
        'warm-gray': '#A89F95',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Oswald', 'Arial Narrow', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        display: ['Libre Baskerville', 'Georgia', 'serif'],
      },
      animation: {
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(191, 87, 0, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(191, 87, 0, 0.8), 0 0 40px rgba(191, 87, 0, 0.3)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
};
