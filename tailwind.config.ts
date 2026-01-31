import type { Config } from 'tailwindcss';

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
        // Brand Colors - Burnt Orange Scale
        'burnt-orange': {
          50: '#FFF4E6',
          100: '#FFE4C4',
          200: '#FFCC99',
          300: '#FFB066',
          400: '#FF9333',
          500: '#FF7700',
          600: '#BF5700', // Primary Brand - UT Burnt Orange
          700: '#994500',
          800: '#733400',
          900: '#4D2300',
          DEFAULT: '#BF5700',
        },
        gold: {
          50: '#FFFBEB',
          100: '#FFF3C4',
          200: '#FFE588',
          300: '#FFD54F',
          400: '#FFC947',
          500: '#FDB913', // Primary gold accent
          600: '#F59E0B',
          700: '#D97706',
          800: '#B45309',
          900: '#92400E',
          DEFAULT: '#FDB913',
        },
        // Charcoal/Neutral Scale
        charcoal: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0f',
          DEFAULT: '#1f2937',
        },
        // Semantic Colors
        'texas-soil': '#8B4513',
        'texas-cream': '#F5E6D3',
        midnight: '#0d0d12',
        ember: '#FF6B35',
        flame: '#E85D04',
        graphite: '#242424',
        // Text Colors
        text: {
          primary: '#fafafa',
          secondary: '#B0B0B0',
          tertiary: '#999999',
          muted: '#888888',
        },
        // Border Colors
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.15)',
          accent: 'rgba(191, 87, 0, 0.4)',
        },
        // Background variants
        background: {
          primary: '#0d0d12',
          secondary: '#161620',
          tertiary: '#1f1f2e',
          elevated: '#28283c',
        },
        // Surface/Glass
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          heavy: 'rgba(255, 255, 255, 0.16)',
        },
        // Status Colors
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        // Sport Colors
        baseball: {
          DEFAULT: '#BF5700',
          diamond: '#6B8E23',
          dirt: '#8B7355',
          grass: '#228B22',
          warning: '#FF6B35',
          leather: '#8B4513',
        },
        football: {
          DEFAULT: '#8B4513',
          grass: '#228B22',
          field: '#355E3B',
          endzone: '#DC2626',
        },
        basketball: {
          DEFAULT: '#FF6B35',
          court: '#E25822',
          hardwood: '#8B4513',
          paint: '#1E40AF',
        },
        track: {
          DEFAULT: '#F59E0B',
          surface: '#DC143C',
          lane: '#FFD700',
          field: '#10B981',
        },
        nba: {
          DEFAULT: '#17408B',
          red: '#C9082A',
          court: '#E2B67F',
          paint: '#17408B',
        },
        // Team Colors
        cardinals: {
          DEFAULT: '#C41E3A',
          secondary: '#0C2340',
          gold: '#FEDB00',
        },
        titans: {
          DEFAULT: '#002244',
          secondary: '#4B92DB',
          red: '#C8102E',
        },
        longhorns: {
          DEFAULT: '#BF5700',
          secondary: '#FFFFFF',
        },
        grizzlies: {
          DEFAULT: '#5D76A9',
          secondary: '#FDB927',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'Archivo Black',
          'Impact',
          'Arial Black',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'JetBrains Mono',
          'SF Mono',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
        serif: ['var(--font-serif)', 'Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        xs: ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        sm: ['clamp(0.875rem, 0.825rem + 0.25vw, 1rem)', { lineHeight: '1.5' }],
        base: ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.5' }],
        lg: ['clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)', { lineHeight: '1.5' }],
        xl: ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.375' }],
        '2xl': ['clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)', { lineHeight: '1.375' }],
        '3xl': ['clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)', { lineHeight: '1.25' }],
        '4xl': ['clamp(2.25rem, 1.95rem + 1.5vw, 3rem)', { lineHeight: '1.25' }],
        '5xl': ['clamp(3rem, 2.5rem + 2.5vw, 3.75rem)', { lineHeight: '1' }],
        '6xl': ['clamp(3.75rem, 3rem + 3.75vw, 4.5rem)', { lineHeight: '1' }],
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(191, 87, 0, 0.3)',
        'glow-md': '0 0 40px rgba(191, 87, 0, 0.4), 0 0 60px rgba(191, 87, 0, 0.2)',
        'glow-lg':
          '0 0 60px rgba(204, 102, 0, 0.5), 0 0 100px rgba(191, 87, 0, 0.3), 0 0 140px rgba(217, 123, 56, 0.2)',
      },
      backdropBlur: {
        glass: '12px',
        'glass-heavy': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-live': 'pulseLive 1.5s ease-in-out infinite',
        'ticker-scroll': 'tickerScroll 30s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
        shake: 'shake 0.5s ease-in-out',
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
        pulseLive: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.95)' },
        },
        tickerScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-elastic': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        // Sport-specific curves
        'ease-pitch-release': 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
        'ease-tackle-snap': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        notification: '1080',
      },
    },
  },
  plugins: [],
};

export default config;
