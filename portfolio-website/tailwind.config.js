export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'burnt-orange': '#BF5700',
        'texas-soil': '#703A0F', // WCAG AA compliant - 4.52:1 contrast on sand
        'charcoal': '#1A1A1A',
        'midnight': '#0D0D0D',
        'sand': '#F4EEE7',
        'ember': '#FF6B35',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Oswald', 'Arial Narrow', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
};
