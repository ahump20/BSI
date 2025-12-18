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
          50: '#fff5ed',
          100: '#ffead5',
          200: '#ffd0aa',
          300: '#ffad74',
          400: '#ff7d3c',
          500: '#bf5700', // Primary Brand
          600: '#9c4500',
          700: '#7d3700',
          800: '#5e2900',
          900: '#3f1c00',
          DEFAULT: '#bf5700',
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
        graphite: '#242424',
        gold: '#C9A227',
        // Flame Palette (logo-inspired)
        flame: {
          core: '#FF6B35',
          mid: '#E85D04',
          outer: '#DC2F02',
          glow: '#FFBA08',
          ember: '#9D0208',
          smoke: '#370617',
          DEFAULT: '#E85D04',
        },
        // Text Colors
        text: {
          primary: '#fafafa',
          secondary: '#a3a3a3',
          tertiary: '#737373',
          muted: '#525252',
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
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-oswald)', 'Oswald', 'var(--font-bebas)', 'Bebas Neue', 'Impact', 'Arial Black', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
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
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(191, 87, 0, 0.3)',
        'glow-md': '0 0 40px rgba(191, 87, 0, 0.4), 0 0 60px rgba(191, 87, 0, 0.2)',
        'glow-lg': '0 0 60px rgba(204, 102, 0, 0.5), 0 0 100px rgba(191, 87, 0, 0.3), 0 0 140px rgba(217, 123, 56, 0.2)',
        // Flame glow effects (logo-inspired)
        'flame-sm': '0 0 15px rgba(255, 107, 53, 0.4), 0 0 30px rgba(255, 186, 8, 0.2)',
        'flame-md': '0 0 30px rgba(255, 107, 53, 0.5), 0 0 60px rgba(232, 93, 4, 0.3), 0 0 90px rgba(255, 186, 8, 0.2)',
        'flame-lg': '0 0 40px rgba(255, 107, 53, 0.6), 0 0 80px rgba(232, 93, 4, 0.4), 0 0 120px rgba(255, 186, 8, 0.3), 0 0 160px rgba(220, 47, 2, 0.2)',
        // Shield badge shadow
        'shield': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(201, 162, 39, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
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
        // Flame animations (logo-inspired)
        'flame-flicker': 'flameFlicker 0.5s ease-in-out infinite alternate',
        'flame-pulse': 'flamePulse 2s ease-in-out infinite',
        'ember-float': 'emberFloat 3s ease-in-out infinite',
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
        // Flame keyframes
        flameFlicker: {
          '0%': { opacity: '0.8', transform: 'scaleY(1) scaleX(1)' },
          '100%': { opacity: '1', transform: 'scaleY(1.05) scaleX(0.98)' },
        },
        flamePulse: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(255, 107, 53, 0.4), 0 0 60px rgba(255, 186, 8, 0.2)' },
          '50%': { boxShadow: '0 0 50px rgba(255, 107, 53, 0.6), 0 0 100px rgba(255, 186, 8, 0.4)' },
        },
        emberFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.6' },
          '50%': { transform: 'translateY(-10px) rotate(5deg)', opacity: '1' },
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
