'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import { motion } from 'framer-motion';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface RadarDataSet {
  name: string;
  values: number[];
  color?: string;
  fillOpacity?: number;
}

export interface RadarChartProps {
  categories: string[];
  datasets: RadarDataSet[];
  title: string;
  height?: number;
  width?: number;
  maxValue?: number;
  showLegend?: boolean;
}

/**
 * Enhanced Radar Chart Component
 * Perfect for player comparisons and multi-dimensional analysis
 * Features glassmorphism styling and smooth animations
 */
export default function RadarChart({
  categories,
  datasets,
  title,
  height = 500,
  width,
  maxValue = 100,
  showLegend = true
}: RadarChartProps) {
  // Default colors based on Blaze brand palette
  const defaultColors = [
    'rgba(191, 87, 0, 0.7)',    // Burnt orange (primary)
    'rgba(59, 130, 246, 0.7)',  // Blue
    'rgba(251, 191, 36, 0.7)',  // Amber
    'rgba(220, 38, 38, 0.7)',   // Red
    'rgba(34, 197, 94, 0.7)',   // Green
    'rgba(168, 85, 247, 0.7)'   // Purple
  ];

  const plotData: PlotParams['data'] = datasets.map((dataset, idx) => ({
    type: 'scatterpolar',
    name: dataset.name,
    r: [...dataset.values, dataset.values[0]], // Close the shape
    theta: [...categories, categories[0]],
    fill: 'toself',
    fillcolor: dataset.color || defaultColors[idx % defaultColors.length],
    opacity: dataset.fillOpacity || 0.6,
    line: {
      color: dataset.color || defaultColors[idx % defaultColors.length],
      width: 2
    },
    marker: {
      size: 6,
      color: dataset.color || defaultColors[idx % defaultColors.length],
      symbol: 'circle'
    },
    hovertemplate: '<b>%{theta}</b><br>Value: %{r:.1f}<br><extra>%{fullData.name}</extra>'
  }));

  const layout: Partial<PlotParams['layout']> = {
    title: {
      text: title,
      font: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 20,
        color: 'rgba(248, 250, 252, 0.95)',
        weight: 600
      },
      x: 0.5,
      xanchor: 'center'
    },
    polar: {
      bgcolor: 'rgba(15, 23, 42, 0.2)',
      radialaxis: {
        visible: true,
        range: [0, maxValue],
        gridcolor: 'rgba(148, 163, 184, 0.3)',
        tickfont: {
          color: 'rgba(248, 250, 252, 0.7)',
          size: 10
        },
        linecolor: 'rgba(191, 87, 0, 0.3)',
        showline: true
      },
      angularaxis: {
        gridcolor: 'rgba(148, 163, 184, 0.3)',
        tickfont: {
          color: 'rgba(248, 250, 252, 0.9)',
          size: 11,
          weight: 500
        },
        linecolor: 'rgba(191, 87, 0, 0.3)'
      }
    },
    paper_bgcolor: 'rgba(15, 23, 42, 0)',
    plot_bgcolor: 'rgba(15, 23, 42, 0)',
    height,
    width: width || undefined,
    autosize: !width,
    showlegend: showLegend,
    legend: {
      x: 1.1,
      y: 1,
      bgcolor: 'rgba(15, 23, 42, 0.7)',
      bordercolor: 'rgba(191, 87, 0, 0.4)',
      borderwidth: 1,
      font: {
        color: 'rgba(248, 250, 252, 0.9)',
        size: 12
      }
    },
    margin: {
      l: 80,
      r: 80,
      t: 80,
      b: 80
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'rgba(15, 23, 42, 0.95)',
      bordercolor: 'rgba(191, 87, 0, 0.6)',
      font: {
        color: 'rgba(248, 250, 252, 0.95)',
        size: 13
      }
    }
  };

  const config: Partial<PlotParams['config']> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoom2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `radar_chart_${Date.now()}`,
      height: 800,
      width: 800,
      scale: 2
    }
  };

  return (
    <motion.div
      className="radar-chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'var(--glass-light, rgba(15, 23, 42, 0.3))',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(191, 87, 0, 0.2)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}
    >
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%' }}
      />

      {/* Legend helper for mobile */}
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'center'
      }}>
        {datasets.map((dataset, idx) => (
          <motion.div
            key={dataset.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'rgba(248, 250, 252, 0.9)'
            }}
          >
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: dataset.color || defaultColors[idx % defaultColors.length],
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }} />
            <span>{dataset.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
