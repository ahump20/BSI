# Advanced Chart Components

A collection of interactive, animated visualization components optimized for sports data analytics with glassmorphism styling.

## 🎨 Components

### 1. HeatMap
Interactive heat map component for visualizing density and distribution data.

**Use Cases:**
- Pitch zone analysis
- Spray charts (batted ball distribution)
- Defensive positioning heat maps
- Generic density visualizations

**Props:**
```typescript
interface HeatMapProps {
  data: HeatMapDataPoint[];
  title: string;
  type?: 'pitch-zone' | 'spray-chart' | 'generic';
  colorScale?: 'hot' | 'cool' | 'sequential' | 'diverging';
  height?: number;
  width?: number;
  showColorBar?: boolean;
  xLabel?: string;
  yLabel?: string;
  onPointClick?: (point: HeatMapDataPoint) => void;
}
```

**Example:**
```tsx
import { HeatMap } from '@/components/charts';

const data = [
  { x: 100, y: 200, value: 85, label: 'Zone 1' },
  // ... more data points
];

<HeatMap
  data={data}
  title="Pitch Location Density"
  type="pitch-zone"
  colorScale="hot"
  height={450}
  onPointClick={(point) => console.log(point)}
/>
```

---

### 2. RadarChart
Multi-dimensional comparison chart perfect for player scouting and analysis.

**Use Cases:**
- 5-tool player analysis
- Pitcher arsenal evaluation
- Team strength comparison
- Multi-dimensional performance metrics

**Props:**
```typescript
interface RadarChartProps {
  categories: string[];
  datasets: RadarDataSet[];
  title: string;
  height?: number;
  width?: number;
  maxValue?: number;
  showLegend?: boolean;
}
```

**Example:**
```tsx
import { RadarChart } from '@/components/charts';

const categories = ['Power', 'Contact', 'Speed', 'Fielding', 'Arm'];
const datasets = [
  {
    name: 'Player A',
    values: [85, 92, 78, 88, 90],
    color: 'rgba(191, 87, 0, 0.7)'
  },
  {
    name: 'Player B',
    values: [95, 80, 85, 75, 82],
    color: 'rgba(59, 130, 246, 0.7)'
  }
];

<RadarChart
  categories={categories}
  datasets={datasets}
  title="Player Comparison"
  height={500}
  maxValue={100}
/>
```

---

### 3. StrikeZone
Interactive pitch location visualization with filtering and customization.

**Use Cases:**
- Pitcher arsenal analysis
- Strike zone tendency analysis
- Pitch sequencing study
- Umpire consistency tracking

**Props:**
```typescript
interface StrikeZoneProps {
  pitches: Pitch[];
  title?: string;
  showStrikeZone?: boolean;
  colorBy?: 'type' | 'result' | 'velocity';
  height?: number;
  width?: number;
  batterSide?: 'left' | 'right';
  onPitchClick?: (pitch: Pitch) => void;
}
```

**Example:**
```tsx
import { StrikeZone } from '@/components/charts';

const pitches = [
  {
    x: 0.2,
    y: 2.5,
    type: '4FB',
    velocity: 95,
    result: 'swinging_strike',
    spin: 2400
  },
  // ... more pitches
];

<StrikeZone
  pitches={pitches}
  title="Pitcher Arsenal"
  colorBy="velocity"
  showStrikeZone={true}
  onPitchClick={(pitch) => console.log(pitch)}
/>
```

---

### 4. AnimatedChartWrapper
Add smooth entrance animations to any chart component.

**Animation Types:**
- `fade` - Simple opacity transition
- `slide` - Slide up from below
- `scale` - Scale up from center
- `rotate` - Subtle rotation with scale
- `blur` - Blur to sharp transition

**Example:**
```tsx
import { AnimatedChartWrapper } from '@/components/charts';

<AnimatedChartWrapper animationType="slide" delay={0.2} duration={0.6}>
  <YourChartComponent />
</AnimatedChartWrapper>
```

---

### 5. StaggeredChartContainer
Animate multiple charts in sequence.

**Example:**
```tsx
import { StaggeredChartContainer } from '@/components/charts';

<StaggeredChartContainer staggerDelay={0.15}>
  <Chart1 />
  <Chart2 />
  <Chart3 />
</StaggeredChartContainer>
```

---

### 6. AnimatedCounter
Count-up animation for statistics.

**Example:**
```tsx
import { AnimatedCounter } from '@/components/charts';

<AnimatedCounter
  from={0}
  to={1247}
  duration={2}
  decimals={0}
  suffix=" games"
  prefix="Total: "
/>
```

---

### 7. LiveUpdateIndicator
Pulsing indicator for real-time data.

**Example:**
```tsx
import { LiveUpdateIndicator } from '@/components/charts';

<LiveUpdateIndicator isLive={true} label="LIVE" />
```

---

### 8. ChartLoadingSkeleton
Animated placeholder for loading states.

**Example:**
```tsx
import { ChartLoadingSkeleton } from '@/components/charts';

<ChartLoadingSkeleton height={400} width="100%" />
```

---

## 🎨 Design System Integration

All charts follow the Blaze Sports Intel design system:

### Colors
- **Primary**: `#BF5700` (Burnt Orange)
- **Secondary**: `rgba(59, 130, 246, 0.7)` (Blue)
- **Accent**: `rgba(251, 191, 36, 0.7)` (Amber)
- **Background**: `rgba(15, 23, 42, 0.3)` (Dark Slate with alpha)

### Glassmorphism
```css
background: var(--glass-light, rgba(15, 23, 42, 0.3));
backdrop-filter: blur(12px);
border: 1px solid rgba(191, 87, 0, 0.2);
```

### Typography
- System font stack: `system-ui, -apple-system, sans-serif`
- Responsive sizing with `clamp()`
- Color: `rgba(248, 250, 252, 0.95)` for high contrast

---

## 📦 Dependencies

The chart components require the following packages:

```json
{
  "dependencies": {
    "d3": "^7.9.0",
    "framer-motion": "^11.0.0",
    "plotly.js": "^2.35.0",
    "react-plotly.js": "^2.6.0"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/plotly.js": "^2.33.0",
    "@types/react-plotly.js": "^2.6.3"
  }
}
```

---

## 🚀 Features

### Interactive
- Hover tooltips with detailed information
- Click handlers for drill-down analysis
- Zoom and pan capabilities (where applicable)
- Filter controls (e.g., pitch type selection)

### Responsive
- Mobile-optimized layouts
- Automatic resizing
- Touch-friendly interactions
- Responsive text scaling

### Animated
- Smooth entrance animations
- Staggered loading effects
- Live update indicators
- Count-up number animations

### Accessible
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast colors

### Exportable
- Download as high-resolution PNG
- Customizable export dimensions
- Maintains visual quality at 2x scale

---

## 🎯 Demo Page

Visit `/charts-demo` to see all components in action with sample data.

The demo page includes:
- Live interactive examples
- Sample data for each chart type
- Feature highlights
- Mobile responsiveness showcase

---

## 🔧 Advanced Usage

### Custom Color Scales

```tsx
// Heat Map with custom color scale
const customScale: Array<[number, string]> = [
  [0, 'rgba(0, 255, 0, 0.3)'],
  [0.5, 'rgba(255, 255, 0, 0.6)'],
  [1, 'rgba(255, 0, 0, 0.9)']
];
```

### Combining Components

```tsx
import {
  RadarChart,
  AnimatedChartWrapper,
  LiveUpdateIndicator
} from '@/components/charts';

<AnimatedChartWrapper animationType="scale" delay={0.3}>
  <div style={{ position: 'relative' }}>
    <LiveUpdateIndicator isLive={true} />
    <RadarChart {...props} />
  </div>
</AnimatedChartWrapper>
```

### Dynamic Data Updates

```tsx
const [pitches, setPitches] = useState<Pitch[]>([]);

useEffect(() => {
  const interval = setInterval(() => {
    fetchLatestPitches().then(setPitches);
  }, 5000);
  return () => clearInterval(interval);
}, []);

<StrikeZone pitches={pitches} colorBy="velocity" />
```

---

## 📊 Performance Considerations

### Code Splitting
All Plotly components use dynamic imports to avoid SSR issues:

```tsx
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
```

### Lazy Loading
Use `React.lazy()` for charts below the fold:

```tsx
const HeatMap = lazy(() => import('@/components/charts/HeatMap'));

<Suspense fallback={<ChartLoadingSkeleton height={400} />}>
  <HeatMap {...props} />
</Suspense>
```

### Data Optimization
- Limit data points to essential information
- Use aggregation for dense datasets
- Implement virtual scrolling for large lists

---

## 🐛 Troubleshooting

### Chart Not Rendering
- Ensure all required props are provided
- Check that data is in the correct format
- Verify Plotly.js is imported dynamically (client-side only)

### Type Errors
- Make sure TypeScript types are imported correctly
- Use type assertions (`as any`) for complex Plotly types if needed

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check that TypeScript paths are configured in `tsconfig.json`

---

## 📝 License

Part of the Blaze Sports Intel platform. All rights reserved.

---

## 🤝 Contributing

When adding new chart components:
1. Follow the existing component structure
2. Include TypeScript types
3. Add Framer Motion animations
4. Maintain glassmorphism styling
5. Ensure mobile responsiveness
6. Add to demo page
7. Update this README

---

**Built with:**
- ⚡ Next.js 15
- 📊 Plotly.js
- 🎨 Framer Motion
- 🎯 TypeScript
- 🌐 D3.js

**Demo:** `/charts-demo`
