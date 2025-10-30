/**
 * Graphics Engine - Theme Configuration
 *
 * Centralized theme configuration for charts, animations, and visual elements.
 * Provides sensible defaults aligned with Blaze Sports Intel brand.
 */

export const graphicsTheme = {
  // Brand Colors
  colors: {
    primary: '#BF5700',      // Burnt Orange
    primaryDark: '#9C4500',
    primaryLight: '#FF7D3C',

    // Semantic Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Grayscale (Dark Theme)
    background: {
      primary: '#0D0D12',
      secondary: '#161620',
      tertiary: '#1F1F2E',
    },

    text: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
      tertiary: '#64748B',
    },

    // Chart Color Palettes
    chartPalette: [
      '#BF5700', // Primary Orange
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
    ],

    // Gradient Sets
    gradients: {
      primary: ['#BF5700', '#FF7D3C'],
      success: ['#10B981', '#34D399'],
      info: ['#3B82F6', '#60A5FA'],
      warning: ['#F59E0B', '#FBD57D'],
    },
  },

  // Typography
  typography: {
    fontFamily: {
      body: 'Inter, system-ui, sans-serif',
      display: 'Bebas Neue, sans-serif',
      mono: 'SF Mono, Monaco, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },

  // Spacing (8px grid)
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },

  // Border Radius
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // Animation Timings
  animation: {
    duration: {
      fast: 150,
      normal: 200,
      slow: 300,
      slower: 500,
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
  },

  // Opacity Levels
  opacity: {
    disabled: 0.38,
    hover: 0.8,
    focus: 0.9,
  },
} as const;

/**
 * Chart.js Default Configuration
 * Pre-configured for dark theme and optimal readability
 */
export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: true,

  // Font configuration
  font: {
    family: graphicsTheme.typography.fontFamily.body,
    size: 12,
  },

  // Color configuration
  color: graphicsTheme.colors.text.secondary,

  // Animation configuration
  animation: {
    duration: graphicsTheme.animation.duration.normal,
    easing: 'easeInOut',
  },

  // Interaction configuration
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },

  // Plugin defaults
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: graphicsTheme.colors.text.primary,
        padding: 12,
        font: {
          size: 12,
          family: graphicsTheme.typography.fontFamily.body,
        },
      },
    },
    tooltip: {
      backgroundColor: graphicsTheme.colors.background.tertiary,
      titleColor: graphicsTheme.colors.text.primary,
      bodyColor: graphicsTheme.colors.text.secondary,
      borderColor: graphicsTheme.colors.text.tertiary,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 13,
        weight: '600' as const,
      },
      bodyFont: {
        size: 12,
      },
    },
  },

  // Scale defaults
  scales: {
    x: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      ticks: {
        color: graphicsTheme.colors.text.secondary,
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      ticks: {
        color: graphicsTheme.colors.text.secondary,
        font: {
          size: 11,
        },
      },
    },
  },
};

/**
 * Utility: Get color by index for multi-series charts
 */
export function getChartColor(index: number): string {
  return graphicsTheme.colors.chartPalette[index % graphicsTheme.colors.chartPalette.length];
}

/**
 * Utility: Create gradient for canvas context
 */
export function createGradient(
  ctx: CanvasRenderingContext2D,
  colors: string[],
  vertical = true
): CanvasGradient {
  const gradient = vertical
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : ctx.createLinearGradient(0, 0, 400, 0);

  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });

  return gradient;
}

/**
 * Utility: Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
