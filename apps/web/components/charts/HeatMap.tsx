'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import { motion } from 'framer-motion';

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface HeatMapDataPoint {
  x: number;
  y: number;
  value: number;
  label?: string;
}

export interface HeatMapProps {
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

/**
 * Interactive Heat Map Component
 * Supports pitch zone visualization, spray charts, and generic heat maps
 * Uses Plotly.js with glassmorphism styling
 */
export default function HeatMap({
  data,
  title,
  type = 'generic',
  colorScale = 'hot',
  height = 400,
  width,
  showColorBar = true,
  xLabel,
  yLabel,
  onPointClick
}: HeatMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HeatMapDataPoint | null>(null);

  // Prepare data for Plotly heatmap
  const prepareHeatMapData = () => {
    // Create a grid based on the data points
    const gridSize = type === 'pitch-zone' ? 10 : 15;
    const xValues: number[] = [];
    const yValues: number[] = [];
    const zValues: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    const counts: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    // Find min/max for normalization
    const xCoords = data.map(d => d.x);
    const yCoords = data.map(d => d.y);
    const xMin = Math.min(...xCoords);
    const xMax = Math.max(...xCoords);
    const yMin = Math.min(...yCoords);
    const yMax = Math.max(...yCoords);

    // Aggregate data into grid
    data.forEach(point => {
      const xIdx = Math.floor(((point.x - xMin) / (xMax - xMin)) * (gridSize - 1));
      const yIdx = Math.floor(((point.y - yMin) / (yMax - yMin)) * (gridSize - 1));

      if (xIdx >= 0 && xIdx < gridSize && yIdx >= 0 && yIdx < gridSize) {
        zValues[yIdx][xIdx] += point.value;
        counts[yIdx][xIdx] += 1;
      }
    });

    // Average the values
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (counts[i][j] > 0) {
          zValues[i][j] /= counts[i][j];
        }
      }
    }

    // Create axis labels
    for (let i = 0; i < gridSize; i++) {
      xValues.push(xMin + (i / (gridSize - 1)) * (xMax - xMin));
      yValues.push(yMin + (i / (gridSize - 1)) * (yMax - yMin));
    }

    return { x: xValues, y: yValues, z: zValues };
  };

  const heatmapData = prepareHeatMapData();

  // Color scale configurations
  const colorScales: Record<string, Array<[number, string]>> = {
    hot: [
      [0, 'rgba(59, 130, 246, 0.3)'],    // Cool blue (low)
      [0.5, 'rgba(251, 191, 36, 0.6)'],  // Amber (medium)
      [1, 'rgba(220, 38, 38, 0.9)']      // Hot red (high)
    ],
    cool: [
      [0, 'rgba(191, 87, 0, 0.3)'],      // Burnt orange (low)
      [0.5, 'rgba(148, 163, 184, 0.6)'], // Slate (medium)
      [1, 'rgba(59, 130, 246, 0.9)']     // Cool blue (high)
    ],
    sequential: [
      [0, 'rgba(15, 23, 42, 0.3)'],      // Dark slate (low)
      [0.5, 'rgba(191, 87, 0, 0.6)'],    // Brand orange (medium)
      [1, 'rgba(251, 191, 36, 0.9)']     // Bright amber (high)
    ],
    diverging: [
      [0, 'rgba(59, 130, 246, 0.9)'],    // Blue (negative)
      [0.5, 'rgba(148, 163, 184, 0.3)'], // Neutral gray
      [1, 'rgba(220, 38, 38, 0.9)']      // Red (positive)
    ]
  };

  const plotData: PlotParams['data'] = [
    {
      x: heatmapData.x,
      y: heatmapData.y,
      z: heatmapData.z,
      type: 'heatmap',
      colorscale: colorScales[colorScale] as any,
      showscale: showColorBar,
      hovertemplate: type === 'pitch-zone'
        ? '<b>Zone</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<br>Value: %{z:.2f}<extra></extra>'
        : '<b>Location</b><br>X: %{x:.1f}<br>Y: %{y:.1f}<br>Value: %{z:.2f}<extra></extra>',
      colorbar: showColorBar ? {
        thickness: 15,
        len: 0.7,
        bgcolor: 'rgba(15, 23, 42, 0.5)',
        tickfont: {
          color: 'rgba(248, 250, 252, 0.9)',
          size: 10
        },
        bordercolor: 'rgba(191, 87, 0, 0.3)',
        borderwidth: 1
      } : undefined
    }
  ];

  const layout: Partial<PlotParams['layout']> = {
    title: {
      text: title,
      font: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 18,
        color: 'rgba(248, 250, 252, 0.95)'
      },
      x: 0.05
    },
    paper_bgcolor: 'rgba(15, 23, 42, 0.3)',
    plot_bgcolor: 'rgba(15, 23, 42, 0.2)',
    height,
    width: width || undefined,
    autosize: !width,
    margin: {
      l: 60,
      r: 40,
      t: 60,
      b: 60
    },
    xaxis: {
      title: {
        text: xLabel || (type === 'pitch-zone' ? 'Horizontal Location' : 'X Position'),
        font: {
          color: 'rgba(248, 250, 252, 0.8)',
          size: 12
        }
      },
      gridcolor: 'rgba(148, 163, 184, 0.2)',
      tickfont: {
        color: 'rgba(248, 250, 252, 0.7)',
        size: 10
      },
      zeroline: type === 'pitch-zone',
      zerolinecolor: 'rgba(191, 87, 0, 0.5)',
      zerolinewidth: 2
    },
    yaxis: {
      title: {
        text: yLabel || (type === 'pitch-zone' ? 'Vertical Location' : 'Y Position'),
        font: {
          color: 'rgba(248, 250, 252, 0.8)',
          size: 12
        }
      },
      gridcolor: 'rgba(148, 163, 184, 0.2)',
      tickfont: {
        color: 'rgba(248, 250, 252, 0.7)',
        size: 10
      },
      zeroline: type === 'pitch-zone',
      zerolinecolor: 'rgba(191, 87, 0, 0.5)',
      zerolinewidth: 2
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'rgba(15, 23, 42, 0.95)',
      bordercolor: 'rgba(191, 87, 0, 0.6)',
      font: {
        color: 'rgba(248, 250, 252, 0.95)',
        size: 12
      }
    }
  };

  const config: Partial<PlotParams['config']> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `${type}_heatmap_${Date.now()}`,
      height: 800,
      width: 1200,
      scale: 2
    }
  };

  return (
    <motion.div
      className="heatmap-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'var(--glass-light, rgba(15, 23, 42, 0.3))',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(191, 87, 0, 0.2)',
        padding: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}
    >
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        onClick={(event) => {
          if (onPointClick && event.points && event.points.length > 0) {
            const point = event.points[0] as any;
            const dataPoint: HeatMapDataPoint = {
              x: point.x as number,
              y: point.y as number,
              value: point.z as number
            };
            onPointClick(dataPoint);
          }
        }}
        onHover={(event) => {
          if (event.points && event.points.length > 0) {
            const point = event.points[0] as any;
            setHoveredPoint({
              x: point.x as number,
              y: point.y as number,
              value: point.z as number
            });
          }
        }}
        onUnhover={() => setHoveredPoint(null)}
        style={{ width: '100%' }}
      />

      {hoveredPoint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: 'rgba(248, 250, 252, 0.9)',
            textAlign: 'center'
          }}
        >
          Hovering: X={hoveredPoint.x.toFixed(2)}, Y={hoveredPoint.y.toFixed(2)}, Value={hoveredPoint.value.toFixed(2)}
        </motion.div>
      )}
    </motion.div>
  );
}
