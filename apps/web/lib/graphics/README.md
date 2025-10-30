# Graphics Engine

A sophisticated yet elegantly simple graphics and visualization engine for Blaze Sports Intel.

## Philosophy

The Graphics Engine follows three core principles:

1. **Sensible Defaults**: Zero-config components work beautifully out of the box
2. **Progressive Enhancement**: Add complexity only when needed, one prop at a time
3. **Performance First**: GPU-accelerated animations, optimized rendering, and accessibility built-in

## Features

- 📊 **Charts**: Line, Bar, and Sparkline charts with Chart.js
- 📋 **Data Tables**: Sortable, filterable, paginated tables
- 🎬 **Animations**: Smooth, performant transitions and effects
- 🎨 **Theme System**: Centralized design tokens and color palettes
- ♿ **Accessible**: WCAG AA compliant, keyboard navigable, reduced-motion support
- ⚡ **Performant**: 60fps animations, code splitting, lazy loading

## Quick Start

### Simple Line Chart

```tsx
import { LineChart } from '@/components/charts/LineChart';

<LineChart
  labels={['Week 1', 'Week 2', 'Week 3']}
  datasets={[
    { label: 'Texas', data: [12, 15, 18] }
  ]}
/>
```

### Data Table

```tsx
import { DataTable } from '@/components/ui/DataTable';

const columns = [
  { key: 'name', header: 'Player', sortable: true },
  { key: 'stats', header: 'Stats', sortable: true },
];

<DataTable data={players} columns={columns} />
```

### Animations

```tsx
import { useFadeIn } from '@/lib/graphics/hooks';

function MyComponent() {
  const ref = useFadeIn({ duration: 300 });
  return <div ref={ref}>Fades in on mount</div>;
}
```

## Components

### Charts

#### LineChart

Elegant line charts for trends and time-series data.

**Props:**
- `labels: string[]` - X-axis labels (required)
- `datasets: LineChartDataset[]` - Data series (required)
- `title?: string` - Chart title
- `height?: number` - Chart height in pixels (default: 300)
- `showLegend?: boolean` - Show/hide legend (default: true)
- `showGrid?: boolean` - Show/hide grid lines (default: true)
- `smooth?: boolean` - Smooth curves (default: true)
- `fill?: boolean` - Fill area under line (default: false)
- `stacked?: boolean` - Stack multiple series (default: false)
- `animate?: boolean` - Enable animations (default: true)

**Example:**
```tsx
<LineChart
  labels={['Jan', 'Feb', 'Mar']}
  datasets={[
    {
      label: 'Wins',
      data: [12, 15, 18],
      color: '#BF5700',
      fill: true
    }
  ]}
  title="Monthly Wins"
  height={400}
  smooth={true}
/>
```

#### BarChart

Bar charts for comparisons and distributions.

**Props:**
- `labels: string[]` - Categories (required)
- `datasets: BarChartDataset[]` - Data series (required)
- `title?: string` - Chart title
- `height?: number` - Chart height (default: 300)
- `horizontal?: boolean` - Horizontal bars (default: false)
- `stacked?: boolean` - Stack bars (default: false)
- `animate?: boolean` - Enable animations (default: true)

**Example:**
```tsx
<BarChart
  labels={['Texas', 'Oklahoma', 'Alabama']}
  datasets={[
    { label: 'Wins', data: [28, 26, 27] }
  ]}
  title="Season Wins"
/>
```

#### Sparkline

Minimal inline charts for compact data visualization.

**Props:**
- `data: number[]` - Data points (required)
- `color?: string` - Line color
- `width?: number` - Width in pixels (default: 100)
- `height?: number` - Height in pixels (default: 30)
- `showTooltip?: boolean` - Enable tooltip (default: true)

**Example:**
```tsx
<Sparkline data={[85, 88, 92, 95, 98]} width={120} height={40} />
```

### Data Tables

#### DataTable

Feature-rich data table with sorting, filtering, and pagination.

**Props:**
- `data: T[]` - Table data (required)
- `columns: DataTableColumn<T>[]` - Column definitions (required)
- `pageSize?: number` - Rows per page (default: 10)
- `showSearch?: boolean` - Show search bar (default: true)
- `showPagination?: boolean` - Show pagination (default: true)
- `striped?: boolean` - Striped rows (default: true)
- `hoverable?: boolean` - Hover effect (default: true)
- `compact?: boolean` - Compact mode (default: false)
- `stickyHeader?: boolean` - Sticky header on scroll (default: false)
- `onRowClick?: (row: T) => void` - Row click handler

**Column Definition:**
```tsx
interface DataTableColumn<T> {
  key: string;                    // Data key
  header: string;                 // Column header
  sortable?: boolean;             // Enable sorting
  filterable?: boolean;           // Enable filtering
  render?: (value, row) => React.ReactNode;  // Custom renderer
  width?: string;                 // Column width
  align?: 'left' | 'center' | 'right';  // Text alignment
}
```

**Example:**
```tsx
const columns = [
  {
    key: 'name',
    header: 'Player',
    sortable: true,
    width: '200px',
  },
  {
    key: 'rating',
    header: 'Rating',
    sortable: true,
    align: 'right',
    render: (value) => value.toFixed(1),
  },
];

<DataTable
  data={players}
  columns={columns}
  pageSize={20}
  stickyHeader={true}
/>
```

### Transitions

#### FadeTransition

Fade in/out content based on state.

```tsx
<FadeTransition show={isVisible}>
  <Content />
</FadeTransition>
```

#### SlideTransition

Slide content from a direction.

```tsx
<SlideTransition show={isVisible} direction="bottom">
  <Content />
</SlideTransition>
```

#### CollapseTransition

Expand/collapse content smoothly.

```tsx
<CollapseTransition show={isExpanded}>
  <Content />
</CollapseTransition>
```

#### ScaleTransition

Scale in/out with fade effect.

```tsx
<ScaleTransition show={isVisible}>
  <Content />
</ScaleTransition>
```

## Hooks

### Animation Hooks

- `useFadeIn(config?)` - Fade in element on mount
- `useSlideIn(direction, config?)` - Slide in element on mount
- `useRevealOnScroll(config?)` - Reveal when scrolled into view
- `useStaggerChildren(delay, config?)` - Stagger children animations

### Interaction Hooks

- `useHover()` - Track hover state
- `useFocus()` - Track focus state
- `useIntersectionObserver(options?)` - Track viewport visibility

### Utility Hooks

- `useDebounce(value, delay)` - Debounce value changes
- `useCountUp(end, duration, start?)` - Animate number counter
- `useElementSize()` - Measure element dimensions
- `useScrollPosition()` - Track scroll position
- `useMediaQuery(query)` - Match media queries
- `usePrefersReducedMotion()` - Check motion preferences
- `useToggle(initial?)` - Toggle boolean state
- `useLocalStorage(key, initial)` - Sync state with localStorage

## Theme System

The Graphics Engine uses a centralized theme system with design tokens:

```tsx
import { graphicsTheme } from '@/lib/graphics/theme';

// Colors
graphicsTheme.colors.primary        // #BF5700
graphicsTheme.colors.success        // #10B981
graphicsTheme.colors.chartPalette   // Array of 8 colors

// Typography
graphicsTheme.typography.fontFamily.body     // Inter
graphicsTheme.typography.fontFamily.display  // Bebas Neue
graphicsTheme.typography.fontSize.xl         // 1.25rem

// Spacing
graphicsTheme.spacing.md            // 1rem (16px)
graphicsTheme.spacing.xl            // 2rem (32px)

// Animation
graphicsTheme.animation.duration.normal  // 200ms
graphicsTheme.animation.easing.ease      // cubic-bezier(...)
```

### Utilities

```tsx
// Get chart color by index
const color = getChartColor(2);  // Returns 3rd color from palette

// Convert hex to rgba
const transparentOrange = hexToRgba('#BF5700', 0.5);

// Create canvas gradient
const gradient = createGradient(ctx, ['#BF5700', '#FF7D3C']);
```

## Animation Utilities

### Core Animations

```tsx
import { fadeIn, slideIn, scale } from '@/lib/graphics/animations';

// Fade in element
fadeIn(element, { duration: 300, delay: 100 });

// Slide in from direction
slideIn(element, 'bottom', { duration: 400 });

// Scale animation
scale(element, 0, 1, { easing: 'spring' });
```

### Stagger Animations

```tsx
import { staggerAnimation, slideIn } from '@/lib/graphics/animations';

const elements = document.querySelectorAll('.item');
staggerAnimation(
  elements,
  (el, index) => slideIn(el, 'bottom'),
  { staggerDelay: 50 }
);
```

### Scroll Reveals

```tsx
import { observeIntersection, reveal } from '@/lib/graphics/animations';

const elements = document.querySelectorAll('.reveal');
observeIntersection(elements, (element) => {
  reveal(element);
});
```

## Performance

The Graphics Engine is optimized for performance:

- **GPU Acceleration**: Uses `transform` and `opacity` for animations
- **Debouncing**: Built-in debouncing for search and filters
- **Virtual Scrolling**: Coming soon for large datasets
- **Code Splitting**: Components are lazy-loadable
- **Reduced Motion**: Respects user preferences automatically
- **60fps Target**: All animations run at 60fps on modern devices

## Accessibility

Built-in accessibility features:

- **WCAG AA Compliant**: 4.5:1 contrast ratios
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and live regions
- **Focus Management**: Visible focus indicators
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Supports high contrast mode

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with ES6 support

## Examples

See `/apps/web/app/graphics-demo/page.tsx` for comprehensive examples of all features.

## License

Part of Blaze Sports Intel - All rights reserved.
