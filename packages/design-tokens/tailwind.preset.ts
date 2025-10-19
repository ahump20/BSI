const preset = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-base': '#0b1120',
        'brand-surface': '#111827',
        'brand-surface-muted': '#1f2937',
        'brand-border': 'rgba(148, 163, 184, 0.2)',
        'brand-text': '#e2e8f0',
        'brand-muted': '#94a3b8',
        'brand-accent': '#fbbf24',
        'brand-accent-strong': '#dc2626'
      },
      borderRadius: {
        xl: '1.125rem',
        pill: '999px'
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        6.5: '1.625rem',
        7.5: '1.875rem',
        13.5: '3.375rem',
        15: '3.75rem'
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif'
        ],
        heading: ['"Source Serif Pro"', '"Times New Roman"', 'serif']
      },
      boxShadow: {
        brand: '0 12px 28px rgba(251, 191, 36, 0.22)'
      }
    }
  }
};

export default preset;
